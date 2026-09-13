import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface BestSellersSectionProps {
  products: Product[];
  onNavigate: (page: string, data?: any) => void;
}

export const BestSellersSection: React.FC<BestSellersSectionProps> = ({ products, onNavigate }) => {
  // Filter products explicitly marked as Best Seller in the Admin product database
  const bestsellers = products
    .filter((p) => Boolean(p.isBestseller))
    .sort((a, b) => (a.bestsellerOrder ?? 999) - (b.bestsellerOrder ?? 999));

  // If no products are selected as Best Sellers, hide the section completely
  // (per requirement: no fake or demo products)
  if (bestsellers.length === 0) {
    return null;
  }

  return (
    <section id="best-sellers-section" className="py-16 md:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12 pb-4 border-b border-stone-100 gap-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-1">
              Curated Selection
            </span>
            <h2 className="font-editorial text-2xl md:text-3xl lg:text-4xl tracking-[0.06em] font-light uppercase text-black">
              Best Sellers
            </h2>
          </div>
          
          <button
            type="button"
            onClick={() => onNavigate('shop', { sort: 'featured' })}
            className="self-start sm:self-auto text-[11px] tracking-[0.25em] uppercase text-stone-600 hover:text-black font-medium border-b border-stone-300 hover:border-black pb-0.5 transition-colors cursor-pointer"
          >
            View All Pieces
          </button>
        </div>

        {/* Dynamic Best Sellers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {bestsellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onNavigate={onNavigate}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
