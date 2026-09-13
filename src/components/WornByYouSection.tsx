import React, { useState } from 'react';
import { WornByYouItem, Product } from '../types';
import { Instagram, ArrowUpRight, X } from 'lucide-react';

interface WornByYouSectionProps {
  items: WornByYouItem[];
  allProducts?: Product[];
  onNavigate?: (page: string, data?: any) => void;
  title?: string;
  subtitle?: string;
}

export const WornByYouSection: React.FC<WornByYouSectionProps> = ({
  items,
  allProducts = [],
  onNavigate,
  title = 'Worn By You',
  subtitle = '@sofyra.pk'
}) => {
  const [selectedItem, setSelectedItem] = useState<WornByYouItem | null>(null);

  if (!items || items.length === 0) return null;

  const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleItemClick = (item: WornByYouItem) => {
    setSelectedItem(item);
  };

  const handleProductNavigate = (productId?: string) => {
    if (!productId || !onNavigate) return;
    const targetProd = allProducts.find((p) => p.id === productId);
    if (targetProd) {
      setSelectedItem(null);
      onNavigate('product', targetProd);
    }
  };

  return (
    <section id="worn-by-you-section" className="py-16 md:py-24 bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-[11px] tracking-[0.35em] uppercase text-stone-400 font-light block mb-2">
            Community & Styling
          </span>
          <h2 className="font-editorial text-3xl md:text-4xl lg:text-5xl tracking-[0.06em] font-light text-black uppercase mb-2">
            {title}
          </h2>
          <div className="flex items-center justify-center gap-2 text-xs text-stone-500 font-light">
            <Instagram className="w-3.5 h-3.5 text-stone-700" />
            <span className="tracking-wider">{subtitle}</span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-400">Tag #SofyraMuse to be featured</span>
          </div>
        </div>

        {/* Minimal High-End Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="group relative aspect-square overflow-hidden bg-stone-100 border border-stone-200 cursor-pointer"
            >
              <img
                src={item.mediaUrl}
                alt={item.caption || 'SOFYRA worn by you'}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                loading="lazy"
              />

              {/* Minimal Luxury Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
                <div className="flex justify-end">
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  {item.caption && (
                    <p className="text-xs font-light text-stone-100 line-clamp-2 mb-1">
                      {item.caption}
                    </p>
                  )}
                  {item.productName && (
                    <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-stone-300 block">
                      {item.productName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-white border border-stone-200 max-w-2xl w-full overflow-hidden shadow-2xl relative">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-black flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="aspect-square sm:aspect-auto sm:h-full bg-stone-100">
                  <img
                    src={selectedItem.mediaUrl}
                    alt={selectedItem.caption || 'Customer Styling'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-light block mb-2">
                      Sofyra Muse Look
                    </span>
                    <h4 className="font-editorial text-xl uppercase tracking-wider text-black mb-3">
                      {selectedItem.productName || 'Featured Jewellery'}
                    </h4>
                    {selectedItem.caption && (
                      <p className="text-xs text-stone-600 font-light leading-relaxed mb-6">
                        &ldquo;{selectedItem.caption}&rdquo;
                      </p>
                    )}
                  </div>

                  {selectedItem.productId && (
                    <div className="pt-4 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleProductNavigate(selectedItem.productId)}
                        className="w-full py-3 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>View Featured Piece</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
