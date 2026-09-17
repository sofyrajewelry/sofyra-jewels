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
    dbInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
      : getFirestore(appInstance);
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

    // Bound with a 3.5s timeout so hanging or offline Firestore never stalls UI product saving
    const savePromise = setDoc(docRef, cleanData, { merge: true }).then(() => true);
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.warn('[SOFYRA Firebase] Firestore write timed out after 3.5s');
        resolve(false);
      }, 3500);
    });

    return await Promise.race([savePromise, timeoutPromise]);
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
    const deletePromise = deleteDoc(docRef).then(() => true);
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 3000);
    });
    return await Promise.race([deletePromise, timeoutPromise]);
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
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
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
    const configSnap = await getDoc(doc(db, 'siteContent', 'adminConfig'));
    if (configSnap.exists() && configSnap.data()?.hasAdmin) {
      return { hasAdmin: true, email: configSnap.data()?.masterAdminEmail || null };
    }

    const adminsCol = collection(db, 'admins');
    const adminDocs = await getDocs(adminsCol);
    if (!adminDocs.empty) {
      const first = adminDocs.docs[0].data();
      return { hasAdmin: true, email: first.email || null };
    }
  } catch (err) {
    console.warn('[SOFYRA Firebase] Check admin in Firestore error:', err);
  }

  return { hasAdmin: false };
};


