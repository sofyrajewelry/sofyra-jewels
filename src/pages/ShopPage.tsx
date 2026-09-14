import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { storageService } from '../services/storageService';
import { Filter, SlidersHorizontal, ArrowUpDown, Sparkles } from 'lucide-react';

interface ShopPageProps {
  products: Product[];
  initialCategory?: ProductCategory;
  initialSort?: string;
  initialFilter?: string;
  onNavigate: (page: string, data?: any) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  initialCategory = 'all',
  initialSort = 'featured',
  initialFilter,
  onNavigate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(initialCategory);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlySale, setOnlySale] = useState<boolean>(initialFilter === 'sale');
  const [onlyNew, setOnlyNew] = useState<boolean>(initialFilter === 'new');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if props change
  React.useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  React.useEffect(() => {
    if (initialFilter === 'new') setOnlyNew(true);
    if (initialFilter === 'sale') setOnlySale(true);
  }, [initialFilter]);

  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter(p => p.category?.toLowerCase() === catLower || p.subcategory?.toLowerCase() === catLower);
    }

    // Secondary filters
    if (onlyInStock) {
      list = list.filter(p => p.inStock);
    }
    if (onlySale) {
      list = list.filter(p => (p.discountPercent && p.discountPercent > 0) || p.isSale);
    }
    if (onlyNew) {
      list = list.filter(p => p.isNew);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'featured':
      default:
        list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return list;
  }, [products, selectedCategory, sortBy, onlyInStock, onlySale, onlyNew]);

  const categoriesList = useMemo(() => {
    try {
      const stored = storageService.getCategories();
      const enabled = (stored || [])
        .filter(c => c.enabled !== false && !c.hidden)
        .sort((a, b) => (a.displayOrder || a.order || 99) - (b.displayOrder || b.order || 99));
      if (enabled.length > 0) {
        return [
          { id: 'all' as ProductCategory, label: 'All Pieces' },
          ...enabled.map(c => ({ id: c.slug as ProductCategory, label: c.name }))
        ];
      }
    } catch {}

    return [
      { id: 'all' as ProductCategory, label: 'All Pieces' },
      { id: 'rings' as ProductCategory, label: 'Rings' },
      { id: 'bracelets' as ProductCategory, label: 'Bracelets' },
      { id: 'necklaces' as ProductCategory, label: 'Necklaces' },
      { id: 'earrings' as ProductCategory, label: 'Earrings' }
    ];
  }, []);

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title Banner */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <span className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-stone-500 font-light block mb-2">
            The Complete Atelier Collection
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl uppercase tracking-[0.06em] text-black font-light mb-3">
            {selectedCategory === 'all' ? 'All Jewellery' : selectedCategory}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-light tracking-wide max-w-md mx-auto">
            Fine 925 sterling silver and radiant 18K gold dipping, designed in Pakistan for effortless everyday brilliance.
          </p>
        </div>

        {/* Categories Bar (Desktop & Mobile Scroll) */}
        <div className="flex items-center justify-center border-b border-stone-200 pb-4 mb-8 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {categoriesList.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'border-b-2 border-black text-black font-semibold'
                    : 'text-stone-500 hover:text-black font-light'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200/80 text-xs">
          
          {/* Left: Toggles */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`px-3 py-1.5 border text-[11px] tracking-wider uppercase transition-colors cursor-pointer ${
                onlyInStock
                  ? 'border-black bg-black text-white font-medium'
                  : 'border-stone-300 bg-white text-stone-600 hover:border-black'
              }`}
            >
              In Stock Only
            </button>
            <button
              type="button"
              onClick={() => setOnlyNew(!onlyNew)}
              className={`px-3 py-1.5 border text-[11px] tracking-wider uppercase transition-colors cursor-pointer ${
                onlyNew
                  ? 'border-black bg-black text-white font-medium'
                  : 'border-stone-300 bg-white text-stone-600 hover:border-black'
              }`}
            >
              New Arrivals
            </button>
            <button
              type="button"
              onClick={() => setOnlySale(!onlySale)}
              className={`px-3 py-1.5 border text-[11px] tracking-wider uppercase transition-colors cursor-pointer ${
                onlySale
                  ? 'border-black bg-black text-white font-medium'
                  : 'border-stone-300 bg-white text-stone-600 hover:border-black'
              }`}
            >
              Sale / Offers
            </button>
          </div>

          {/* Right: Results Count & Sort By */}
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-stone-500 text-[11px] tracking-wider uppercase hidden sm:inline">
              {filteredAndSortedProducts.length} Items Found
            </span>

            <div className="flex items-center gap-2">
              <span className="text-stone-400 tracking-wider uppercase text-[10px]">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-white border border-stone-300 px-3 py-1.5 text-xs text-black uppercase tracking-wider focus:outline-none focus:border-black"
              >
                <option value="featured">Featured First</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

        </div>

        {/* Products Grid */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
              No Pieces Match Your Filter
            </h3>
            <p className="text-xs text-stone-500 font-light">
              Try resetting your filters or switching to another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setOnlyInStock(false);
                setOnlyNew(false);
                setOnlySale(false);
              }}
              className="mt-4 px-6 py-2.5 bg-black text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSortedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
