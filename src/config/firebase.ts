/**
 * SOFYRA - Firebase & Cloud Database Configuration
 * 
 * To connect your live Firebase Firestore database:
 * 1. Create a free project at https://console.firebase.google.com
 * 2. Create a Firestore Database in production/test mode
 * 3. Add a Web App in Firebase Project Settings
 * 4. Paste your configuration credentials below (or use environment variables)
 * 5. Set `isFirebaseEnabled` to `true`
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// User credentials placeholder - easily editable or configured via .env:
export const firebaseConfig: FirebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "sofyra-jewellery.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "sofyra-jewellery",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "sofyra-jewellery.appspot.com",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || ""
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};
