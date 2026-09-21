import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_PRODUCTS,
  DEFAULT_ADVANTAGES_SECTION,
  DEFAULT_CATEGORIES,
  DEFAULT_CONTACT_INFO,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_WORN_BY_YOU,
  DEFAULT_REVIEWS,
  DEFAULT_HOMEPAGE_CONTENT
} from './src/data/initialProducts';

const PORT = Number(process.env.PORT) || 3000;
const app = express();

// Enable large JSON payloads for direct base64 image uploading
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const MEDIA_STORE_FILE = path.join(DATA_DIR, 'media_store.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_UPLOADS_DIR)) {
  fs.mkdirSync(DATA_UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// PERSISTENT MEDIA DATABASE STORE
// ---------------------------------------------------------------------------
interface MediaRecord {
  filename: string;
  contentType: string;
  size: number;
  dataBase64?: string;
  createdAt: string;
  originalName: string;
}

function readMediaStore(): Record<string, MediaRecord> {
  try {
    if (fs.existsSync(MEDIA_STORE_FILE)) {
      return JSON.parse(fs.readFileSync(MEDIA_STORE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read media store file:', err);
  }
  return {};
}

function writeMediaStore(store: Record<string, MediaRecord>): void {
  try {
    fs.writeFileSync(MEDIA_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write media store file:', err);
  }
}

// Ensure all media records in data/ are synced to public/uploads and dist/uploads
function syncMediaStore(): void {
  const mediaStore = readMediaStore();
  const distUploadsDir = path.join(process.cwd(), 'dist', 'uploads');

  [UPLOADS_DIR, DATA_UPLOADS_DIR, distUploadsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
  });

  let updatedStore = false;

  // 1. Sync from mediaStore records (with base64) to disk
  for (const [filename, record] of Object.entries(mediaStore)) {
    const dataPath = path.join(DATA_UPLOADS_DIR, filename);
    const publicPath = path.join(UPLOADS_DIR, filename);
    const distPath = path.join(distUploadsDir, filename);

    if (record.dataBase64) {
      try {
        const buffer = Buffer.from(record.dataBase64, 'base64');
        if (!fs.existsSync(dataPath)) {
          fs.writeFileSync(dataPath, buffer);
        }
        if (!fs.existsSync(publicPath)) {
          fs.writeFileSync(publicPath, buffer);
        }
        if (fs.existsSync(path.join(process.cwd(), 'dist')) && !fs.existsSync(distPath)) {
          fs.writeFileSync(distPath, buffer);
        }
      } catch (err) {
        console.error(`Failed to restore media file ${filename} to disk:`, err);
      }
    } else if (fs.existsSync(dataPath)) {
      try {
        const buf = fs.readFileSync(dataPath);
        record.dataBase64 = buf.toString('base64');
        updatedStore = true;
      } catch {}
    }
  }

  // 2. Scan DATA_UPLOADS_DIR and ensure public and dist have it
  try {
    const files = fs.readdirSync(DATA_UPLOADS_DIR);
    for (const file of files) {
      const dataPath = path.join(DATA_UPLOADS_DIR, file);
      const publicPath = path.join(UPLOADS_DIR, file);
      const distPath = path.join(distUploadsDir, file);

      if (!fs.existsSync(publicPath)) {
        try {
          fs.copyFileSync(dataPath, publicPath);
        } catch {}
      }
      if (fs.existsSync(path.join(process.cwd(), 'dist')) && !fs.existsSync(distPath)) {
        try {
          fs.copyFileSync(dataPath, distPath);
        } catch {}
      }

      if (!mediaStore[file]) {
        try {
          const stats = fs.statSync(dataPath);
          const buf = fs.readFileSync(dataPath);
          const ext = path.extname(file).replace('.', '').toLowerCase();
          let ct = 'image/jpeg';
          if (ext === 'png') ct = 'image/png';
          else if (ext === 'webp') ct = 'image/webp';
          else if (ext === 'gif') ct = 'image/gif';
          else if (ext === 'svg') ct = 'image/svg+xml';

          mediaStore[file] = {
            filename: file,
            contentType: ct,
            size: stats.size,
            dataBase64: buf.toString('base64'),
            createdAt: stats.birthtime.toISOString(),
            originalName: file
          };
          updatedStore = true;
        } catch {}
      }
    }
  } catch {}

  // 3. Scan UPLOADS_DIR (if any file was placed directly in public/uploads)
  try {
    const pubFiles = fs.readdirSync(UPLOADS_DIR);
    for (const file of pubFiles) {
      const publicPath = path.join(UPLOADS_DIR, file);
      const dataPath = path.join(DATA_UPLOADS_DIR, file);
      if (!fs.existsSync(dataPath)) {
        try {
          fs.copyFileSync(publicPath, dataPath);
          const stats = fs.statSync(dataPath);
          const buf = fs.readFileSync(dataPath);
          const ext = path.extname(file).replace('.', '').toLowerCase();
          let ct = 'image/jpeg';
          if (ext === 'png') ct = 'image/png';
          else if (ext === 'webp') ct = 'image/webp';
          else if (ext === 'gif') ct = 'image/gif';
          else if (ext === 'svg') ct = 'image/svg+xml';

          mediaStore[file] = {
            filename: file,
            contentType: ct,
            size: stats.size,
            dataBase64: buf.toString('base64'),
            createdAt: stats.birthtime.toISOString(),
            originalName: file
          };
          updatedStore = true;
        } catch {}
      }
    }
  } catch {}

  if (updatedStore) {
    writeMediaStore(mediaStore);
  }
}

// Initial hydration on load
syncMediaStore();

// Direct permanent image serving with zero authentication required (customers & public)
// Checks public/uploads, dist/uploads, persistent data/uploads, and media_store.json
app.get(['/uploads/:filename', '/api/images/:filename'], (req, res) => {
  const rawFilename = req.params.filename;
  const filename = path.basename(rawFilename); // Prevent path traversal attacks

  // 1. Check in public/uploads
  const publicPath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(publicPath)) {
    return res.sendFile(publicPath);
  }

  // 2. Check in dist/uploads (production)
  const distPath = path.join(process.cwd(), 'dist', 'uploads', filename);
  if (fs.existsSync(distPath)) {
    return res.sendFile(distPath);
  }

  // 3. Check in persistent data/uploads
  const dataPath = path.join(DATA_UPLOADS_DIR, filename);
  if (fs.existsSync(dataPath)) {
    try {
      if (!fs.existsSync(publicPath)) fs.copyFileSync(dataPath, publicPath);
    } catch {}
    return res.sendFile(dataPath);
  }

  // 4. Check in persistent media_store.json
  const mediaStore = readMediaStore();
  const record = mediaStore[filename];
  if (record && record.dataBase64) {
    const buffer = Buffer.from(record.dataBase64, 'base64');
    try {
      fs.writeFileSync(dataPath, buffer);
      fs.writeFileSync(publicPath, buffer);
    } catch {}
    res.setHeader('Content-Type', record.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buffer);
  }

  // 5. File does not exist: Return 404 (NEVER fall through to Vite / index.html!)
  return res.status(404).setHeader('Content-Type', 'text/plain').send('Image not found');
});

// Fallback static middleware for /uploads
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/uploads', express.static(DATA_UPLOADS_DIR));

// Health check endpoints FIRST
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sofyra' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'sofyra' });
});

// ---------------------------------------------------------------------------
// DATA STORE LOGIC (Persistent JSON file)
// ---------------------------------------------------------------------------
interface StoreData {
  homepage: any;
  products: any[];
  categories: any[];
  wornByYou: any[];
  contactInfo: any;
  siteSettings: any;
  orders: any[];
  reviews: any[];
}

const DEFAULT_STORE: StoreData = {
  homepage: {
    hero: {
      titleLine1: 'JEWELLERY',
      titleLine2: 'THAT SPEAKS YOU',
      ctaText: 'SHOP NOW',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=2000&auto=format&fit=crop'
    },
    categories: {
      rings: {
        name: 'RINGS',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=900&auto=format&fit=crop'
      },
      bracelets: {
        name: 'BRACELETS',
        image: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=85&w=900&auto=format&fit=crop'
      },
      necklaces: {
        name: 'NECKLACES',
        image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=85&w=900&auto=format&fit=crop'
      },
      earrings: {
        name: 'EARRINGS',
        image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=85&w=900&auto=format&fit=crop'
      }
    },
    editorial: {
      splitLeftTitle: 'Bestsellers',
      splitLeftSubtitle: 'The Curated Edit',
      splitLeftImage: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=85&w=1200&auto=format&fit=crop',
      splitRightTitle: 'New Collection',
      splitRightSubtitle: 'New Season Launch',
      splitRightImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=85&w=1200&auto=format&fit=crop',
      spotlightDetailImage: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=85&w=900&auto=format&fit=crop',
      spotlightLifestyleImage: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=85&w=1400&auto=format&fit=crop',
      spotlightBadge: 'NEW',
      spotlightTitle: 'HYPE CHAIN BRACELET'
    },
    advantagesSection: DEFAULT_ADVANTAGES_SECTION,
    advantages: {
      customDesignImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=700&auto=format&fit=crop',
      versatilityImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=700&auto=format&fit=crop',
      qualityMaterialsImage: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=80&w=700&auto=format&fit=crop',
      comfortWearingImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=700&auto=format&fit=crop'
    },
    aboutSofyra: DEFAULT_HOMEPAGE_CONTENT.aboutSofyra
  },
  products: INITIAL_PRODUCTS,
  categories: DEFAULT_CATEGORIES,
  wornByYou: DEFAULT_WORN_BY_YOU,
  contactInfo: DEFAULT_CONTACT_INFO,
  siteSettings: DEFAULT_SITE_SETTINGS,
  orders: [],
  reviews: DEFAULT_REVIEWS
};

function checkImageExists(url: string, mediaStore: Record<string, MediaRecord>): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('/uploads/')) {
    const filename = path.basename(url);
    if (mediaStore[filename]) return true;
    if (fs.existsSync(path.join(DATA_UPLOADS_DIR, filename))) return true;
    if (fs.existsSync(path.join(UPLOADS_DIR, filename))) return true;
    return false;
  }
  return false;
}

