/**
 * SOFYRA Executive Admin Authentication & Access Control Service
 * 
 * Powered by Firebase Authentication (Email/Password) & Firestore RBAC.
 * - Zero hardcoded passwords.
 * - Zero plaintext or custom password hashing in local files or localStorage.
 * - Persistent Firebase Auth session across browser refreshes and reopenings.
 * - Strict Role-Based Access Control (RBAC) in Firestore ensuring customers have no admin permissions.
 */

import { apiClient } from './apiClient';
import { isFirebaseConfigured } from '../config/firebase';
import {
  registerAdminWithFirebaseAuth,
  loginAdminWithFirebaseAuth,
  checkFirestoreAdminExists,
  getFirebaseAuthInstance
} from './firebaseService';
import { signOut, onAuthStateChanged, sendPasswordResetEmail, User } from 'firebase/auth';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  createdAt: string;
  lastLogin?: string;
}

export interface AdminSession {
  token: string;
  email: string;
  role: 'admin';
  expiresAt: number;
}

type AuthListener = (isAuthenticated: boolean, user: AdminUser | null) => void;

let cachedHasAdmin: boolean = false;
let cachedAdminEmail: string | null = null;
let cachedIsAuthenticated: boolean = false;

// Track whether the initial auth state from Firebase has completed
let isAuthReady = false;
let authReadyResolve: () => void;
const authReadyPromise = new Promise<void>((resolve) => {
  authReadyResolve = resolve;
});

const listeners: Set<AuthListener> = new Set();

function notifyListeners(user: AdminUser | null) {
  listeners.forEach((listener) => {
    try {
      listener(cachedIsAuthenticated, user);
    } catch (e) {
      console.error('[SOFYRA Auth] Listener error:', e);
    }
  });
}

async function getIdTokenWithTimeout(user: User, timeoutMs: number = 10000): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Firebase Auth getIdToken timed out after 10s')), timeoutMs);
  });
  try {
    return await Promise.race([user.getIdToken(), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

// Attach Firebase Auth state listener
let isListenerSet = false;

function setupAuthListener() {
  if (isListenerSet) return;
  const auth = getFirebaseAuthInstance();
  if (auth) {
    isListenerSet = true;
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        cachedIsAuthenticated = true;
        cachedAdminEmail = user.email || null;
        cachedHasAdmin = true;
        try {
          const token = await getIdTokenWithTimeout(user, 10000);
          apiClient.setToken(token);
        } catch {
          // Token extraction error fallback
        }
      } else {
        cachedIsAuthenticated = false;
        apiClient.clearToken();
      }

      if (!isAuthReady) {
        isAuthReady = true;
        authReadyResolve();
      }

      notifyListeners(adminAuthService.getAdminProfile());
    });
  } else {
    if (!isAuthReady) {
      isAuthReady = true;
      authReadyResolve();
    }
  }
}

// Trigger setup on module evaluation
try {
  setupAuthListener();
} catch (e) {
  console.warn('[SOFYRA Auth] Initial auth listener setup deferred:', e);
}

