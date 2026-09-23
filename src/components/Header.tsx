import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { storageService } from '../services/storageService';
import { DEFAULT_CATEGORIES } from '../data/initialProducts';
import { ShoppingBag, Search, Menu, X, ChevronDown, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string, data?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { totalItemsCount, setIsCartDrawerOpen, setIsSearchOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);

  const [categories, setCategories] = useState(() => {
    try {
      const stored = storageService.getCategories();
      if (stored && stored.length > 0) {
        return stored
          .filter(c => c.enabled !== false && !c.hidden)
          .sort((a, b) => (a.displayOrder || a.order || 99) - (b.displayOrder || b.order || 99));
      }
    } catch (e) {}
    return DEFAULT_CATEGORIES.filter(c => c.enabled !== false && !c.hidden);
  });

  useEffect(() => {
    const refreshCategories = () => {
      try {
        const stored = storageService.getCategories();
        if (stored) {
          const active = stored.filter(c => c.enabled !== false && !c.hidden);
          if (stored.length === 0) {
            setCategories(DEFAULT_CATEGORIES.filter(c => c.enabled !== false && !c.hidden));
          } else {
            setCategories(
              active.sort((a, b) => (a.displayOrder || a.order || 99) - (b.displayOrder || b.order || 99))
            );
          }
        }
      } catch (e) {}
    };
    window.addEventListener('storage', refreshCategories);
    window.addEventListener('sofyra:categories-updated', refreshCategories);
    return () => {
      window.removeEventListener('storage', refreshCategories);
      window.removeEventListener('sofyra:categories-updated', refreshCategories);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (page: string, data?: any) => {
    onNavigate(page, data);
    setIsMobileMenuOpen(false);
    setIsCategoryHovered(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Editorial Announcement Bar */}
      <div className="bg-[#111111] text-stone-300 text-[10px] md:text-[11px] tracking-[0.25em] uppercase py-2 px-4 text-center border-b border-white/5 font-light">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-[#C5A880] inline" />
          <span>Complimentary Delivery Across Pakistan On Orders Over PKR 3,500 &bull; Cash On Delivery Available</span>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className={`w-full transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-stone-200/80 py-3.5'
          : 'bg-[#FAFAF8] border-stone-200 py-4 md:py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Left: Mobile Menu Button & Desktop Nav */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 -ml-1 text-black md:hidden hover:opacity-70 transition-opacity cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5 stroke-[1.5]" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-7">
              <button
                type="button"
                onClick={() => handleLinkClick('home')}
                className={`text-[12px] tracking-[0.2em] uppercase transition-colors cursor-pointer ${
                  currentPage === 'home'
                    ? 'text-black font-semibold border-b border-black pb-0.5'
                    : 'text-stone-700 hover:text-black'
                }`}
              >
                Home
              </button>

              <button
                type="button"
                onClick={() => handleLinkClick('shop')}
                className={`text-[12px] tracking-[0.2em] uppercase transition-colors cursor-pointer ${
                  currentPage === 'shop'
                    ? 'text-black font-semibold border-b border-black pb-0.5'
                    : 'text-stone-700 hover:text-black'
                }`}
              >
                Shop
              </button>

              {/* Categories Popover / Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsCategoryHovered(true)}
                onMouseLeave={() => setIsCategoryHovered(false)}
              >
                <button
                  type="button"
                  onClick={() => handleLinkClick('shop')}
                  className={`text-[12px] tracking-[0.2em] uppercase flex items-center gap-1 transition-colors cursor-pointer ${
                    currentPage === 'category'
                      ? 'text-black font-semibold border-b border-black pb-0.5'
                      : 'text-stone-700 hover:text-black'
                  }`}
                >
                  <span>Categories</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {isCategoryHovered && (
                  <div className="absolute top-full left-0 pt-3 w-56 z-50 animate-in fade-in-50 duration-150">
                    <div className="bg-white border border-stone-200 py-3 shadow-md max-h-[380px] overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleLinkClick('category', { category: cat.slug || cat.id })}
                          className="w-full text-left px-4 py-2 text-[11px] tracking-[0.2em] uppercase text-stone-700 hover:text-black hover:bg-stone-50 transition-colors block"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleLinkClick('shop', { filter: 'new' })}
                className="text-[12px] tracking-[0.2em] uppercase text-stone-700 hover:text-black transition-colors cursor-pointer"
              >
                New Arrivals
              </button>

              <button
                type="button"
                onClick={() => handleLinkClick('about')}
                className={`text-[12px] tracking-[0.2em] uppercase transition-colors cursor-pointer ${
                  currentPage === 'about'
                    ? 'text-black font-semibold border-b border-black pb-0.5'
                    : 'text-stone-700 hover:text-black'
                }`}
              >
                About
              </button>

              <button
                type="button"
                onClick={() => handleLinkClick('contact')}
                className={`text-[12px] tracking-[0.2em] uppercase transition-colors cursor-pointer ${
                  currentPage === 'contact'
                    ? 'text-black font-semibold border-b border-black pb-0.5'
                    : 'text-stone-700 hover:text-black'
                }`}
              >
                Contact
              </button>
            </nav>
          </div>

          {/* Center: Brand Logo */}
          <div className="flex-1 text-center md:flex-initial">
            <button
              type="button"
              onClick={() => handleLinkClick('home')}
              className="inline-block cursor-pointer group"
            >
              <span className="font-editorial text-2xl md:text-3xl tracking-[0.3em] font-normal text-black uppercase transition-all duration-300">
                SOFYRA
              </span>
            </button>
          </div>

          {/* Right: Actions (Search, Admin, Bag) */}
          <div className="flex items-center space-x-4 md:space-x-5">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 text-stone-700 hover:text-black transition-colors cursor-pointer"
              aria-label="Search jewellery"
              title="Search"
            >
              <Search className="w-4 h-4 stroke-[1.75]" />
            </button>

            {/* Shopping Bag Trigger */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="p-1.5 text-black hover:opacity-75 transition-opacity relative cursor-pointer flex items-center gap-1"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Slide-Out Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-editorial text-2xl tracking-[0.25em] text-black">SOFYRA</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-stone-600 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleLinkClick('home')}
                  className="block text-left w-full text-base tracking-[0.2em] uppercase font-light text-black"
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => handleLinkClick('shop')}
                  className="block text-left w-full text-base tracking-[0.2em] uppercase font-light text-black"
                >
                  All Jewellery
                </button>
              </div>

              <div className="pt-4 border-t border-stone-200">
                <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-medium block mb-3">
                  Categories
                </span>
                <div className="space-y-3 pl-2 max-h-60 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleLinkClick('category', { category: cat.slug || cat.id })}
                      className="block text-left w-full text-sm tracking-[0.18em] uppercase text-stone-700 hover:text-black"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-3">
                <button
                  type="button"
                  onClick={() => handleLinkClick('about')}
                  className="block text-left w-full text-sm tracking-[0.2em] uppercase text-stone-700"
                >
                  About Sofyra
                </button>
                <button
                  type="button"
                  onClick={() => handleLinkClick('contact')}
                  className="block text-left w-full text-sm tracking-[0.2em] uppercase text-stone-700"
                >
                  Contact & Assistance
                </button>
                <button
                  type="button"
                  onClick={() => handleLinkClick('policies', { tab: 'shipping' })}
                  className="block text-left w-full text-sm tracking-[0.2em] uppercase text-stone-700"
                >
                  Shipping & Returns
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500">
              <p className="tracking-wider">Lahore &bull; Karachi &bull; Nationwide Delivery</p>
              <p className="mt-1 text-stone-400">Cash on Delivery &bull; Direct Bank Transfer (HBL)</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
