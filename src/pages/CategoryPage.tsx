import React, { useMemo } from 'react';
import { Product, ProductCategory, HomepageContent, CategoryItem } from '../types';
import { ProductCard } from '../components/ProductCard';
import { storageService } from '../services/storageService';

interface CategoryPageProps {
  category: ProductCategory;
  products: Product[];
  categories?: HomepageContent['categories'];
  onNavigate: (page: string, data?: any) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  products,
  categories: homepageCategories,
  onNavigate
}) => {
  // 1. Fetch dynamic categories from storageService
  const allCategories: CategoryItem[] = useMemo(() => {
    return storageService.getCategories();
  }, []);

  // 2. Find matching category metadata
  const activeCategory = useMemo(() => {
    const rawCatStr = typeof category === 'string'
      ? category
      : ((category as any)?.category || (category as any)?.slug || (category as any)?.name || 'rings');
    const catSearchStr = String(rawCatStr).trim().toLowerCase();

    const slugMatch = allCategories.find(
      c => (c.slug || '').trim().toLowerCase() === catSearchStr ||
           (c.name || '').trim().toLowerCase() === catSearchStr ||
           (c.id || '').trim().toLowerCase() === catSearchStr
    );
    if (slugMatch) return slugMatch;

    // Fallback if not found in list
    const name = catSearchStr.replace(/-/g, ' ');
    return {
      id: `cat-${catSearchStr}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      slug: catSearchStr,
      eyebrowText: 'SOFYRA FINE COLLECTION',
      heroTitle: name.toUpperCase(),
      heroSubtitle: '',
      description: '',
      heroImage: '',
      image: '',
      displayOrder: 99,
      enabled: true
    } as CategoryItem;
  }, [allCategories, category]);

  const eyebrowText = activeCategory.eyebrowText || 'SOFYRA FINE COLLECTION';
  const heroTitle = activeCategory.heroTitle || activeCategory.name.toUpperCase();
  const heroSubtitle = activeCategory.heroSubtitle || activeCategory.tagline || '';
  const heroImage = (activeCategory.heroImage || activeCategory.image || '').trim();

  // 3. Filter products matching this category (single-category model, no subcategories)
  const categoryProducts = useMemo(() => {
    const rawCatStr = typeof category === 'string'
      ? category
      : ((category as any)?.category || (category as any)?.slug || (category as any)?.name || 'rings');
    const targetSlug = (activeCategory.slug || '').trim().toLowerCase();
    const targetName = (activeCategory.name || '').trim().toLowerCase();
    const rawTarget = String(rawCatStr).trim().toLowerCase();

    return products.filter(p => {
      const prodCat = (p.category || '').trim().toLowerCase();
      const prodSub = (p.subcategory || '').trim().toLowerCase();

      // Ensure exact category matching (e.g. rings) and prevent returning all products
      if (!prodCat && !prodSub) return false;

      return (
        prodCat === targetSlug ||
        prodCat === targetName ||
        prodCat === rawTarget ||
        prodSub === targetSlug ||
        prodSub === targetName ||
        prodSub === rawTarget
      );
    });
  }, [products, activeCategory, category]);

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-20">
      
      {/* Category Editorial Hero Banner */}
      {heroImage ? (
        // When a real hero image is configured in Firestore
        <div className="relative h-[260px] sm:h-[340px] md:h-[400px] overflow-hidden bg-black text-white flex items-center justify-center">
          <img
            src={heroImage}
            alt={heroTitle}
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.55] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

          <div className="relative z-10 text-center px-4 max-w-3xl">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-stone-300 font-light block mb-2">
              {eyebrowText}
            </span>
            <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl uppercase tracking-[0.1em] text-white font-light">
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p className="mt-3 text-xs sm:text-sm text-stone-300 font-light tracking-[0.2em] uppercase max-w-xl mx-auto">
                {heroSubtitle}
              </p>
            )}
            {activeCategory.description && (
              <p className="mt-2 text-xs text-stone-400 font-light max-w-lg mx-auto line-clamp-2">
                {activeCategory.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        // Clean empty-state luxury typographic header when no image is uploaded
        // DOES NOT invent or restore any unrelated image or watch image
        <div className="bg-[#181716] text-white py-16 md:py-24 border-b border-stone-800 text-center px-4">
          <div className="max-w-3xl mx-auto">
            <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-stone-400 font-light block mb-3">
              {eyebrowText}
            </span>
            <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl uppercase tracking-[0.12em] text-white font-light">
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p className="mt-3 text-xs sm:text-sm text-stone-300 font-light tracking-[0.2em] uppercase max-w-xl mx-auto">
                {heroSubtitle}
              </p>
            )}
            {activeCategory.description && (
              <p className="mt-3 text-xs sm:text-sm text-stone-400 font-light max-w-lg mx-auto leading-relaxed">
                {activeCategory.description}
              </p>
            )}
          </div>
        </div>
      )}

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
          <span className="text-black font-medium">{activeCategory.name}</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between pb-4 mb-8 border-b border-stone-200 text-xs">
          <span className="tracking-[0.2em] uppercase text-stone-500">
            {categoryProducts.length} {categoryProducts.length === 1 ? 'Creation' : 'Creations'}
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
          <div className="py-20 text-center space-y-3 bg-white border border-stone-200 p-8">
            <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
              New Designs Coming Soon
            </h3>
            <p className="text-xs text-stone-500 font-light max-w-md mx-auto">
              Our artisans are finalizing new additions to the {activeCategory.name} collection. Check back soon or browse our other handcrafted pieces.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="mt-4 px-6 py-2.5 bg-black text-white text-xs tracking-wider uppercase font-medium hover:bg-stone-800 transition-colors"
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
