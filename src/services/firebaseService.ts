import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  deleteField,
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
import { getAuth, Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase';
import { CategoryItem, Product, HomepageContent } from '../types';

export interface FirebaseAuthResult {
  success: boolean;
  user?: { uid: string; email: string; role: 'admin' };
  token?: string;
  error?: string;
  isExistingUser?: boolean;
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let authInstance: Auth | null = null;

let isFirebaseInitLogged = false;

async function withFirestoreTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 20000,
  description: string = 'Firestore operation'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${description} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

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
    const rawDbId = (firebaseConfig.firestoreDatabaseId || '').trim();
    const isCustomDb = Boolean(rawDbId && rawDbId !== '(default)' && rawDbId !== 'default');
    if (!dbInstance) {
      dbInstance = isCustomDb
        ? initializeFirestore(appInstance, { experimentalForceLongPolling: true }, rawDbId)
        : initializeFirestore(appInstance, { experimentalForceLongPolling: true });
    }

    if (!isFirebaseInitLogged) {
      isFirebaseInitLogged = true;
      const resolvedProjectId = firebaseConfig.projectId || '(unknown)';
      const resolvedDatabaseId = isCustomDb ? rawDbId : '(default)';
      console.log(`[SOFYRA Firebase] Initialized with projectId: "${resolvedProjectId}", databaseId: "${resolvedDatabaseId}"`);
    }

    storageInstance = getStorage(appInstance);
    // Limit upload retry window to 10s so UI never hangs indefinitely if storage is unavailable
    try {
      storageInstance.maxUploadRetryTime = 10000;
      storageInstance.maxOperationRetryTime = 10000;
    } catch {
      // Safe fallback if not supported on instance
    }
    authInstance = getAuth(appInstance);

    return { app: appInstance, db: dbInstance, storage: storageInstance, auth: authInstance };
  } catch (error) {
    console.warn('[SOFYRA Firebase] Initialization skipped or error:', error);
    return { app: null, db: null, storage: null, auth: null };
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = getFirebaseAuthInstance();
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

export const fetchCategoriesFromFirestore = async (): Promise<CategoryItem[]> => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Database is not initialized');
  }

  try {
    const colRef = collection(db, 'categories');
    // Get all category documents from Firestore
    const snapshot = await withFirestoreTimeout(
      () => getDocs(colRef),
      20000,
      'fetchCategories getDocs'
    );
    if (snapshot.empty) return [];

    const docs: CategoryItem[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CategoryItem));

    // Sort in application code: items with displayOrder/order first, then others
    docs.sort((a, b) => {
      const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : (typeof a.order === 'number' ? a.order : 999);
      const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : (typeof b.order === 'number' ? b.order : 999);
      return orderA - orderB;
    });

    return docs;
  } catch (err: any) {
    console.error('[SOFYRA Firebase] fetchCategoriesFromFirestore failed:', { name: err?.name, code: err?.code, message: err?.message, raw: err });
    throw err;
  }
};

export const saveCategoryToFirestore = async (category: CategoryItem): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Database is not initialized');
  }

  try {
    const docId = category.id || `cat-${category.slug}`;
    const docRef = doc(db, 'categories', docId);
    
    // Clean out undefined values before saving to Firestore
    const cleanData = JSON.parse(JSON.stringify(category));
    delete cleanData.subcategories; // Ensure no subcategories in Firestore schema

    await withFirestoreTimeout(
      () => setDoc(docRef, cleanData, { merge: true }),
      20000,
      'saveCategory setDoc'
    );
    return true;
  } catch (err: any) {
    console.error('[SOFYRA Firebase] saveCategoryToFirestore failed:', { name: err?.name, code: err?.code, message: err?.message, raw: err });
    throw err;
  }
};

export const saveAllCategoriesToFirestore = async (categories: CategoryItem[]): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Database is not initialized');
  }

  try {
    const batch = writeBatch(db);
    categories.forEach(cat => {
      const docId = cat.id || `cat-${cat.slug}`;
      const docRef = doc(db, 'categories', docId);
      const cleanData = JSON.parse(JSON.stringify(cat));
      delete cleanData.subcategories;
      batch.set(docRef, cleanData, { merge: true });
    });
    await withFirestoreTimeout(
      () => batch.commit(),
      20000,
      'saveAllCategories batch.commit'
    );
    return true;
  } catch (err: any) {
    console.error('[SOFYRA Firebase] saveAllCategoriesToFirestore failed:', { name: err?.name, code: err?.code, message: err?.message, raw: err });
    throw err;
  }
};

