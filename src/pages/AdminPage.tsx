import React, { useState, useEffect } from 'react';
import { Product, Order, CustomerReview, ProductCategory, HomepageContent, AdvantagesSectionConfig, CategoryHierarchyItem, WornByYouItem, ContactInfo, SiteSettings, DiscountCode } from '../types';
import { storageService } from '../services/storageService';
import { adminAuthService, AdminUser } from '../services/adminAuthService';
import { DEFAULT_HOMEPAGE_CONTENT, DEFAULT_ADVANTAGES_SECTION } from '../data/initialProducts';
import { formatPKR } from '../utils/format';
import { ImageUploadField } from '../components/admin/ImageUploadField';
import { ProductGalleryManager } from '../components/admin/ProductGalleryManager';
import { AdvantagesManager } from '../components/admin/AdvantagesManager';
import { CategoriesManager } from '../components/admin/CategoriesManager';
import { WornByYouManager } from '../components/admin/WornByYouManager';
import { ContactInfoManager } from '../components/admin/ContactInfoManager';
import { SiteSettingsManager } from '../components/admin/SiteSettingsManager';
import { ReviewsManager } from '../components/admin/ReviewsManager';
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  ShoppingBag,
  Star,
  Download,
  RotateCcw,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  Layout,
  Layers,
  Sliders,
  Check,
  Image as ImageIcon,
  Shield,
  Key,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  User,
  ShieldCheck,
  Camera,
  PhoneCall,
  MessageSquare,
  SlidersHorizontal,
  FolderTree,
  ArrowUp,
  ArrowDown,
  Phone,
  Tag,
  Loader2,
  Upload
} from 'lucide-react';

