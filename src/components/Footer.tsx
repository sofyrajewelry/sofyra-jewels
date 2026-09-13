import React from 'react';
import { ArrowUp } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string, data?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0E0E0E] text-stone-300 border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-12 mb-12 border-b border-white/10 gap-6">
          <div>
            <h2 className="font-editorial text-4xl sm:text-5xl tracking-[0.25em] text-white uppercase font-normal">
              SOFYRA
            </h2>
            <p className="text-[10px] sm:text-[11px] tracking-[0.35em] text-stone-400 uppercase mt-1">
              Fine Jewellery
            </p>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[11px] tracking-[0.2em] text-stone-400 uppercase hidden md:inline">
              Pakistan &bull; Free Shipping over PKR 3,500
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              className="p-3 border border-white/20 hover:border-white text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Column Layout matching Screenshot 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 sm:gap-8 pb-14 text-xs font-light tracking-wider">
          
          {/* Column 1: Contacts */}
          <div>
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-white font-medium mb-4">
              CONTACT
            </h4>
            <div className="space-y-2.5 text-stone-400">
              <p className="text-white">Email:</p>
              <a href="mailto:contact@sofyra.pk" className="hover:text-white transition-colors block">
                contact@sofyra.pk
              </a>
              <p className="text-white pt-2">Phone / WhatsApp:</p>
              <a href="tel:+923001234567" className="hover:text-white transition-colors block">
                +92 (300) 123-4567
              </a>
              <p className="text-white pt-2">Instagram:</p>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors block">
                @sofyra_jewellery
              </a>
              <p className="pt-2 text-stone-500 text-[11px]">
                Mon–Sat: 10:00 AM – 8:00 PM PKT
              </p>
            </div>
          </div>

          {/* Column 2: Menu */}
          <div>
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-white font-medium mb-4">
              MENU
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Shop
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop', { filter: 'new' })}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  New Arrivals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-white font-medium mb-4">
              CATEGORIES
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('category', { category: 'rings' })}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Rings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('category', { category: 'bracelets' })}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Bracelets
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('category', { category: 'necklaces' })}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Necklaces
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('category', { category: 'earrings' })}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Earrings
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Policies */}
          <div>
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-white font-medium mb-4">
              POLICIES
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('policies', { tab: 'shipping' })}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Shipping Information
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('policies', { tab: 'returns' })}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Returns & Exchanges
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('policies', { tab: 'privacy' })}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('policies', { tab: 'terms' })}
                  className="hover:text-white transition-colors uppercase cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Copyright & Payment Icons */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500 font-light">
          <p>
            &copy; {new Date().getFullYear()} SOFYRA Fine Jewellery. Handcrafted with pride in Pakistan. All rights reserved.
          </p>

          <div className="flex items-center gap-3 text-[10px] tracking-widest uppercase">
            <span>Cash on Delivery</span>
            <span>&bull;</span>
            <span>Direct Bank Transfer (HBL)</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
