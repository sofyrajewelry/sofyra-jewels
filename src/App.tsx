import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { storageService } from './services/storageService';
import { adminAuthService } from './services/adminAuthService';
import { Product, Order, ProductCategory, HomepageContent } from './types';

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
import { ShieldCheck } from 'lucide-react';

const VALID_PAGES = ['home', 'shop', 'category', 'product', 'checkout', 'order-confirmation', 'admin', 'auth', 'about', 'policies', 'contact'];

const getInitialRoute = (): string => {
  if (typeof window === 'undefined') return 'home';

  // Support pathname (/admin, /auth), hash (#admin, #auth), and query parameters (?admin, ?auth)
  const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0].toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const isQueryAdmin = searchParams.has('admin') || searchParams.get('page') === 'admin';
  const isQueryAuth = searchParams.has('auth') || searchParams.get('page') === 'auth';

  const target = (isQueryAdmin ? 'admin' : '') || (isQueryAuth ? 'auth' : '') || path || hash;

  if (target === 'admin') {
    if (adminAuthService.isAuthenticated()) {
      return 'admin';
    }
    return 'auth';
  }

  if (target === 'auth') {
    if (adminAuthService.isAuthenticated()) {
      return 'admin';
    }
    return 'auth';
  }

  if (target && VALID_PAGES.includes(target)) {
    return target;
  }

  try {
    const saved = sessionStorage.getItem('sofyra_current_page');
    if (saved && VALID_PAGES.includes(saved)) {
      if (saved === 'admin' && !adminAuthService.isAuthenticated()) {
        return 'auth';
      }
      return saved;
    }
  } catch {}

  return 'home';
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => getInitialRoute());
  const [pageData, setPageData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [reviews, setReviews] = useState(() => storageService.getReviews());
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(() => storageService.getHomepageContent());
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  // Sync route on URL pathname / hash / search change and protect admin route
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0].toLowerCase();
      const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const isQueryAdmin = searchParams.has('admin') || searchParams.get('page') === 'admin';
      const isQueryAuth = searchParams.has('auth') || searchParams.get('page') === 'auth';
      const target = (isQueryAdmin ? 'admin' : '') || (isQueryAuth ? 'auth' : '') || path || hash;

      if (target === 'admin') {
        if (!adminAuthService.isAuthenticated()) {
          if (currentPage !== 'auth') setCurrentPage('auth');
          return;
        }
        if (currentPage !== 'admin') setCurrentPage('admin');
        return;
      }

      if (target === 'auth') {
        if (adminAuthService.isAuthenticated()) {
          if (currentPage !== 'admin') setCurrentPage('admin');
          return;
        }
        if (currentPage !== 'auth') setCurrentPage('auth');
        return;
      }

      if (target && VALID_PAGES.includes(target) && target !== currentPage) {
        setCurrentPage(target);
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [currentPage]);

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
        console.error('[SOFYRA App] Failed to fetch products from Firestore, keeping cached products:', err);
      });
    storageService.fetchReviews().then(revs => {
      if (revs && revs.length > 0) setReviews(revs);
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
    window.addEventListener('sofyra:homepage-updated', onHomepageUpdated);

    return () => {
      unsubscribe();
      window.removeEventListener('sofyra:homepage-updated', onHomepageUpdated);
    };
  }, []);

  // Sync products when modified in Admin
  const handleRefreshProducts = async () => {
    const prods = await storageService.fetchProducts();
    setProducts(prods);
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

  // Find active product for product detail page
  const activeProduct = pageData?.slug
    ? products.find(p => p.slug === pageData.slug) || products[0]
    : products[0];

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
              category={(pageData?.category as ProductCategory) || 'rings'}
              products={products}
              categories={homepageContent.categories}
              onNavigate={handleNavigate}
            />
          )}

          {/* 4. PRODUCT EXPERIENCE PAGE (Rera Jewels Reference) */}
          {currentPage === 'product' && activeProduct && (
            <ProductDetailPage
              product={activeProduct}
              allProducts={products}
              onNavigate={handleNavigate}
            />
          )}

          {/* 5. CHECKOUT FLOW */}
          {currentPage === 'checkout' && (
            <CheckoutPage
              onOrderPlaced={handleOrderPlaced}
              onNavigate={handleNavigate}
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
