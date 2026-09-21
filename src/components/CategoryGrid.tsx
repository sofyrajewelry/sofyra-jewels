import React, { useState, useEffect } from 'react';
import { HomepageContent, CategoryHierarchyItem } from '../types';
import { storageService } from '../services/storageService';

interface CategoryGridProps {
  categories?: HomepageContent['categories'];
  onNavigate: (page: string, data?: any) => void;
}

interface CoreCategory {
  slug: string;
  defaultName: string;
  defaultImage: string;
}

const CORE_CATEGORIES: CoreCategory[] = [
  {
    slug: 'rings',
    defaultName: 'RINGS',
    defaultImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=900&auto=format&fit=crop'
  },
  {
    slug: 'bracelets',
    defaultName: 'BRACELETS',
    defaultImage: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=85&w=900&auto=format&fit=crop'
  },
  {
    slug: 'necklaces',
    defaultName: 'NECKLACES',
    defaultImage: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=85&w=900&auto=format&fit=crop'
  },
  {
    slug: 'earrings',
    defaultName: 'EARRINGS',
    defaultImage: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=85&w=900&auto=format&fit=crop'
  }
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories: homepageCategories, onNavigate }) => {
  const [categoryItems, setCategoryItems] = useState<CategoryHierarchyItem[]>(() => {
    try {
      const stored = storageService.getCategories();
      if (stored && stored.length > 0) {
        return stored;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    // Initial fetch from backend
    storageService.fetchCategories().then(stored => {
      if (stored && stored.length > 0) {
        setCategoryItems(stored);
      }
    });

    const handleUpdate = () => {
      try {
        const stored = storageService.getCategories();
        if (stored && stored.length > 0) {
          setCategoryItems(stored);
        }
      } catch {}
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('sofyra:categories-updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('sofyra:categories-updated', handleUpdate);
    };
  }, []);

  // Map the 4 core categories to dynamic storage data
  const displayCategories = CORE_CATEGORIES.map((core) => {
    // 1. Check for matching category in storage
    const matchedCategory = categoryItems.find(
      c => c.slug?.toLowerCase() === core.slug || 
           c.name?.toLowerCase() === core.slug || 
           c.id?.toLowerCase().includes(core.slug)
    );

    // 2. Check for subcategory inside parent categories (e.g. Jewellery -> Rings)
    let subcategoryImage = '';
    for (const parent of categoryItems) {
      if (parent.subcategories && parent.subcategories.length > 0) {
        const sub = parent.subcategories.find(
          s => s.slug?.toLowerCase() === core.slug || s.name?.toLowerCase() === core.slug
        );
        if (sub && (sub as any).image) {
          subcategoryImage = (sub as any).image;
          break;
        }
      }
    }

    // 3. Check homepage content config
    const hpCategory = homepageCategories?.[core.slug];

    const image = (
      hpCategory?.image ||
      matchedCategory?.heroImage ||
      matchedCategory?.image ||
      subcategoryImage ||
      core.defaultImage
    ).trim();

    const name = (
      hpCategory?.name ||
      matchedCategory?.name ||
      core.defaultName
    ).toUpperCase();

    return {
      slug: core.slug,
      name,
      image
    };
  });

  return (
    <section className="py-8 sm:py-10 md:py-12 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="mb-4 sm:mb-5">
          <h2 className="text-xs sm:text-sm tracking-[0.24em] font-normal uppercase text-black font-serif">
            Categories
          </h2>
        </div>

        {/* 4 compact category cards in ONE horizontal row */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5 md:gap-5">
          {displayCategories.map((cat) => (
            <div
              key={cat.slug}
              onClick={() => onNavigate('category', { category: cat.slug })}
              className="group relative flex flex-col justify-between items-center bg-white border border-stone-200 hover:border-black transition-all duration-300 cursor-pointer overflow-hidden aspect-[3/4.6] sm:aspect-[3/4.4] md:aspect-[3/4] p-2 sm:p-3 md:p-4 select-none"
            >
              {/* Centered Jewelry Image */}
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-0 py-1 sm:py-2">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="max-h-full max-w-full w-auto h-auto object-contain filter contrast-[1.02] group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-400">
                    <span className="font-serif text-base uppercase tracking-wider text-stone-500">
                      {cat.name.slice(0, 1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Category Name Underneath Inside Bordered Card */}
              <div className="w-full text-center pb-1 sm:pb-2 pt-1 shrink-0">
                <span className="block text-[9px] sm:text-xs md:text-sm tracking-[0.18em] sm:tracking-[0.24em] uppercase text-black font-normal leading-tight truncate">
                  {cat.name}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

