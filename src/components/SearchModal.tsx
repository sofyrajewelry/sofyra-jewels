import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { formatPKR } from '../utils/format';

interface SearchModalProps {
  products: Product[];
  onNavigate: (page: string, data?: any) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ products, onNavigate }) => {
  const { isSearchOpen, setIsSearchOpen } = useCart();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q)) ||
        (p.stone && p.stone.toLowerCase().includes(q))
    );
  }, [searchTerm, products]);

  if (!isSearchOpen) return null;

  const handleSelectProduct = (slug: string) => {
    setIsSearchOpen(false);
    setSearchTerm('');
    onNavigate('product', { slug });
  };

  const handleCategoryClick = (cat: string) => {
    setIsSearchOpen(false);
    setSearchTerm('');
    onNavigate('category', { category: cat });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsSearchOpen(false)}
      />

      {/* Search Container */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl border border-stone-200 z-10 animate-in fade-in-50 zoom-in-95 duration-200 overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search rings, tennis bracelets, earrings, gold..."
            className="flex-1 bg-transparent text-sm sm:text-base text-black tracking-wide placeholder:text-stone-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-stone-400 hover:text-black p-1 text-xs uppercase"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1 text-stone-500 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {!searchTerm.trim() ? (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-medium block mb-3">
                  Popular Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {['rings', 'bracelets', 'necklaces', 'earrings'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="px-3 py-1.5 border border-stone-200 text-xs tracking-wider uppercase hover:border-black transition-colors cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-medium block mb-3">
                  Trending Searches
                </span>
                <div className="space-y-2 text-xs text-stone-600">
                  <div
                    onClick={() => setSearchTerm('tennis bracelet')}
                    className="flex items-center gap-2 cursor-pointer hover:text-black"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span>Linea 2mm Tennis Bracelet</span>
                  </div>
                  <div
                    onClick={() => setSearchTerm('drop earrings')}
                    className="flex items-center gap-2 cursor-pointer hover:text-black"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span>Etoile Sculptural Drop Earrings</span>
                  </div>
                  <div
                    onClick={() => setSearchTerm('baguette')}
                    className="flex items-center gap-2 cursor-pointer hover:text-black"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span>Emera Baguette Necklace</span>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <p className="text-sm">No results found for &ldquo;{searchTerm}&rdquo;</p>
              <p className="text-xs text-stone-400">Try searching for &lsquo;rings&rsquo;, &lsquo;silver&rsquo;, or &lsquo;earrings&rsquo;.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-medium block mb-3">
                {filteredProducts.length} Results
              </span>
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p.slug)}
                  className="py-3.5 flex items-center justify-between gap-4 group cursor-pointer hover:bg-stone-50/80 -mx-2 px-2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-12 h-14 object-cover bg-stone-100 border border-stone-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium uppercase tracking-wide text-black group-hover:underline">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-light">
                        {p.category} &bull; {p.material}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-black">
                      {formatPKR(p.price)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
