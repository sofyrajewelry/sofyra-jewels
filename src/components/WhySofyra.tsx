import React from 'react';
import { Sparkles, ShieldCheck, Package, RotateCcw } from 'lucide-react';
import { WhySofyraSectionConfig } from '../types';

interface WhySofyraProps {
  config?: WhySofyraSectionConfig;
}

export const WhySofyra: React.FC<WhySofyraProps> = ({ config }) => {
  const tagline = config?.tagline || 'The Sofyra Standard';
  const heading = config?.heading || 'WHY SOFYRA';

  const defaultBenefits = [
    {
      id: 'benefit-1',
      title: 'Premium Materials',
      description: 'Handcrafted with 925 sterling silver and thick 18k gold finishing made for daily longevity.',
      icon: 'Sparkles'
    },
    {
      id: 'benefit-2',
      title: 'Quality Inspected',
      description: 'Every piece is hand-inspected for smooth finish, stone setting, and clasp durability.',
      icon: 'ShieldCheck'
    },
    {
      id: 'benefit-3',
      title: 'Secure Packaging',
      description: 'Delivered in our signature velvet-lined jewelry box, sealed and ready for gifting or storage.',
      icon: 'Package'
    },
    {
      id: 'benefit-4',
      title: '30-Day Money-Back Guarantee',
      description: "Shop with peace of mind. Covered by our 30-day money-back guarantee, subject to policy.",
      icon: 'RotateCcw'
    }
  ];

  const benefits = config?.benefits && config.benefits.length > 0 ? config.benefits : defaultBenefits;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 stroke-[1.25]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 stroke-[1.25]" />;
      case 'Package':
        return <Package className="w-5 h-5 stroke-[1.25]" />;
      case 'RotateCcw':
      default:
        return <RotateCcw className="w-5 h-5 stroke-[1.25]" />;
    }
  };

  return (
    <section id="why-sofyra-section" className="py-20 md:py-28 bg-[#FAFAFA] border-y border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <span className="text-[11px] tracking-[0.35em] uppercase text-stone-400 font-light block mb-3">
            {tagline}
          </span>
          <h2 className="font-editorial text-3xl md:text-4xl lg:text-5xl tracking-[0.08em] font-light text-black uppercase">
            {heading}
          </h2>
          <div className="w-12 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        {/* 4 Benefits Horizontal on Desktop, Grid on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.id || `benefit-${index}`}
              className="flex flex-col items-center text-center group"
            >
              {/* Minimal Luxury Icon Ring */}
              <div className="w-14 h-14 rounded-full bg-white border border-stone-200 text-stone-900 flex items-center justify-center mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 group-hover:border-stone-900 group-hover:scale-105">
                {getIcon(benefit.icon)}
              </div>

              {/* Title */}
              <h3 className="font-editorial text-lg md:text-xl tracking-[0.06em] uppercase text-black font-normal mb-3">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="text-xs md:text-sm text-stone-600 font-light leading-relaxed max-w-[260px]">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