function migrateBrokenImages(store: StoreData): boolean {
  const mediaStore = readMediaStore();
  let modified = false;

  // 1. Migrate Products - ensure all products have valid, viewable images
  if (Array.isArray(store.products)) {
    store.products = store.products.map((prod) => {
      const initialMatch = INITIAL_PRODUCTS.find((p) => p.id === prod.id || p.slug === prod.slug);
      const fallbackImages =
        initialMatch && initialMatch.images && initialMatch.images.length > 0
          ? initialMatch.images
          : ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=1200&auto=format&fit=crop'];

      const currentImages: string[] = Array.isArray(prod.images) ? prod.images : [];
      const validImages: string[] = [];

      for (const img of currentImages) {
        if (checkImageExists(img, mediaStore)) {
          validImages.push(img);
        }
      }

      // If all images were broken or missing from ephemeral loss, restore valid product imagery
      if (validImages.length === 0) {
        modified = true;
        return {
          ...prod,
          images: [...fallbackImages]
        };
      } else if (validImages.length !== currentImages.length) {
        modified = true;
        return {
          ...prod,
          images: validImages
        };
      }

      return prod;
    });
  }

  // 2. Migrate Homepage images if broken
  if (store.homepage) {
    if (store.homepage.hero && !checkImageExists(store.homepage.hero.image, mediaStore)) {
      store.homepage.hero.image = DEFAULT_HOMEPAGE_CONTENT.hero.image;
      modified = true;
    }
    if (store.homepage.editorial) {
      const ed = store.homepage.editorial;
      const defEd = DEFAULT_HOMEPAGE_CONTENT.editorial;
      if (!checkImageExists(ed.splitLeftImage, mediaStore)) {
        ed.splitLeftImage = defEd.splitLeftImage;
        modified = true;
      }
      if (!checkImageExists(ed.splitRightImage, mediaStore)) {
        ed.splitRightImage = defEd.splitRightImage;
        modified = true;
      }
      if (!checkImageExists(ed.spotlightLifestyleImage, mediaStore)) {
        ed.spotlightLifestyleImage = defEd.spotlightLifestyleImage;
        modified = true;
      }
      if (!checkImageExists(ed.spotlightDetailImage, mediaStore)) {
        ed.spotlightDetailImage = defEd.spotlightDetailImage;
        modified = true;
      }
    }
    if (store.homepage.categories) {
      for (const catKey of Object.keys(store.homepage.categories)) {
        const cat = store.homepage.categories[catKey];
        if (cat && !checkImageExists(cat.image, mediaStore)) {
          const defCat = (DEFAULT_HOMEPAGE_CONTENT.categories as any)[catKey];
          if (defCat && defCat.image) {
            cat.image = defCat.image;
            modified = true;
          }
        }
      }
    }
    if (store.homepage.advantages) {
      const adv = store.homepage.advantages;
      const defAdv = DEFAULT_HOMEPAGE_CONTENT.advantages;
      for (const key of Object.keys(adv)) {
        if (!checkImageExists(adv[key], mediaStore)) {
          adv[key] = (defAdv as any)[key] || adv[key];
          modified = true;
        }
      }
    }
    if (store.homepage.aboutSofyra && store.homepage.aboutSofyra.image) {
      if (!checkImageExists(store.homepage.aboutSofyra.image, mediaStore)) {
        store.homepage.aboutSofyra.image = DEFAULT_HOMEPAGE_CONTENT.aboutSofyra?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop';
        modified = true;
      }
    }
  }

  // 3. Migrate WornByYou images
  if (Array.isArray(store.wornByYou)) {
    store.wornByYou = store.wornByYou.map((item, idx) => {
      if (!checkImageExists(item.mediaUrl, mediaStore)) {
        const def = DEFAULT_WORN_BY_YOU[idx] || DEFAULT_WORN_BY_YOU[0];
        modified = true;
        return {
          ...item,
          mediaUrl: def
            ? def.mediaUrl
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop'
        };
      }
      return item;
    });
  }

  return modified;
}