export const deleteCategoryFromFirestore = async (categoryId: string): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Database is not initialized');
  }

  try {
    const docRef = doc(db, 'categories', categoryId);
    await withFirestoreTimeout(
      () => deleteDoc(docRef),
      20000,
      'deleteCategory deleteDoc'
    );
    return true;
  } catch (err: any) {
    console.error('[SOFYRA Firebase] deleteCategoryFromFirestore failed:', { name: err?.name, code: err?.code, message: err?.message, raw: err });
    throw err;
  }
};

// ==========================================
// 2. FIRESTORE PRODUCTS CRUD
// ==========================================

export const fetchProductsFromFirestore = async (): Promise<Product[]> => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Database is not initialized');
  }

  try {
    const colRef = collection(db, 'products');
    const snapshot = await withFirestoreTimeout(
      () => getDocs(colRef),
      20000,
      'fetchProducts getDocs'
    );
    if (snapshot.empty) return [];

    const docs: Product[] = snapshot.docs.map(d => {
      const data = d.data() as any;
      const isBestseller = Boolean(data.isBestseller);
      return {
        id: d.id,
        ...data,
        isBestseller,
        bestsellerOrder: isBestseller && data.bestsellerOrder !== undefined ? data.bestsellerOrder : undefined,
        category: (data.category || data.subcategory || 'rings').toLowerCase()
      } as Product;
    });

    return docs;
  } catch (err: any) {
    console.error('[SOFYRA Firebase] fetchProductsFromFirestore failed:', { name: err?.name, code: err?.code, message: err?.message, raw: err });
    throw err;
  }
};

export const saveProductToFirestore = async (product: Product): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Database is not initialized');
  }

  try {
    const docRef = doc(db, 'products', product.id);
    const cleanData = JSON.parse(JSON.stringify(product));
    delete cleanData.subcategory; // No subcategories

    if (!product.isBestseller || product.bestsellerOrder === undefined || product.bestsellerOrder === null) {
      cleanData.isBestseller = false;
      cleanData.bestsellerOrder = deleteField();
    } else {
      cleanData.isBestseller = true;
      cleanData.bestsellerOrder = product.bestsellerOrder;
    }

    await withFirestoreTimeout(
      () => setDoc(docRef, cleanData, { merge: true }),
      20000,
      'saveProduct setDoc'
    );
    return true;
  } catch (err: any) {
    console.error('[SOFYRA Firebase] saveProductToFirestore failed:', { name: err?.name, code: err?.code, message: err?.message, raw: err });
    throw err;
  }
};

export const saveAllProductsToFirestore = async (products: Product[]): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Database is not initialized');
  }

  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(prod => {
        if (!prod || !prod.id) return;
        const docRef = doc(db, 'products', prod.id);
        const cleanData = JSON.parse(JSON.stringify(prod));
        delete cleanData.subcategory;

        if (!prod.isBestseller || prod.bestsellerOrder === undefined || prod.bestsellerOrder === null) {
          cleanData.isBestseller = false;
          cleanData.bestsellerOrder = deleteField();
        } else {
          cleanData.isBestseller = true;
          cleanData.bestsellerOrder = prod.bestsellerOrder;
        }

        batch.set(docRef, cleanData, { merge: true });
      });
      await withFirestoreTimeout(
        () => batch.commit(),
        20000,
        'saveAllProducts batch.commit'
      );
    }
    return true;
  } catch (err: any) {
    console.error('[SOFYRA Firebase] saveAllProductsToFirestore failed:', { name: err?.name, code: err?.code, message: err?.message, raw: err });
    throw err;
  }
};

export const deleteProductFromFirestore = async (productId: string): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Database is not initialized');
  }

  try {
    const docRef = doc(db, 'products', productId);
    await withFirestoreTimeout(
      () => deleteDoc(docRef),
      20000,
      'deleteProduct deleteDoc'
    );
    return true;
  } catch (err: any) {
    console.error('[SOFYRA Firebase] deleteProductFromFirestore failed:', { name: err?.name, code: err?.code, message: err?.message, raw: err });
    throw err;
  }
};

// ==========================================
// 3. FIREBASE STORAGE IMAGE UPLOAD
// ==========================================

