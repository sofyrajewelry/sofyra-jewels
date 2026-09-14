import { HomepageContent, Product, Order, CustomerReview } from '../types';
import { uploadImageToFirebaseStorage } from './firebaseService';
import { isFirebaseConfigured } from '../config/firebase';

const ADMIN_TOKEN_KEY = 'sofyra_admin_session_token';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'x-admin-token': token
    };
  }
  return {};
}

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  // 1. Permanent Image Upload to Firebase Storage or /uploads/...
  async uploadImage(base64OrDataUrl: string, filename?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    // If Firebase is configured, attempt upload to Firebase Storage
    if (isFirebaseConfigured()) {
      try {
        const firebaseUrl = await uploadImageToFirebaseStorage(base64OrDataUrl, filename || 'image.jpg');
        if (firebaseUrl) {
          return { success: true, url: firebaseUrl };
        }
      } catch (fbErr) {
        console.warn('[SOFYRA Firebase Storage] Direct upload failed, falling back to server upload:', fbErr);
      }
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          image: base64OrDataUrl,
          filename: filename || 'image'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Upload failed' };
      }

      const data = await res.json();
      return { success: true, url: data.url };
    } catch (e: any) {
      console.error('API uploadImage network error:', e);
      return { success: false, error: e.message || 'Network error during image upload' };
    }
  },

  // 2. Homepage Content
  async getHomepage(): Promise<HomepageContent | null> {
    try {
      const res = await fetch('/api/homepage');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('API getHomepage error:', e);
      return null;
    }
  },

  async saveHomepage(content: HomepageContent): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(content)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Failed to save homepage' };
      }
      return { success: true };
    } catch (e: any) {
      console.error('API saveHomepage error:', e);
      return { success: false, error: e.message || 'Network error saving homepage' };
    }
  },

  // 3. Products
  async getProducts(): Promise<Product[] | null> {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('API getProducts error:', e);
      return null;
    }
  },

  async saveProducts(products: Product[]): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(products)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Failed to save products' };
      }
      return { success: true };
    } catch (e: any) {
      console.error('API saveProducts error:', e);
      return { success: false, error: e.message };
    }
  },

  async patchProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string; product?: Product }> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Failed to update product' };
      }
      const data = await res.json();
      return { success: true, product: data.product };
    } catch (e: any) {
      console.error('API patchProduct error:', e);
      return { success: false, error: e.message };
    }
  },

  // 4. Orders
  async getOrders(): Promise<Order[] | null> {
    try {
      const res = await fetch('/api/orders', {
        headers: getAuthHeader()
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('API getOrders error:', e);
      return null;
    }
  },

  async saveOrder(order: Order): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      return { success: res.ok };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateOrderStatus(id: string, status: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ status })
      });
      return { success: res.ok };
    } catch {
      return { success: false };
    }
  },

  // 5. Reviews
  async getReviews(): Promise<CustomerReview[] | null> {
    try {
      const res = await fetch('/api/reviews');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveReviews(reviews: CustomerReview[]): Promise<{ success: boolean; reviews?: CustomerReview[] }> {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(reviews)
      });
      const data = await res.json();
      return { success: res.ok, reviews: data.reviews };
    } catch {
      return { success: false };
    }
  },

  async addReview(review: CustomerReview): Promise<{ success: boolean; review?: CustomerReview }> {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      const data = await res.json();
      return { success: res.ok, review: data.review };
    } catch {
      return { success: false };
    }
  },

  async updateReview(id: string, updates: Partial<CustomerReview>): Promise<{ success: boolean; review?: CustomerReview }> {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return { success: res.ok, review: data.review };
    } catch {
      return { success: false };
    }
  },

  async deleteReview(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      return { success: res.ok };
    } catch {
      return { success: false };
    }
  },

  // 6. Categories & Subcategories
  async getCategories(): Promise<import('../types').CategoryHierarchyItem[] | null> {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('API getCategories error:', e);
      return null;
    }
  },

  async saveCategories(categories: import('../types').CategoryHierarchyItem[]): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(categories)
      });
      return { success: res.ok };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 7. Worn By You Customer Gallery
  async getWornByYou(): Promise<import('../types').WornByYouItem[] | null> {
    try {
      const res = await fetch('/api/worn-by-you');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('API getWornByYou error:', e);
      return null;
    }
  },

  async saveWornByYou(items: import('../types').WornByYouItem[]): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/worn-by-you', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(items)
      });
      return { success: res.ok };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async addWornByYouItem(item: import('../types').WornByYouItem): Promise<{ success: boolean; item?: import('../types').WornByYouItem }> {
    try {
      const res = await fetch('/api/worn-by-you', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(item)
      });
      const data = await res.json();
      return { success: res.ok, item: data.item };
    } catch (e) {
      return { success: false };
    }
  },

  async deleteWornByYouItem(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/worn-by-you/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      return { success: res.ok };
    } catch {
      return { success: false };
    }
  },

  // 8. Contact Information
  async getContactInfo(): Promise<import('../types').ContactInfo | null> {
    try {
      const res = await fetch('/api/contact-info');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('API getContactInfo error:', e);
      return null;
    }
  },

  async saveContactInfo(info: import('../types').ContactInfo): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/contact-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(info)
      });
      return { success: res.ok };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 9. Site Settings (Accordions, Money Back Guarantee, Benefits)
  async getSiteSettings(): Promise<import('../types').SiteSettings | null> {
    try {
      const res = await fetch('/api/site-settings');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('API getSiteSettings error:', e);
      return null;
    }
  },

  async saveSiteSettings(settings: import('../types').SiteSettings): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(settings)
      });
      return { success: res.ok };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 6. Admin Authentication
  async getAuthStatus(): Promise<{ hasAdmin: boolean; email: string | null }> {
    try {
      const res = await fetch('/api/auth/status');
      if (!res.ok) return { hasAdmin: false, email: null };
      return await res.json();
    } catch {
      return { hasAdmin: false, email: null };
    }
  },

  async registerAdmin(email: string, password: string, securityPin?: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, securityPin })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        this.setToken(data.token);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Failed to register admin' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration request failed' };
    }
  },

  async loginAdmin(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        this.setToken(data.token);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Login request failed' };
    }
  },

  async checkSession(): Promise<{ authenticated: boolean; user?: any }> {
    const token = this.getToken();
    if (!token) {
      return { authenticated: false };
    }

    try {
      const res = await fetch('/api/auth/session', {
        headers: getAuthHeader()
      });
      if (!res.ok) {
        this.clearToken();
        return { authenticated: false };
      }
      const data = await res.json();
      if (!data.authenticated) {
        this.clearToken();
      }
      return data;
    } catch {
      // In case of transient offline, don't immediately clear token
      return { authenticated: true, user: { role: 'admin' } };
    }
  },

  async logoutAdmin(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeader()
      });
    } catch {
      // ignore
    } finally {
      this.clearToken();
    }
  },

  async resetPasswordWithPin(email: string, securityPin: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, securityPin, newPassword })
      });
      const data = await res.json();
      return { success: res.ok, error: data.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};