// Read store without ever overwriting existing user data
function readStore(): StoreData {
  try {
    syncMediaStore();

    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      
      // Normalize products so each has category and subcategory
      const rawProducts = Array.isArray(parsed.products) && parsed.products.length > 0
        ? parsed.products
        : INITIAL_PRODUCTS;

      const products = rawProducts.map((p: any) => {
        let cat = p.category;
        let sub = p.subcategory;
        if ((!cat || cat === 'jewellery') && sub) {
          cat = sub;
        }
        if (!cat) {
          cat = 'rings';
        }
        if (!sub) {
          sub = cat.toLowerCase();
        }
        return {
          ...p,
          category: cat.toLowerCase(),
          subcategory: sub.toLowerCase(),
          sku: p.sku || `SOF-${p.id.toUpperCase()}`,
          material: p.material || '925 Sterling Silver',
          plating: p.plating || '18K Yellow Gold',
          inStock: p.inStock !== false,
          stockCount: typeof p.stockCount === 'number' ? p.stockCount : 10,
          shippingInfo: p.shippingInfo || 'Nationwide delivery across Pakistan. Estimated 4–5 business days. Cash on delivery available.',
          guaranteeInfo: p.guaranteeInfo || "Covered by SOFYRA's 30-day money-back guarantee, subject to return policy."
        };
      });

      const rawHomepage = parsed.homepage || DEFAULT_STORE.homepage;

      const store: StoreData = {
        homepage: {
          ...DEFAULT_STORE.homepage,
          ...rawHomepage,
          advantagesSection: rawHomepage.advantagesSection || DEFAULT_ADVANTAGES_SECTION
        },
        products,
        categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
        wornByYou: Array.isArray(parsed.wornByYou) && parsed.wornByYou.length > 0 ? parsed.wornByYou : DEFAULT_WORN_BY_YOU,
        contactInfo: parsed.contactInfo ? { ...DEFAULT_CONTACT_INFO, ...parsed.contactInfo } : DEFAULT_CONTACT_INFO,
        siteSettings: parsed.siteSettings ? { ...DEFAULT_SITE_SETTINGS, ...parsed.siteSettings } : DEFAULT_SITE_SETTINGS,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : DEFAULT_REVIEWS
      };

      if (migrateBrokenImages(store)) {
        writeStore(store);
      }

      return store;
    }
  } catch (err) {
    console.error('Failed to read store file:', err);
  }

  // Initialize once if not existing
  writeStore(DEFAULT_STORE);
  return DEFAULT_STORE;
}