export const uploadImageToFirebaseStorage = async (
  dataUrlOrBlob: string | Blob,
  fileName: string
): Promise<string | null> => {
  // If it is already a persistent URL, return directly
  if (
    typeof dataUrlOrBlob === 'string' &&
    (dataUrlOrBlob.startsWith('http://') ||
      dataUrlOrBlob.startsWith('https://') ||
      dataUrlOrBlob.startsWith('/uploads/'))
  ) {
    return dataUrlOrBlob;
  }

  const storage = getFirebaseStorageInstance();
  if (!storage) return null;

  try {
    let blobToUpload: Blob;
    let mimeType = 'image/jpeg';

    if (typeof dataUrlOrBlob === 'string') {
      if (dataUrlOrBlob.startsWith('data:')) {
        try {
          const res = await fetch(dataUrlOrBlob);
          blobToUpload = await res.blob();
          if (blobToUpload.type) mimeType = blobToUpload.type;
        } catch {
          const arr = dataUrlOrBlob.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          if (mimeMatch) mimeType = mimeMatch[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          blobToUpload = new Blob([u8arr], { type: mimeType });
        }
      } else {
        // Raw base64 string
        const cleanBase64 = dataUrlOrBlob.replace(/\s/g, '');
        const bstr = atob(cleanBase64);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        blobToUpload = new Blob([u8arr], { type: mimeType });
      }
    } else {
      blobToUpload = dataUrlOrBlob;
      if (dataUrlOrBlob.type) {
        mimeType = dataUrlOrBlob.type;
      }
    }

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('svg')) ext = 'svg';

    const cleanName = (fileName || 'image').replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^/.]+$/, '');
    const uniquePath = `products/${Date.now()}-${cleanName}.${ext}`;

    const metadata = {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000'
    };

    const uploadWithTimeout = async (targetStorage: FirebaseStorage, timeoutMs: number = 3500): Promise<string> => {
      const storageRef = ref(targetStorage, uniquePath);
      const uploadPromise = (async () => {
        const snapshot = await uploadBytes(storageRef, blobToUpload, metadata);
        return await getDownloadURL(snapshot.ref);
      })();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Storage upload timed out')), timeoutMs)
      );
      return await Promise.race([uploadPromise, timeoutPromise]);
    };

    try {
      return await uploadWithTimeout(storage, 3500);
    } catch (primaryErr) {
      console.warn('[SOFYRA Firebase] Primary bucket upload failed, trying alternate:', primaryErr);
      const app = getApps()[0] || appInstance;
      if (app && firebaseConfig.projectId) {
        const currentBucket = firebaseConfig.storageBucket || '';
        let altBucket = '';
        if (currentBucket.endsWith('.firebasestorage.app')) {
          altBucket = `${firebaseConfig.projectId}.appspot.com`;
        } else if (currentBucket.endsWith('.appspot.com')) {
          altBucket = `${firebaseConfig.projectId}.firebasestorage.app`;
        }
        if (altBucket && altBucket !== currentBucket) {
          try {
            const altStorage = getStorage(app, `gs://${altBucket}`);
            return await uploadWithTimeout(altStorage, 2500);
          } catch (altErr) {
            console.warn('[SOFYRA Firebase] Alternate bucket upload also failed:', altErr);
          }
        }
      }
      return null;
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
    const snap = await withFirestoreTimeout(
      () => getDoc(docRef),
      20000,
      'fetchHomepage getDoc'
    );
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
    await withFirestoreTimeout(
      () => setDoc(docRef, cleanData, { merge: true }),
      20000,
      'saveHomepage setDoc'
    );
    return true;
  } catch (err) {
    console.warn('[SOFYRA Firebase] Error saving homepage to Firestore:', err);
    return false;
  }
};

// ==========================================
// 6. FIREBASE AUTHENTICATION & ADMIN ROLES
// ==========================================

/**
 * Register a private administrator with Firebase Authentication and record
 * administrative authorization in Firestore.
 */
