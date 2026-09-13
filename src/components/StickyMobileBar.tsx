import React from 'react';
import { Product } from '../types';
import { formatPKR } from '../utils/format';
import { ShoppingBag } from 'lucide-react';

interface StickyMobileBarProps {
  product: Product;
  selectedOptions: Record<string, string>;
  onAddToCart: () => void;
  isVisible: boolean;
}

export const StickyMobileBar: React.FC<StickyMobileBarProps> = ({
  product,
  selectedOptions,
  onAddToCart,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 sm:p-4 md:hidden shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3">
        {/* Thumbnail & Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-10 h-12 object-cover border border-stone-200 bg-stone-100 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-medium text-black uppercase tracking-wider truncate">
              {product.name}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-black">
                {formatPKR(product.price)}
              </span>
              {Object.keys(selectedOptions).length > 0 && (
                <span className="text-[10px] text-stone-500 truncate">
                  ({Object.values(selectedOptions).join(', ')})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!product.inStock}
          className="px-5 py-3 bg-black text-white hover:bg-stone-800 transition-colors text-[11px] tracking-[0.2em] uppercase font-medium flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{product.inStock ? 'Add to Bag' : 'Sold Out'}</span>
        </button>
      </div>
    </div>
  );
};