function writeStore(data: StoreData): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write store file:', err);
  }
}

// ---------------------------------------------------------------------------
// ADMIN AUTHENTICATION LOGIC (Persistent Credentials & Sessions)
// ---------------------------------------------------------------------------
interface AdminAccount {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  pinHash?: string;
  pinSalt?: string;
  role: 'admin';
  createdAt: string;
  lastLogin?: string;
}

interface Session {
  token: string;
  email: string;
  role: 'admin';
  createdAt: number;
  expiresAt: number;
}

let activeSessions: Record<string, Session> = {};

// Load sessions from disk
try {
  if (fs.existsSync(SESSIONS_FILE)) {
    activeSessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
  }
} catch {
  activeSessions = {};
}

function saveSessions() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(activeSessions, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
}

function readAdmin(): AdminAccount | null {
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      const raw = fs.readFileSync(ADMIN_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read admin file:', e);
  }
  return null;
}

function writeAdmin(admin: AdminAccount): void {
  try {
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write admin file:', e);
  }
}

function hashSecret(secret: string, salt: string): string {
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256').toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getSessionFromReq(req: express.Request): Session | null {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }

  if (!token || !activeSessions[token]) {
    return null;
  }

  const session = activeSessions[token];
  if (Date.now() > session.expiresAt) {
    delete activeSessions[token];
    saveSessions();
    return null;
  }

  return session;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const admin = readAdmin();
  if (admin) {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
  }
  next();
}

// ---------------------------------------------------------------------------
// REST API ROUTES
// ---------------------------------------------------------------------------

