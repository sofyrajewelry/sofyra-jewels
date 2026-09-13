import React from 'react';
import { Product, ProductCategory, HomepageContent } from '../types';
import { CATEGORIES_DATA } from '../data/initialProducts';
import { ProductCard } from '../components/ProductCard';

interface CategoryPageProps {
  category: ProductCategory;
  products: Product[];
  categories?: HomepageContent['categories'];
  onNavigate: (page: string, data?: any) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  products,
  categories,
  onNavigate
}) => {
  const dynamicCatImage = categories?.[category]?.image;

  const categoryMeta = CATEGORIES_DATA.find(c => c.slug === category) || {
    id: category,
    name: category.toUpperCase(),
    slug: category,
    tagline: 'Signature Handcrafted Fine Jewellery',
    image: dynamicCatImage || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=85&w=1600&auto=format&fit=crop'
  };

  const bannerImage = dynamicCatImage || categoryMeta.image;

  const categoryProducts = products.filter(
    p => p.category?.toLowerCase() === category?.toLowerCase() || p.subcategory?.toLowerCase() === category?.toLowerCase()
  );

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-20">
      
      {/* Category Editorial Hero Banner */}
      <div className="relative h-[260px] sm:h-[340px] md:h-[400px] overflow-hidden bg-black text-white flex items-center justify-center">
        <img
          src={bannerImage}
          alt={categoryMeta.name}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.55] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

        <div className="relative z-10 text-center px-4 max-w-3xl">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-stone-300 font-light block mb-2">
            SOFYRA FINE COLLECTION
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl uppercase tracking-[0.1em] text-white font-light">
            {categoryMeta.name}
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-stone-300 font-light tracking-[0.2em] uppercase max-w-md mx-auto">
            {categoryMeta.tagline}
          </p>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-stone-500 font-light">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hover:text-black transition-colors"
          >
            Home
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="hover:text-black transition-colors"
          >
            Collections
          </button>
          <span>/</span>
          <span className="text-black font-medium">{categoryMeta.name}</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between pb-4 mb-8 border-b border-stone-200 text-xs">
          <span className="tracking-[0.2em] uppercase text-stone-500">
            {categoryProducts.length} Creations
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="text-stone-600 hover:text-black uppercase tracking-wider text-[11px] font-medium"
            >
              Browse All Categories &rarr;
            </button>
          </div>
        </div>

        {categoryProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <h3 className="font-editorial text-2xl uppercase tracking-wider">
              New Designs Coming Soon
            </h3>
            <p className="text-xs text-stone-500 font-light">
              Our artisans are finalizing new additions to the {categoryMeta.name} collection.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="mt-4 px-6 py-2.5 bg-black text-white text-xs tracking-wider uppercase font-medium"
            >
              Explore Other Pieces
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categoryProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
