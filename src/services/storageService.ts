import { Product, Order, CustomerReview, ProductCategory, HomepageContent, CategoryItem, CategoryHierarchyItem, WornByYouItem, ContactInfo, SiteSettings, AdvantagesSectionConfig, DiscountCode } from '../types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS, DEFAULT_HOMEPAGE_CONTENT, DEFAULT_CATEGORIES, DEFAULT_WORN_BY_YOU, DEFAULT_CONTACT_INFO, DEFAULT_SITE_SETTINGS } from '../data/initialProducts';
import { adminAuthService } from './adminAuthService';
import { apiClient } from './apiClient';

const PRODUCTS_KEY = 'sofyra_products_v1';
const ORDERS_KEY = 'sofyra_orders_v1';
const REVIEWS_KEY = 'sofyra_reviews_v1';
const HOMEPAGE_KEY = 'sofyra_homepage_content_v1';
const CATEGORIES_KEY = 'sofyra_categories_v1';
const WORN_BY_YOU_KEY = 'sofyra_worn_by_you_v1';
const CONTACT_INFO_KEY = 'sofyra_contact_info_v1';
const SITE_SETTINGS_KEY = 'sofyra_site_settings_v1';
const DISCOUNTS_KEY = 'sofyra_discounts_v1';

const INITIAL_DISCOUNTS: DiscountCode[] = [
  {
    id: 'disc-welcome10',
    code: 'WELCOME10',
    percentage: 10,
    enabled: true,
    description: '10% off entire order'
  }
];

// Initial sample orders
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'SOF-8941',
    customerName: 'Fatima Zahra',
    phone: '+92 300 1234567',
    email: 'fatima.z@example.com',
    address: 'House 42, Street 8, Phase 5, DHA',
    city: 'Lahore',
    province: 'Punjab',
    orderNotes: 'Please ring bell twice upon arrival',
    items: [
      {
        id: 'item-1',
        product: INITIAL_PRODUCTS[0],
        selectedVariantOptions: { Finish: '18K Yellow Gold Plated' },
        quantity: 1,
        unitPrice: 3450
      }
    ],
    subtotal: 3450,
    shippingFee: 250,
    total: 3700,
    paymentMethod: 'cod',
    status: 'Dispatched',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000 * 2).toISOString()
  },
  {
    id: 'ord-102',
    orderNumber: 'SOF-8942',
    customerName: 'Amina Tariq',
    phone: '+92 321 9876543',
    email: 'amina.t@example.com',
    address: 'Apartment 4B, Clifton Block 2',
    city: 'Karachi',
    province: 'Sindh',
    orderNotes: '',
    items: [
      {
        id: 'item-2',
        product: INITIAL_PRODUCTS[1],
        selectedVariantOptions: { 'Metal & Tone': 'Platinum Silver Finish' },
        quantity: 1,
        unitPrice: 4800
      }
    ],
    subtotal: 4800,
    shippingFee: 0,
    total: 4800,
    paymentMethod: 'bank_transfer',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
  }
];

let cachedHomepageContent: HomepageContent | null = null;
let cachedProducts: Product[] | null = null;
let cachedOrders: Order[] | null = null;
let cachedReviews: CustomerReview[] | null = null;
let cachedCategories: CategoryHierarchyItem[] | null = null;
let cachedWornByYou: WornByYouItem[] | null = null;
let cachedContactInfo: ContactInfo | null = null;
let cachedSiteSettings: SiteSettings | null = null;
let cachedDiscounts: DiscountCode[] | null = null;