export const registerAdminWithFirebaseAuth = async (
  email: string,
  password: string
): Promise<FirebaseAuthResult> => {
  const cleanEmail = email.trim().toLowerCase();

  // Validate format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return {
      success: false,
      error: 'Please enter a valid email address (e.g. example@gmail.com).'
    };
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters long.'
    };
  }

  const auth = getFirebaseAuthInstance();
  if (!auth) {
    return {
      success: false,
      error: 'Firebase Authentication is not currently initialized.'
    };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    // Securely write administrative role to Firestore
    const db = getFirebaseDb();
    if (db) {
      try {
        const adminDocRef = doc(db, 'admins', user.uid);
        await setDoc(adminDocRef, {
          uid: user.uid,
          email: cleanEmail,
          role: 'admin',
          isMasterAdmin: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Lock public registration in system status doc
        const configDocRef = doc(db, 'siteContent', 'adminConfig');
        await setDoc(configDocRef, {
          hasAdmin: true,
          masterAdminEmail: cleanEmail,
          masterAdminUid: user.uid,
          lockedAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('[SOFYRA Firebase] Notice: Firestore role recording:', dbErr);
      }
    }

    const token = await user.getIdToken();
    return {
      success: true,
      user: {
        uid: user.uid,
        email: cleanEmail,
        role: 'admin'
      },
      token
    };
  } catch (err: any) {
    const code = err?.code || '';
    const msg = err?.message || '';

    // If account already exists in Firebase Auth, attempt signing in
    if (code === 'auth/email-already-in-use') {
      try {
        const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = signInCred.user;

        // Ensure Firestore role is present
        const db = getFirebaseDb();
        if (db) {
          try {
            const adminDocRef = doc(db, 'admins', user.uid);
            await setDoc(adminDocRef, {
              uid: user.uid,
              email: cleanEmail,
              role: 'admin',
              isMasterAdmin: true,
              lastLogin: new Date().toISOString()
            }, { merge: true });
          } catch {}
        }

        const token = await user.getIdToken();
        return {
          success: true,
          user: {
            uid: user.uid,
            email: cleanEmail,
            role: 'admin'
          },
          token,
          isExistingUser: true
        };
      } catch (signInErr: any) {
        if (signInErr?.code === 'auth/wrong-password' || signInErr?.code === 'auth/invalid-credential') {
          return {
            success: false,
            error: 'This email is already registered in Firebase Authentication. Please enter your existing password to sign in.'
          };
        }
        return {
          success: false,
          error: 'This email is already registered in Firebase Authentication. Please sign in instead.'
        };
      }
    }

    // Human-readable translations for Firebase Auth error codes
    if (code === 'auth/invalid-email') {
      return {
        success: false,
        error: 'Invalid email address format. Please enter a standard email (e.g. example@gmail.com).'
      };
    }
    if (code === 'auth/weak-password') {
      return {
        success: false,
        error: 'Password is too weak. Please use at least 6 characters.'
      };
    }
    if (code === 'auth/password-does-not-meet-requirements') {
      return {
        success: false,
        error: 'Password does not meet the project security policy requirements (minimum 6 characters).'
      };
    }
    if (code === 'auth/operation-not-allowed') {
      return {
        success: false,
        error: 'Email/Password sign-in provider is not enabled in the Firebase Console.'
      };
    }
    if (code === 'auth/network-request-failed') {
      return {
        success: false,
        error: 'Network connection error while contacting Firebase. Please check your internet connection.'
      };
    }
    if (code === 'auth/too-many-requests') {
      return {
        success: false,
        error: 'Too many requests. Please wait a few moments and try again.'
      };
    }
    if (msg.includes('pattern') || msg.includes('did not match')) {
      return {
        success: false,
        error: 'Format validation error: Please ensure your email is valid (e.g. example@gmail.com) and password is at least 6 characters.'
      };
    }

    return {
      success: false,
      error: msg || 'Failed to create Firebase administrator account.'
    };
  }
};

/**
 * Authenticate administrator with Firebase Authentication.
 */
export const loginAdminWithFirebaseAuth = async (
  email: string,
  password: string
): Promise<FirebaseAuthResult> => {
  const cleanEmail = email.trim().toLowerCase();
  const auth = getFirebaseAuthInstance();
  if (!auth) {
    return { success: false, error: 'Firebase Authentication is not configured.' };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;

    // Verify role in Firestore if db is available
    const db = getFirebaseDb();
    if (db) {
      try {
        const adminSnap = await withFirestoreTimeout(
          () => getDoc(doc(db, 'admins', user.uid)),
          10000,
          'loginAdmin getDoc'
        );
        if (adminSnap.exists() && adminSnap.data()?.role !== 'admin') {
          return { success: false, error: 'This account does not have administrative privileges.' };
        }
      } catch {}
    }

    const token = await user.getIdToken();
    return {
      success: true,
      user: { uid: user.uid, email: cleanEmail, role: 'admin' },
      token
    };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return { success: false, error: 'Incorrect email or password.' };
    }
    if (code === 'auth/invalid-email') {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (code === 'auth/too-many-requests') {
      return { success: false, error: 'Access temporarily disabled due to multiple failed attempts. Please try again later.' };
    }
    return { success: false, error: err?.message || 'Firebase login failed.' };
  }
};

/**
 * Check if an administrator record already exists in Firestore.
 */
export const checkFirestoreAdminExists = async (): Promise<{ hasAdmin: boolean; email?: string | null }> => {
  const db = getFirebaseDb();
  if (!db) return { hasAdmin: false };

  try {
    const configSnap = await withFirestoreTimeout(
      () => getDoc(doc(db, 'siteContent', 'adminConfig')),
      20000,
      'checkFirestoreAdminExists getDoc'
    );
    if (configSnap.exists() && configSnap.data()?.hasAdmin) {
      return { hasAdmin: true, email: configSnap.data()?.masterAdminEmail || null };
    }

    const adminsCol = collection(db, 'admins');
    const adminDocs = await withFirestoreTimeout(
      () => getDocs(adminsCol),
      20000,
      'checkFirestoreAdminExists getDocs'
    );
    if (!adminDocs.empty) {
      const first = adminDocs.docs[0].data();
      return { hasAdmin: true, email: first.email || null };
    }
  } catch (err: any) {
    console.error('[SOFYRA Firebase] checkFirestoreAdminExists failed:', { name: err?.name, code: err?.code, message: err?.message, raw: err });
  }

  return { hasAdmin: false };
};


