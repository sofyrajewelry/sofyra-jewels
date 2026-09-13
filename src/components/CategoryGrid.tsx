import React from 'react';
import { HomepageContent } from '../types';

interface CategoryGridProps {
  categories?: HomepageContent['categories'];
  onNavigate: (page: string, data?: any) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onNavigate }) => {
  // Default fallback categories if not provided
  const categoryList: { id: 'rings' | 'bracelets' | 'necklaces' | 'earrings'; name: string; image: string }[] = [
    {
      id: 'rings',
      name: categories?.rings?.name || 'RINGS',
      image: categories?.rings?.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=900&auto=format&fit=crop'
    },
    {
      id: 'bracelets',
      name: categories?.bracelets?.name || 'BRACELETS',
      image: categories?.bracelets?.image || 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=85&w=900&auto=format&fit=crop'
    },
    {
      id: 'necklaces',
      name: categories?.necklaces?.name || 'NECKLACES',
      image: categories?.necklaces?.image || 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=85&w=900&auto=format&fit=crop'
    },
    {
      id: 'earrings',
      name: categories?.earrings?.name || 'EARRINGS',
      image: categories?.earrings?.image || 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=85&w=900&auto=format&fit=crop'
    }
  ];

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading matching Reference Image 1 exactly */}
        <div className="mb-4 sm:mb-6 md:mb-8 text-left">
          <h2 className="text-xs sm:text-sm md:text-base tracking-[0.24em] font-normal uppercase text-black font-sans">
            Categories
          </h2>
        </div>

        {/* 4 Cards Grid strictly matching Reference Image 1:
            - Exact 4 vertical cards in a row
            - Thin crisp borders
            - Isolated jewelry product image centered
            - Clean uppercase label at the bottom inside each box
            - Responsive 4-card layout on desktop and mobile matching mobile screenshot
        */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5 md:gap-5 lg:gap-6">
          {categoryList.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('category', { category: cat.id })}
              className="group relative flex flex-col justify-between items-center bg-white border border-stone-300/90 hover:border-black transition-all duration-300 cursor-pointer overflow-hidden aspect-[3/4.2] sm:aspect-[3/4] p-2 sm:p-4 md:p-6 select-none"
            >
              {/* Centered Isolated Jewelry Product Image */}
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-0 py-1">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="max-h-full max-w-full w-auto h-auto object-contain filter contrast-[1.03] group-hover:scale-105 transition-transform duration-500 ease-out"
                  loading="lazy"
                />
              </div>

              {/* Category Name Centered at Bottom Inside the Bordered Card */}
              <div className="w-full text-center pt-2 sm:pt-3 border-t border-transparent shrink-0">
                <span className="block text-[9px] sm:text-xs md:text-sm tracking-[0.22em] sm:tracking-[0.26em] uppercase text-black font-normal leading-tight">
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
