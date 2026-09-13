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

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      const validPages = ['home', 'shop', 'category', 'product', 'checkout', 'order-confirmation', 'admin', 'about', 'policies', 'contact'];
      if (hash && validPages.includes(hash)) {
        return hash;
      }
      try {
        const saved = sessionStorage.getItem('sofyra_current_page');
        if (saved && validPages.includes(saved)) {
          return saved;
        }
      } catch {}
    }
    return 'home';
  });
  const [pageData, setPageData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [reviews, setReviews] = useState(() => storageService.getReviews());
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(() => storageService.getHomepageContent());
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  // Sync route on hash change and persist active page
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      const validPages = ['home', 'shop', 'category', 'product', 'checkout', 'order-confirmation', 'admin', 'about', 'policies', 'contact'];
      if (hash && validPages.includes(hash) && hash !== currentPage) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPage]);

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
    storageService.fetchProducts().then(prods => {
      if (prods && prods.length > 0) setProducts(prods);
    });
    storageService.fetchReviews().then(revs => {
      if (revs && revs.length > 0) setReviews(revs);
    });
    adminAuthService.init();
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

  // Simple, smooth URL hash and navigation state
  const handleNavigate = (page: string, data?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(page);
    setPageData(data || null);
    if (typeof window !== 'undefined') {
      window.location.hash = page;
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

          {/* 7. ADMIN PANEL */}
          {currentPage === 'admin' && (
            <AdminPage
              products={products}
              onRefreshProducts={handleRefreshProducts}
              homepageContent={homepageContent}
              onRefreshHomepageContent={handleRefreshHomepageContent}
              onNavigate={handleNavigate}
            />
          )}

          {/* 8. ABOUT SOFYRA */}
          {currentPage === 'about' && (
            <AboutPage onNavigate={handleNavigate} />
          )}

          {/* 9. POLICIES & CARE */}
          {currentPage === 'policies' && (
            <PoliciesPage
              initialTab={pageData?.tab || 'shipping'}
              onNavigate={handleNavigate}
            />
          )}

          {/* 10. CONTACT PAGE VIEW */}
          {currentPage === 'contact' && (
            <div className="py-12 bg-white">
              <ContactSection contactPageImage={homepageContent.contactPage?.image} />
            </div>
          )}
        </main>

        {/* Persistent Dark Luxury Footer */}
        {currentPage !== 'admin' && (
          <Footer onNavigate={handleNavigate} />
        )}

      </div>
    </CartProvider>
  );
}
