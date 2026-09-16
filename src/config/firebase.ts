/**
 * SOFYRA - Firebase & Cloud Database Configuration
 * 
 * Reads standard Vite build environment variables provided via import.meta.env:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const rawStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0301737033.firebasestorage.app";
const cleanStorageBucket = rawStorageBucket.trim().replace(/^gs:\/\//i, '').replace(/\/+$/, '');

// Injected by Vite build via Cloudflare / production environment variables:
export const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDU4rR6H1jVq7BuBszTamUV0jlQAr0GLmo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0301737033.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0301737033",
  storageBucket: cleanStorageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "49762632999",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:49762632999:web:7fca918b45d5624cc8d502",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};
