/**
 * SOFYRA Executive Admin Authentication & Access Control Service
 * 
 * Secure session-based authentication communicating directly with the backend API.
 */

import { apiClient } from './apiClient';

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

export const adminAuthService = {
  /**
   * Subscribe to authentication state changes.
   */
  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Async initialization that checks admin registration and verifies existing session.
   */
  async init(): Promise<{ hasAdmin: boolean; authenticated: boolean; email: string | null }> {
    try {
      // 1. Fetch admin status from server
      const status = await apiClient.getAuthStatus();
      if (status) {
        cachedHasAdmin = Boolean(status.hasAdmin);
        if (status.email) {
          cachedAdminEmail = status.email;
        }
      }

      // 2. Check active session if token exists
      const currentToken = apiClient.getToken();
      if (currentToken) {
        const sessionCheck = await apiClient.checkSession();
        if (sessionCheck && sessionCheck.authenticated) {
          cachedIsAuthenticated = true;
          if (sessionCheck.user?.email) {
            cachedAdminEmail = sessionCheck.user.email;
          }
          cachedHasAdmin = true;
        } else {
          cachedIsAuthenticated = false;
          apiClient.clearToken();
        }
      } else {
        cachedIsAuthenticated = false;
      }

      notifyListeners(this.getAdminProfile());

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
   * Get the registered administrator profile from current session.
   */
  getAdminProfile(): AdminUser | null {
    if (cachedIsAuthenticated) {
      return {
        id: 'admin-root',
        email: cachedAdminEmail || 'admin@sofyra.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
    }
    return null;
  },

  /**
   * Register the primary administrator account (First-Time Setup).
   */
  async registerAdmin(
    email: string,
    password: string,
    securityPin?: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';
    const cleanPin = (securityPin || '').trim();

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
      const result = await apiClient.registerAdmin(cleanEmail, cleanPassword, cleanPin);
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to register administrator.'
        };
      }

      cachedHasAdmin = true;
      cachedAdminEmail = cleanEmail;
      cachedIsAuthenticated = true;

      notifyListeners(this.getAdminProfile());
      return { success: true };
    } catch (err: any) {
      console.error('[SOFYRA Auth] Registration error:', err);
      return {
        success: false,
        error: err?.message || 'Failed to create administrator account.'
      };
    }
  },

  /**
   * Authenticate administrator.
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
      const result = await apiClient.loginAdmin(cleanEmail, cleanPassword);
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Invalid administrator credentials.'
        };
      }

      cachedHasAdmin = true;
      cachedAdminEmail = cleanEmail;
      cachedIsAuthenticated = true;

      notifyListeners(this.getAdminProfile());
      return { success: true };
    } catch (err: any) {
      console.error('[SOFYRA Auth] Login error:', err);
      return {
        success: false,
        error: err?.message || 'Authentication failed.'
      };
    }
  },

  /**
   * Reset password using security PIN.
   */
  async resetPasswordWithPin(
    email: string,
    securityPin?: string,
    newPassword?: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPin = (securityPin || '').trim();
    const cleanNewPassword = (newPassword || '').trim();

    if (!cleanPin || !cleanNewPassword) {
      return { success: false, error: 'Security PIN and new password are required.' };
    }

    try {
      const result = await apiClient.resetPasswordWithPin(cleanEmail, cleanPin, cleanNewPassword);
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to reset password.'
      };
    }
  },

  /**
   * Check if current user is an authenticated administrator.
   */
  isAuthenticated(): boolean {
    return cachedIsAuthenticated;
  },

  /**
   * Terminate active administrative session.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.logoutAdmin();
    } catch (e) {
      console.warn('[SOFYRA Auth] Logout error:', e);
    }
    cachedIsAuthenticated = false;
    notifyListeners(null);
  },

  /**
   * Get active session information.
   */
  getCurrentSession(): AdminSession | null {
    const token = apiClient.getToken();
    if (!token || !cachedIsAuthenticated) return null;

    return {
      token,
      email: cachedAdminEmail || 'admin@sofyra.com',
      role: 'admin',
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
  }
};
