import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { storageService } from './services/storageService';
import { adminAuthService } from './services/adminAuthService';
import { Product, Order, ProductCategory, HomepageContent, SiteSettings, ContactInfo } from './types';

// Components
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryGrid } from './components/CategoryGrid';
import { BestSellersSection } from './components/BestSellersSection';
import { AdvantagesSection } from './components/AdvantagesSection';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';

// Pages
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShopPage } from './pages/ShopPage';
import { CategoryPage } from './pages/CategoryPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AdminPage } from './pages/AdminPage';
import { AboutPage } from './pages/AboutPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { AuthPage } from './pages/AuthPage';
import { ShieldCheck, Package } from 'lucide-react';

const VALID_PAGES = ['home', 'shop', 'category', 'product', 'checkout', 'order-confirmation', 'admin', 'auth', 'about', 'policies', 'contact'];

interface RouteState {
  page: string;
  data: any;
}

const parseCurrentRoute = (): RouteState => {
  if (typeof window === 'undefined') return { page: 'home', data: null };

  const pathname = window.location.pathname.replace(/^\/+/, '');
  const pathSegments = pathname.split('/').filter(Boolean);
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  const hashSegments = rawHash.split('/').filter(Boolean);
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Direct query parameters for shared product URLs (?product=slug, ?slug=slug, ?id=id)
  const productParam =
    searchParams.get('product') ||
    searchParams.get('p') ||
    searchParams.get('slug') ||
    searchParams.get('id');

  if (productParam) {
    const cleanIdent = decodeURIComponent(productParam).trim();
    return { page: 'product', data: { slug: cleanIdent, id: cleanIdent } };
  }

  // 2. Direct query parameter for category (?category=rings, ?cat=rings)
  const categoryParam = searchParams.get('category') || searchParams.get('cat');
  if (categoryParam) {
    const cleanCat = decodeURIComponent(categoryParam).trim();
    return { page: 'category', data: { category: cleanCat, slug: cleanCat } };
  }

  // 3. Admin / Auth queries
  const isQueryAdmin = searchParams.has('admin') || searchParams.get('page') === 'admin';
  const isQueryAuth = searchParams.has('auth') || searchParams.get('page') === 'auth';
  if (isQueryAdmin) {
    return { page: adminAuthService.isAuthenticated() ? 'admin' : 'auth', data: null };
  }
  if (isQueryAuth) {
    return { page: adminAuthService.isAuthenticated() ? 'admin' : 'auth', data: null };
  }

  // 4. Hash-based routing (#product/slug, #category/rings, #shop, etc.)
  if (hashSegments.length > 0) {
    const firstHash = hashSegments[0].toLowerCase();
    if (firstHash === 'product' && hashSegments[1]) {
      const identifier = decodeURIComponent(hashSegments[1]).trim();
      return { page: 'product', data: { slug: identifier, id: identifier } };
    }
    if (firstHash === 'category' && hashSegments[1]) {
      const catSlug = decodeURIComponent(hashSegments[1]).trim();
      return { page: 'category', data: { category: catSlug, slug: catSlug } };
    }
    if (firstHash === 'admin') {
      return { page: adminAuthService.isAuthenticated() ? 'admin' : 'auth', data: null };
    }
    if (firstHash === 'auth') {
      return { page: adminAuthService.isAuthenticated() ? 'admin' : 'auth', data: null };
    }
    if (VALID_PAGES.includes(firstHash)) {
      return { page: firstHash, data: null };
    }
  }

  // 5. Pathname-based routing (/product/slug, /category/rings, /admin, etc.)
  if (pathSegments.length > 0) {
    const firstPath = pathSegments[0].toLowerCase();
    if (firstPath === 'product' && pathSegments[1]) {
      const identifier = decodeURIComponent(pathSegments[1]).trim();
      return { page: 'product', data: { slug: identifier, id: identifier } };
    }
    if (firstPath === 'category' && pathSegments[1]) {
      const catSlug = decodeURIComponent(pathSegments[1]).trim();
      return { page: 'category', data: { category: catSlug, slug: catSlug } };
    }
    if (firstPath === 'admin') {
      return { page: adminAuthService.isAuthenticated() ? 'admin' : 'auth', data: null };
    }
    if (firstPath === 'auth') {
      return { page: adminAuthService.isAuthenticated() ? 'admin' : 'auth', data: null };
    }
    if (VALID_PAGES.includes(firstPath)) {
      return { page: firstPath, data: null };
    }
  }

  // 6. Generic query parameter (?page=shop)
  const pageParam = searchParams.get('page');
  if (pageParam && VALID_PAGES.includes(pageParam.toLowerCase())) {
    return { page: pageParam.toLowerCase(), data: null };
  }

  // 7. Session storage recovery
  try {
    const saved = sessionStorage.getItem('sofyra_current_page');
    if (saved && VALID_PAGES.includes(saved)) {
      if (saved === 'admin' && !adminAuthService.isAuthenticated()) {
        return { page: 'auth', data: null };
      }
      return { page: saved, data: null };
    }
  } catch {}

  return { page: 'home', data: null };
};

