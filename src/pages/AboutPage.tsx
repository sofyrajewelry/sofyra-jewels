import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Heart } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-stone-400 font-light block mb-3">
            Our Atelier Philosophy
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl uppercase tracking-[0.08em] text-black font-light mb-4">
            About SOFYRA
          </h1>
          <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-stone-500 font-light max-w-md mx-auto">
            Jewellery That Speaks You &bull; Fine Jewellery for the Modern Woman
          </p>
        </div>

        {/* Large Editorial Portrait */}
        <div className="aspect-[16/9] w-full bg-stone-200 overflow-hidden mb-12 border border-stone-200">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1600&auto=format&fit=crop"
            alt="SOFYRA Atelier Pakistani Craftsmanship"
            className="w-full h-full object-cover grayscale contrast-110"
          />
        </div>

        {/* Editorial Text Blocks */}
        <div className="space-y-8 text-stone-700 text-xs sm:text-sm font-light leading-relaxed tracking-wide">
          <p className="first-letter:text-4xl first-letter:font-editorial first-letter:float-left first-letter:mr-3 first-letter:text-black">
            SOFYRA was born out of a desire to redefine fine jewellery in Pakistan. For decades, exquisite jewellery was preserved only for weddings or heavy family lockboxes. We believe brilliance belongs in every ordinary Tuesday afternoon, every morning coffee, and every evening celebration.
          </p>

          <p>
            Each piece in our collection is sculpted from certified 925 sterling silver, layered in radiant 18K yellow or white gold, and guarded by an invisible anti-tarnish microscopic shield. The outcome is jewellery that moves with you effortlessly—lightweight, hypoallergenic, and timeless.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 pb-6 border-y border-stone-200 text-center">
            <div className="space-y-2">
              <Sparkles className="w-5 h-5 mx-auto text-black" />
              <h4 className="font-editorial text-lg uppercase tracking-wider text-black">Modern Luxury</h4>
              <p className="text-[11px] text-stone-500 font-light">Architectural lines made for daily layering.</p>
            </div>
            <div className="space-y-2">
              <ShieldCheck className="w-5 h-5 mx-auto text-black" />
              <h4 className="font-editorial text-lg uppercase tracking-wider text-black">925 Pure Silver</h4>
              <p className="text-[11px] text-stone-500 font-light">Ethically sourced, nickel-free, and lead-free.</p>
            </div>
            <div className="space-y-2">
              <Heart className="w-5 h-5 mx-auto text-black" />
              <h4 className="font-editorial text-lg uppercase tracking-wider text-black">Pakistani Pride</h4>
              <p className="text-[11px] text-stone-500 font-light">Hand-finished by master local silversmiths.</p>
            </div>
          </div>

          <p>
            From our atelier in Lahore to homes across Karachi, Islamabad, Peshawar, and Quetta, every SOFYRA piece arrives enveloped in our signature plush velvet gift box, complete with a certificate of authenticity.
          </p>

          <div className="pt-8 text-center">
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="px-8 py-3.5 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.25em] uppercase font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Explore The Collection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
