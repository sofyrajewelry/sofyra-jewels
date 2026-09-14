import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  Firestore
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage
} from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase';
import { CategoryItem, Product, HomepageContent } from '../types';

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let authInstance: Auth | null = null;

export const initFirebase = (): {
  app: FirebaseApp | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  auth: Auth | null;
} => {
  if (!isFirebaseConfigured()) {
    return { app: null, db: null, storage: null, auth: null };
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(firebaseConfig);
    } else {
      appInstance = getApp();
    }
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
    authInstance = getAuth(appInstance);
    return { app: appInstance, db: dbInstance, storage: storageInstance, auth: authInstance };
  } catch (error) {
    console.warn('[SOFYRA Firebase] Initialization skipped or error:', error);
    return { app: null, db: null, storage: null, auth: null };
  }
};

export const getFirebaseDb = (): Firestore | null => {
  if (!dbInstance) initFirebase();
  return dbInstance;
};

export const getFirebaseStorageInstance = (): FirebaseStorage | null => {
  if (!storageInstance) initFirebase();
  return storageInstance;
};

export const getFirebaseAuthInstance = (): Auth | null => {
  if (!authInstance) initFirebase();
  return authInstance;
};

// ==========================================
// 1. FIRESTORE CATEGORIES CRUD
// ==========================================

export const fetchCategoriesFromFirestore = async (): Promise<CategoryItem[] | null> => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, 'categories');
    const q = query(colRef, orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Try fetching without orderBy in case index/field is missing
      const plainSnapshot = await getDocs(colRef);
      if (plainSnapshot.empty) return null;
      return plainSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CategoryItem));
    }

    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CategoryItem));
  } catch (err) {
    console.warn('[SOFYRA Firebase] Could not fetch categories from Firestore:', err);
    return null;
  }
};

export const saveCategoryToFirestore = async (category: CategoryItem): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const docId = category.id || `cat-${category.slug}`;
    const docRef = doc(db, 'categories', docId);
    
    // Clean out undefined values before saving to Firestore
    const cleanData = JSON.parse(JSON.stringify(category));
    delete cleanData.subcategories; // Ensure no subcategories in Firestore schema

    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.warn('[SOFYRA Firebase] Error saving category to Firestore:', err);
    return false;
  }
};

export const saveAllCategoriesToFirestore = async (categories: CategoryItem[]): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const batch = writeBatch(db);
    categories.forEach(cat => {
      const docId = cat.id || `cat-${cat.slug}`;
      const docRef = doc(db, 'categories', docId);
      const cleanData = JSON.parse(JSON.stringify(cat));
      delete cleanData.subcategories;
      batch.set(docRef, cleanData, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.warn('[SOFYRA Firebase] Error saving all categories to Firestore:', err);
    return false;
  }
};

export const deleteCategoryFromFirestore = async (categoryId: string): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('[SOFYRA Firebase] Error deleting category from Firestore:', err);
    return false;
  }
};

// ==========================================
// 2. FIRESTORE PRODUCTS CRUD
// ==========================================

export const fetchProductsFromFirestore = async (): Promise<Product[] | null> => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, 'products');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return null;

    return snapshot.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        ...data,
        category: (data.category || data.subcategory || 'rings').toLowerCase()
      } as Product;
    });
  } catch (err) {
    console.warn('[SOFYRA Firebase] Could not fetch products from Firestore:', err);
    return null;
  }
};

export const saveProductToFirestore = async (product: Product): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'products', product.id);
    const cleanData = JSON.parse(JSON.stringify(product));
    delete cleanData.subcategory; // No subcategories
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.warn('[SOFYRA Firebase] Error saving product to Firestore:', err);
    return false;
  }
};

export const deleteProductFromFirestore = async (productId: string): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('[SOFYRA Firebase] Error deleting product from Firestore:', err);
    return false;
  }
};

// ==========================================
// 3. FIREBASE STORAGE IMAGE UPLOAD
// ==========================================

export const uploadImageToFirebaseStorage = async (
  dataUrlOrBlob: string | Blob,
  fileName: string
): Promise<string | null> => {
  const storage = getFirebaseStorageInstance();
  if (!storage) return null;

  try {
    const uniquePath = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, uniquePath);

    if (typeof dataUrlOrBlob === 'string') {
      if (dataUrlOrBlob.startsWith('data:')) {
        const snapshot = await uploadString(storageRef, dataUrlOrBlob, 'data_url');
        return await getDownloadURL(snapshot.ref);
      }
      return null;
    } else {
      const snapshot = await uploadBytes(storageRef, dataUrlOrBlob);
      return await getDownloadURL(snapshot.ref);
    }
  } catch (err) {
    console.warn('[SOFYRA Firebase] Storage upload error:', err);
    return null;
  }
};

// ==========================================
// 4. BULK CLOUD SYNC
// ==========================================

export const syncLocalToFirestore = async (
  categories: CategoryItem[],
  products: Product[]
): Promise<{ categoriesCount: number; productsCount: number }> => {
  const db = getFirebaseDb();
  if (!db) return { categoriesCount: 0, productsCount: 0 };

  let categoriesCount = 0;
  let productsCount = 0;

  try {
    for (const cat of categories) {
      const ok = await saveCategoryToFirestore(cat);
      if (ok) categoriesCount++;
    }

    for (const prod of products) {
      const ok = await saveProductToFirestore(prod);
      if (ok) productsCount++;
    }
  } catch (err) {
    console.error('[SOFYRA Firebase] Sync local to Firestore failed:', err);
  }

  return { categoriesCount, productsCount };
};

// ==========================================
// 5. FIRESTORE HOMEPAGE & ABOUT CONTENT
// ==========================================

export const fetchHomepageFromFirestore = async (): Promise<HomepageContent | null> => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const docRef = doc(db, 'siteContent', 'homepage');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as HomepageContent;
  } catch (err) {
    console.warn('[SOFYRA Firebase] Could not fetch homepage from Firestore:', err);
    return null;
  }
};

export const saveHomepageToFirestore = async (content: HomepageContent): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'siteContent', 'homepage');
    const cleanData = JSON.parse(JSON.stringify(content));
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.warn('[SOFYRA Firebase] Error saving homepage to Firestore:', err);
    return false;
  }
};