export default function App() {
  const initialRoute = parseCurrentRoute();
  const [currentPage, setCurrentPage] = useState<string>(initialRoute.page);
  const [pageData, setPageData] = useState<any>(initialRoute.data);
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [reviews, setReviews] = useState(() => storageService.getReviews());
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(() => storageService.getHomepageContent());
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => storageService.getSiteSettings());
  const [contactInfo, setContactInfo] = useState<ContactInfo>(() => storageService.getContactInfo());
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  // Sync route on URL pathname / hash / search change and protect admin route
  useEffect(() => {
    const handleLocationChange = () => {
      const parsed = parseCurrentRoute();
      if (parsed.page === 'admin' && !adminAuthService.isAuthenticated()) {
        setCurrentPage('auth');
        setPageData(null);
        return;
      }
      if (parsed.page === 'auth' && adminAuthService.isAuthenticated()) {
        setCurrentPage('admin');
        setPageData(null);
        return;
      }

      setCurrentPage(parsed.page);
      setPageData(parsed.data);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Global keyboard shortcut (Ctrl+Shift+A or Cmd+Shift+A or Alt+A) for admin access in preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.metaKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && (e.key === 'A' || e.key === 'a'))
      ) {
        e.preventDefault();
        if (currentPage === 'admin') {
          handleNavigate('home');
        } else if (adminAuthService.isAuthenticated()) {
          handleNavigate('admin');
        } else {
          handleNavigate('auth');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  // Developer / Preview console access helper
  useEffect(() => {
    (window as any).openAdmin = () => {
      if (adminAuthService.isAuthenticated()) {
        handleNavigate('admin');
      } else {
        handleNavigate('auth');
      }
    };
    (window as any).sofyraAdmin = (window as any).openAdmin;
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('sofyra_current_page', currentPage);
    } catch {}
  }, [currentPage]);

  // Load persistent backend database data on startup and sync auth
  useEffect(() => {
    storageService.fetchCategories();
    storageService.fetchHomepageContent().then(data => {
      if (data) setHomepageContent(data);
    });
    storageService.fetchProducts()
      .then(prods => {
        if (prods) setProducts(prods);
      })
      .catch(err => {
        console.error('[SOFYRA App] Failed to fetch products, keeping cached products:', err);
      });
    storageService.fetchReviews().then(revs => {
      if (revs && revs.length > 0) setReviews(revs);
    });
    storageService.fetchSiteSettings().then(settings => {
      if (settings) setSiteSettings(settings);
    });
    storageService.fetchContactInfo().then(info => {
      if (info) setContactInfo(info);
    });
    const unsubscribe = adminAuthService.subscribe((authed) => {
      if (authed && currentPage === 'auth') {
        handleNavigate('admin');
      } else if (!authed && currentPage === 'admin') {
        handleNavigate('auth');
      }
    });

    adminAuthService.init().then(auth => {
      if (auth.authenticated) {
        const saved = sessionStorage.getItem('sofyra_current_page');
        const searchParams = new URLSearchParams(window.location.search);
        const isQueryAdmin = searchParams.has('admin') || searchParams.get('page') === 'admin';
        if (saved === 'admin' || isQueryAdmin || currentPage === 'auth') {
          handleNavigate('admin');
        }
      } else if (!auth.authenticated && currentPage === 'admin') {
        handleNavigate('auth');
      }
    });

    const onHomepageUpdated = (e: any) => {
      if (e.detail) setHomepageContent(e.detail);
    };
    const onSiteSettingsUpdated = (e: any) => {
      if (e.detail) setSiteSettings(e.detail);
    };
    window.addEventListener('sofyra:homepage-updated', onHomepageUpdated);
    window.addEventListener('sofyra:site-settings-updated', onSiteSettingsUpdated);

    return () => {
      unsubscribe();
      window.removeEventListener('sofyra:homepage-updated', onHomepageUpdated);
      window.removeEventListener('sofyra:site-settings-updated', onSiteSettingsUpdated);
    };
  }, []);

  // Sync products when modified in Admin
  const handleRefreshProducts = async () => {
    try {
      const prods = await storageService.fetchProducts();
      if (prods) setProducts(prods);
    } catch (err) {
      console.error('[SOFYRA App] Error refreshing products, keeping current products:', err);
    }
  };

  const handleRefreshReviews = async () => {
    const revs = await storageService.fetchReviews();
    setReviews(revs);
  };

  const handleRefreshHomepageContent = async () => {
    const content = await storageService.fetchHomepageContent();
    setHomepageContent(content);
  };

  // Secure URL navigation handler
  const handleNavigate = (page: string, data?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Guard: /admin is restricted to authenticated owners. Unauthenticated navigation goes to auth.
    if (page === 'admin' && !adminAuthService.isAuthenticated()) {
      page = 'auth';
    } else if (page === 'auth' && adminAuthService.isAuthenticated()) {
      page = 'admin';
    }

    setCurrentPage(page);
    setPageData(data || null);

    if (typeof window !== 'undefined') {
      if (page === 'home') {
        if (window.history?.replaceState) {
          window.history.replaceState(null, '', '/');
        }
        window.location.hash = '';
      } else if (page === 'admin' || page === 'auth') {
        if (window.history?.pushState) {
          window.history.pushState(null, '', `/${page}`);
        }
        window.location.hash = page;
      } else if (page === 'product') {
        const identifier = typeof data === 'string' ? data : (data?.slug || data?.id || '');
        if (identifier) {
          if (window.history?.pushState) {
            window.history.pushState(null, '', `/?product=${encodeURIComponent(identifier)}`);
          }
          window.location.hash = `product/${encodeURIComponent(identifier)}`;
        } else {
          window.location.hash = 'product';
        }
      } else if (page === 'category') {
        const catSlug = typeof data === 'string' ? data : (data?.category || data?.slug || '');
        if (catSlug) {
          window.location.hash = `category/${encodeURIComponent(catSlug)}`;
        } else {
          window.location.hash = 'category';
        }
      } else {
        window.location.hash = page;
      }

      try {
        sessionStorage.setItem('sofyra_current_page', page);
      } catch {}
    }
  };

  // Handle Order Placed from Checkout
  const handleOrderPlaced = (order: Order) => {
    setLatestOrder(order);
    handleNavigate('order-confirmation', { orderId: order.id });
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex flex-col font-sans selection:bg-stone-200 selection:text-black">
        
        {/* Persistent Luxury Header & Navigation */}
        <Header onNavigate={handleNavigate} currentPage={currentPage} />

        {/* Global Drawers & Modals */}
        <CartDrawer onNavigate={handleNavigate} />
        <SearchModal products={products} onNavigate={handleNavigate} />

        {/* Main Content Router */}
        <main className="flex-1">
          {/* 1. HOMEPAGE */}
          {currentPage === 'home' && (
            <div>
              <Hero heroData={homepageContent.hero} onNavigate={handleNavigate} />
              <CategoryGrid categories={homepageContent.categories} onNavigate={handleNavigate} />
              <BestSellersSection products={products} onNavigate={handleNavigate} />
              <AdvantagesSection advantagesSection={homepageContent.advantagesSection} advantagesData={homepageContent.advantages} />
              <ReviewsSection reviews={reviews} onReviewAdded={handleRefreshReviews} />
              <ContactSection contactPageImage={homepageContent.contactPage?.image} />
            </div>
          )}

          {/* 2. SHOP / CATALOG PAGE */}
          {currentPage === 'shop' && (
            <ShopPage
              products={products}
              initialCategory={pageData?.category || 'all'}
              initialSort={pageData?.sort || 'featured'}
              initialFilter={pageData?.filter}
              onNavigate={handleNavigate}
            />
          )}

          {/* 3. DEDICATED CATEGORY PAGE */}
          {currentPage === 'category' && (
            <CategoryPage
              category={(typeof pageData === 'string' ? pageData : (pageData?.category || pageData?.slug || pageData?.id || 'rings')) as ProductCategory}
              products={products}
              categories={homepageContent.categories}
              onNavigate={handleNavigate}
            />
          )}

          {/* 4. PRODUCT EXPERIENCE PAGE (Shared Link & Details) */}
          {currentPage === 'product' && (() => {
            const requestedIdentifier = (
              typeof pageData === 'string'
                ? pageData
                : (pageData?.slug || pageData?.id || '')
            ).trim().toLowerCase();

            const matchedProduct = requestedIdentifier
              ? products.find(
                  p =>
                    (p.slug || '').toLowerCase() === requestedIdentifier ||
                    (p.id || '').toLowerCase() === requestedIdentifier
                )
              : null;

            // Strict requirement: Never silently show the first product when a shared slug is invalid!
            if (requestedIdentifier && !matchedProduct) {
              return (
                <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[#FAF9F6]">
                  <div className="max-w-lg w-full text-center bg-white border border-stone-200 p-8 sm:p-12 shadow-xs space-y-5">
                    <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-2">
                        SOFYRA Fine Jewellery
                      </span>
                      <h1 className="font-editorial text-3xl uppercase tracking-wider text-black">
                        Piece Not Found
                      </h1>
                    </div>
                    <p className="text-xs text-stone-600 font-light leading-relaxed">
                      The shared jewel{' '}
                      <span className="font-mono bg-stone-100 px-1.5 py-0.5 text-black font-medium">
                        "{requestedIdentifier}"
                      </span>{' '}
                      could not be found or may no longer be available in our atelier collection.
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleNavigate('shop')}
                        className="w-full sm:w-auto px-6 py-3 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-semibold transition-colors cursor-pointer"
                      >
                        Explore Collection
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigate('home')}
                        className="w-full sm:w-auto px-6 py-3 border border-stone-300 text-stone-800 hover:border-black text-xs tracking-[0.2em] uppercase font-semibold transition-colors cursor-pointer"
                      >
                        Return Home
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            const displayProduct = matchedProduct || products[0];

            if (!displayProduct) {
              return (
                <div className="min-h-[50vh] flex items-center justify-center text-center p-8">
                  <p className="text-xs tracking-wider uppercase text-stone-500">
                    No products currently available.
                  </p>
                </div>
              );
            }

            return (
              <ProductDetailPage
                product={displayProduct}
                allProducts={products}
                reviews={reviews}
                siteSettings={siteSettings}
                onReviewAdded={handleRefreshReviews}
                onNavigate={handleNavigate}
              />
            );
          })()}

          {/* 5. CHECKOUT FLOW */}
          {currentPage === 'checkout' && (
            <CheckoutPage
              onOrderPlaced={handleOrderPlaced}
              onNavigate={handleNavigate}
              siteSettings={siteSettings}
            />
          )}

          {/* 6. ORDER CONFIRMATION RECEIPT */}
          {currentPage === 'order-confirmation' && latestOrder && (
            <OrderConfirmationPage
              order={latestOrder}
              onNavigate={handleNavigate}
            />
          )}

          {/* 7. OWNER AUTHENTICATION (/auth) */}
          {currentPage === 'auth' && (
            <AuthPage onNavigate={handleNavigate} />
          )}

          {/* 8. ADMIN PANEL (/admin - strictly authenticated) */}
          {currentPage === 'admin' && adminAuthService.isAuthenticated() && (
            <AdminPage
              products={products}
              onRefreshProducts={handleRefreshProducts}
              homepageContent={homepageContent}
              onRefreshHomepageContent={handleRefreshHomepageContent}
              onNavigate={handleNavigate}
            />
          )}

          {/* 9. ABOUT SOFYRA */}
          {currentPage === 'about' && (
            <AboutPage aboutData={homepageContent.aboutSofyra} onNavigate={handleNavigate} />
          )}

          {/* 10. POLICIES & CARE */}
          {currentPage === 'policies' && (
            <PoliciesPage
              initialTab={pageData?.tab || 'shipping'}
              onNavigate={handleNavigate}
            />
          )}

          {/* 11. CONTACT PAGE VIEW */}
          {currentPage === 'contact' && (
            <div className="py-12 bg-white">
              <ContactSection contactPageImage={homepageContent.contactPage?.image} />
            </div>
          )}
        </main>

        {/* Persistent Dark Luxury Footer */}
        {currentPage !== 'admin' && currentPage !== 'auth' && (
          <Footer onNavigate={handleNavigate} />
        )}

        {/* Floating WhatsApp Button (HOMEPAGE ONLY) */}
        {currentPage === 'home' && (
          <FloatingWhatsAppButton
            settings={siteSettings?.whatsappButton}
            fallbackPhone={contactInfo?.whatsapp || contactInfo?.phone || ''}
          />
        )}

        {/* Authenticated Administrator Quick Access (Visible ONLY when an administrator session is verified active; strictly hidden from public customers) */}
        {adminAuthService.isAuthenticated() && currentPage !== 'admin' && currentPage !== 'auth' && (
          <aside
            aria-label="Admin Session Access"
            className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="bg-[#111111]/95 text-white border border-stone-700 shadow-2xl px-3.5 py-2 flex items-center gap-3 backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-stone-300">
                  Admin Active
                </span>
              </div>
              <div className="h-3 w-px bg-stone-700" />
              <button
                type="button"
                onClick={() => handleNavigate('admin')}
                className="text-[11px] tracking-[0.2em] uppercase font-semibold text-white hover:text-[#C5A880] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Return to Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Admin Dashboard</span>
              </button>
            </div>
          </aside>
        )}

      </div>
    </CartProvider>
  );
}
