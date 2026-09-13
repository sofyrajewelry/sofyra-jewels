import React, { useState } from 'react';
import { Product } from '../types';
import { formatPKR } from '../utils/format';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Eye, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, data?: any) => void;
  darkTheme?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  darkTheme = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();

  const primaryImage = product.images[0];
  const hoverImage = product.images[1] || product.images[0];

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate('product', { slug: product.slug });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Default to first variant option if exists
    const defaultOptions: Record<string, string> = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(v => {
        if (v.options.length > 0) {
          defaultOptions[v.name] = v.options[0].name;
        }
      });
    }
    addToCart(product, 1, defaultOptions);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col h-full select-none"
    >
      {/* Image Container */}
      <div className={`relative aspect-square overflow-hidden border transition-all duration-300 ${
        darkTheme
          ? 'bg-[#181818] border-white/10 hover:border-white/30'
          : 'bg-[#F4F2EE] border-stone-200/80 hover:border-stone-400'
      }`}>
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          {product.isNew && (
            <span className="px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase font-medium bg-black text-white">
              NEW
            </span>
          )}
          {product.discountPercent && product.discountPercent > 0 ? (
            <span className="px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase font-medium bg-[#B8860B] text-white">
              -{product.discountPercent}%
            </span>
          ) : null}
          {!product.inStock && (
            <span className="px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase font-medium bg-stone-500 text-white">
              OUT OF STOCK
            </span>
          )}
        </div>

        {/* Product Images (Smooth Cross-fade / Swap) */}
        <img
          src={primaryImage}
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
            isHovered && product.images.length > 1
              ? 'opacity-0 scale-105'
              : 'opacity-100 scale-100'
          }`}
          loading="lazy"
        />

        {product.images.length > 1 && (
          <img
            src={hoverImage}
            alt={`${product.name} alternate view`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
            loading="lazy"
          />
        )}

        {/* Quick Add Overlay on Desktop */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!product.inStock}
            className="flex-1 py-2.5 px-3 bg-white text-black hover:bg-stone-100 transition-colors text-[11px] tracking-[0.2em] uppercase font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.inStock ? 'Quick Add' : 'Sold Out'}
          </button>
          <button
            type="button"
            onClick={handleCardClick}
            className="p-2.5 bg-black/80 hover:bg-black text-white transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="pt-4 pb-2 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`text-[10px] tracking-[0.2em] uppercase ${
            darkTheme ? 'text-stone-400' : 'text-stone-500'
          }`}>
            {product.category}
          </span>
          {product.rating && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600">
              <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
              <span className={darkTheme ? 'text-stone-300' : 'text-stone-700'}>
                {product.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <h3 className={`text-base font-normal tracking-[0.04em] mb-1 group-hover:underline underline-offset-4 line-clamp-1 ${
          darkTheme ? 'text-white' : 'text-[#1A1A1A]'
        }`}>
          {product.name}
        </h3>

        {product.subtitle && (
          <p className={`text-[12px] line-clamp-1 mb-2 font-light ${
            darkTheme ? 'text-stone-400' : 'text-stone-500'
          }`}>
            {product.subtitle}
          </p>
        )}

        <div className="mt-auto pt-1 flex items-center gap-2.5">
          <span className={`text-sm font-medium tracking-[0.05em] ${
            darkTheme ? 'text-stone-100' : 'text-black'
          }`}>
            {formatPKR(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-stone-400 line-through tracking-[0.05em]">
              {formatPKR(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Mobile Quick Add Button */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!product.inStock}
          className={`mt-3 py-2 px-3 border text-[11px] tracking-[0.18em] uppercase font-medium md:hidden flex items-center justify-center gap-2 transition-colors ${
            darkTheme
              ? 'border-white/20 text-white hover:bg-white/10'
              : 'border-black/20 text-black hover:bg-black hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3 h-3" />
          {product.inStock ? 'Add to Bag' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};
