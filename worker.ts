/**
 * Cloudflare Worker entry point for SOFYRA Jewels
 * Handles static SPA assets via env.ASSETS and R2 object storage via env.SOFYRA_IMAGES
 * Pure native Web APIs: No Express, body-parser, raw-body, or iconv-lite dependencies.
 */

export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    contentLanguage?: string;
  };
  customMetadata?: Record<string, string>;
}

export interface R2Object {
  key: string;
  size: number;
  httpEtag?: string;
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob, options?: R2PutOptions): Promise<R2Object>;
  get(key: string): Promise<R2Object | null>;
  delete(keys: string | string[]): Promise<void>;
}

export interface Env {
  SOFYRA_IMAGES: R2Bucket;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  R2_PUBLIC_URL?: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
};

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function getRandomHex(bytesCount = 4): string {
  const array = new Uint8Array(bytesCount);
  crypto.getRandomValues(array);
  let hex = '';
  for (let i = 0; i < array.length; i++) {
    hex += array[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Health check endpoint
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        runtime: 'cloudflare-worker',
        r2Configured: !!env.SOFYRA_IMAGES,
      });
    }

    // 1. Image Upload Endpoint (/api/upload)
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      try {
        if (!env.SOFYRA_IMAGES || typeof env.SOFYRA_IMAGES.put !== 'function') {
          return jsonResponse({
            error: 'Cloudflare R2 binding env.SOFYRA_IMAGES is not configured.',
            requiresR2Config: true,
          }, 500);
        }

        const contentTypeHeader = request.headers.get('content-type') || '';
        let fileBuffer: Uint8Array;
        let mimeType = 'image/jpeg';
        let rawFilename = 'image.jpg';

        if (contentTypeHeader.includes('multipart/form-data')) {
          const formData = await request.formData();
          const file = (formData.get('file') || formData.get('image')) as File | null;
          if (!file || typeof file.arrayBuffer !== 'function') {
            return jsonResponse({ error: 'Missing image file in form data' }, 400);
          }
          rawFilename = file.name || 'image.jpg';
          mimeType = file.type || 'image/jpeg';
          const arrayBuf = await file.arrayBuffer();
          fileBuffer = new Uint8Array(arrayBuf);
        } else {
          // JSON payload: { image: base64String, filename: string }
          const body = await request.json().catch(() => null) as { image?: string; filename?: string } | null;
          if (!body || !body.image || typeof body.image !== 'string') {
            return jsonResponse({ error: 'Missing image data in request body' }, 400);
          }

          rawFilename = body.filename || 'image.jpg';
          let base64Data = body.image;

          if (base64Data.includes(';base64,')) {
            const parts = base64Data.split(';base64,');
            const prefix = parts[0];
            base64Data = parts[1];
            const mimeMatch = prefix.match(/data:([a-zA-Z0-9\/+-]+)/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
          } else if (base64Data.startsWith('data:')) {
            const commaIndex = base64Data.indexOf(',');
            if (commaIndex !== -1) {
              base64Data = base64Data.substring(commaIndex + 1);
            }
          }

          // Strip whitespace and newlines
          base64Data = base64Data.replace(/\s/g, '');
          const binaryString = atob(base64Data);
          fileBuffer = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            fileBuffer[i] = binaryString.charCodeAt(i);
          }
        }

        if (fileBuffer.length === 0) {
          return jsonResponse({ error: 'Image data is empty or invalid' }, 400);
        }

        // Determine file extension
        let ext = 'jpg';
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('gif')) ext = 'gif';
        else if (mimeType.includes('svg')) ext = 'svg';
        else if (rawFilename && /\.(png|jpe?g|webp|gif|svg)$/i.test(rawFilename)) {
          const match = rawFilename.match(/\.(png|jpe?g|webp|gif|svg)$/i);
          if (match) ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
        }

        const safeName = (rawFilename.replace(/[^a-zA-Z0-9_-]/g, '') || 'img').slice(0, 20);
        const uniqueKey = `products/sofyra-${safeName}-${Date.now()}-${getRandomHex(4)}.${ext}`;

        // Direct upload to Cloudflare R2 bucket sofyraimages via binding
        await env.SOFYRA_IMAGES.put(uniqueKey, fileBuffer, {
          httpMetadata: {
            contentType: mimeType,
            cacheControl: 'public, max-age=31536000, immutable',
          },
        });

        const publicDomain = (env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
        const permanentUrl = publicDomain ? `${publicDomain}/${uniqueKey}` : `/api/r2/${uniqueKey}`;

        return jsonResponse({
          success: true,
          url: permanentUrl,
          filename: uniqueKey,
          storage: 'cloudflare-r2',
        });
      } catch (err: any) {
        return jsonResponse({
          error: err?.message || 'Failed to process image upload',
        }, 500);
      }
    }

    // 2. Direct Image Retrieval Proxy (/api/r2/:key)
    if (url.pathname.startsWith('/api/r2/') && request.method === 'GET') {
      try {
        if (!env.SOFYRA_IMAGES || typeof env.SOFYRA_IMAGES.get !== 'function') {
          return new Response('Cloudflare R2 storage is not configured', {
            status: 503,
            headers: CORS_HEADERS,
          });
        }

        const key = decodeURIComponent(url.pathname.replace(/^\/api\/r2\//, ''));
        const object = await env.SOFYRA_IMAGES.get(key);

        if (!object) {
          return new Response('Image not found in R2 bucket', {
            status: 404,
            headers: CORS_HEADERS,
          });
        }

        const headers = new Headers(CORS_HEADERS);
        if (object.httpMetadata?.contentType) {
          headers.set('Content-Type', object.httpMetadata.contentType);
        }
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        if (object.httpEtag) {
          headers.set('ETag', object.httpEtag);
        }

        return new Response(object.body, {
          status: 200,
          headers,
        });
      } catch (err: any) {
        return new Response('Error retrieving image from R2', {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // 3. Static Assets & SPA Routing
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return await env.ASSETS.fetch(request);
    }

    return new Response('Not Found', {
      status: 404,
      headers: CORS_HEADERS,
    });
  },
};