export const adminAuthService = {
  /**
   * Subscribe to authentication state changes.
   */
  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Async initialization that waits for Firebase Auth persistent session restoration
   * and verifies admin registration in Firestore.
   */
  async init(): Promise<{ hasAdmin: boolean; authenticated: boolean; email: string | null }> {
    try {
      // 1. Ensure Firebase Auth listener is hooked
      setupAuthListener();

      const auth = getFirebaseAuthInstance();
      if (auth) {
        // Await Firebase auth state restoration (from IndexedDB / localStorage)
        if (typeof (auth as any).authStateReady === 'function') {
          await Promise.race([
            (auth as any).authStateReady(),
            new Promise((res) => setTimeout(res, 2500))
          ]);
        } else {
          await Promise.race([
            authReadyPromise,
            new Promise((res) => setTimeout(res, 2500))
          ]);
        }

        if (auth.currentUser) {
          cachedIsAuthenticated = true;
          cachedAdminEmail = auth.currentUser.email || cachedAdminEmail;
          cachedHasAdmin = true;
          try {
            const token = await getIdTokenWithTimeout(auth.currentUser, 10000);
            apiClient.setToken(token);
          } catch {}
        }
      }

      // 2. Query Firestore to check if an admin account was created
      if (isFirebaseConfigured()) {
        try {
          const fsAdmin = await checkFirestoreAdminExists();
          if (fsAdmin.hasAdmin) {
            cachedHasAdmin = true;
            if (fsAdmin.email && !cachedAdminEmail) {
              cachedAdminEmail = fsAdmin.email;
            }
          }
        } catch (e) {
          console.warn('[SOFYRA Auth] Firestore admin check error:', e);
        }
      }

      // If already authenticated via Firebase Auth, the admin account certainly exists
      if (cachedIsAuthenticated) {
        cachedHasAdmin = true;
      }

      return {
        hasAdmin: cachedHasAdmin,
        authenticated: cachedIsAuthenticated,
        email: cachedAdminEmail
      };
    } catch (err) {
      console.error('[SOFYRA Auth] Initialization error:', err);
      return {
        hasAdmin: cachedHasAdmin,
        authenticated: cachedIsAuthenticated,
        email: cachedAdminEmail
      };
    }
  },

  /**
   * Check whether an administrator account has already been registered.
   */
  hasAdminAccount(): boolean {
    return cachedHasAdmin;
  },

  /**
   * Get the registered administrator profile from current Firebase session.
   */
  getAdminProfile(): AdminUser | null {
    const auth = getFirebaseAuthInstance();
    const currentUser = auth?.currentUser;

    if (currentUser) {
      return {
        id: currentUser.uid,
        email: currentUser.email || cachedAdminEmail || 'Administrator',
        role: 'admin',
        createdAt: currentUser.metadata.creationTime || new Date().toISOString(),
        lastLogin: currentUser.metadata.lastSignInTime || new Date().toISOString()
      };
    }

    if (cachedIsAuthenticated && cachedAdminEmail) {
      return {
        id: 'admin-root',
        email: cachedAdminEmail,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
    }

    return null;
  },

  /**
   * Register the primary administrator account (First-Time Setup).
   * Validates inputs, creates user in Firebase Authentication with Email/Password,
   * records the authorization doc in Firestore, and sets the session.
   */
  async registerAdmin(
    email: string,
    password: string,
    _securityPin?: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address (e.g. example@gmail.com).'
      };
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long.'
      };
    }

    try {
      const fbResult = await registerAdminWithFirebaseAuth(cleanEmail, cleanPassword);
      if (!fbResult.success) {
        return {
          success: false,
          error: fbResult.error || 'Failed to register with Firebase Authentication.'
        };
      }

      cachedHasAdmin = true;
      cachedAdminEmail = cleanEmail;
      cachedIsAuthenticated = true;

      if (fbResult.token) {
        apiClient.setToken(fbResult.token);
      }

      notifyListeners(this.getAdminProfile());
      return { success: true };
    } catch (fbErr: any) {
      console.error('[SOFYRA Auth] Firebase registration error:', fbErr);
      return {
        success: false,
        error: fbErr?.message || 'Failed to create Firebase administrator account.'
      };
    }
  },

  /**
   * Authenticate administrator using Firebase Email/Password Authentication.
   */
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your administrator email.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      const fbResult = await loginAdminWithFirebaseAuth(cleanEmail, cleanPassword);
      if (!fbResult.success) {
        return {
          success: false,
          error: fbResult.error || 'Invalid administrator credentials.'
        };
      }

      cachedHasAdmin = true;
      cachedAdminEmail = cleanEmail;
      cachedIsAuthenticated = true;

      if (fbResult.token) {
        apiClient.setToken(fbResult.token);
      }

      notifyListeners(this.getAdminProfile());
      return { success: true };
    } catch (fbErr: any) {
      console.error('[SOFYRA Auth] Firebase login error:', fbErr);
      return {
        success: false,
        error: fbErr?.message || 'Firebase Authentication failed.'
      };
    }
  },

  /**
   * Reset password using Firebase Authentication password reset email.
   */
  async resetPasswordWithPin(
    email: string,
    _securityPin?: string,
    _newPassword?: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const auth = getFirebaseAuthInstance();
    if (!auth) {
      return { success: false, error: 'Firebase is not initialized.' };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        return { success: false, error: 'No account registered with this email address.' };
      }
      return {
        success: false,
        error: err?.message || 'Failed to send password reset email via Firebase.'
      };
    }
  },

  /**
   * Check if current user is an authenticated administrator.
   */
  isAuthenticated(): boolean {
    const auth = getFirebaseAuthInstance();
    if (auth && auth.currentUser) {
      return true;
    }
    return cachedIsAuthenticated;
  },

  /**
   * Terminate active administrative session in Firebase.
   */
  async logout(): Promise<void> {
    cachedIsAuthenticated = false;
    const auth = getFirebaseAuthInstance();
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('[SOFYRA Auth] Firebase signout error:', e);
      }
    }
    apiClient.clearToken();
    notifyListeners(null);
  },

  /**
   * Get active session information.
   */
  getCurrentSession(): AdminSession | null {
    const auth = getFirebaseAuthInstance();
    const currentUser = auth?.currentUser;
    const token = apiClient.getToken() || (currentUser ? 'fb-' + currentUser.uid : null);
    if (!token && !currentUser) return null;

    return {
      token: token || '',
      email: currentUser?.email || cachedAdminEmail || 'admin@sofyra.com',
      role: 'admin',
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };
  }
};
