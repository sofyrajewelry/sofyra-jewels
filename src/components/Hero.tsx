import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HomepageContent } from '../types';

interface HeroProps {
  heroData?: HomepageContent['hero'];
  onNavigate: (page: string, data?: any) => void;
}

export const Hero: React.FC<HeroProps> = ({ heroData, onNavigate }) => {
  const bgImage = heroData?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=2000&auto=format&fit=crop';
  const titleLine1 = heroData?.titleLine1 || 'JEWELLERY';
  const titleLine2 = heroData?.titleLine2 || 'THAT SPEAKS YOU';
  const ctaText = heroData?.ctaText || 'SHOP NOW';

  return (
    <section className="relative w-full bg-[#0E0E0E] text-white overflow-hidden">
      {/* Background Editorial Visual matching Reference Image 1 */}
      <div className="relative min-h-[75vh] sm:min-h-[82vh] md:min-h-[88vh] flex items-end">
        
        {/* Editorial Background Image - configurable via CMS */}
        <div className="absolute inset-0 z-0">
          <img
            src={bgImage}
            alt="SOFYRA fine jewellery"
            className="w-full h-full object-cover object-[50%_25%] sm:object-[50%_30%] filter brightness-[0.82] contrast-[1.06]"
          />
          {/* Subtle gradient overlay to ensure perfect contrast for the text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/25" />
        </div>

        {/* Content Container positioned similar to Reference Image 1 */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-20">
          
          <div className="max-w-2xl text-left">
            {/* Primary Headline strictly matching user specification & reference image:
                JEWELLERY
                THAT SPEAKS YOU
                (No "SHINE EVERY DAY")
            */}
            <h1 className="font-sans font-medium text-3xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-[0.14em] sm:tracking-[0.18em] text-white leading-[1.12] sm:leading-[1.16] mb-6 sm:mb-8 select-none">
              <span className="block">{titleLine1}</span>
              <span className="block">{titleLine2}</span>
            </h1>

            {/* CTA Button: SHOP NOW */}
            <div>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="group inline-flex items-center gap-3 px-8 py-3.5 sm:py-4 bg-white text-black hover:bg-stone-100 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300 shadow-xl cursor-pointer"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
