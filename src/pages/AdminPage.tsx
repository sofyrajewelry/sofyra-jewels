import React, { useState, useEffect } from 'react';
import { Product, Order, CustomerReview, ProductCategory, HomepageContent, AdvantagesSectionConfig, CategoryHierarchyItem, WornByYouItem, ContactInfo, SiteSettings } from '../types';
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
  Loader2
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

  // Homepage Content Form State
  const [homepageForm, setHomepageForm] = useState<HomepageContent>(homepageContent);
  const [homepageSubTab, setHomepageSubTab] = useState<'all' | 'hero' | 'categories' | 'editorial' | 'advantages' | 'contactPage'>('all');
  const [homepageSaveSuccess, setHomepageSaveSuccess] = useState(false);

  // Sync auth status with backend on mount
  useEffect(() => {
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

    storageService.fetchCategories().then(cats => {
      if (cats && cats.length > 0) setCategories(cats);
    });

    storageService.fetchWornByYou().then(items => {
      if (items && items.length > 0) setWornByYou(items);
    });

    storageService.fetchContactInfo().then(info => {
      if (info) setContactInfo(info);
    });

    storageService.fetchSiteSettings().then(settings => {
      if (settings) setSiteSettings(settings);
    });
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
  const [productForm, setProductForm] = useState<{
    name: string;
    subtitle: string;
    category: ProductCategory;
    subcategory: string;
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
  }>({
    name: '',
    subtitle: '',
    category: 'rings',
    subcategory: '',
    sku: '',
    price: 3500,
    compareAtPrice: 0,
    description: '',
    material: '925 Sterling Silver',
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
    ]
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
        authEmail,
        authPassword,
        authSecurityPin
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
    } catch {
      setAuthError('Failed to register administrator.');
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
        setAuthSuccess('Password successfully reset! You can now log in with your new password.');
        setAuthView('login');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthSecurityPin('');
      } else {
        setAuthError(res.error || 'Recovery failed. Verify your email and PIN.');
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
    setEditingProduct(null);
    setProductForm({
      name: '',
      subtitle: '',
      category: categories[0]?.slug || 'rings',
      subcategory: '',
      sku: `SOF-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 3500,
      compareAtPrice: 4200,
      description: '',
      material: '925 Sterling Silver',
      plating: '18K Yellow Gold',
      stone: 'Cubic Zirconia (AAAAA grade)',
      dimensions: '',
      careInfo: '',
      inStock: true,
      stockCount: 15,
      isNew: true,
      isBestseller: false,
      isFeatured: false,
      images: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=1200&auto=format&fit=crop'
      ]
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      subtitle: prod.subtitle || '',
      category: prod.category,
      subcategory: prod.subcategory || '',
      sku: prod.sku || '',
      price: prod.price,
      compareAtPrice: prod.compareAtPrice || 0,
      description: prod.description,
      material: prod.material,
      plating: prod.plating || '',
      stone: prod.stone || '',
      dimensions: prod.dimensions || '',
      careInfo: prod.careInfo || '',
      inStock: prod.inStock,
      stockCount: prod.stockCount,
      isNew: prod.isNew,
      isBestseller: prod.isBestseller,
      isFeatured: prod.isFeatured,
      images: prod.images && prod.images.length > 0 ? [...prod.images] : []
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      const cleanImages = productForm.images.filter(Boolean);
      if (cleanImages.length === 0) {
        cleanImages.push('https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=1200&auto=format&fit=crop');
      }

      const discountPercent =
        productForm.compareAtPrice > productForm.price
          ? Math.round(((productForm.compareAtPrice - productForm.price) / productForm.compareAtPrice) * 100)
          : undefined;

      if (editingProduct) {
        await storageService.updateProduct(editingProduct.id, {
          name: productForm.name,
          subtitle: productForm.subtitle,
          category: productForm.category,
          subcategory: productForm.subcategory || undefined,
          sku: productForm.sku || undefined,
          price: Number(productForm.price),
          compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : undefined,
          discountPercent,
          description: productForm.description,
          material: productForm.material,
          plating: productForm.plating,
          stone: productForm.stone,
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
          subcategory: productForm.subcategory || undefined,
          sku: productForm.sku || undefined,
          price: Number(productForm.price),
          compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : undefined,
          discountPercent,
          description: productForm.description,
          material: productForm.material,
          plating: productForm.plating,
          stone: productForm.stone,
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

      setIsProductModalOpen(false);
      onRefreshProducts();
      setSuccessToast(`"${productForm.name}" and all photos saved to persistent database.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(`Failed to save product: ${err.message || 'Unknown error'}`);
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

  // Secure Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[#FAF9F6]">
        <div className="max-w-md w-full bg-white border border-stone-300 p-8 sm:p-10 shadow-xl">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-black text-white mx-auto flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 stroke-[1.5]" />
            </div>

            <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 block mb-1 font-medium">
              SOFYRA Fine Jewellery
            </span>

            {!hasAdminAccount && (
              <div className="mb-2">
                <span className="inline-block px-3 py-1 bg-stone-900 text-white text-[10px] font-semibold uppercase tracking-widest">
                  One-Time Setup
                </span>
              </div>
            )}

            <h2 className="font-editorial text-2xl sm:text-3xl uppercase tracking-wider text-black">
              {!hasAdminAccount
                ? 'Create Administrator Account'
                : authView === 'recovery'
                ? 'Security PIN Reset'
                : 'Sign in as Administrator'}
            </h2>

            <p className="text-xs text-stone-500 font-light mt-2 max-w-xs mx-auto">
              {!hasAdminAccount
                ? 'Create your private administrator email and password. Once established, public registration is locked permanently.'
                : authView === 'recovery'
                ? 'Enter your registered email and secret recovery PIN to reset your master password.'
                : 'Restricted administrative access. Authenticate with your private administrator credentials.'}
            </p>
          </div>

          {/* Error & Success Feedback Alerts */}
          {authError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* VIEW 1: FIRST-TIME REGISTRATION (No hard-coded passwords) */}
          {!hasAdminAccount && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                  Private Admin Email *
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="e.g. your-private-email@gmail.com"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  This private email will be designated as the sole SOFYRA Administrator.
                </span>
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                  Admin Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Create a strong password (min 6 chars)"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-3 pr-10 text-sm text-black focus:border-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-stone-400 hover:text-black cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                  Confirm Admin Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authConfirmPassword}
                  onChange={e => setAuthConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                  Emergency Security Recovery PIN (Optional)
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={authSecurityPin}
                  onChange={e => setAuthSecurityPin(e.target.value)}
                  placeholder="4 to 8 digit recovery PIN (e.g. 7482)"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none font-mono"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  Used if you ever forget your master password.
                </span>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1">
                <p className="font-semibold text-stone-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-black" />
                  Cryptographic Security Guarantee
                </p>
                <p className="text-[10px] leading-relaxed text-stone-500">
                  Password is cryptographically salted & hashed with Web Crypto PBKDF2 (SHA-256, 100k rounds). Credentials are never hard-coded in source code or sent to external trackers.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-black text-white uppercase tracking-[0.2em] text-xs font-semibold hover:bg-stone-800 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Administrator Account...' : 'Create Administrator Account'}
              </button>
            </form>
          )}

          {/* VIEW 2: STANDARD LOGIN */}
          {hasAdminAccount && authView === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="Enter registered admin email"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] tracking-wider uppercase text-stone-700 font-medium">
                    Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('recovery');
                      setAuthError('');
                    }}
                    className="text-[10px] text-stone-500 hover:text-black uppercase tracking-wider underline cursor-pointer"
                  >
                    Forgot PIN / Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-3 pr-10 text-sm text-black focus:border-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-stone-400 hover:text-black cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-black text-white uppercase tracking-[0.2em] text-xs font-semibold hover:bg-stone-800 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying...' : 'Sign In as Administrator'}
              </button>
            </form>
          )}

          {/* VIEW 3: RECOVERY WITH PIN */}
          {hasAdminAccount && authView === 'recovery' && (
            <form onSubmit={handleRecovery} className="space-y-4">
              <div>
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                  Registered Admin Email *
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="Admin email"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                  Security Recovery PIN *
                </label>
                <input
                  type="password"
                  required
                  value={authSecurityPin}
                  onChange={e => setAuthSecurityPin(e.target.value)}
                  placeholder="Enter your security PIN"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                  New Admin Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authConfirmPassword}
                  onChange={e => setAuthConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-black text-white uppercase tracking-[0.2em] text-xs font-semibold hover:bg-stone-800 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Resetting...' : 'Verify PIN & Update Password'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setAuthError('');
                  }}
                  className="text-xs text-stone-500 hover:text-black uppercase tracking-wider"
                >
                  &larr; Back to Login
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-5 border-t border-stone-200 text-center">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-xs text-stone-500 hover:text-black uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto"
            >
              <span>&larr; Return to Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
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
                    url: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?q=85&w=2000&auto=format&fit=crop'
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
                          <ul className="space-y-1">
                            {(order.items || []).map((item, idx) => {
                              const itemName = item.product?.name || (item as any).name || 'Jewellery Item';
                              const itemPrice = item.unitPrice || item.product?.price || 0;
                              const itemQty = item.quantity || 1;
                              return (
                                <li key={item.id || item.product?.id || idx} className="flex justify-between">
                                  <span className="text-stone-700">{itemName} &times; {itemQty}</span>
                                  <span className="font-mono text-stone-500">{formatPKR(itemPrice * itemQty)}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] tracking-wider uppercase text-stone-400 block mb-1">Total Due</span>
                          <p className="font-mono font-bold text-lg text-black">{formatPKR(order.total || 0)}</p>
                          {order.discountAmount && order.discountAmount > 0 ? (
                            <span className="text-[10px] tracking-wider uppercase text-emerald-700 block mt-0.5 font-medium">
                              Includes 10% Bank Discount (-{formatPKR(order.discountAmount)})
                            </span>
                          ) : null}
                          <span className="text-[10px] tracking-wider uppercase text-stone-500 block mt-1">
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
                  onClick={() => {
                    if (window.confirm('Do you want to switch or reset administrator credentials? You will be logged out and taken to the authentication screen.')) {
                      handleLogout();
                    }
                  }}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:border-black text-xs tracking-wider uppercase font-medium cursor-pointer transition-colors"
                >
                  Change Password / Sign In as Different Admin
                </button>
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
                    <option value="rings">Rings</option>
                    <option value="bracelets">Bracelets</option>
                    <option value="necklaces">Necklaces</option>
                    <option value="earrings">Earrings</option>
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
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Core Material</label>
                  <input
                    type="text"
                    value={productForm.material}
                    onChange={e => setProductForm({ ...productForm, material: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Plating</label>
                  <input
                    type="text"
                    value={productForm.plating}
                    onChange={e => setProductForm({ ...productForm, plating: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block tracking-wider uppercase text-stone-700 mb-1 font-medium">Stone Setting</label>
                  <input
                    type="text"
                    value={productForm.stone}
                    onChange={e => setProductForm({ ...productForm, stone: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-black focus:border-black focus:outline-none"
                  />
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
                  disabled={isSavingProduct}
                  className="px-7 py-2.5 bg-black text-white hover:bg-stone-800 uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSavingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingProduct ? 'Saving to Database...' : 'Save Piece & Photos'}</span>
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
                onClick={() => setQuickImageProduct(null)}
                className="px-6 py-2 bg-black text-white hover:bg-stone-800 text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