// 1. Image Upload Endpoint (Local file system & persistent Media Store)
app.post('/api/upload', requireAdmin, (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Missing image data' });
    }

    // Robustly extract base64 data and mime type
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.includes(';base64,')) {
      const parts = image.split(';base64,');
      const prefix = parts[0];
      base64Data = parts[1];
      const mimeMatch = prefix.match(/data:([a-zA-Z0-9\/+-]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    } else if (image.startsWith('data:')) {
      const commaIndex = image.indexOf(',');
      if (commaIndex !== -1) {
        base64Data = image.substring(commaIndex + 1);
      }
    }

    // Clean whitespace and line breaks from base64 string
    base64Data = base64Data.replace(/\s/g, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Image data is empty or invalid' });
    }

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('svg')) ext = 'svg';
    else if (filename && /\.(png|jpe?g|webp|gif|svg)$/i.test(filename)) {
      const match = filename.match(/\.(png|jpe?g|webp|gif|svg)$/i);
      if (match) ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    }

    const safeName = (filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '') : 'img')
      .slice(0, 20) || 'img';
    const uniqueFilename = `sofyra-${safeName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    // 1. Write to persistent data/uploads directory
    const dataFilePath = path.join(DATA_UPLOADS_DIR, uniqueFilename);
    fs.writeFileSync(dataFilePath, buffer);

    // 2. Write to public/uploads directory
    const publicFilePath = path.join(UPLOADS_DIR, uniqueFilename);
    try {
      fs.writeFileSync(publicFilePath, buffer);
    } catch {}

    // 3. Write to dist/uploads directory if production dist exists
    const distUploadsDir = path.join(process.cwd(), 'dist', 'uploads');
    if (fs.existsSync(distUploadsDir)) {
      try {
        fs.writeFileSync(path.join(distUploadsDir, uniqueFilename), buffer);
      } catch {}
    }

    // 4. Record in persistent media_store.json
    const mediaStore = readMediaStore();
    mediaStore[uniqueFilename] = {
      filename: uniqueFilename,
      contentType: mimeType,
      size: buffer.length,
      dataBase64: base64Data,
      createdAt: new Date().toISOString(),
      originalName: filename || uniqueFilename
    };
    writeMediaStore(mediaStore);

    const imageUrl = `/uploads/${uniqueFilename}`;
    return res.json({
      success: true,
      url: imageUrl,
      filename: uniqueFilename
    });
  } catch (err: any) {
    console.error('Image upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process image upload' });
  }
});

// 2. Homepage Content
app.get('/api/homepage', (req, res) => {
  const store = readStore();
  res.json(store.homepage);
});

app.put('/api/homepage', requireAdmin, (req, res) => {
  const updatedHomepage = req.body;
  if (!updatedHomepage || typeof updatedHomepage !== 'object') {
    return res.status(400).json({ error: 'Invalid homepage content payload' });
  }

  const store = readStore();
  const currentHp = store.homepage || {};
  store.homepage = {
    ...currentHp,
    ...updatedHomepage,
    hero: { ...(currentHp.hero || {}), ...(updatedHomepage.hero || {}) },
    categories: { ...(currentHp.categories || {}), ...(updatedHomepage.categories || {}) },
    editorial: { ...(currentHp.editorial || {}), ...(updatedHomepage.editorial || {}) },
    advantages: { ...(currentHp.advantages || {}), ...(updatedHomepage.advantages || {}) },
    advantagesSection: updatedHomepage.advantagesSection || currentHp.advantagesSection || DEFAULT_ADVANTAGES_SECTION,
    aboutSofyra: { ...(currentHp.aboutSofyra || {}), ...(updatedHomepage.aboutSofyra || {}) },
    contactPage: { ...(currentHp.contactPage || {}), ...(updatedHomepage.contactPage || {}) }
  };
  writeStore(store);

  res.json({ success: true, homepage: store.homepage });
});

app.post('/api/homepage', requireAdmin, (req, res) => {
  const updatedHomepage = req.body;
  if (!updatedHomepage || typeof updatedHomepage !== 'object') {
    return res.status(400).json({ error: 'Invalid homepage content payload' });
  }

  const store = readStore();
  const currentHp = store.homepage || {};
  store.homepage = {
    ...currentHp,
    ...updatedHomepage,
    hero: { ...(currentHp.hero || {}), ...(updatedHomepage.hero || {}) },
    categories: { ...(currentHp.categories || {}), ...(updatedHomepage.categories || {}) },
    editorial: { ...(currentHp.editorial || {}), ...(updatedHomepage.editorial || {}) },
    advantages: { ...(currentHp.advantages || {}), ...(updatedHomepage.advantages || {}) },
    advantagesSection: updatedHomepage.advantagesSection || currentHp.advantagesSection || DEFAULT_ADVANTAGES_SECTION,
    aboutSofyra: { ...(currentHp.aboutSofyra || {}), ...(updatedHomepage.aboutSofyra || {}) },
    contactPage: { ...(currentHp.contactPage || {}), ...(updatedHomepage.contactPage || {}) }
  };
  writeStore(store);

  res.json({ success: true, homepage: store.homepage });
});

// 3. Products
app.get('/api/products', (req, res) => {
  const store = readStore();
  res.json(store.products);
});

app.post('/api/products', requireAdmin, (req, res) => {
  // If array is passed, perform bulk save matching PUT /api/products
  if (Array.isArray(req.body)) {
    const store = readStore();
    store.products = req.body;
    writeStore(store);
    return res.json({ success: true, products: store.products });
  }

  const productData = req.body;
  if (!productData || !productData.name) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  const store = readStore();
  const id = productData.id || `prod-${Date.now()}`;
  const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const newProduct = {
    id,
    slug,
    name: productData.name,
    subtitle: productData.subtitle || '',
    category: productData.category || 'jewellery',
    subcategory: productData.subcategory || 'rings',
    price: Number(productData.price) || 1000,
    compareAtPrice: productData.compareAtPrice ? Number(productData.compareAtPrice) : undefined,
    discountPercent: productData.discountPercent ? Number(productData.discountPercent) : (
      productData.compareAtPrice && productData.compareAtPrice > productData.price
        ? Math.round(((productData.compareAtPrice - productData.price) / productData.compareAtPrice) * 100)
        : undefined
    ),
    description: productData.description || '',
    details: Array.isArray(productData.details) ? productData.details : (
      typeof productData.details === 'string'
        ? productData.details.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : []
    ),
    material: productData.material || '925 Sterling Silver',
    plating: productData.plating || '18K Yellow Gold',
    stone: productData.stone || '',
    dimensions: productData.dimensions || '',
    careInfo: productData.careInfo || 'To preserve your jewellery brilliance, avoid direct contact with perfumes and chlorinated water. Store safely in your SOFYRA pouch.',
    shippingInfo: productData.shippingInfo || 'Nationwide delivery across Pakistan in 4-5 business days. Cash on delivery is available.',
    guaranteeInfo: productData.guaranteeInfo || "Covered by SOFYRA's 30-day money-back guarantee, subject to our return policy.",
    sku: productData.sku || `SOF-${id.toUpperCase()}`,
    stockCount: typeof productData.stockCount === 'number' ? productData.stockCount : 10,
    inStock: productData.inStock !== false,
    isNew: Boolean(productData.isNew),
    isFeatured: Boolean(productData.isFeatured),
    isBestseller: Boolean(productData.isBestseller),
    images: Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=900&auto=format&fit=crop'],
    wornByYouMedia: Array.isArray(productData.wornByYouMedia) ? productData.wornByYouMedia : [],
    variants: productData.variants || [],
    rating: productData.rating || 5,
    reviewCount: productData.reviewCount || 0,
    createdAt: productData.createdAt || new Date().toISOString()
  };

  const existingIdx = store.products.findIndex((p: any) => p.id === id || p.slug === slug);
  if (existingIdx >= 0) {
    store.products[existingIdx] = { ...store.products[existingIdx], ...newProduct };
  } else {
    store.products.unshift(newProduct);
  }
  writeStore(store);

  res.json({ success: true, product: newProduct });
});

app.put('/api/products', requireAdmin, (req, res) => {
  const products = req.body;
  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'Expected an array of products' });
  }

  const store = readStore();
  store.products = products;
  writeStore(store);

  res.json({ success: true, products: store.products });
});

app.patch('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const store = readStore();
  const index = store.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  store.products[index] = { ...store.products[index], ...updates };
  writeStore(store);

  res.json({ success: true, product: store.products[index] });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const store = readStore();
  store.products = store.products.filter(p => p.id !== id);
  writeStore(store);

  res.json({ success: true, message: 'Product removed' });
});

// 4. Categories & Subcategories
app.get('/api/categories', (req, res) => {
  const store = readStore();
  res.json(store.categories);
});

app.put('/api/categories', requireAdmin, (req, res) => {
  const categories = req.body;
  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: 'Expected an array of categories' });
  }

  const store = readStore();
  store.categories = categories;
  writeStore(store);

  res.json({ success: true, categories: store.categories });
});

app.post('/api/categories', requireAdmin, (req, res) => {
  // If array is passed, perform bulk save matching PUT /api/categories
  if (Array.isArray(req.body)) {
    const store = readStore();
    store.categories = req.body;
    writeStore(store);
    return res.json({ success: true, categories: store.categories });
  }

  const newCat = req.body;
  if (!newCat || !newCat.name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const store = readStore();
  const id = newCat.id || `cat-${Date.now()}`;
  const slug = newCat.slug || newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const categoryItem = {
    id,
    name: newCat.name,
    slug,
    description: newCat.description || '',
    image: newCat.image || '',
    subcategories: Array.isArray(newCat.subcategories) ? newCat.subcategories : []
  };

  const existingIdx = store.categories.findIndex((c: any) => c.id === id || c.slug === slug);
  if (existingIdx >= 0) {
    store.categories[existingIdx] = { ...store.categories[existingIdx], ...categoryItem };
  } else {
    store.categories.push(categoryItem);
  }
  writeStore(store);

  res.json({ success: true, category: categoryItem });
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const store = readStore();
  store.categories = store.categories.filter(c => c.id !== id && c.slug !== id);
  writeStore(store);

  res.json({ success: true });
});

// 5. Worn By You
app.get('/api/worn-by-you', (req, res) => {
  const store = readStore();
  res.json(store.wornByYou);
});

app.put('/api/worn-by-you', requireAdmin, (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Expected array of Worn By You items' });
  }

  const store = readStore();
  store.wornByYou = items;
  writeStore(store);

  res.json({ success: true, wornByYou: store.wornByYou });
});

app.post('/api/worn-by-you', requireAdmin, (req, res) => {
  // If array is passed, perform bulk save matching PUT /api/worn-by-you
  if (Array.isArray(req.body)) {
    const store = readStore();
    store.wornByYou = req.body;
    writeStore(store);
    return res.json({ success: true, wornByYou: store.wornByYou });
  }

  const item = req.body;
  if (!item || !item.mediaUrl) {
    return res.status(400).json({ error: 'Media URL is required' });
  }

  const store = readStore();
  const newItem = {
    id: item.id || `wby-${Date.now()}`,
    type: item.type || 'image',
    mediaUrl: item.mediaUrl,
    thumbnailUrl: item.thumbnailUrl || item.mediaUrl,
    caption: item.caption || '',
    productId: item.productId || '',
    productName: item.productName || '',
    order: typeof item.order === 'number' ? item.order : store.wornByYou.length + 1
  };

  store.wornByYou.push(newItem);
  writeStore(store);

  res.json({ success: true, item: newItem });
});

app.delete('/api/worn-by-you/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const store = readStore();
  store.wornByYou = store.wornByYou.filter(item => item.id !== id);
  writeStore(store);

  res.json({ success: true });
});

// 6. Contact Information
app.get('/api/contact-info', (req, res) => {
  const store = readStore();
  res.json(store.contactInfo);
});

app.put('/api/contact-info', requireAdmin, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid contact info' });
  }

  const store = readStore();
  store.contactInfo = { ...store.contactInfo, ...updates };
  writeStore(store);

  res.json({ success: true, contactInfo: store.contactInfo });
});

app.post('/api/contact-info', requireAdmin, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid contact info' });
  }

  const store = readStore();
  store.contactInfo = { ...store.contactInfo, ...updates };
  writeStore(store);

  res.json({ success: true, contactInfo: store.contactInfo });
});

// 7. Site Settings (Why Sofyra, Money Back Guarantee, Accordions, Benefits Row)
app.get('/api/site-settings', (req, res) => {
  const store = readStore();
  res.json(store.siteSettings);
});

app.put('/api/site-settings', requireAdmin, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid site settings' });
  }

  const store = readStore();
  store.siteSettings = { ...store.siteSettings, ...updates };
  writeStore(store);

  res.json({ success: true, siteSettings: store.siteSettings });
});

app.post('/api/site-settings', requireAdmin, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid site settings' });
  }

  const store = readStore();
  store.siteSettings = { ...store.siteSettings, ...updates };
  writeStore(store);

  res.json({ success: true, siteSettings: store.siteSettings });
});

// 8. Orders
app.get('/api/orders', requireAdmin, (req, res) => {
  const store = readStore();
  res.json(store.orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  if (!newOrder || !newOrder.id) {
    return res.status(400).json({ error: 'Invalid order' });
  }

  const store = readStore();
  store.orders = [newOrder, ...store.orders];
  writeStore(store);

  res.json({ success: true, order: newOrder });
});

app.patch('/api/orders/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const store = readStore();
  const index = store.orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  store.orders[index] = { ...store.orders[index], ...updates };
  writeStore(store);

  res.json({ success: true, order: store.orders[index] });
});

// 9. Reviews
app.get('/api/reviews', (req, res) => {
  const store = readStore();
  res.json(store.reviews);
});

app.put('/api/reviews', requireAdmin, (req, res) => {
  const reviews = req.body;
  if (!Array.isArray(reviews)) {
    return res.status(400).json({ error: 'Expected array of reviews' });
  }

  const store = readStore();
  store.reviews = reviews;
  writeStore(store);

  res.json({ success: true, reviews: store.reviews });
});

app.post('/api/reviews', (req, res) => {
  if (Array.isArray(req.body)) {
    const store = readStore();
    store.reviews = req.body;
    writeStore(store);
    return res.json({ success: true, reviews: store.reviews });
  }

  const review = req.body;
  if (!review || !review.customerName) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  const store = readStore();
  const newReview = {
    id: review.id || `rev-${Date.now()}`,
    customerName: review.customerName,
    customerCity: review.customerCity || '',
    rating: Number(review.rating) || 5,
    title: review.title || '',
    comment: review.comment || '',
    productName: review.productName || '',
    productId: review.productId || '',
    verified: Boolean(review.verified),
    userImage: review.userImage || review.image || '',
    published: review.published !== false,
    order: typeof review.order === 'number' ? review.order : store.reviews.length + 1,
    date: review.date || new Date().toISOString().split('T')[0]
  };

  store.reviews = [newReview, ...store.reviews];
  writeStore(store);

  res.json({ success: true, review: newReview });
});

app.put('/api/reviews/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const store = readStore();
  const index = store.reviews.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }

  store.reviews[index] = { ...store.reviews[index], ...updates };
  writeStore(store);

  res.json({ success: true, review: store.reviews[index] });
});

app.delete('/api/reviews/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const store = readStore();
  store.reviews = store.reviews.filter(r => r.id !== id);
  writeStore(store);

  res.json({ success: true });
});

// 6. Admin Authentication Endpoints
app.get('/api/auth/status', (req, res) => {
  const admin = readAdmin();
  res.json({
    hasAdmin: Boolean(admin && admin.email && admin.passwordHash),
    email: admin ? admin.email : null
  });
});

app.post('/api/auth/register', (req, res) => {
  const existingAdmin = readAdmin();
  const { email, password, securityPin } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. example@gmail.com).' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (existingAdmin) {
    // If this is the same admin re-authenticating, issue a fresh session token
    if (existingAdmin.email.toLowerCase() === cleanEmail) {
      const calculatedHash = hashSecret(password, existingAdmin.salt);
      if (calculatedHash === existingAdmin.passwordHash) {
        const token = generateToken();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        activeSessions[token] = {
          token,
          email: cleanEmail,
          role: 'admin',
          createdAt: Date.now(),
          expiresAt
        };
        saveSessions();

        return res.json({
          success: true,
          token,
          user: {
            id: existingAdmin.id,
            email: existingAdmin.email,
            role: 'admin'
          }
        });
      }
    }
    return res.status(400).json({ error: 'An administrator account has already been registered. Public registration is locked.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashSecret(password, salt);

  let pinHash: string | undefined;
  let pinSalt: string | undefined;
  if (securityPin && typeof securityPin === 'string' && securityPin.trim().length >= 4) {
    pinSalt = crypto.randomBytes(16).toString('hex');
    pinHash = hashSecret(securityPin.trim(), pinSalt);
  }

  const newAdmin: AdminAccount = {
    id: 'admin-' + Date.now(),
    email: cleanEmail,
    passwordHash,
    salt,
    pinHash,
    pinSalt,
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  writeAdmin(newAdmin);

  // Generate persistent 7-day session token
  const token = generateToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  activeSessions[token] = {
    token,
    email: cleanEmail,
    role: 'admin',
    createdAt: Date.now(),
    expiresAt
  };
  saveSessions();

  res.json({
    success: true,
    token,
    user: {
      id: newAdmin.id,
      email: newAdmin.email,
      role: 'admin'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  const admin = readAdmin();
  if (!admin) {
    return res.status(400).json({ error: 'No administrator registered yet. Please create an account.' });
  }

  if (admin.email.toLowerCase() !== cleanEmail) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const calculatedHash = hashSecret(password, admin.salt);
  if (calculatedHash !== admin.passwordHash) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  // Update last login
  admin.lastLogin = new Date().toISOString();
  writeAdmin(admin);

  // Create 7-day session token
  const token = generateToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  activeSessions[token] = {
    token,
    email: admin.email,
    role: 'admin',
    createdAt: Date.now(),
    expiresAt
  };
  saveSessions();

  res.json({
    success: true,
    token,
    user: {
      id: admin.id,
      email: admin.email,
      role: 'admin'
    }
  });
});

app.get('/api/auth/session', (req, res) => {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.json({ authenticated: false, user: null });
  }

  res.json({
    authenticated: true,
    user: {
      email: session.email,
      role: session.role
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }

  if (token && activeSessions[token]) {
    delete activeSessions[token];
    saveSessions();
  }

  res.json({ success: true });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, securityPin, newPassword } = req.body;
  const admin = readAdmin();

  if (!admin) {
    return res.status(400).json({ error: 'No admin registered.' });
  }

  if (admin.email.toLowerCase() !== (email || '').trim().toLowerCase()) {
    return res.status(400).json({ error: 'Email does not match registered admin.' });
  }

  if (!admin.pinHash || !admin.pinSalt) {
    return res.status(400).json({ error: 'No recovery PIN was configured for this admin account.' });
  }

  const calculatedPinHash = hashSecret(securityPin, admin.pinSalt);
  if (calculatedPinHash !== admin.pinHash) {
    return res.status(401).json({ error: 'Invalid security PIN.' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  admin.salt = newSalt;
  admin.passwordHash = hashSecret(newPassword, newSalt);
  writeAdmin(admin);

  res.json({ success: true, message: 'Password reset successfully' });
});

// ---------------------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SOFYRA Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('SOFYRA Server encountered an error:', err);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting SOFYRA server:', err);
  process.exit(1);
});