export const storageService = {
  assertAdminPermission(action: string) {
    if (adminAuthService.hasAdminAccount() && !adminAuthService.isAuthenticated()) {
      throw new Error(`Unauthorized: Only authenticated administrator accounts can ${action}. Customers have no administrative permissions.`);
    }
  },

  // -------------------------------------------------------------------------
  // INITIALIZE / FETCH ALL PERSISTENT DATA FROM SERVER
  // -------------------------------------------------------------------------
  async init(): Promise<{
    homepage: HomepageContent;
    products: Product[];
    orders: Order[];
    reviews: CustomerReview[];
    categories: CategoryHierarchyItem[];
    wornByYou: WornByYouItem[];
    contactInfo: ContactInfo;
    siteSettings: SiteSettings;
  }> {
    const [homepage, products, orders, reviews, categories, wornByYou, contactInfo, siteSettings] = await Promise.all([
      this.fetchHomepageContent(),
      this.fetchProducts(),
      this.fetchOrders(),
      this.fetchReviews(),
      this.fetchCategories(),
      this.fetchWornByYou(),
      this.fetchContactInfo(),
      this.fetchSiteSettings()
    ]);

    return { homepage, products, orders, reviews, categories, wornByYou, contactInfo, siteSettings };
  },

  // -------------------------------------------------------------------------
  // HOMEPAGE CONTENT (Fully Persistent via Server API & Local Cache)
  // -------------------------------------------------------------------------
  async fetchHomepageContent(): Promise<HomepageContent> {
    try {
      const serverData = await apiClient.getHomepage();
      if (serverData && serverData.hero) {
        cachedHomepageContent = {
          ...DEFAULT_HOMEPAGE_CONTENT,
          ...serverData,
          hero: { ...DEFAULT_HOMEPAGE_CONTENT.hero, ...(serverData.hero || {}) },
          categories: { ...DEFAULT_HOMEPAGE_CONTENT.categories, ...(serverData.categories || {}) },
          editorial: { ...DEFAULT_HOMEPAGE_CONTENT.editorial, ...(serverData.editorial || {}) },
          advantagesSection: serverData.advantagesSection || DEFAULT_HOMEPAGE_CONTENT.advantagesSection,
          advantages: { ...DEFAULT_HOMEPAGE_CONTENT.advantages, ...(serverData.advantages || {}) },
          contactPage: { ...DEFAULT_HOMEPAGE_CONTENT.contactPage, ...(serverData.contactPage || {}) },
          aboutSofyra: { ...DEFAULT_HOMEPAGE_CONTENT.aboutSofyra, ...(serverData.aboutSofyra || {}) }
        };
        try {
          localStorage.setItem(HOMEPAGE_KEY, JSON.stringify(cachedHomepageContent));
        } catch {}
        return cachedHomepageContent;
      }
    } catch (err) {
      console.warn('Failed to fetch homepage from server API, falling back to cached', err);
    }
    return this.getHomepageContent();
  },

  getHomepageContent(): HomepageContent {
    if (cachedHomepageContent) {
      return cachedHomepageContent;
    }
    try {
      const stored = localStorage.getItem(HOMEPAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        cachedHomepageContent = {
          ...DEFAULT_HOMEPAGE_CONTENT,
          ...parsed,
          hero: { ...DEFAULT_HOMEPAGE_CONTENT.hero, ...(parsed.hero || {}) },
          categories: { ...DEFAULT_HOMEPAGE_CONTENT.categories, ...(parsed.categories || {}) },
          editorial: { ...DEFAULT_HOMEPAGE_CONTENT.editorial, ...(parsed.editorial || {}) },
          advantagesSection: parsed.advantagesSection || DEFAULT_HOMEPAGE_CONTENT.advantagesSection,
          advantages: { ...DEFAULT_HOMEPAGE_CONTENT.advantages, ...(parsed.advantages || {}) },
          contactPage: { ...DEFAULT_HOMEPAGE_CONTENT.contactPage, ...(parsed.contactPage || {}) },
          aboutSofyra: { ...DEFAULT_HOMEPAGE_CONTENT.aboutSofyra, ...(parsed.aboutSofyra || {}) }
        };
        return cachedHomepageContent;
      }
    } catch (e) {
      console.error('Failed to load homepage content from local storage:', e);
    }
    return DEFAULT_HOMEPAGE_CONTENT;
  },

  async saveHomepageContent(content: HomepageContent): Promise<HomepageContent> {
    this.assertAdminPermission('manage homepage content and images');
    cachedHomepageContent = content;
    
    // 1. Save to local cache
    try {
      localStorage.setItem(HOMEPAGE_KEY, JSON.stringify(content));
    } catch (e) {
      console.error('Failed to cache homepage content:', e);
    }

    // 2. Persist to server backend database
    const saveRes = await apiClient.saveHomepage(content);
    if (!saveRes.success) {
      console.error('Failed to persist homepage to server:', saveRes.error);
      throw new Error(saveRes.error || 'Failed to save homepage content to server');
    }

    // 3. Dispatch event for storefront components to update immediately
    try {
      window.dispatchEvent(new CustomEvent('sofyra:homepage-updated', { detail: content }));
    } catch {}

    return content;
  },

  async saveAdvantagesSection(advantagesSection: AdvantagesSectionConfig): Promise<HomepageContent> {
    const current = await this.fetchHomepageContent();
    const updated: HomepageContent = {
      ...current,
      advantagesSection
    };
    return this.saveHomepageContent(updated);
  },

  // -------------------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------------------
  async fetchProducts(): Promise<Product[]> {
    try {
      const serverProducts = await apiClient.getProducts();
      if (Array.isArray(serverProducts) && serverProducts.length > 0) {
        cachedProducts = serverProducts;
        try {
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(serverProducts));
        } catch {}
        return serverProducts;
      }
    } catch (err) {
      console.warn('[SOFYRA Storage] Failed to fetch products from server:', err);
    }
    return this.getProducts();
  },

  getProducts(): Product[] {
    if (cachedProducts && cachedProducts.length > 0) {
      return cachedProducts;
    }
    try {
      const stored = localStorage.getItem(PRODUCTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedProducts = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Storage read error', e);
    }
    cachedProducts = INITIAL_PRODUCTS;
    return INITIAL_PRODUCTS;
  },

  getProductBySlug(slug: string): Product | undefined {
    const products = this.getProducts();
    return products.find(p => p.slug === slug);
  },

  getProductById(id: string): Product | undefined {
    const products = this.getProducts();
    return products.find(p => p.id === id);
  },

  async saveProduct(product: Product): Promise<Product> {
    this.assertAdminPermission('save product');

    // 1. Persist to server backend database
    const saveRes = await apiClient.saveProduct(product);
    if (!saveRes.success) {
      console.error('Failed to save product to server:', saveRes.error);
      throw new Error(saveRes.error || 'Failed to save product to server');
    }

    // 2. Update local cached products
    const current = this.getProducts();
    const index = current.findIndex(p => p.id === product.id);
    let updatedProducts: Product[];
    if (index >= 0) {
      updatedProducts = current.map((p, i) => i === index ? product : p);
    } else {
      updatedProducts = [product, ...current];
    }

    cachedProducts = updatedProducts;
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
    } catch {}

    window.dispatchEvent(new CustomEvent('sofyra:products-updated'));

    return product;
  },

  async deleteProduct(id: string): Promise<boolean> {
    this.assertAdminPermission('delete products');

    // 1. Delete on server backend
    const deleteRes = await apiClient.deleteProduct(id);
    if (!deleteRes.success) {
      console.error('Failed to delete product from server:', deleteRes.error);
      throw new Error(deleteRes.error || 'Failed to delete product from server');
    }

    // 2. Update local cached products
    const current = this.getProducts();
    const updatedProducts = current.filter(p => p.id !== id);
    cachedProducts = updatedProducts;
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
    } catch {}

    window.dispatchEvent(new CustomEvent('sofyra:products-updated'));
    return true;
  },

  async duplicateProduct(id: string): Promise<Product | null> {
    const original = this.getProductById(id);
    if (!original) return null;

    const newId = 'prod-' + Date.now();
    const newSlug = `${original.slug}-copy-${Math.floor(Math.random() * 1000)}`;
    const duplicated: Product = {
      ...original,
      id: newId,
      slug: newSlug,
      name: `${original.name} (Copy)`,
      sku: `${original.sku}-CP`,
      isNew: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    return await this.saveProduct(duplicated);
  },

  async saveAllProducts(products: Product[]): Promise<boolean> {
    this.assertAdminPermission('save all products');
    cachedProducts = products;
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      window.dispatchEvent(new CustomEvent('sofyra:products-updated'));
    } catch (e) {
      console.warn('Failed to save products to local storage', e);
    }

    const res = await apiClient.saveProducts(products);
    return res.success;
  },

  async addProduct(data: Omit<Product, 'id' | 'slug' | 'sku' | 'createdAt' | 'rating' | 'reviewCount'> & { sku?: string }): Promise<Product> {
    this.assertAdminPermission('add new products');
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const randSku = data.sku || 'SF-' + Math.floor(1000 + Math.random() * 9000);
    const newProduct: Product = {
      ...data,
      id: 'prod-' + Date.now(),
      slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
      sku: randSku,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString()
    };
    return await this.saveProduct(newProduct);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    this.assertAdminPermission('edit products, change prices, or change stock');
    const product = this.getProductById(id);
    if (!product) return null;
    const updated = { ...product, ...updates };
    if (!updated.isBestseller) {
      delete updated.bestsellerOrder;
    }
    return await this.saveProduct(updated);
  },

  async toggleBestseller(id: string): Promise<Product | null> {
    const product = this.getProductById(id);
    if (!product) return null;
    const nextState = !Boolean(product.isBestseller);
    const all = this.getProducts();
    const currentBestsellerCount = all.filter(p => p.isBestseller).length;
    return await this.updateProduct(id, {
      isBestseller: nextState,
      bestsellerOrder: nextState ? currentBestsellerCount + 1 : undefined
    });
  },

  async reorderBestsellers(orderedIds: string[]): Promise<Product[]> {
    this.assertAdminPermission('reorder bestsellers');
    const products = this.getProducts();
    const updated = products.map((p) => {
      const idx = orderedIds.indexOf(p.id);
      if (idx !== -1) {
        return {
          ...p,
          isBestseller: true,
          bestsellerOrder: idx + 1
        };
      }
      return p;
    });

    await this.saveAllProducts(updated);
    return updated;
  },

  async setPrimaryImage(id: string, imageIndexOrUrl: number | string): Promise<Product | null> {
    const product = this.getProductById(id);
    if (!product || !product.images || product.images.length === 0) return null;
    let newImages = [...product.images];
    if (typeof imageIndexOrUrl === 'number') {
      if (imageIndexOrUrl < 0 || imageIndexOrUrl >= newImages.length) return product;
      const [chosen] = newImages.splice(imageIndexOrUrl, 1);
      newImages.unshift(chosen);
    } else {
      newImages = newImages.filter(img => img !== imageIndexOrUrl);
      newImages.unshift(imageIndexOrUrl);
    }
    const updated = { ...product, images: newImages };
    return await this.saveProduct(updated);
  },

  // -------------------------------------------------------------------------
  // ORDERS
  // -------------------------------------------------------------------------
  async fetchOrders(): Promise<Order[]> {
    try {
      const serverOrders = await apiClient.getOrders();
      if (Array.isArray(serverOrders) && serverOrders.length > 0) {
        cachedOrders = serverOrders;
        try {
          localStorage.setItem(ORDERS_KEY, JSON.stringify(serverOrders));
        } catch {}
        return serverOrders;
      }
    } catch (e) {
      console.warn('Failed to fetch orders from server', e);
    }
    return this.getOrders();
  },

  getOrders(): Order[] {
    if (cachedOrders) {
      return cachedOrders;
    }
    try {
      const stored = localStorage.getItem(ORDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          cachedOrders = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored orders', e);
    }
    cachedOrders = INITIAL_ORDERS;
    return INITIAL_ORDERS;
  },

  saveOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'> & { status?: Order['status'] }): Order {
    const orders = this.getOrders();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...orderData,
      id: 'ord-' + Date.now(),
      orderNumber: `SOF-${randNum}`,
      status: orderData.status || 'Pending',
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder);
    this.saveAllOrders(orders);

    // Persist to server backend
    apiClient.saveOrder(newOrder).catch(console.error);

    // Update stock counts for purchased items
    const products = this.getProducts();
    orderData.items.forEach(item => {
      const prod = products.find(p => p.id === item.product.id);
      if (prod) {
        prod.stockCount = Math.max(0, prod.stockCount - item.quantity);
        prod.inStock = prod.stockCount > 0;
      }
    });
    this.saveAllProducts(products);

    return newOrder;
  },

  updateOrderStatus(orderId: string, status: Order['status'], paymentStatus?: any): boolean {
    this.assertAdminPermission('manage orders and update status');
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      this.saveAllOrders(orders);
      apiClient.updateOrderStatus(orderId, status).catch(console.error);
      return true;
    }
    return false;
  },

  saveAllOrders(orders: Order[]) {
    cachedOrders = orders;
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent('sofyra:orders-updated'));
    } catch (e) {
      console.error('Failed to save orders to local storage', e);
    }
  },

  // -------------------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------------------
  async fetchReviews(): Promise<CustomerReview[]> {
    try {
      const serverReviews = await apiClient.getReviews();
      if (Array.isArray(serverReviews)) {
        cachedReviews = serverReviews;
        try {
          localStorage.setItem(REVIEWS_KEY, JSON.stringify(serverReviews));
        } catch {}
        return serverReviews;
      }
    } catch (e) {
      console.warn('Failed to fetch reviews from server', e);
    }
    return this.getReviews();
  },

  getReviews(productId?: string): CustomerReview[] {
    let reviews = cachedReviews || INITIAL_REVIEWS;
    try {
      const stored = localStorage.getItem(REVIEWS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          reviews = parsed;
          cachedReviews = parsed;
        }
      }
    } catch {
      // ignore
    }

    if (productId) {
      return reviews.filter(r => !r.productId || r.productId === productId);
    }
    return reviews;
  },

  saveAllReviews(reviews: CustomerReview[]): CustomerReview[] {
    this.assertAdminPermission('manage customer reviews');
    cachedReviews = reviews;
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
      window.dispatchEvent(new CustomEvent('sofyra:reviews-updated'));
    } catch (e) {
      console.error(e);
    }
    apiClient.saveReviews(reviews).catch(console.error);
    return reviews;
  },

  addReview(reviewData: Partial<CustomerReview> & { customerName: string; comment: string }): CustomerReview {
    const all = this.getReviews();
    const newRev: CustomerReview = {
      id: reviewData.id || 'rev-' + Date.now(),
      customerName: reviewData.customerName,
      customerCity: reviewData.customerCity || '',
      rating: typeof reviewData.rating === 'number' ? reviewData.rating : 5,
      title: reviewData.title || '',
      comment: reviewData.comment,
      productName: reviewData.productName || '',
      productId: reviewData.productId || '',
      verified: Boolean(reviewData.verified),
      userImage: reviewData.userImage || reviewData.image || '',
      image: reviewData.image || reviewData.userImage || '',
      published: reviewData.published !== false,
      order: typeof reviewData.order === 'number' ? reviewData.order : all.length + 1,
      date: reviewData.date || new Date().toISOString().split('T')[0]
    };
    all.unshift(newRev);
    cachedReviews = all;
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error(e);
    }
    apiClient.addReview(newRev).catch(console.error);
    return newRev;
  },

  updateReview(id: string, updates: Partial<CustomerReview>): CustomerReview | null {
    this.assertAdminPermission('edit customer reviews');
    const all = this.getReviews();
    const index = all.findIndex(r => r.id === id);
    if (index >= 0) {
      all[index] = { ...all[index], ...updates };
      cachedReviews = all;
      try {
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
      } catch (e) {
        console.error(e);
      }
      apiClient.updateReview(id, updates).catch(console.error);
      return all[index];
    }
    return null;
  },

  deleteReview(id: string): boolean {
    this.assertAdminPermission('delete customer reviews');
    const all = this.getReviews();
    const filtered = all.filter(r => r.id !== id);
    if (filtered.length !== all.length) {
      cachedReviews = filtered;
      try {
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.error(e);
      }
      apiClient.deleteReview(id).catch(console.error);
      return true;
    }
    return false;
  },

  // -------------------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------------------
  async fetchCategories(): Promise<CategoryHierarchyItem[]> {
    try {
      const serverCategories = await apiClient.getCategories();
      if (Array.isArray(serverCategories) && serverCategories.length > 0) {
        cachedCategories = serverCategories;
        try {
          localStorage.setItem(CATEGORIES_KEY, JSON.stringify(serverCategories));
        } catch {}
        return serverCategories;
      }
    } catch (err) {
      console.warn('[SOFYRA Storage] Failed to fetch categories from server:', err);
    }
    return this.getCategories();
  },

  getCategories(): CategoryHierarchyItem[] {
    if (cachedCategories && cachedCategories.length > 0) {
      return cachedCategories;
    }
    try {
      const stored = localStorage.getItem(CATEGORIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedCategories = parsed;
          return parsed;
        }
      }
    } catch {}
    cachedCategories = DEFAULT_CATEGORIES;
    return DEFAULT_CATEGORIES;
  },

  getCategoriesHierarchy(): CategoryHierarchyItem[] {
    return this.getCategories();
  },

  async saveCategories(categories: CategoryHierarchyItem[]): Promise<CategoryHierarchyItem[]> {
    this.assertAdminPermission('manage categories');
    
    const res = await apiClient.saveCategories(categories);
    if (!res.success) {
      console.error('Failed to save categories to server:', res.error);
      throw new Error(res.error || 'Failed to save categories to server');
    }

    cachedCategories = categories;
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch {}

    window.dispatchEvent(new CustomEvent('sofyra:categories-updated'));
    return categories;
  },

  async saveCategory(category: CategoryHierarchyItem): Promise<CategoryHierarchyItem> {
    this.assertAdminPermission('manage categories');

    const res = await apiClient.saveCategory(category);
    if (!res.success) {
      console.error('Failed to save category to server:', res.error);
      throw new Error(res.error || 'Failed to save category to server');
    }

    const current = this.getCategories();
    const index = current.findIndex(c => c.id === category.id);
    let updatedCategories: CategoryHierarchyItem[];
    if (index >= 0) {
      updatedCategories = current.map((c, i) => i === index ? category : c);
    } else {
      updatedCategories = [...current, category];
    }

    cachedCategories = updatedCategories;
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));
    } catch {}

    window.dispatchEvent(new CustomEvent('sofyra:categories-updated'));
    return category;
  },

  async deleteCategory(categoryId: string): Promise<boolean> {
    this.assertAdminPermission('delete categories');

    const res = await apiClient.deleteCategory(categoryId);
    if (!res.success) {
      console.error('Failed to delete category from server:', res.error);
      throw new Error(res.error || 'Failed to delete category from server');
    }

    const current = this.getCategories();
    const updatedCategories = current.filter(c => c.id !== categoryId);
    cachedCategories = updatedCategories;
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));
    } catch {}

    window.dispatchEvent(new CustomEvent('sofyra:categories-updated'));
    return true;
  },

  // -------------------------------------------------------------------------
  // WORN BY YOU (Customer Styling Gallery)
  // -------------------------------------------------------------------------
  async fetchWornByYou(): Promise<WornByYouItem[]> {
    try {
      const serverItems = await apiClient.getWornByYou();
      if (Array.isArray(serverItems) && serverItems.length > 0) {
        cachedWornByYou = serverItems;
        try {
          localStorage.setItem(WORN_BY_YOU_KEY, JSON.stringify(serverItems));
        } catch {}
        return serverItems;
      }
    } catch (e) {
      console.warn('Failed to fetch wornByYou from server', e);
    }
    return this.getWornByYou();
  },

  getWornByYou(): WornByYouItem[] {
    if (cachedWornByYou && cachedWornByYou.length > 0) {
      return cachedWornByYou;
    }
    try {
      const stored = localStorage.getItem(WORN_BY_YOU_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedWornByYou = parsed;
          return parsed;
        }
      }
    } catch {}
    cachedWornByYou = DEFAULT_WORN_BY_YOU;
    return DEFAULT_WORN_BY_YOU;
  },

  async saveWornByYou(items: WornByYouItem[]): Promise<WornByYouItem[]> {
    this.assertAdminPermission('manage Worn By You gallery');
    cachedWornByYou = items;
    try {
      localStorage.setItem(WORN_BY_YOU_KEY, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
    apiClient.saveWornByYou(items).catch(console.error);
    return items;
  },

  // -------------------------------------------------------------------------
  // CONTACT INFO
  // -------------------------------------------------------------------------
  async fetchContactInfo(): Promise<ContactInfo> {
    try {
      const serverInfo = await apiClient.getContactInfo();
      if (serverInfo && serverInfo.email) {
        cachedContactInfo = serverInfo;
        try {
          localStorage.setItem(CONTACT_INFO_KEY, JSON.stringify(serverInfo));
        } catch {}
        return serverInfo;
      }
    } catch (e) {
      console.warn('Failed to fetch contactInfo from server', e);
    }
    return this.getContactInfo();
  },

  getContactInfo(): ContactInfo {
    if (cachedContactInfo) {
      return cachedContactInfo;
    }
    try {
      const stored = localStorage.getItem(CONTACT_INFO_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          cachedContactInfo = parsed;
          return parsed;
        }
      }
    } catch {}
    cachedContactInfo = DEFAULT_CONTACT_INFO;
    return DEFAULT_CONTACT_INFO;
  },

  async saveContactInfo(info: ContactInfo): Promise<ContactInfo> {
    this.assertAdminPermission('manage contact information');
    cachedContactInfo = info;
    try {
      localStorage.setItem(CONTACT_INFO_KEY, JSON.stringify(info));
    } catch (e) {
      console.error(e);
    }
    apiClient.saveContactInfo(info).catch(console.error);
    return info;
  },

  // -------------------------------------------------------------------------
  // SITE SETTINGS (Accordions, Money Back Guarantee, Reassurance Benefits)
  // -------------------------------------------------------------------------
  async fetchSiteSettings(): Promise<SiteSettings> {
    try {
      const serverSettings = await apiClient.getSiteSettings();
      if (serverSettings) {
        cachedSiteSettings = serverSettings;
        try {
          localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(serverSettings));
        } catch {}
        return serverSettings;
      }
    } catch (e) {
      console.warn('Failed to fetch siteSettings from server', e);
    }
    return this.getSiteSettings();
  },

  getSiteSettings(): SiteSettings {
    if (cachedSiteSettings) {
      return cachedSiteSettings;
    }
    try {
      const stored = localStorage.getItem(SITE_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          cachedSiteSettings = parsed;
          return parsed;
        }
      }
    } catch {}
    cachedSiteSettings = DEFAULT_SITE_SETTINGS;
    return DEFAULT_SITE_SETTINGS;
  },

  async saveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
    this.assertAdminPermission('manage site settings and accordions');
    cachedSiteSettings = settings;
    try {
      localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
    apiClient.saveSiteSettings(settings).catch(console.error);
    return settings;
  },

  // Reset to default sample catalogue
  resetToDefaultCatalog(): Product[] {
    this.saveAllProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  },

  resetToDefaults() {
    this.assertAdminPermission('reset catalog data');
    this.saveAllProducts(INITIAL_PRODUCTS);
    this.saveAllOrders(INITIAL_ORDERS);
    cachedReviews = INITIAL_REVIEWS;
    cachedHomepageContent = DEFAULT_HOMEPAGE_CONTENT;
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(INITIAL_REVIEWS));
      localStorage.setItem(HOMEPAGE_KEY, JSON.stringify(DEFAULT_HOMEPAGE_CONTENT));
    } catch {}
    apiClient.saveHomepage(DEFAULT_HOMEPAGE_CONTENT).catch(console.error);
  },

  // -------------------------------------------------------------------------
  // DISCOUNT CODES
  // -------------------------------------------------------------------------
  async fetchDiscounts(): Promise<DiscountCode[]> {
    try {
      const serverDiscounts = await apiClient.getDiscounts();
      if (Array.isArray(serverDiscounts)) {
        cachedDiscounts = serverDiscounts;
        try {
          localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(serverDiscounts));
        } catch {}
        return serverDiscounts;
      }
    } catch (e) {
      console.warn('Failed to fetch discounts from server', e);
    }
    return this.getDiscounts();
  },

  getDiscounts(): DiscountCode[] {
    if (cachedDiscounts) return cachedDiscounts;
    try {
      const stored = localStorage.getItem(DISCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          cachedDiscounts = parsed;
          return parsed;
        }
      }
    } catch {}
    cachedDiscounts = INITIAL_DISCOUNTS;
    return INITIAL_DISCOUNTS;
  },

  async validateDiscount(code: string, subtotal: number): Promise<{ valid: boolean; code?: string; percentage?: number; discountAmount?: number; error?: string }> {
    if (!code || !code.trim()) {
      return { valid: false, error: 'Please enter a discount code' };
    }

    try {
      const result = await apiClient.validateDiscount(code, subtotal);
      return result;
    } catch {
      // Fallback local validation
      const discounts = this.getDiscounts();
      const clean = code.trim().toUpperCase();
      const matched = discounts.find(d => d.code.toUpperCase() === clean && d.enabled !== false);
      if (matched) {
        const percentage = matched.percentage || 10;
        const discountAmount = Math.round((subtotal * percentage) / 100);
        return {
          valid: true,
          code: matched.code,
          percentage,
          discountAmount
        };
      }
      return { valid: false, error: 'Invalid or expired discount code' };
    }
  },

  saveAllDiscounts(discounts: DiscountCode[]): DiscountCode[] {
    this.assertAdminPermission('manage discount codes');
    cachedDiscounts = discounts;
    try {
      localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
      window.dispatchEvent(new CustomEvent('sofyra:discounts-updated'));
    } catch (e) {
      console.error(e);
    }
    apiClient.saveDiscounts(discounts).catch(console.error);
    return discounts;
  },

  exportAllData(): string {
    const payload = {
      exportedAt: new Date().toISOString(),
      brand: 'SOFYRA Fine Jewellery',
      products: this.getProducts(),
      orders: this.getOrders(),
      reviews: this.getReviews(),
      homepage: this.getHomepageContent()
    };
    return JSON.stringify(payload, null, 2);
  }
};