interface AdminPageProps {
  products: Product[];
  onRefreshProducts: () => void;
  homepageContent: HomepageContent;
  onRefreshHomepageContent: () => void;
  onNavigate: (page: string, data?: any) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  products,
  onRefreshProducts,
  homepageContent,
  onRefreshHomepageContent,
  onNavigate
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthService.isAuthenticated());
  const [hasAdminAccount, setHasAdminAccount] = useState(() => adminAuthService.hasAdminAccount());
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => adminAuthService.getAdminProfile());

  // Auth UI state
  const [authView, setAuthView] = useState<'login' | 'register' | 'recovery'>(() => 
    adminAuthService.hasAdminAccount() ? 'login' : 'register'
  );
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authSecurityPin, setAuthSecurityPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tabs: Homepage & Images, Products, Categories, Worn By You, Reviews, Contact, Settings, Orders
  const [activeTab, setActiveTab] = useState<'homepage' | 'products' | 'categories' | 'wornByYou' | 'reviews' | 'contact' | 'settings' | 'orders'>('homepage');
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());
  const [reviews, setReviews] = useState<CustomerReview[]>(() => storageService.getReviews());
  const [categories, setCategories] = useState<CategoryHierarchyItem[]>(() => storageService.getCategories());
  const [wornByYou, setWornByYou] = useState<WornByYouItem[]>(() => storageService.getWornByYou());
  const [contactInfo, setContactInfo] = useState<ContactInfo>(() => storageService.getContactInfo());
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => storageService.getSiteSettings());
  const [discounts, setDiscounts] = useState<DiscountCode[]>(() => storageService.getDiscounts());
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState<number>(10);
  const [isSavingDiscounts, setIsSavingDiscounts] = useState(false);

  // Homepage Content Form State
  const [homepageForm, setHomepageForm] = useState<HomepageContent>(homepageContent);
  const [homepageSubTab, setHomepageSubTab] = useState<'all' | 'hero' | 'categories' | 'aboutSofyra' | 'editorial' | 'advantages' | 'contactPage'>('all');
  const [homepageSaveSuccess, setHomepageSaveSuccess] = useState(false);

  // Sync auth status with backend on mount
  useEffect(() => {
    const unsubscribe = adminAuthService.subscribe((authed, user) => {
      setIsAuthenticated(authed);
      setAdminUser(user);
    });

    adminAuthService.init().then(res => {
      setHasAdminAccount(res.hasAdmin);
      setIsAuthenticated(res.authenticated);
      setAdminUser(adminAuthService.getAdminProfile());
      if (res.hasAdmin && !res.authenticated) {
        setAuthView('login');
      } else if (!res.hasAdmin) {
        setAuthView('register');
      }
    });

    storageService.fetchOrders().then(ords => {
      if (ords && ords.length > 0) setOrders(ords);
    });

    storageService.fetchReviews().then(revs => {
      if (revs && revs.length > 0) setReviews(revs);
    });

    storageService.fetchCategories()
      .then(cats => {
        if (cats) setCategories(cats);
      })
      .catch(err => {
        console.error('[SOFYRA Admin] Failed to fetch categories:', err);
      });

    const handleCategoriesUpdated = () => {
      const cats = storageService.getCategories();
      if (cats) {
        setCategories(cats);
      }
    };
    window.addEventListener('sofyra:categories-updated', handleCategoriesUpdated);

    storageService.fetchWornByYou().then(items => {
      if (items && items.length > 0) setWornByYou(items);
    });

    storageService.fetchContactInfo().then(info => {
      if (info) setContactInfo(info);
    });

    storageService.fetchSiteSettings().then(settings => {
      if (settings) setSiteSettings(settings);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('sofyra:categories-updated', handleCategoriesUpdated);
    };
  }, []);

  // Sync if external homepageContent changes
  useEffect(() => {
    setHomepageForm(homepageContent);
  }, [homepageContent]);

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [quickImageProduct, setQuickImageProduct] = useState<Product | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSaveStatus, setProductSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [isQuickUploading, setIsQuickUploading] = useState(false);
  const [productColorInput, setProductColorInput] = useState('');
  const [productForm, setProductForm] = useState<{
    name: string;
    subtitle: string;
    category: ProductCategory;
    sku: string;
    price: number;
    compareAtPrice: number;
    description: string;
    material: string;
    plating: string;
    stone: string;
    dimensions: string;
    careInfo: string;
    inStock: boolean;
    stockCount: number;
    isNew: boolean;
    isBestseller: boolean;
    isFeatured: boolean;
    images: string[];
    colors: string[];
  }>({
    name: '',
    subtitle: '',
    category: 'rings',
    sku: '',
    price: 3500,
    compareAtPrice: 0,
    description: '',
    material: '',
    plating: '18K Gold Vermeil',
    stone: 'AAA Cubic Zirconia',
    dimensions: '',
    careInfo: '',
    inStock: true,
    stockCount: 15,
    isNew: true,
    isBestseller: false,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=1200&auto=format&fit=crop'
    ],
    colors: []
  });

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    try {
      const res = await adminAuthService.login(authEmail, authPassword);
      if (res.success) {
        setIsAuthenticated(true);
        setAdminUser(adminAuthService.getAdminProfile());
        setAuthPassword('');
      } else {
        setAuthError(res.error || 'Invalid credentials');
      }
    } catch {
      setAuthError('An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle First-Time Admin Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = authEmail.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!cleanEmail) {
      setAuthError('Please enter your private administrator email address.');
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setAuthError('Please enter a valid email address (e.g. example@gmail.com).');
      return;
    }

    if (authPassword !== authConfirmPassword) {
      setAuthError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAuthService.registerAdmin(
        cleanEmail,
        authPassword,
        authSecurityPin && authSecurityPin.trim() ? authSecurityPin.trim() : undefined
      );

      if (res.success) {
        setIsAuthenticated(true);
        setHasAdminAccount(true);
        setAdminUser(adminAuthService.getAdminProfile());
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthSecurityPin('');
        setAuthSuccess('Administrator account registered and secured successfully!');
      } else {
        setAuthError(res.error || 'Failed to create administrator account.');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('pattern') || msg.includes('did not match')) {
        setAuthError('Validation notice: Please ensure your email is formatted correctly (e.g. example@gmail.com) and password is at least 6 characters.');
      } else {
        setAuthError(msg || 'Failed to register administrator.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Recovery with PIN
  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authPassword !== authConfirmPassword) {
      setAuthError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAuthService.resetPasswordWithPin(
        authEmail,
        authSecurityPin,
        authPassword
      );

      if (res.success) {
        setAuthSuccess('Password reset link sent to your registered email! Please check your inbox.');
        setAuthView('login');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthSecurityPin('');
      } else {
        setAuthError(res.error || 'Password reset request failed. Please check your email.');
      }
    } catch {
      setAuthError('Failed to complete recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await adminAuthService.logout();
    setIsAuthenticated(false);
    setAuthPassword('');
    setAuthView('login');
    onNavigate('home');
  };

  // Save Homepage Content Changes
  const handleSaveHomepage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      await storageService.saveHomepageContent(homepageForm);
      await onRefreshHomepageContent();
      setHomepageSaveSuccess(true);
      setTimeout(() => setHomepageSaveSuccess(false), 3500);
    } catch (err: any) {
      alert('Failed to save homepage content: ' + (err.message || 'Error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dedicated Persistent Advantages Section Handler (Auto-saves & syncs homepage)
  const handleAdvantagesSectionChange = async (updatedSection: AdvantagesSectionConfig) => {
    const updatedForm: HomepageContent = {
      ...homepageForm,
      advantagesSection: updatedSection
    };
    setHomepageForm(updatedForm);
    try {
      await storageService.saveHomepageContent(updatedForm);
      await onRefreshHomepageContent();
      setSuccessToast('Advantages updated and persistently saved');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      console.error('Failed to auto-save advantages section:', err);
    }
  };

  // Reset Homepage Content to Reference Defaults
  const handleResetHomepageDefaults = async () => {
    if (window.confirm('Reset all homepage images and text to the default design reference values?')) {
      setHomepageForm(DEFAULT_HOMEPAGE_CONTENT);
      await storageService.saveHomepageContent(DEFAULT_HOMEPAGE_CONTENT);
      await onRefreshHomepageContent();
      setHomepageSaveSuccess(true);
      setTimeout(() => setHomepageSaveSuccess(false), 3000);
    }
  };

  // Product Add / Edit handlers
  const handleOpenAddProduct = () => {
    setProductSaveStatus('idle');
    setEditingProduct(null);
    setProductColorInput('');
    const activeCats = (categories || []).filter(c => c.enabled !== false && !c.hidden);
    const initialCat = activeCats[0]?.slug || categories[0]?.slug || 'rings';
    setProductForm({
      name: '',
      subtitle: '',
      category: initialCat as ProductCategory,
      sku: `SOF-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 3500,
      compareAtPrice: 0,
      description: '',
      material: '',
      plating: '',
      stone: '',
      dimensions: '',
      careInfo: '',
      inStock: true,
      stockCount: 15,
      isNew: true,
      isBestseller: false,
      isFeatured: false,
      images: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=1200&auto=format&fit=crop'
      ],
      colors: []
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductSaveStatus('idle');
    setEditingProduct(prod);
    setProductColorInput('');
    const existingColors = Array.isArray(prod.colors)
      ? [...prod.colors]
      : (Array.isArray(prod.colorOptions) ? [...prod.colorOptions] : []);

    setProductForm({
      name: prod.name,
      subtitle: prod.subtitle || '',
      category: prod.category,
      sku: prod.sku || '',
      price: prod.price,
      compareAtPrice: prod.compareAtPrice || 0,
      description: prod.description,
      material: prod.material || '',
      plating: prod.plating || '',
      stone: prod.stone || '',
      dimensions: prod.dimensions || '',
      careInfo: prod.careInfo || '',
      inStock: prod.inStock,
      stockCount: prod.stockCount,
      isNew: prod.isNew,
      isBestseller: prod.isBestseller,
      isFeatured: prod.isFeatured,
      images: prod.images && prod.images.length > 0 ? [...prod.images] : [],
      colors: existingColors
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
    setProductSaveStatus('saving');
    try {
      const cleanImages = productForm.images.filter(Boolean);
      if (cleanImages.length === 0) {
        cleanImages.push('https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=1200&auto=format&fit=crop');
      }

      const cleanColors = productForm.colors.map(c => c.trim()).filter(Boolean);
      const cleanMaterial = productForm.material ? productForm.material.trim() : undefined;

      const discountPercent =
        productForm.compareAtPrice > productForm.price
            ? Math.round(((productForm.compareAtPrice - productForm.price) / productForm.compareAtPrice) * 100)
            : undefined;

      if (editingProduct) {
        await storageService.updateProduct(editingProduct.id, {
          name: productForm.name,
          subtitle: productForm.subtitle,
          category: productForm.category,
          sku: productForm.sku || undefined,
          price: Number(productForm.price),
          compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : undefined,
          discountPercent,
          description: productForm.description,
          material: cleanMaterial,
          colors: cleanColors,
          colorOptions: cleanColors,
          plating: productForm.plating || undefined,
          stone: productForm.stone || undefined,
          dimensions: productForm.dimensions || undefined,
          careInfo: productForm.careInfo || undefined,
          inStock: productForm.inStock,
          stockCount: Number(productForm.stockCount),
          isNew: productForm.isNew,
          isBestseller: productForm.isBestseller,
          isFeatured: productForm.isFeatured,
          images: cleanImages
        });
      } else {
        await storageService.addProduct({
          name: productForm.name,
          subtitle: productForm.subtitle,
          category: productForm.category,
          sku: productForm.sku || undefined,
          price: Number(productForm.price),
          compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : undefined,
          discountPercent,
          description: productForm.description,
          material: cleanMaterial,
          colors: cleanColors,
          colorOptions: cleanColors,
          plating: productForm.plating || undefined,
          stone: productForm.stone || undefined,
          dimensions: productForm.dimensions || undefined,
          careInfo: productForm.careInfo || undefined,
          inStock: productForm.inStock,
          stockCount: Number(productForm.stockCount),
          isNew: productForm.isNew,
          isBestseller: productForm.isBestseller,
          isFeatured: productForm.isFeatured,
          images: cleanImages
        });
      }

      // Actual save successfully completes!
      setProductSaveStatus('saved');
      onRefreshProducts();
      setSuccessToast(`"${productForm.name}" saved successfully.`);
      await new Promise(res => setTimeout(res, 800));
      setIsProductModalOpen(false);
      setTimeout(() => setSuccessToast(null), 3500);
      setProductSaveStatus('idle');
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setProductSaveStatus('failed');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await storageService.deleteProduct(id);
      onRefreshProducts();
      setSuccessToast(`"${name}" was deleted.`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleToggleBestseller = async (prod: Product) => {
    const nextState = !Boolean(prod.isBestseller);
    await storageService.toggleBestseller(prod.id);
    onRefreshProducts();
    setSuccessToast(
      `"${prod.name}" Best Seller status: ${
        nextState ? 'ON (Now visible in Homepage BEST SELLERS)' : 'OFF (Removed from BEST SELLERS)'
      }`
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleMoveBestseller = async (index: number, direction: 'up' | 'down') => {
    const currentBestsellers = products
      .filter((p) => Boolean(p.isBestseller))
      .sort((a, b) => (a.bestsellerOrder ?? 999) - (b.bestsellerOrder ?? 999));

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentBestsellers.length) return;

    const copy = [...currentBestsellers];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const orderedIds = copy.map((p) => p.id);
    await storageService.reorderBestsellers(orderedIds);
    onRefreshProducts();
    setSuccessToast('Best Sellers display order updated!');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleAddProductToBestsellers = async (prodId: string) => {
    if (!prodId) return;
    await storageService.toggleBestseller(prodId);
    onRefreshProducts();
    setSuccessToast('Product added to Homepage Best Sellers!');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleUpdateQuickGallery = async (newImages: string[]) => {
    if (!quickImageProduct) return;
    await storageService.updateProduct(quickImageProduct.id, { images: newImages });
    onRefreshProducts();
    setQuickImageProduct({ ...quickImageProduct, images: newImages });
    setSuccessToast(
      `Primary image updated for "${quickImageProduct.name}". The homepage BEST SELLERS section will automatically display this photo.`
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    storageService.updateOrderStatus(orderId, status);
    setOrders(storageService.getOrders());
  };

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm('Delete this customer review?')) {
      storageService.deleteReview(reviewId);
      setReviews(storageService.getReviews());
    }
  };

  const handleExportData = () => {
    const backup = {
      products: storageService.getProducts(),
      homepageContent: storageService.getHomepageContent(),
      orders: storageService.getOrders(),
      reviews: storageService.getReviews(),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sofyra-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetSeedProducts = () => {
    if (window.confirm('Reset all products and homepage images to original seed archive? This will overwrite existing customized entries.')) {
      storageService.resetToDefaults();
      onRefreshProducts();
      onRefreshHomepageContent();
      setOrders(storageService.getOrders());
      setReviews(storageService.getReviews());
      alert('System restored to original seed catalogue.');
    }
  };

  // Secure Authentication Check: Unauthenticated visitors are redirected to home
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('home');
    }
  }, [isAuthenticated, onNavigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-10 relative">
      {/* Floating Status Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-black text-white px-5 py-3.5 shadow-2xl border border-amber-400/40 flex items-center gap-3 animate-fade-in text-xs uppercase tracking-wider font-medium max-w-md">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="flex-1">{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-stone-400 hover:text-white cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Admin Header with Authenticated Profile & Logout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-stone-500">
                SOFYRA High Jewellery Management Console
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="font-editorial text-3xl uppercase tracking-wider text-black">
                Admin Console
              </h1>
              <span className="px-2.5 py-0.5 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium">
                Verified Admin
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 font-mono">
              Authenticated Session: <span className="font-semibold text-stone-800">{adminUser?.email || adminAuthService.getCurrentSession()?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-4 py-2 border border-stone-300 text-xs uppercase tracking-wider text-stone-700 hover:border-black cursor-pointer transition-colors"
            >
              View Live Store
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 bg-stone-900 text-white text-xs uppercase tracking-wider hover:bg-black cursor-pointer transition-colors flex items-center gap-1.5"
              title="End admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Global Success Notification */}
        {homepageSaveSuccess && (
          <div className="mb-6 p-4 bg-emerald-900 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span className="text-xs tracking-wider uppercase font-medium">
                Changes Saved! Homepage and category images updated across the entire website.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-3 py-1 bg-white text-black text-[11px] uppercase tracking-wider font-semibold hover:bg-stone-100 cursor-pointer"
            >
              View On Storefront &rarr;
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-6 border-b border-stone-200 mb-8 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('homepage')}
            className={`pb-3 px-2 font-medium tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'homepage'
                ? 'border-b-2 border-black text-black'
                : 'text-stone-400 hover:text-stone-800'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Homepage & Site Content</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-2 font-medium tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'categories'
                ? 'border-b-2 border-black text-black'
                : 'text-stone-400 hover:text-stone-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Categories & Menu ({categories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-2 font-medium tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'products'
                ? 'border-b-2 border-black text-black'
                : 'text-stone-400 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products & Best Sellers ({products.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`pb-3 px-2 font-medium tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'contact'
                ? 'border-b-2 border-black text-black'
                : 'text-stone-400 hover:text-stone-800'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Contact Page & Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-2 font-medium tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'orders'
                ? 'border-b-2 border-black text-black'
                : 'text-stone-400 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-2 font-medium tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'reviews'
                ? 'border-b-2 border-black text-black'
                : 'text-stone-400 hover:text-stone-800'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Customer Reviews ({reviews.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-2 font-medium tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'settings'
                ? 'border-b-2 border-black text-black'
                : 'text-stone-400 hover:text-stone-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Backup & Sync</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: HOMEPAGE CONTENT & IMAGE MANAGEMENT (VERY IMPORTANT REQUIREMENT)  */}
        {/* ========================================================================= */}
        {activeTab === 'homepage' && (
          <div className="space-y-10">
            
            {/* Top Action Bar */}
            <div className="bg-stone-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-editorial text-xl uppercase tracking-wider text-white">
                  Homepage Content & Visual Assets
                </h3>
                <p className="text-xs text-stone-300 font-light mt-0.5">
                  Replace images and copy easily without touching source code. All changes persist automatically.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetHomepageDefaults}
                  className="px-3.5 py-2 border border-stone-600 hover:border-white text-[11px] tracking-wider uppercase text-stone-300 transition-colors cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveHomepage()}
                  className="px-6 py-2 bg-white text-black hover:bg-stone-200 text-xs tracking-wider uppercase font-semibold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save All Changes</span>
                </button>
              </div>
            </div>

            {/* HOMEPAGE CONTENT SUB-NAVIGATION (HOMEPAGE CONTENT -> ADVANTAGES) */}
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4">
              <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold mr-1">
                HOMEPAGE CONTENT &rarr;
              </span>
              {[
                { id: 'all', label: 'All Sections' },
                {
                  id: 'advantages',
                  label: 'Advantages',
                  badge: `${(homepageForm.advantagesSection?.items || DEFAULT_ADVANTAGES_SECTION.items).filter((i) => i.enabled !== false).length} Active`
                },
                { id: 'hero', label: 'Hero Banner' },
                { id: 'categories', label: 'Categories' },
                { id: 'aboutSofyra', label: 'About SOFYRA' },
                { id: 'editorial', label: 'Editorial & Spotlight' },
                { id: 'contactPage', label: 'Contact Page Image' }
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setHomepageSubTab(sub.id as any)}
                  className={`px-4 py-2 text-xs uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-2 ${
                    homepageSubTab === sub.id
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-black'
                  }`}
                >
                  <span>{sub.label}</span>
                  {sub.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        homepageSubTab === sub.id
                          ? 'bg-amber-400 text-black font-semibold'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {sub.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* SECTION 1: HERO SECTION */}
            {(homepageSubTab === 'all' || homepageSubTab === 'hero') && (
              <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
              <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-medium block">
                    Section 01
                  </span>
                  <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                    Hero Section
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Controls the primary above-the-fold visual backdrop and headline.
                  </p>
                </div>
              </div>

              {/* Headline & CTA Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Headline Line 1
                  </label>
                  <input
                    type="text"
                    value={homepageForm.hero.titleLine1}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        hero: { ...homepageForm.hero, titleLine1: e.target.value }
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-300 p-2.5 text-xs text-black font-medium uppercase tracking-wider focus:border-black focus:outline-none"
                    placeholder="JEWELLERY"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Headline Line 2
                  </label>
                  <input
                    type="text"
                    value={homepageForm.hero.titleLine2}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        hero: { ...homepageForm.hero, titleLine2: e.target.value }
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-300 p-2.5 text-xs text-black font-medium uppercase tracking-wider focus:border-black focus:outline-none"
                    placeholder="THAT SPEAKS YOU"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Call To Action Button
                  </label>
                  <input
                    type="text"
                    value={homepageForm.hero.ctaText}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        hero: { ...homepageForm.hero, ctaText: e.target.value }
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-300 p-2.5 text-xs text-black font-medium uppercase tracking-wider focus:border-black focus:outline-none"
                    placeholder="SHOP NOW"
                  />
                </div>
              </div>

              {/* Hero Image Upload */}
              <ImageUploadField
                label="Hero Background Editorial Image"
                sublabel="High-resolution dark luxury photography for the primary hero banner"
                value={homepageForm.hero.image}
                onChange={(url) =>
                  setHomepageForm({
                    ...homepageForm,
                    hero: { ...homepageForm.hero, image: url }
                  })
                }
                aspectRatio="hero"
                presetOptions={[
                  {
                    label: 'Editorial Portrait (Reference Style)',
                    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=2000&auto=format&fit=crop'
                  },
                  {
                    label: 'Gold Jewelry Editorial',
                    url: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=85&w=2000&auto=format&fit=crop'
                  }
                ]}
              />
            </div>
          )}

          {/* SECTION 2: CATEGORIES SECTION (REFERENCE IMAGE 1 MATCH) */}
          {(homepageSubTab === 'all' || homepageSubTab === 'categories') && (
            <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
              <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-medium block">
                    Section 02 &bull; Direct Reference Image 1 Match
                  </span>
                  <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                    Categories Section (4 Distinct Cards)
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Changes here immediately update the 4 category cards on the homepage and their respective category pages.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHomepageForm({
                      ...homepageForm,
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
                          image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=90&w=900&auto=format&fit=crop'
                        },
                        earrings: {
                          name: 'EARRINGS',
                          image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=85&w=900&auto=format&fit=crop'
                        }
                      }
                    });
                  }}
                  className="text-xs text-stone-600 hover:text-black uppercase tracking-wider underline cursor-pointer"
                >
                  Restore Studio Cutouts
                </button>
              </div>

              {/* 4 Category Cards in Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. RINGS */}
                <ImageUploadField
                  label="1. RINGS Category Card Image"
                  sublabel="Studio cutout on white or neutral background"
                  value={homepageForm.categories.rings.image}
                  onChange={(url) =>
                    setHomepageForm({
                      ...homepageForm,
                      categories: {
                        ...homepageForm.categories,
                        rings: { ...homepageForm.categories.rings, image: url }
                      }
                    })
                  }
                  aspectRatio="portrait"
                />

                {/* 2. BRACELETS */}
                <ImageUploadField
                  label="2. BRACELETS Category Card Image"
                  sublabel="Studio cutout on white or neutral background"
                  value={homepageForm.categories.bracelets.image}
                  onChange={(url) =>
                    setHomepageForm({
                      ...homepageForm,
                      categories: {
                        ...homepageForm.categories,
                        bracelets: { ...homepageForm.categories.bracelets, image: url }
                      }
                    })
                  }
                  aspectRatio="portrait"
                />

                {/* 3. NECKLACES */}
                <ImageUploadField
                  label="3. NECKLACES Category Card Image"
                  sublabel="Studio cutout on white or neutral background"
                  value={homepageForm.categories.necklaces.image}
                  onChange={(url) =>
                    setHomepageForm({
                      ...homepageForm,
                      categories: {
                        ...homepageForm.categories,
                        necklaces: { ...homepageForm.categories.necklaces, image: url }
                      }
                    })
                  }
                  aspectRatio="portrait"
                />

                {/* 4. EARRINGS */}
                <ImageUploadField
                  label="4. EARRINGS Category Card Image"
                  sublabel="Studio cutout on white or neutral background"
                  value={homepageForm.categories.earrings.image}
                  onChange={(url) =>
                    setHomepageForm({
                      ...homepageForm,
                      categories: {
                        ...homepageForm.categories,
                        earrings: { ...homepageForm.categories.earrings, image: url }
                      }
                    })
                  }
                  aspectRatio="portrait"
                />

              </div>
            </div>
          )}

          {/* SECTION 3: EDITORIAL & SPOTLIGHT IMAGES */}
          {(homepageSubTab === 'all' || homepageSubTab === 'editorial') && (
            <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
              <div className="border-b border-stone-200 pb-4">
                <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-medium block">
                  Section 03
                </span>
                <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                  Homepage Editorial & Dark Spotlight Showcase
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Update the split high-fashion banners and the dark spotlight carousel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploadField
                  label="Left Split Banner: Bestsellers Image"
                  sublabel="High-editorial lifestyle photography"
                  value={homepageForm.editorial.splitLeftImage}
                  onChange={(url) =>
                    setHomepageForm({
                      ...homepageForm,
                      editorial: { ...homepageForm.editorial, splitLeftImage: url }
                    })
                  }
                  aspectRatio="portrait"
                />

                <ImageUploadField
                  label="Right Split Banner: New Collection Image"
                  sublabel="High-editorial lifestyle photography"
                  value={homepageForm.editorial.splitRightImage}
                  onChange={(url) =>
                    setHomepageForm({
                      ...homepageForm,
                      editorial: { ...homepageForm.editorial, splitRightImage: url }
                    })
                  }
                  aspectRatio="portrait"
                />

                <ImageUploadField
                  label="Dark Spotlight Lifestyle Photo (Model On Wrist)"
                  sublabel="Matches the right-side lifestyle image in Reference Image 1"
                  value={homepageForm.editorial.spotlightLifestyleImage}
                  onChange={(url) =>
                    setHomepageForm({
                      ...homepageForm,
                      editorial: { ...homepageForm.editorial, spotlightLifestyleImage: url }
                    })
                  }
                  aspectRatio="portrait"
                />

                <ImageUploadField
                  label="Dark Spotlight Detail Photo (Chain Close-Up Inset)"
                  sublabel="Matches the square inset box in Reference Image 1"
                  value={homepageForm.editorial.spotlightDetailImage}
                  onChange={(url) =>
                    setHomepageForm({
                      ...homepageForm,
                      editorial: { ...homepageForm.editorial, spotlightDetailImage: url }
                    })
                  }
                  aspectRatio="square"
                />
              </div>
            </div>
          )}

          {/* SECTION 4: ADVANTAGES SECTION (HOMEPAGE CONTENT → ADVANTAGES) */}
            {(homepageSubTab === 'all' || homepageSubTab === 'advantages') && (
              <AdvantagesManager
                advantagesSection={homepageForm.advantagesSection || DEFAULT_ADVANTAGES_SECTION}
                onChange={handleAdvantagesSectionChange}
                onSave={handleSaveHomepage}
              />
            )}

            {/* SECTION 5: CONTACT PAGE IMAGE (SITE CONTENT / CONTACT PAGE -> CONTACT PAGE IMAGE) */}
            {(homepageSubTab === 'all' || homepageSubTab === 'contactPage') && (
              <div id="contact-page-image-settings" className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-1">
                      Site Content &rarr; Contact Page
                    </span>
                    <h4 className="font-editorial text-xl uppercase tracking-wider text-black">
                      Contact Page — Image Above "Contact Us"
                    </h4>
                    <p className="text-xs text-stone-500 font-light mt-1">
                      Manage the signature high-fashion editorial portrait displayed on the Contact Us page. Replace easily by uploading or entering a direct image URL.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultImg = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop";
                        const updated = {
                          ...homepageForm,
                          contactPage: {
                            ...homepageForm.contactPage,
                            image: defaultImg
                          }
                        };
                        setHomepageForm(updated);
                        storageService.saveHomepageContent(updated);
                        setSuccessToast('Reset to default contact image');
                        setTimeout(() => setSuccessToast(null), 3000);
                      }}
                      className="px-3 py-1.5 border border-stone-300 hover:border-black text-[11px] uppercase tracking-wider text-stone-600 transition-colors cursor-pointer"
                    >
                      Reset Default Image
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <ImageUploadField
                      label="Contact Page Editorial Image (Portrait)"
                      value={homepageForm.contactPage?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop"}
                      onChange={(url) => {
                        const updated = {
                          ...homepageForm,
                          contactPage: {
                            ...homepageForm.contactPage,
                            image: url
                          }
                        };
                        setHomepageForm(updated);
                        storageService.saveHomepageContent(updated);
                        storageService.saveContactInfo({
                          ...contactInfo,
                          contactImage: url
                        });
                        setSuccessToast('Contact page image updated & saved');
                        setTimeout(() => setSuccessToast(null), 3000);
                      }}
                      helpText="Upload an image from your device (auto-compressed) or paste an image URL. Displayed directly above or alongside the Contact Us form."
                      aspectRatio="portrait"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                          Eyebrow Tagline
                        </label>
                        <input
                          type="text"
                          value={homepageForm.contactPage?.tagline ?? 'Atelier Concierge'}
                          onChange={(e) => {
                            setHomepageForm({
                              ...homepageForm,
                              contactPage: {
                                ...homepageForm.contactPage,
                                image: homepageForm.contactPage?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop",
                                tagline: e.target.value
                              }
                            });
                          }}
                          className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                          placeholder="Atelier Concierge"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                          Heading
                        </label>
                        <input
                          type="text"
                          value={homepageForm.contactPage?.heading ?? 'Contact Us'}
                          onChange={(e) => {
                            setHomepageForm({
                              ...homepageForm,
                              contactPage: {
                                ...homepageForm.contactPage,
                                image: homepageForm.contactPage?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop",
                                heading: e.target.value
                              }
                            });
                          }}
                          className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black font-editorial"
                          placeholder="Contact Us"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-[#FAF9F6] border border-stone-200 p-4">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold block mb-2">
                      Live Storefront Preview
                    </span>
                    <div className="h-[280px] overflow-hidden bg-stone-100 border border-stone-200 relative mb-3">
                      <img
                        src={homepageForm.contactPage?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop"}
                        alt="Contact Page Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/75 text-white text-[9px] uppercase tracking-wider">
                        Contact Page View
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-500 font-light leading-relaxed">
                      This portrait image renders in its original full color on both mobile and desktop screens directly above/beside the consultation form.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: ABOUT SOFYRA (ADMIN -> HOMEPAGE -> ABOUT SOFYRA) */}
            {(homepageSubTab === 'all' || homepageSubTab === 'aboutSofyra') && (
              <div id="about-sofyra-settings" className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light">
                        ADMIN &rarr; HOMEPAGE &rarr; ABOUT SOFYRA
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] uppercase tracking-wider font-semibold">
                        Full-Colour Enabled
                      </span>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200 text-[9px] uppercase tracking-wider font-mono">
                        Persistent Storage
                      </span>
                    </div>
                    <h4 className="font-editorial text-xl uppercase tracking-wider text-black">
                      About SOFYRA — Our Atelier Philosophy
                    </h4>
                    <p className="text-xs text-stone-500 font-light mt-1">
                      Manage the editorial portrait and philosophy displayed on the homepage and about page. Full-colour uploaded images appear with zero grayscale or monochrome filters. Stored permanently in backend storage and database.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          await storageService.saveHomepageContent(homepageForm);
                          await onRefreshHomepageContent();
                          setSuccessToast('About SOFYRA image & content saved!');
                          setTimeout(() => setSuccessToast(null), 3500);
                        } catch (err: any) {
                          alert('Failed to save About SOFYRA: ' + (err.message || 'Error occurred'));
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="px-4 py-2 bg-black text-white hover:bg-stone-800 text-xs tracking-wider uppercase font-semibold transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const defaultImg = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop";
                        const updated: HomepageContent = {
                          ...homepageForm,
                          aboutSofyra: {
                            ...homepageForm.aboutSofyra,
                            image: defaultImg
                          }
                        };
                        setHomepageForm(updated);
                        await storageService.saveHomepageContent(updated);
                        await onRefreshHomepageContent();
                        setSuccessToast('Reset to reference default image');
                        setTimeout(() => setSuccessToast(null), 3000);
                      }}
                      className="px-3 py-2 border border-stone-300 hover:border-black text-[11px] uppercase tracking-wider text-stone-600 transition-colors cursor-pointer"
                    >
                      Reset Default Image
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Image Controls & Text Fields */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Primary Image Upload Field */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-black">
                          Editorial Portrait Image (16:9 Landscape Aspect Ratio)
                        </label>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                          Persistent Storage & Database
                        </span>
                      </div>

                      <ImageUploadField
                        label="Editorial Portrait Image"
                        sublabel="Upload a high-resolution photo. Color images render in full color without grayscale conversion."
                        value={homepageForm.aboutSofyra?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop"}
                        onChange={async (url) => {
                          const updated: HomepageContent = {
                            ...homepageForm,
                            aboutSofyra: {
                              ...homepageForm.aboutSofyra,
                              image: url
                            }
                          };
                          setHomepageForm(updated);
                          await storageService.saveHomepageContent(updated);
                          await onRefreshHomepageContent();
                          setSuccessToast('About SOFYRA image uploaded and saved');
                          setTimeout(() => setSuccessToast(null), 3000);
                        }}
                        aspectRatio="video"
                        aspectHint="16:9 Landscape Aspect Ratio — Matches Atelier Philosophy layout exactly"
                      />

                      {/* Quick Action Controls: Upload New, Replace, Remove, Save Changes */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const container = document.getElementById('about-sofyra-settings');
                            const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement | null;
                            fileInput?.click();
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-black text-[11px] uppercase tracking-wider font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-300"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{homepageForm.aboutSofyra?.image ? 'Replace Image' : 'Upload New Image'}</span>
                        </button>
                        {homepageForm.aboutSofyra?.image && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to remove the About SOFYRA image?')) {
                                const updated: HomepageContent = {
                                  ...homepageForm,
                                  aboutSofyra: {
                                    ...homepageForm.aboutSofyra,
                                    image: ''
                                  }
                                };
                                setHomepageForm(updated);
                                await storageService.saveHomepageContent(updated);
                                await onRefreshHomepageContent();
                                setSuccessToast('Image removed & saved');
                                setTimeout(() => setSuccessToast(null), 3000);
                              }
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] uppercase tracking-wider font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Image</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            setIsSubmitting(true);
                            try {
                              await storageService.saveHomepageContent(homepageForm);
                              await onRefreshHomepageContent();
                              setSuccessToast('Changes saved successfully!');
                              setTimeout(() => setSuccessToast(null), 3000);
                            } catch (err: any) {
                              alert('Save error: ' + (err.message || 'Unknown'));
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-black text-white hover:bg-stone-800 text-[11px] uppercase tracking-wider font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>

                    {/* Section Text Fields */}
                    <div className="border-t border-stone-200 pt-5 space-y-4">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold block">
                        Editorial Philosophy Text (Optional Content Editing)
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                            Eyebrow Tagline
                          </label>
                          <input
                            type="text"
                            value={homepageForm.aboutSofyra?.tagline ?? 'Our Atelier Philosophy'}
                            onChange={(e) => {
                              setHomepageForm({
                                ...homepageForm,
                                aboutSofyra: {
                                  image: homepageForm.aboutSofyra?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop",
                                  ...homepageForm.aboutSofyra,
                                  tagline: e.target.value
                                }
                              });
                            }}
                            className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                            placeholder="Our Atelier Philosophy"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                            Heading
                          </label>
                          <input
                            type="text"
                            value={homepageForm.aboutSofyra?.heading ?? 'About SOFYRA'}
                            onChange={(e) => {
                              setHomepageForm({
                                ...homepageForm,
                                aboutSofyra: {
                                  image: homepageForm.aboutSofyra?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop",
                                  ...homepageForm.aboutSofyra,
                                  heading: e.target.value
                                }
                              });
                            }}
                            className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black font-editorial"
                            placeholder="About SOFYRA"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                          Subheading
                        </label>
                        <input
                          type="text"
                          value={homepageForm.aboutSofyra?.subheading ?? 'Jewellery That Speaks You • Fine Jewellery for the Modern Woman'}
                          onChange={(e) => {
                            setHomepageForm({
                              ...homepageForm,
                              aboutSofyra: {
                                image: homepageForm.aboutSofyra?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop",
                                ...homepageForm.aboutSofyra,
                                subheading: e.target.value
                              }
                            });
                          }}
                          className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                          placeholder="Jewellery That Speaks You • Fine Jewellery for the Modern Woman"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Storefront Preview in Full Color */}
                  <div className="lg:col-span-5 bg-[#FAF9F6] border border-stone-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold">
                        Storefront Live Preview
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 font-medium">
                        Full-Colour (No Filter)
                      </span>
                    </div>

                    {/* Preview Box with 16:9 Aspect Ratio matching storefront */}
                    <div className="bg-white border border-stone-200 p-4 space-y-3">
                      <div className="text-center">
                        <span className="text-[9px] tracking-[0.3em] uppercase text-stone-400 font-light block">
                          {homepageForm.aboutSofyra?.tagline || 'Our Atelier Philosophy'}
                        </span>
                        <h5 className="font-editorial text-base uppercase tracking-wider text-black font-light">
                          {homepageForm.aboutSofyra?.heading || 'About SOFYRA'}
                        </h5>
                      </div>

                      <div className="aspect-[16/9] w-full bg-stone-100 overflow-hidden border border-stone-200 relative">
                        {homepageForm.aboutSofyra?.image ? (
                          <img
                            src={homepageForm.aboutSofyra.image}
                            alt="About SOFYRA Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                            <Upload className="w-6 h-6 mb-1 opacity-50" />
                            <span>No Image Set</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[9px] uppercase tracking-wider font-mono">
                          16:9 • Full Colour
                        </div>
                      </div>

                      <p className="text-[10px] text-stone-500 font-light text-center line-clamp-2">
                        {homepageForm.aboutSofyra?.subheading || 'Jewellery That Speaks You • Fine Jewellery for the Modern Woman'}
                      </p>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 p-3 space-y-1.5 text-[11px] text-stone-600 font-light">
                      <div className="flex items-center gap-1.5 font-medium text-black">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Persistence Guarantee</span>
                      </div>
                      <p className="leading-relaxed">
                        Uploaded full-colour images are saved directly to persistent storage. Your image will remain saved across browser refresh, logins, product updates, and category changes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Action Button */}
            <div className="p-4 bg-white border border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                All changes made to images and text can be previewed immediately on the storefront.
              </span>
              <button
                type="button"
                onClick={() => handleSaveHomepage()}
                className="px-8 py-3 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-semibold transition-colors cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save All Homepage & Image Changes</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PRODUCTS MANAGEMENT WITH USER-FRIENDLY MULTI-IMAGE GALLERY         */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* HOMEPAGE BEST SELLERS CURATOR */}
            {(() => {
              const bestsellers = products
                .filter((p) => Boolean(p.isBestseller))
                .sort((a, b) => (a.bestsellerOrder ?? 999) - (b.bestsellerOrder ?? 999));
              const nonBestsellers = products.filter((p) => !p.isBestseller);

              return (
                <div className="bg-white border border-stone-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
                    <div>
                      <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 block font-medium">
                        Homepage Curation
                      </span>
                      <h3 className="font-editorial text-lg uppercase tracking-wider text-black flex items-center gap-2">
                        <span>Best Sellers Showcase</span>
                        <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-sans normal-case">
                          {bestsellers.length} {bestsellers.length === 1 ? 'item' : 'items'} active
                        </span>
                      </h3>
                    </div>

                    {nonBestsellers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          id="add-bestseller-select"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddProductToBestsellers(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="text-xs border border-stone-300 bg-white px-3 py-1.5 focus:outline-none focus:border-black cursor-pointer"
                        >
                          <option value="" disabled>+ Add product to Best Sellers...</option>
                          {nonBestsellers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatPKR(p.price)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-stone-500 font-light">
                    These products appear in the &ldquo;BEST SELLERS&rdquo; section on your homepage. Use the arrows to reorder their sequence. If no products are selected, the section automatically hides on the storefront.
                  </p>

                  {bestsellers.length === 0 ? (
                    <div className="py-6 text-center border border-dashed border-stone-200 bg-stone-50/50">
                      <p className="text-xs text-stone-500 font-light">
                        No Best Sellers selected yet. Toggle the &ldquo;Best Seller&rdquo; switch in the catalog table below or select a product above.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {bestsellers.map((prod, idx) => (
                        <div
                          key={prod.id}
                          className="border border-stone-200 p-3 bg-stone-50/60 flex items-center gap-3 relative group"
                        >
                          <div className="w-12 h-12 bg-white border border-stone-200 overflow-hidden shrink-0">
                            <img
                              src={prod.images[0] || 'https://placehold.co/100'}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100/70 px-1 rounded">
                                #{idx + 1}
                              </span>
                              <p className="text-xs font-medium text-black truncate">{prod.name}</p>
                            </div>
                            <p className="text-[11px] text-stone-500">{formatPKR(prod.price)}</p>
                          </div>

                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveBestseller(idx, 'up')}
                              title="Move Earlier"
                              className="p-1 border border-stone-200 bg-white hover:border-black disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === bestsellers.length - 1}
                              onClick={() => handleMoveBestseller(idx, 'down')}
                              title="Move Later"
                              className="p-1 border border-stone-200 bg-white hover:border-black disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleBestseller(prod)}
                            title="Remove from Best Sellers"
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-between">
              <span className="text-xs tracking-wider uppercase text-stone-500">
                Active Catalog ({products.length} Items)
              </span>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-wider uppercase font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Jewellery Piece</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-stone-200 overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[10px] tracking-wider uppercase text-stone-500">
                    <th className="py-3.5 px-4">Primary Photo</th>
                    <th className="py-3.5 px-4">Product Details</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price (PKR)</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4 text-center">Best Seller (Homepage)</th>
                    <th className="py-3.5 px-4">Badges</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map(prod => (
                    <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="relative group/thumb w-14 h-14 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                          <img
                            src={prod.images?.[0] || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=200&auto=format&fit=crop'}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setQuickImageProduct(prod)}
                            title="Manage / change primary photo"
                            className="absolute inset-0 bg-black/75 text-white opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center text-[8px] uppercase tracking-wider font-semibold transition-opacity cursor-pointer p-1"
                          >
                            <Camera className="w-3.5 h-3.5 mb-0.5 text-amber-300" />
                            <span>Change</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-black uppercase tracking-wider">{prod.name}</p>
                        <p className="text-[10px] text-stone-400 font-mono">SKU: {prod.sku}</p>
                        <p className="text-[10px] text-stone-400 font-light truncate max-w-xs">{prod.material}</p>
                      </td>
                      <td className="py-3 px-4 uppercase text-stone-600">
                        {prod.category}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {formatPKR(prod.price)}
                        {prod.compareAtPrice && (
                          <span className="block text-[10px] text-stone-400 line-through">
                            {formatPKR(prod.compareAtPrice)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {prod.inStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            {prod.stockCount} in stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] bg-red-50 text-red-700 border border-red-200 font-medium">
                            Sold Out
                          </span>
                        )}
                      </td>
                      {/* BEST SELLER ON / OFF TOGGLE */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleBestseller(prod)}
                          title={prod.isBestseller ? `Turn Best Seller OFF for "${prod.name}"` : `Turn Best Seller ON for "${prod.name}"`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border transition-all cursor-pointer shadow-2xs ${
                            prod.isBestseller
                              ? 'bg-black text-amber-300 border-black hover:bg-stone-800'
                              : 'bg-stone-100 text-stone-500 border-stone-300 hover:border-stone-400 hover:text-black'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${prod.isBestseller ? 'bg-amber-400 animate-pulse' : 'bg-stone-400'}`} />
                          <span>Best Seller:</span>
                          <span className={prod.isBestseller ? 'text-white font-bold' : 'text-stone-600'}>
                            {prod.isBestseller ? 'ON' : 'OFF'}
                          </span>
                        </button>
                        {prod.isBestseller && (
                          <span className="block text-[9px] text-amber-700 font-medium tracking-wider mt-0.5 uppercase">
                            ✓ On Homepage
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {prod.isNew && (
                            <span className="px-1.5 py-0.5 bg-black text-white text-[9px] uppercase tracking-wider">
                              New
                            </span>
                          )}
                          {prod.isBestseller && (
                            <span className="px-1.5 py-0.5 bg-[#C5A880] text-black text-[9px] uppercase tracking-wider font-medium">
                              Bestseller
                            </span>
                          )}
                          {prod.isFeatured && (
                            <span className="px-1.5 py-0.5 bg-stone-200 text-stone-800 text-[9px] uppercase tracking-wider">
                              Spotlight
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setQuickImageProduct(prod)}
                            className="p-1.5 text-stone-600 hover:text-black border border-stone-200 hover:border-black cursor-pointer transition-colors"
                            title="Manage Photos & Select Primary Main Image"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 text-stone-500 hover:text-black border border-stone-200 hover:border-black cursor-pointer transition-colors"
                            title="Edit Piece & Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-stone-400 hover:text-red-600 border border-stone-200 hover:border-red-300 cursor-pointer transition-colors"
                            title="Delete Piece"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ORDERS MANAGEMENT                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-wider uppercase text-stone-500">
                Customer Orders ({orders.length})
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-stone-200 p-12 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="text-xs uppercase tracking-wider text-stone-500">No orders received yet</p>
                <p className="text-[11px] text-stone-400 mt-1">Orders placed via COD will appear here with customer delivery details.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const customerName = order.customerName || order.shippingAddress?.fullName || 'Valued Customer';
                  const customerPhone = order.phone || order.shippingAddress?.phone || 'No phone provided';
                  const customerEmail = order.email || order.shippingAddress?.email || 'No email provided';
                  const addressParts = [
                    order.address || order.shippingAddress?.address,
                    order.city || order.shippingAddress?.city,
                    order.province || order.shippingAddress?.province
                  ].filter(Boolean);
                  const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'No delivery address provided';

                  return (
                    <div key={order.id} className="bg-white border border-stone-200 p-5 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-stone-100 gap-2">
                        <div>
                          <span className="text-[10px] tracking-wider uppercase text-stone-400">
                            Order {order.orderNumber ? `#${order.orderNumber}` : ''}
                          </span>
                          <p className="font-mono font-bold text-black">{order.orderNumber || order.id}</p>
                          <p className="text-[10px] text-stone-400">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={order.status}
                            onChange={e => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                            className="bg-stone-50 border border-stone-300 text-xs py-1.5 px-3 uppercase tracking-wider font-medium focus:border-black focus:outline-none"
                          >
                            <option value="Pending">Pending Confirmation</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing & Crafting</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Dispatched">Dispatched with TCS</option>
                            <option value="Delivered">Delivered & Paid</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] tracking-wider uppercase text-stone-400 block mb-1">Customer & Delivery</span>
                          <p className="font-medium text-black">{customerName}</p>
                          <p className="text-stone-500 font-mono">{customerPhone}</p>
                          <p className="text-stone-500">{customerEmail}</p>
                          <p className="text-stone-600 mt-1 leading-relaxed">{formattedAddress}</p>
                          {order.orderNotes && (
                            <p className="text-[11px] text-stone-500 italic mt-2 bg-stone-50 p-2 border border-stone-200">
                              Note: {order.orderNotes}
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] tracking-wider uppercase text-stone-400 block mb-1">
                            Items ({order.items?.length || 0})
                          </span>
                          <ul className="space-y-1.5">
                            {(order.items || []).map((item, idx) => {
                              const itemName = item.product?.name || (item as any).name || 'Jewellery Item';
                              const itemPrice = item.unitPrice || item.product?.price || 0;
                              const itemQty = item.quantity || 1;
                              const isRingItem =
                                (item.product?.category || '').toLowerCase().trim() === 'rings' ||
                                (item.product?.category || '').toLowerCase().trim() === 'ring';
                              return (
                                <li key={item.id || item.product?.id || idx} className="text-stone-700">
                                  <div className="flex justify-between">
                                    <span>{itemName} &times; {itemQty}</span>
                                    <span className="font-mono text-stone-500">{formatPKR(itemPrice * itemQty)}</span>
                                  </div>
                                  {isRingItem && (
                                    <span className="text-[10px] text-stone-500 block">
                                      Size: Adjustable — One Size
                                    </span>
                                  )}
                                  {item.giftOptions?.hasPersonalNote && (
                                    <span className="text-[10px] text-stone-600 italic block">
                                      Note: "{item.giftOptions.personalNote || 'Personal Note'}" (+Rs. 350)
                                    </span>
                                  )}
                                  {item.giftOptions?.hasGiftWrap && (
                                    <span className="text-[10px] text-stone-600 block">
                                      Gift Wrap: Yes (+Rs. 520)
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                          {order.giftNote && (
                            <p className="text-[10px] text-stone-600 italic mt-2 bg-stone-50 p-2 border border-stone-200">
                              Gift Note: "{order.giftNote}"
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] tracking-wider uppercase text-stone-400 block mb-1">Total Due</span>
                          <p className="font-mono font-bold text-lg text-black">{formatPKR(order.total || 0)}</p>
                          {order.giftCharges && order.giftCharges > 0 ? (
                            <span className="text-[10px] tracking-wider uppercase text-stone-500 block mt-0.5">
                              Includes Gift Services (+{formatPKR(order.giftCharges)})
                            </span>
                          ) : null}
                          <span className="text-[10px] tracking-wider uppercase text-stone-500 block mt-1">
                            Shipping: {order.paymentMethod === 'bank_transfer' ? 'Bank Transfer (Rs. 99)' : 'Cash on Delivery (Rs. 260)'}
                          </span>
                          <span className="text-[10px] tracking-wider uppercase text-stone-500 block mt-0.5">
                            Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Direct Bank Transfer (HBL)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: REVIEWS MANAGEMENT                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <ReviewsManager
            reviews={reviews}
            products={products}
            onReviewsUpdated={(updatedRevs) => {
              setReviews(updatedRevs);
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 5: BACKUP & SETTINGS                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Administrator Account & Access Control Panel */}
            <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-2">
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 block font-medium">
                    Access Control & Authentication
                  </span>
                  <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                    Administrator Account
                  </h3>
                </div>
                <span className="px-3 py-1 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium self-start sm:self-auto flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Role: Full Administrator</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] tracking-wider uppercase text-stone-400 block mb-0.5">
                      Registered Master Admin Email
                    </span>
                    <p className="font-mono text-sm font-semibold text-black">
                      {adminUser?.email || adminAuthService.getCurrentSession()?.email || 'Registered Administrator'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] tracking-wider uppercase text-stone-400 block mb-0.5">
                      Authentication Standard
                    </span>
                    <p className="text-stone-700 font-light">
                      Web Crypto API PBKDF2 (SHA-256 with 100,000 cryptographic rounds and 16-byte random salt). Zero plaintext storage.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] tracking-wider uppercase text-stone-400 block mb-0.5">
                      Session Security
                    </span>
                    <p className="text-stone-700 font-light">
                      Protected auto-expiring 24-hour token. Customers visiting the storefront have zero administrative privileges.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF9F6] border border-stone-200">
                  <span className="text-[10px] tracking-wider uppercase text-stone-600 block font-medium mb-2">
                    Enforced Administrative Permissions:
                  </span>
                  <ul className="space-y-1.5 text-stone-600 text-[11px]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Add new jewellery pieces to catalogue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Edit details & upload product gallery images</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Delete items & duplicate catalogue records</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Modify prices & comparative discounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Adjust real-time stock counts & availability</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Update homepage headline, editorial, category banners</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Manage customer orders & dispatch status</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Moderate and delete customer reviews</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 bg-stone-900 text-white hover:bg-black text-xs tracking-wider uppercase font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Admin Console</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Do you want to switch or reset administrator credentials? You will be logged out and taken to the authentication screen.')) {
                      await adminAuthService.logout();
                      setIsAuthenticated(false);
                      onNavigate('auth');
                    }
                  }}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:border-black text-xs tracking-wider uppercase font-medium cursor-pointer transition-colors"
                >
                  Change Password / Sign In as Different Admin
                </button>
              </div>
            </div>

            {/* Promo & Discount Codes Management */}
            <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-2">
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 block font-medium">
                    Storefront Promotions
                  </span>
                  <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                    Promo & Discount Codes
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Configure customer discount codes (like WELCOME10 for 10% off). All discounts are verified securely on the server.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSavingDiscounts}
                  onClick={async () => {
                    setIsSavingDiscounts(true);
                    try {
                      await storageService.saveAllDiscounts(discounts);
                      setSuccessToast('Discount codes saved and synchronized with server!');
                      setTimeout(() => setSuccessToast(null), 3500);
                    } catch (e: any) {
                      alert('Failed to save discounts: ' + (e?.message || 'Error'));
                    } finally {
                      setIsSavingDiscounts(false);
                    }
                  }}
                  className="px-5 py-2 bg-black text-white hover:bg-stone-800 text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-2 self-start sm:self-auto"
                >
                  {isSavingDiscounts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isSavingDiscounts ? 'Saving...' : 'Save Discounts'}</span>
                </button>
              </div>

              {/* Existing discounts table */}
              <div className="space-y-3">
                {discounts.map((disc, idx) => (
                  <div
                    key={disc.code}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border text-xs gap-3 ${
                      disc.active ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm tracking-wider uppercase text-black bg-stone-100 px-2.5 py-1 border border-stone-300">
                        {disc.code}
                      </span>
                      <div>
                        <div className="font-semibold text-black">
                          {disc.percentage}% Off Orders
                        </div>
                        {disc.description && (
                          <div className="text-[11px] text-stone-500 font-light">
                            {disc.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-stone-500">Discount %:</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={disc.percentage}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...discounts];
                            updated[idx] = { ...updated[idx], percentage: val };
                            setDiscounts(updated);
                          }}
                          className="w-16 px-2 py-1 border border-stone-300 text-xs font-medium text-black focus:outline-none focus:border-black"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...discounts];
                          updated[idx] = { ...updated[idx], active: !updated[idx].active };
                          setDiscounts(updated);
                        }}
                        className={`px-3 py-1 text-[10px] uppercase tracking-wider font-semibold cursor-pointer border ${
                          disc.active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300'
                        }`}
                      >
                        {disc.active ? 'Active' : 'Disabled'}
                      </button>

                      {disc.code !== 'WELCOME10' && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = discounts.filter((_, i) => i !== idx);
                            setDiscounts(updated);
                          }}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Delete code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Discount Code */}
              <div className="p-4 bg-[#FAF9F6] border border-stone-200 space-y-3">
                <span className="text-[10px] tracking-wider uppercase text-stone-600 block font-bold">
                  Create Additional Promo Code
                </span>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                  <input
                    type="text"
                    value={newDiscountCode}
                    onChange={(e) => setNewDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Code name (e.g. SUMMER15)"
                    className="flex-1 min-w-[140px] px-3 py-2 text-xs bg-white border border-stone-300 uppercase tracking-wider focus:outline-none focus:border-black"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newDiscountPercent}
                      onChange={(e) => setNewDiscountPercent(Number(e.target.value))}
                      placeholder="%"
                      className="w-20 px-3 py-2 text-xs bg-white border border-stone-300 focus:outline-none focus:border-black"
                    />
                    <span className="text-xs font-bold text-stone-500">%</span>
                  </div>
                  <button
                    type="button"
                    disabled={!newDiscountCode.trim()}
                    onClick={() => {
                      const clean = newDiscountCode.trim().toUpperCase();
                      if (!clean) return;
                      if (discounts.some(d => d.code === clean)) {
                        alert('Discount code already exists!');
                        return;
                      }
                      const updated: DiscountCode[] = [
                        ...discounts,
                        {
                          code: clean,
                          percentage: newDiscountPercent || 10,
                          active: true,
                          description: `${newDiscountPercent}% off promotional code`
                        }
                      ];
                      setDiscounts(updated);
                      setNewDiscountCode('');
                      setNewDiscountPercent(10);
                    }}
                    className="px-4 py-2 bg-stone-900 text-white text-xs uppercase tracking-wider hover:bg-black font-semibold disabled:opacity-40 cursor-pointer shrink-0 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Code</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Data Management & Backup */}
            <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
              <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                Data Management & Backup
              </h3>
              <p className="text-xs text-stone-600 font-light max-w-xl">
                All website images, homepage configuration, product catalog, orders, and reviews are stored locally in your browser storage. You can export a JSON backup anytime or reset to initial defaults.
              </p>

              <div className="pt-4 border-t border-stone-200 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-5 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-wider uppercase font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Store Backup (.JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetSeedProducts}
                  className="px-5 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs tracking-wider uppercase font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Store to Original Defaults</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CATEGORIES & NAVIGATION MENU MANAGER                               */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <CategoriesManager
              categories={categories}
              onCategoriesUpdated={(updated) => {
                setCategories(updated);
                setSuccessToast('Categories and navigation synchronized across storefront');
                setTimeout(() => setSuccessToast(null), 3000);
              }}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: CONTACT PAGE & INFO MANAGER                                        */}
        {/* ========================================================================= */}
        {activeTab === 'contact' && (
          <div className="space-y-8">
            {/* Contact Page Image Above "Contact Us" */}
            <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-1">
                    Contact Page Editorial
                  </span>
                  <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                    Contact Page — Image Above "Contact Us"
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-1">
                    Manage the image positioned directly above the "Contact Us" heading on mobile and alongside the consultation form on desktop.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <ImageUploadField
                    label="Contact Page Image (Upload or URL)"
                    value={homepageForm.contactPage?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop"}
                    onChange={(url) => {
                      const updated = {
                        ...homepageForm,
                        contactPage: {
                          ...homepageForm.contactPage,
                          image: url
                        }
                      };
                      setHomepageForm(updated);
                      storageService.saveHomepageContent(updated);
                      storageService.saveContactInfo({
                        ...contactInfo,
                        contactImage: url
                      });
                      setSuccessToast('Contact page image updated and saved');
                      setTimeout(() => setSuccessToast(null), 3000);
                    }}
                    helpText="Upload a portrait photo from your computer or paste an image URL. It will instantly update on the Contact Us page."
                    aspectRatio="portrait"
                  />
                </div>

                <div className="lg:col-span-5 bg-[#FAF9F6] border border-stone-200 p-4">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold block mb-2">
                    Contact Page View
                  </span>
                  <div className="h-[280px] overflow-hidden bg-stone-100 border border-stone-200 relative mb-2">
                    <img
                      src={homepageForm.contactPage?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop"}
                      alt="Contact Page Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                    Shown above "Contact Us" on mobile and alongside the form on desktop
                  </span>
                </div>
              </div>
            </div>

            {/* General Contact Info Manager */}
            <ContactInfoManager
              contactInfo={contactInfo}
              onContactInfoUpdated={(info) => {
                setContactInfo(info);
                setSuccessToast('Contact details successfully updated');
                setTimeout(() => setSuccessToast(null), 3000);
              }}
            />
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* PRODUCT ADD / EDIT MODAL WITH GALLERY MANAGER                             */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white border border-stone-300 max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-6">
              <div>
                <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 block font-medium">
                  Atelier Catalogue
                </span>
                <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                  {editingProduct ? 'Edit Jewellery Piece & Photos' : 'Add New Jewellery Piece'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-stone-400 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Piece Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Etoile Drop Earrings"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none uppercase"
                  >
                    {(() => {
                      const selectedVal = (productForm.category || '').toLowerCase().trim();
                      const allCats = categories || [];

                      // Visible categories:
                      // For a NEW product: show only enabled/active categories
                      // For an EXISTING product: show enabled categories PLUS the product's current category if disabled
                      const visibleCats = allCats.filter(cat => {
                        const isEnabled = cat.enabled !== false && !cat.hidden;
                        if (isEnabled) return true;
                        if (editingProduct) {
                          const catSlug = (cat.slug || '').toLowerCase().trim();
                          const catId = (cat.id || '').toLowerCase().trim();
                          if (catSlug === selectedVal || catId === selectedVal) {
                            return true;
                          }
                        }
                        return false;
                      });

                      const hasSelectedInVisible = visibleCats.some(cat => {
                        const catSlug = (cat.slug || '').toLowerCase().trim();
                        const catId = (cat.id || '').toLowerCase().trim();
                        return catSlug === selectedVal || catId === selectedVal;
                      });

                      return (
                        <>
                          {visibleCats.map(cat => (
                            <option key={cat.id} value={cat.slug || cat.id}>
                              {cat.name} {cat.enabled === false || cat.hidden ? ' (Disabled)' : ''}
                            </option>
                          ))}
                          {!hasSelectedInVisible && selectedVal && (
                            <option value={selectedVal}>
                              {selectedVal.toUpperCase()}
                            </option>
                          )}
                        </>
                      );
                    })()}
                  </select>
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Subtitle / Alloy Note</label>
                <input
                  type="text"
                  value={productForm.subtitle}
                  onChange={e => setProductForm({ ...productForm, subtitle: e.target.value })}
                  placeholder="e.g. sterling silver, 18k yellow gold"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Compare Price</label>
                  <input
                    type="number"
                    value={productForm.compareAtPrice}
                    onChange={e => setProductForm({ ...productForm, compareAtPrice: Number(e.target.value) })}
                    placeholder="e.g. 5000"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Stock Count</label>
                  <input
                    type="number"
                    value={productForm.stockCount}
                    onChange={e => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Materials & Details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Material</label>
                  <select
                    value={productForm.material || ''}
                    onChange={e => setProductForm({ ...productForm, material: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none text-xs cursor-pointer"
                  >
                    <option value="">-- No Material Selected --</option>
                    <option value="925 Sterling Silver">925 Sterling Silver</option>
                    <option value="18K Gold-Plated">18K Gold-Plated</option>
                  </select>
                  <p className="text-[10px] text-stone-500 font-light mt-1">
                    Select material. If none selected, Material section is hidden on product page.
                  </p>
                </div>
                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Plating (Optional)</label>
                  <input
                    type="text"
                    value={productForm.plating}
                    onChange={e => setProductForm({ ...productForm, plating: e.target.value })}
                    placeholder="e.g. 18K Gold-Plated"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Stone Setting (Optional)</label>
                  <input
                    type="text"
                    value={productForm.stone}
                    onChange={e => setProductForm({ ...productForm, stone: e.target.value })}
                    placeholder="e.g. AAA Cubic Zirconia"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Product Color Options */}
              <div className="bg-[#FAF9F6] border border-stone-300 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block tracking-wider uppercase text-stone-800 text-xs font-semibold">
                    Product Color Options (Optional)
                  </label>
                  <span className="text-[11px] text-stone-500 font-light">
                    {productForm.colors.length} {productForm.colors.length === 1 ? 'color' : 'colors'} configured
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 font-light">
                  Add available colors for this specific product (e.g. Gold, Silver, Rose Gold, Pink). Customers can select their preferred color on the product page. If no colors are added, no color selector will be shown.
                </p>

                {/* Current Color Chips */}
                {productForm.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {productForm.colors.map((c, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-300 text-stone-800 text-xs tracking-wider uppercase font-medium shadow-2xs"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm({
                              ...productForm,
                              colors: productForm.colors.filter((_, i) => i !== idx)
                            });
                          }}
                          className="text-stone-400 hover:text-black cursor-pointer font-bold text-sm leading-none ml-1"
                          aria-label={`Remove ${c}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Color Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productColorInput}
                    onChange={e => setProductColorInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = productColorInput.trim();
                        if (val && !productForm.colors.includes(val)) {
                          setProductForm({
                            ...productForm,
                            colors: [...productForm.colors, val]
                          });
                          setProductColorInput('');
                        }
                      }
                    }}
                    placeholder="Type a color (e.g. Gold, Silver, Pink) and press Enter"
                    className="flex-1 bg-white border border-stone-300 p-2 text-xs text-black focus:border-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = productColorInput.trim();
                      if (val && !productForm.colors.includes(val)) {
                        setProductForm({
                          ...productForm,
                          colors: [...productForm.colors, val]
                        });
                        setProductColorInput('');
                      }
                    }}
                    className="px-4 py-2 bg-black text-white text-xs tracking-wider uppercase font-medium hover:bg-stone-800 cursor-pointer"
                  >
                    Add Color
                  </button>
                </div>

                {/* Quick Add Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-stone-500 font-light">
                  <span>Quick Add:</span>
                  {['Gold', 'Silver', 'Rose Gold', 'Pink', 'White Gold', 'Black'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        if (!productForm.colors.includes(preset)) {
                          setProductForm({
                            ...productForm,
                            colors: [...productForm.colors, preset]
                          });
                        }
                      }}
                      className="px-2 py-0.5 border border-stone-200 bg-white text-stone-700 hover:border-black text-[10px] tracking-wide cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Architectural, high-sparkle fine jewellery crafted with precision..."
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none"
                />
              </div>

              {/* =============================================================== */}
              {/* COMPREHENSIVE PRODUCT GALLERY MANAGER (MULTI-UPLOAD, REORDER)    */}
              {/* =============================================================== */}
              <div>
                <ProductGalleryManager
                  images={productForm.images}
                  onChange={(newImages) => setProductForm({ ...productForm, images: newImages })}
                  productName={productForm.name}
                  onUploadingChange={setIsGalleryUploading}
                />
              </div>

              {/* DEDICATED HOMEPAGE BEST SELLER TOGGLE */}
              <div className="p-4 bg-stone-100 border border-stone-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-black">
                      Best Seller Homepage Status
                    </span>
                    {productForm.isBestseller ? (
                      <span className="px-2 py-0.5 bg-black text-amber-300 text-[10px] uppercase tracking-wider font-bold">
                        ★ Visible in Homepage Best Sellers
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-stone-200 text-stone-600 text-[10px] uppercase tracking-wider font-medium">
                        Hidden from Best Sellers
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-600 font-light mt-0.5 max-w-lg">
                    When Best Seller is <strong>ON</strong>, this piece appears in the curated <strong>BEST SELLERS</strong> section on the homepage with its current primary photo, title, and price.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, isBestseller: !productForm.isBestseller })}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                    productForm.isBestseller
                      ? 'bg-black text-amber-300 border-black shadow-xs hover:bg-stone-800'
                      : 'bg-white text-stone-600 border-stone-300 hover:border-black hover:text-black'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${productForm.isBestseller ? 'bg-amber-400 animate-pulse' : 'bg-stone-400'}`} />
                  <span>Best Seller:</span>
                  <span className={productForm.isBestseller ? 'text-white font-bold' : 'text-stone-700'}>
                    {productForm.isBestseller ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Badges Toggles */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-stone-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={e => setProductForm({ ...productForm, inStock: e.target.checked })}
                    className="accent-black"
                  />
                  <span>In Stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isNew}
                    onChange={e => setProductForm({ ...productForm, isNew: e.target.checked })}
                    className="accent-black"
                  />
                  <span>Mark as New</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={e => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="accent-black"
                  />
                  <span>Show in Spotlight Showcase</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-300 text-stone-700 uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct || isGalleryUploading}
                  className="px-7 py-2.5 bg-black text-white hover:bg-stone-800 uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {(isSavingProduct || isGalleryUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {productSaveStatus === 'saving'
                      ? 'Saving…'
                      : productSaveStatus === 'saved'
                      ? 'Saved ✓'
                      : productSaveStatus === 'failed'
                      ? 'Save failed — try again'
                      : isGalleryUploading
                      ? 'Uploading Photos...'
                      : 'Save Piece & Photos'}
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* QUICK PHOTO & PRIMARY IMAGE SELECTOR MODAL */}
      {quickImageProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                  Quick Photo Manager
                </span>
                <h3 className="text-base font-medium uppercase tracking-wider text-black mt-1">
                  Photos for {quickImageProduct.name}
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Select which photo is the primary cover image (displayed in <strong>BEST SELLERS</strong> on the homepage), upload new photos, or replace existing ones.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickImageProduct(null)}
                className="text-stone-400 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gallery manager for this product */}
            <ProductGalleryManager
              images={quickImageProduct.images || []}
              onChange={handleUpdateQuickGallery}
              productName={quickImageProduct.name}
              onUploadingChange={setIsQuickUploading}
            />

            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <div className="text-[11px] text-stone-500">
                {quickImageProduct.isBestseller ? (
                  <span className="text-emerald-700 font-medium">
                    ✓ This piece is currently an active Best Seller on the homepage.
                  </span>
                ) : (
                  <span>
                    Turn Best Seller <strong>ON</strong> in the product table to show it on the homepage.
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={isQuickUploading}
                onClick={() => setQuickImageProduct(null)}
                className="px-6 py-2 bg-black text-white hover:bg-stone-800 text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isQuickUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isQuickUploading ? 'Uploading...' : 'Done'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
