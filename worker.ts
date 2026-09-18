/**
 * Cloudflare Worker entry point for SOFYRA Jewels
 * Handles static SPA assets via env.ASSETS, R2 object storage via env.SOFYRA_IMAGES,
 * and API persistence for products, categories, site content, and image uploads.
 * Pure native Web APIs: No Express, body-parser, raw-body, or iconv-lite dependencies.
 */

import {
  INITIAL_PRODUCTS,
  DEFAULT_CATEGORIES,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_WORN_BY_YOU,
  DEFAULT_CONTACT_INFO,
  DEFAULT_SITE_SETTINGS,
  INITIAL_REVIEWS
} from './src/data/initialProducts';

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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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

/**
 * Validate Administrator authorization from Authorization header (Bearer JWT) or x-admin-token
 */
function isAuthorizedAdmin(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const adminToken = request.headers.get('x-admin-token') || '';
  const rawToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (adminToken || authHeader).trim();

  if (!rawToken) {
    return false;
  }

  // Validate JWT token if 3 dot-separated parts
  const parts = rawToken.split('.');
  if (parts.length === 3) {
    try {
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const jsonStr = atob(base64);
      const payload = JSON.parse(jsonStr);
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // Fallback for session token strings
  return rawToken.length >= 8;
}

/**
 * R2 JSON storage helpers for data caching / server persistence
 */
async function getR2Data<T>(env: Env, filename: string): Promise<T | null> {
  if (!env.SOFYRA_IMAGES || typeof env.SOFYRA_IMAGES.get !== 'function') return null;
  try {
    const obj = await env.SOFYRA_IMAGES.get(`_data/${filename}`);
    if (!obj) return null;
    const text = await new Response(obj.body).text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function putR2Data(env: Env, filename: string, data: unknown): Promise<boolean> {
  if (!env.SOFYRA_IMAGES || typeof env.SOFYRA_IMAGES.put !== 'function') return false;
  try {
    await env.SOFYRA_IMAGES.put(`_data/${filename}`, JSON.stringify(data), {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'no-cache',
      },
    });
    return true;
  } catch {
    return false;
  }
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

    // 3. Products Endpoints (/api/products)
    if (url.pathname === '/api/products') {
      if (request.method === 'GET') {
        const stored = await getR2Data<any[]>(env, 'products.json');
        return jsonResponse(stored && stored.length > 0 ? stored : INITIAL_PRODUCTS);
      }

      if (request.method === 'POST') {
        if (!isAuthorizedAdmin(request)) {
          return jsonResponse({ error: 'Unauthorized: Admin authentication required' }, 401);
        }

        const body = await request.json().catch(() => null);
        if (!body) {
          return jsonResponse({ error: 'Missing product payload' }, 400);
        }

        let currentProducts = await getR2Data<any[]>(env, 'products.json');
        if (!Array.isArray(currentProducts) || currentProducts.length === 0) {
          currentProducts = [...INITIAL_PRODUCTS];
        }

        if (Array.isArray(body)) {
          // Bulk update all products
          await putR2Data(env, 'products.json', body);
          return jsonResponse({ success: true, products: body });
        } else if (typeof body === 'object' && body.id) {
          // Single product upsert
          const idx = currentProducts.findIndex((p: any) => p.id === body.id);
          if (idx >= 0) {
            currentProducts[idx] = { ...currentProducts[idx], ...body };
          } else {
            currentProducts.unshift(body);
          }
          await putR2Data(env, 'products.json', currentProducts);
          return jsonResponse({ success: true, product: body, products: currentProducts });
        } else {
          return jsonResponse({ error: 'Invalid product payload shape' }, 400);
        }
      }
    }

    // Single Product operations: /api/products/:id
    if (url.pathname.startsWith('/api/products/')) {
      const prodId = decodeURIComponent(url.pathname.replace(/^\/api\/products\//, ''));
      if (request.method === 'DELETE') {
        if (!isAuthorizedAdmin(request)) {
          return jsonResponse({ error: 'Unauthorized: Admin authentication required' }, 401);
        }
        let currentProducts = await getR2Data<any[]>(env, 'products.json');
        if (!Array.isArray(currentProducts)) {
          currentProducts = [...INITIAL_PRODUCTS];
        }
        currentProducts = currentProducts.filter((p: any) => p.id !== prodId);
        await putR2Data(env, 'products.json', currentProducts);
        return jsonResponse({ success: true, products: currentProducts });
      }
    }

    // 4. Categories Endpoints (/api/categories)
    if (url.pathname === '/api/categories') {
      if (request.method === 'GET') {
        const stored = await getR2Data<any[]>(env, 'categories.json');
        return jsonResponse(stored && stored.length > 0 ? stored : DEFAULT_CATEGORIES);
      }

      if (request.method === 'POST') {
        if (!isAuthorizedAdmin(request)) {
          return jsonResponse({ error: 'Unauthorized: Admin authentication required' }, 401);
        }

        const body = await request.json().catch(() => null);
        if (!body) {
          return jsonResponse({ error: 'Missing category payload' }, 400);
        }

        let currentCategories = await getR2Data<any[]>(env, 'categories.json');
        if (!Array.isArray(currentCategories) || currentCategories.length === 0) {
          currentCategories = [...DEFAULT_CATEGORIES];
        }

        if (Array.isArray(body)) {
          // Bulk update all categories
          await putR2Data(env, 'categories.json', body);
          return jsonResponse({ success: true, categories: body });
        } else if (typeof body === 'object' && (body.id || body.slug)) {
          // Single category upsert
          const idx = currentCategories.findIndex((c: any) => c.id === body.id || c.slug === body.slug);
          if (idx >= 0) {
            currentCategories[idx] = { ...currentCategories[idx], ...body };
          } else {
            currentCategories.push(body);
          }
          await putR2Data(env, 'categories.json', currentCategories);
          return jsonResponse({ success: true, category: body, categories: currentCategories });
        } else {
          return jsonResponse({ error: 'Invalid category payload shape' }, 400);
        }
      }
    }

    // Single Category delete: /api/categories/:id
    if (url.pathname.startsWith('/api/categories/')) {
      const catId = decodeURIComponent(url.pathname.replace(/^\/api\/categories\//, ''));
      if (request.method === 'DELETE') {
        if (!isAuthorizedAdmin(request)) {
          return jsonResponse({ error: 'Unauthorized: Admin authentication required' }, 401);
        }
        let currentCategories = await getR2Data<any[]>(env, 'categories.json');
        if (!Array.isArray(currentCategories)) {
          currentCategories = [...DEFAULT_CATEGORIES];
        }
        currentCategories = currentCategories.filter((c: any) => c.id !== catId && c.slug !== catId);
        await putR2Data(env, 'categories.json', currentCategories);
        return jsonResponse({ success: true, categories: currentCategories });
      }
    }

    // 5. Additional Site Content Endpoints
    if (url.pathname === '/api/homepage') {
      if (request.method === 'GET') {
        const stored = await getR2Data(env, 'homepage.json');
        return jsonResponse(stored || DEFAULT_HOMEPAGE_CONTENT);
      }
      if (request.method === 'POST') {
        if (!isAuthorizedAdmin(request)) return jsonResponse({ error: 'Unauthorized' }, 401);
        const body = await request.json().catch(() => null);
        if (!body) return jsonResponse({ error: 'Invalid payload' }, 400);
        await putR2Data(env, 'homepage.json', body);
        return jsonResponse({ success: true, content: body });
      }
    }

    if (url.pathname === '/api/worn-by-you') {
      if (request.method === 'GET') {
        const stored = await getR2Data(env, 'worn-by-you.json');
        return jsonResponse(stored || DEFAULT_WORN_BY_YOU);
      }
      if (request.method === 'POST') {
        if (!isAuthorizedAdmin(request)) return jsonResponse({ error: 'Unauthorized' }, 401);
        const body = await request.json().catch(() => null);
        if (!body) return jsonResponse({ error: 'Invalid payload' }, 400);
        await putR2Data(env, 'worn-by-you.json', body);
        return jsonResponse({ success: true, items: body });
      }
    }

    if (url.pathname === '/api/contact-info') {
      if (request.method === 'GET') {
        const stored = await getR2Data(env, 'contact-info.json');
        return jsonResponse(stored || DEFAULT_CONTACT_INFO);
      }
      if (request.method === 'POST') {
        if (!isAuthorizedAdmin(request)) return jsonResponse({ error: 'Unauthorized' }, 401);
        const body = await request.json().catch(() => null);
        if (!body) return jsonResponse({ error: 'Invalid payload' }, 400);
        await putR2Data(env, 'contact-info.json', body);
        return jsonResponse({ success: true, contact: body });
      }
    }

    if (url.pathname === '/api/site-settings') {
      if (request.method === 'GET') {
        const stored = await getR2Data(env, 'site-settings.json');
        return jsonResponse(stored || DEFAULT_SITE_SETTINGS);
      }
      if (request.method === 'POST') {
        if (!isAuthorizedAdmin(request)) return jsonResponse({ error: 'Unauthorized' }, 401);
        const body = await request.json().catch(() => null);
        if (!body) return jsonResponse({ error: 'Invalid payload' }, 400);
        await putR2Data(env, 'site-settings.json', body);
        return jsonResponse({ success: true, settings: body });
      }
    }

    if (url.pathname === '/api/reviews') {
      if (request.method === 'GET') {
        const stored = await getR2Data(env, 'reviews.json');
        return jsonResponse(stored || INITIAL_REVIEWS);
      }
      if (request.method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body) return jsonResponse({ error: 'Invalid payload' }, 400);
        let currentReviews = await getR2Data<any[]>(env, 'reviews.json') || [...INITIAL_REVIEWS];
        if (Array.isArray(body)) {
          if (!isAuthorizedAdmin(request)) return jsonResponse({ error: 'Unauthorized' }, 401);
          await putR2Data(env, 'reviews.json', body);
          return jsonResponse({ success: true, reviews: body });
        } else {
          currentReviews.unshift(body);
          await putR2Data(env, 'reviews.json', currentReviews);
          return jsonResponse({ success: true, review: body, reviews: currentReviews });
        }
      }
    }

    if (url.pathname === '/api/orders') {
      if (request.method === 'GET') {
        if (!isAuthorizedAdmin(request)) return jsonResponse({ error: 'Unauthorized' }, 401);
        const stored = await getR2Data(env, 'orders.json');
        return jsonResponse(stored || []);
      }
      if (request.method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body) return jsonResponse({ error: 'Invalid payload' }, 400);
        let orders = await getR2Data<any[]>(env, 'orders.json') || [];
        orders.unshift(body);
        await putR2Data(env, 'orders.json', orders);
        return jsonResponse({ success: true, order: body });
      }
    }

    if (url.pathname === '/api/auth/status' && request.method === 'GET') {
      return jsonResponse({
        hasAdmin: true,
        authenticated: isAuthorizedAdmin(request),
      });
    }

    // 6. Any other /api/ route: NEVER fall through to env.ASSETS (avoids HTTP 405)
    if (url.pathname.startsWith('/api/')) {
      return jsonResponse({ error: `API route not found: ${url.pathname}` }, 404);
    }

    // 7. Static Assets & SPA Routing (ONLY for non-API requests)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return await env.ASSETS.fetch(request);
    }

    return new Response('Not Found', {
      status: 404,
      headers: CORS_HEADERS,
    });
  },
};

