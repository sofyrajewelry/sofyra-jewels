import { Product, CustomerReview, Advantage, AdvantageItem, AdvantagesSectionConfig, CategoryItem, CategoryHierarchyItem, ContactInfo, SiteSettings, WornByYouItem } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    slug: 'etoile-sculptural-teardrop-earrings',
    name: 'Etoile Sculptural Drop Earrings',
    subtitle: 'Sterling silver / 18k gold plating',
    category: 'earrings',
    price: 3450,
    compareAtPrice: 4200,
    discountPercent: 18,
    description: 'Sculptural elegance crafted for the modern muse. The Etoile Drop Earrings capture ambient light through sweeping, fluid curves with a radiant mirror polish. Designed to frame the face with effortless sophistication from morning meetings to intimate evening soirees.',
    details: [
      'Hand-finished high-gloss mirror shine',
      'Anti-tarnish protective micro-coating',
      'Hypoallergenic post backing with secure butterfly clutch',
      'Weight: 4.8g each (featherweight, zero ear fatigue)',
      'Dimensions: 28mm length × 14mm widest point'
    ],
    material: '925 Sterling Silver base',
    plating: '18K Yellow Gold or Rhodium Silver',
    dimensions: '28mm × 14mm',
    careInfo: 'Gently wipe with our complimentary microfiber polishing cloth after wear. Avoid direct contact with concentrated perfumes and swimming pools.',
    sku: 'SOF-EAR-001',
    stockCount: 14,
    inStock: true,
    isNew: true,
    isFeatured: true,
    isBestseller: true,
    images: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=900&auto=format&fit=crop'
    ],
    variants: [
      {
        id: 'var-finish',
        name: 'Finish',
        options: [
          { name: '18K Yellow Gold Plated', inStock: true, image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=900&auto=format&fit=crop' },
          { name: 'Rhodium Silver', inStock: true, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=900&auto=format&fit=crop' }
        ]
      }
    ],
    rating: 4.9,
    reviewCount: 38,
    createdAt: '2025-01-15'
  },
  {
    id: 'prod-2',
    slug: 'linea-tennis-bracelet-2mm',
    name: 'Linea Tennis Bracelet (2mm)',
    subtitle: 'Triple-A cubic zirconia / 18k silver plating',
    category: 'bracelets',
    price: 4800,
    compareAtPrice: 5800,
    discountPercent: 17,
    description: 'The definitive quintessential jewellery investment piece. Featuring a continuous strand of bezel-prong set brilliant-cut round simulated diamonds, the Linea Tennis Bracelet sits flush against the wrist with fluid motion and breathtaking diamond-like scintillation.',
    details: [
      'Triple-A grade round laboratory crystals (2.0mm)',
      'Double safety figure-eight security clasp',
      'Four-prong structural basket setting for maximum light entrance',
      'Water and sweat resistant protective ionic vapor deposit',
      'Standard 6.7 inch length with complimentary 0.8 inch extender chain'
    ],
    material: '925 Sterling Silver',
    plating: '18K White Gold / Rhodium',
    stone: 'AAA+ Round Cut Simulated Diamonds',
    dimensions: '17cm length + 2cm extender, 2mm stone width',
    careInfo: 'Store flat in the provided custom velvet pouch to prevent entanglement.',
    sku: 'SOF-BRC-002',
    stockCount: 8,
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: true,
    images: [
      'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=900&auto=format&fit=crop'
    ],
    variants: [
      {
        id: 'var-metal',
        name: 'Metal & Tone',
        options: [
          { name: 'Platinum Silver Finish', inStock: true },
          { name: '18K Warm Gold Finish', inStock: true }
        ]
      }
    ],
    rating: 5.0,
    reviewCount: 52,
    createdAt: '2025-01-20'
  },
  {
    id: 'prod-3',
    slug: 'aurea-jacket-earrings',
    name: 'Aurea Jacket Earrings',
    subtitle: 'Sterling silver / 18k silver plating',
    category: 'earrings',
    price: 3600,
    compareAtPrice: 4400,
    discountPercent: 18,
    description: 'An architectural modular design featuring an asymmetric cluster of marquise and baguette stones. The bottom jacket can be detached to convert into an everyday classic solitaire stud, giving you two versatile high-fashion styles in one.',
    details: [
      '2-in-1 convertible jacket & stud system',
      'Marquise and emerald-cut multi-facet stones',
      'Solid silver posts suitable for sensitive skin'
    ],
    material: 'Sterling Silver 925',
    plating: '18k Champagne Gold Plated',
    stone: 'Artisanal Cushion & Marquise Stones',
    sku: 'SOF-EAR-003',
    stockCount: 11,
    inStock: true,
    isNew: true,
    isFeatured: true,
    isBestseller: true,
    images: [
      'https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1629224316810-9d8805b95e76?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=900&auto=format&fit=crop'
    ],
    rating: 4.8,
    reviewCount: 29,
    createdAt: '2025-02-01'
  },
  {
    id: 'prod-4',
    slug: 'emera-baguette-pendant-necklace',
    name: 'Emera Baguette Necklace',
    subtitle: 'Sterling silver / 18k gold plating',
    category: 'necklaces',
    price: 3950,
    compareAtPrice: 4700,
    discountPercent: 16,
    description: 'Clean geometry meets everlasting radiance. A step-cut emerald simulated diamond is horizontally suspended on an ultra-delicate diamond-cut cable chain. Styled solo for a minimal Parisian neckline or stacked effortlessly with choker bands.',
    details: [
      'Horizontal 8x6mm emerald step-cut stone',
      'Diamond-cut Italian cable chain catching natural sun glints',
      'Adjustable 40cm + 5cm extension drop'
    ],
    material: '925 Silver',
    plating: '18K Yellow Gold',
    stone: 'Emerald-Cut Simulated Solitaire',
    dimensions: '42cm + 5cm extension',
    sku: 'SOF-NCK-004',
    stockCount: 16,
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: true,
    images: [
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=80&w=900&auto=format&fit=crop'
    ],
    variants: [
      {
        id: 'var-color',
        name: 'Finish',
        options: [
          { name: '18k Warm Gold', inStock: true },
          { name: 'Sterling Silver', inStock: true }
        ]
      }
    ],
    rating: 4.9,
    reviewCount: 44,
    createdAt: '2025-02-05'
  },
  {
    id: 'prod-5',
    slug: 'aura-baguette-diamond-ring',
    name: 'Aura Baguette Eternity Ring',
    subtitle: 'Signature cut / 18k solid gold finish',
    category: 'rings',
    price: 3200,
    compareAtPrice: 3800,
    discountPercent: 15,
    description: 'An understated band punctuated by alternating channel-set baguette stones. Delicately slim yet substantially durable, designed for everyday wear and seamless stacking.',
    details: [
      'Alternating micro-pave and baguette stones',
      'Smooth comfort-fit inner shank contour',
      'Anti-discoloration e-coating'
    ],
    material: '925 Sterling Silver',
    plating: '18K Gold Plated',
    sku: 'SOF-RNG-005',
    stockCount: 12,
    inStock: true,
    isNew: true,
    isFeatured: true,
    isBestseller: true,
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1543290954-47b2c0cb354a?q=80&w=900&auto=format&fit=crop'
    ],
    variants: [
      {
        id: 'var-size',
        name: 'Ring Size (US)',
        options: [
          { name: 'Size 6 (16.5mm)', inStock: true },
          { name: 'Size 7 (17.3mm)', inStock: true },
          { name: 'Size 8 (18.1mm)', inStock: true }
        ]
      }
    ],
    rating: 5.0,
    reviewCount: 31,
    createdAt: '2025-02-10'
  },
  {
    id: 'prod-6',
    slug: 'solitaire-pave-signature-ring',
    name: 'Solitaire Pavé Signature Ring',
    subtitle: 'Cushion radiant cut / 18k gold vermeil',
    category: 'rings',
    price: 4200,
    compareAtPrice: 5100,
    discountPercent: 17,
    description: 'Showcasing a 2.5 carat cushion-cut centerpiece flanked by hand-embedded micropavé accents along the shank. A breathtaking statement ring with timeless Pakistani bridal and western formal appeal.',
    details: [
      'Four double-claw prongs for gemstone stability',
      'Radiant cut crystal with fire and clarity index matching natural D-flawless',
      'Includes luxury SOFYRA ring box and velvet traveling pouch'
    ],
    material: 'Sterling Silver 925',
    plating: '18K Gold Vermeil',
    stone: '2.5ct Cushion Brilliant Cut',
    sku: 'SOF-RNG-006',
    stockCount: 7,
    inStock: true,
    isNew: true,
    isFeatured: true,
    isBestseller: false,
    images: [
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=900&auto=format&fit=crop'
    ],
    variants: [
      {
        id: 'var-size',
        name: 'Ring Size',
        options: [
          { name: 'Size 6', inStock: true },
          { name: 'Size 7', inStock: true },
          { name: 'Size 8', inStock: true }
        ]
      }
    ],
    rating: 4.9,
    reviewCount: 19,
    createdAt: '2025-02-12'
  },
  {
    id: 'prod-7',
    slug: 'riviera-tennis-collar-necklace',
    name: 'Riviera Diamond Collar Necklace',
    subtitle: 'Seamless articulated links / 18k white gold finish',
    category: 'necklaces',
    price: 6400,
    compareAtPrice: 7500,
    discountPercent: 15,
    description: 'An editorial masterpiece that rests naturally along the collarbone. Each link is independently articulated to prevent flipping, ensuring the stones capture 360-degree brilliance from any angle.',
    details: [
      'Graduated centerpiece design',
      'Concealed tongue-in-groove clasp with dual safety latch',
      'Non-flipping engineered setting'
    ],
    material: '925 Silver with Palladium Barrier',
    plating: 'Rhodium White Gold',
    stone: 'Graduated Lab Diamonds',
    sku: 'SOF-NCK-007',
    stockCount: 6,
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: false,
    images: [
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=900&auto=format&fit=crop'
    ],
    rating: 5.0,
    reviewCount: 22,
    createdAt: '2025-02-14'
  },
  {
    id: 'prod-8',
    slug: 'etoile-pearl-cuff-bracelet',
    name: 'Etoile Pearl Cuff Bangle',
    subtitle: 'Cultured baroque pearls / 18k gold tone',
    category: 'bracelets',
    price: 3900,
    compareAtPrice: 4600,
    discountPercent: 15,
    description: 'An open sculptural cuff terminating in two lustrous natural freshwater pearls. Flexible spring tension allows effortless single-hand slip on, molding gently to your wrist.',
    details: [
      'Genuine hand-selected cultured freshwater pearls',
      'Malleable interior titanium core for customized fit',
      'High polish mirrored surface'
    ],
    material: 'Brass with Heavy 18K Gold Dipping',
    plating: '18K Yellow Gold',
    stone: 'Natural Cultured Pearls',
    sku: 'SOF-BRC-008',
    stockCount: 15,
    inStock: true,
    isNew: true,
    isFeatured: false,
    isBestseller: true,
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=80&w=900&auto=format&fit=crop'
    ],
    rating: 4.8,
    reviewCount: 27,
    createdAt: '2025-02-18'
  }
];

export const INITIAL_REVIEWS: CustomerReview[] = [];

export const DEFAULT_ADVANTAGES_ITEMS: AdvantageItem[] = [
  {
    id: 'adv-1',
    title: 'QUALITY MATERIALS',
    subtitle: '925 Silver • Thick 18k Plating • Tarnish Guard',
    description: 'Thoughtfully selected jewellery for your everyday style.',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=80&w=700&auto=format&fit=crop',
    enabled: true,
    order: 1
  },
  {
    id: 'adv-2',
    title: 'TIMELESS DESIGN',
    subtitle: 'Day-to-night styling • Modular layers',
    description: 'Pieces designed to complement every look.',
    icon: 'Clock',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=700&auto=format&fit=crop',
    enabled: true,
    order: 2
  },
  {
    id: 'adv-3',
    title: 'MONEY BACK GUARANTEE',
    subtitle: '100% Satisfaction • Easy Returns & Exchange',
    description: "Shop with confidence, subject to SOFYRA's return and refund policy.",
    icon: 'RotateCcw',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=700&auto=format&fit=crop',
    enabled: true,
    order: 3
  },
  {
    id: 'adv-4',
    title: 'SECURE PACKAGING',
    subtitle: 'Luxury Gift Box • Tamper-Evident Seal',
    description: 'Every SOFYRA order is carefully prepared and packed.',
    icon: 'Package',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=700&auto=format&fit=crop',
    enabled: true,
    order: 4
  }
];

export const DEFAULT_ADVANTAGES_SECTION: AdvantagesSectionConfig = {
  tagline: 'The Sofyra Standard',
  heading: 'Advantages',
  items: DEFAULT_ADVANTAGES_ITEMS
};

export const ADVANTAGES_DATA: Advantage[] = [
  {
    id: 'adv-1',
    title: 'QUALITY MATERIALS',
    subtitle: '925 Silver • Thick 18k Plating • Tarnish Guard',
    description: 'Thoughtfully selected jewellery for your everyday style.',
    image: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=80&w=700&auto=format&fit=crop'
  },
  {
    id: 'adv-2',
    title: 'TIMELESS DESIGN',
    subtitle: 'Day-to-night styling • Modular layers',
    description: 'Pieces designed to complement every look.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=700&auto=format&fit=crop'
  },
  {
    id: 'adv-3',
    title: 'MONEY BACK GUARANTEE',
    subtitle: '100% Satisfaction • Easy Returns & Exchange',
    description: "Shop with confidence, subject to SOFYRA's return and refund policy.",
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=700&auto=format&fit=crop'
  },
  {
    id: 'adv-4',
    title: 'SECURE PACKAGING',
    subtitle: 'Luxury Gift Box • Tamper-Evident Seal',
    description: 'Every SOFYRA order is carefully prepared and packed.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=700&auto=format&fit=crop'
  }
];

export const DEFAULT_CATEGORIES: CategoryHierarchyItem[] = [
  {
    id: 'cat-rings',
    name: 'Rings',
    slug: 'rings',
    tagline: 'Stackable bands, statement pieces & eternity rings',
    description: 'Fine artisanal rings handcrafted for everyday elegance and modern luxury.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=900&auto=format&fit=crop',
    order: 1,
    hidden: false,
    subcategories: [
      { id: 'sub-band-rings', name: 'Band Rings', slug: 'band-rings' },
      { id: 'sub-solitaire', name: 'Solitaire Rings', slug: 'solitaire' },
      { id: 'sub-eternity', name: 'Eternity Bands', slug: 'eternity-bands' }
    ]
  },
  {
    id: 'cat-bracelets',
    name: 'Bracelets',
    slug: 'bracelets',
    tagline: 'Classic tennis bracelets, cuffs & link chains',
    description: 'Sculpted wristwear crafted in sterling silver and 18K gold dipping.',
    image: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=85&w=900&auto=format&fit=crop',
    order: 2,
    hidden: false,
    subcategories: [
      { id: 'sub-tennis', name: 'Tennis Bracelets', slug: 'tennis-bracelets' },
      { id: 'sub-cuff', name: 'Cuffs & Bangles', slug: 'cuffs' },
      { id: 'sub-chain-bracelets', name: 'Chain Bracelets', slug: 'chain-bracelets' }
    ]
  },
  {
    id: 'cat-necklaces',
    name: 'Necklaces',
    slug: 'necklaces',
    tagline: 'Sculpted collars, diamond pendants & everyday chains',
    description: 'Layerable collars, fine pendants, and timeless link chains.',
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=85&w=900&auto=format&fit=crop',
    order: 3,
    hidden: false,
    subcategories: [
      { id: 'sub-chokers', name: 'Chokers', slug: 'chokers' },
      { id: 'sub-layered', name: 'Layered Chains', slug: 'layered-chains' },
      { id: 'sub-collars', name: 'Collar Necklaces', slug: 'collar-necklaces' }
    ]
  },
  {
    id: 'cat-earrings',
    name: 'Earrings',
    slug: 'earrings',
    tagline: 'Sculptural teardrops, huggies & sparkling chandeliers',
    description: 'Lightweight, hypoallergenic earrings designed for effortless brilliance.',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=85&w=900&auto=format&fit=crop',
    order: 4,
    hidden: false,
    subcategories: [
      { id: 'sub-studs', name: 'Stud Earrings', slug: 'studs' },
      { id: 'sub-hoops', name: 'Hoop Earrings', slug: 'hoops' },
      { id: 'sub-drops', name: 'Drop Earrings', slug: 'drops' }
    ]
  },
  {
    id: 'cat-personalized-jewelry',
    name: 'Personalized Jewelry',
    slug: 'personalized-jewelry',
    tagline: 'Custom engraved initials, nameplates & bespoke keepsakes',
    description: 'Bespoke custom-crafted initial necklaces, engraved bands, and personalized heirlooms.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=85&w=900&auto=format&fit=crop',
    order: 5,
    hidden: false,
    subcategories: [
      { id: 'sub-name-necklaces', name: 'Name Necklaces', slug: 'name-necklaces' },
      { id: 'sub-initial-pendants', name: 'Initial Pendants', slug: 'initial-pendants' },
      { id: 'sub-engraved-cuffs', name: 'Engraved Cuffs', slug: 'engraved-cuffs' }
    ]
  },
  {
    id: 'cat-jhumke',
    name: 'Jhumke',
    slug: 'jhumke',
    tagline: 'Traditional bell drops, chandbali accents & modern heritage',
    description: 'Artisanal heritage jhumkas blending South Asian heritage with contemporary lightweight comfort.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=85&w=900&auto=format&fit=crop',
    order: 6,
    hidden: false,
    subcategories: [
      { id: 'sub-classic-jhumkas', name: 'Classic Bell Jhumke', slug: 'classic-jhumke' },
      { id: 'sub-chandbali-jhumkas', name: 'Chandbali Jhumke', slug: 'chandbali-jhumke' },
      { id: 'sub-pearl-jhumkas', name: 'Pearl Drop Jhumke', slug: 'pearl-jhumke' }
    ]
  },
  {
    id: 'cat-handchains',
    name: 'Handchains',
    slug: 'handchains',
    tagline: 'Delicate ring-to-wrist silhouettes & modern hathphool',
    description: 'Flowing hand flowers, dainty slave bracelets, and finger-to-wrist chain adornments.',
    image: 'https://images.unsplash.com/photo-1611591475824-3453b3df051a?q=85&w=900&auto=format&fit=crop',
    order: 7,
    hidden: false,
    subcategories: [
      { id: 'sub-minimal-hathphool', name: 'Minimal Hathphool', slug: 'minimal-hathphool' },
      { id: 'sub-crystal-handchains', name: 'Crystal Handchains', slug: 'crystal-handchains' },
      { id: 'sub-bridal-handchains', name: 'Bridal Hand Chains', slug: 'bridal-handchains' }
    ]
  },
  {
    id: 'cat-pendants',
    name: 'Pendants',
    slug: 'pendants',
    tagline: 'Solitaire stones, medallions & sculptural charms',
    description: 'Individual charm pendants, solitaire emerald drops, and minimal coin medallions.',
    image: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?q=85&w=900&auto=format&fit=crop',
    order: 8,
    hidden: false,
    subcategories: [
      { id: 'sub-solitaire-pendants', name: 'Solitaire Pendants', slug: 'solitaire-pendants' },
      { id: 'sub-medallions', name: 'Coin Medallions', slug: 'coin-medallions' },
      { id: 'sub-locket-charms', name: 'Locket Charms', slug: 'locket-charms' }
    ]
  }
];

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  email: 'sofyrastore@gmail.com',
  whatsapp: '+92 300 1234567',
  instagram: '@sofyra.pk',
  tiktok: '@sofyra.pk',
  facebook: 'sofyrajewellery',
  pinterest: 'sofyra',
  businessHours: 'Monday – Saturday: 10:00 AM – 7:00 PM PKT',
  customerSupportMessage: 'Our customer care team is available to assist with order tracking, sizing guidance, and product enquiries.',
  phone: '+92 300 1234567',
  address: 'Lahore, Pakistan',
  contactImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop'
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  whySofyra: {
    tagline: 'The Sofyra Standard',
    heading: 'WHY SOFYRA',
    benefits: [
      {
        id: 'benefit-1',
        title: 'Premium Materials',
        description: 'Thoughtfully selected metals, 925 sterling silver, and heavy 18K gold finishing designed for longevity and comfort.',
        icon: 'Sparkles'
      },
      {
        id: 'benefit-2',
        title: 'Quality Inspected',
        description: 'Every piece is individually hand-checked for luster, smooth finish, and clasp integrity prior to dispatch.',
        icon: 'ShieldCheck'
      },
      {
        id: 'benefit-3',
        title: 'Secure Packaging',
        description: 'Encased in a custom velvet-lined protective jewelry box to ensure pristine arrival and scratch-safe storage.',
        icon: 'Package'
      },
      {
        id: 'benefit-4',
        title: '30-Day Money-Back Guarantee',
        description: "Shop with confidence. If you're not satisfied with your purchase, you're covered by our 30-day money-back guarantee, subject to SOFYRA's return policy.",
        icon: 'RotateCcw'
      }
    ]
  },
  productBenefitsRow: [
    'Premium Quality',
    'Secure Packaging',
    'Fast Delivery',
    '30-Day Money-Back Guarantee'
  ],
  moneyBackGuarantee: {
    title: '30-DAY MONEY-BACK GUARANTEE',
    description: "Shop with confidence. If you're not satisfied with your purchase, you're covered by our 30-day money-back guarantee, subject to SOFYRA's return policy."
  },
  accordions: {
    shipping: 'Nationwide delivery across Pakistan.\nEstimated delivery time: 4–5 business days.\nCash on Delivery is available where applicable.',
    payment: 'Checkout securely using the available payment methods, including Cash on Delivery (COD) and Direct Bank Transfer (HBL).',
    about: 'Each piece is selected with attention to finish, comfort and everyday wearability. We balance sculptural modern forms with hypoallergenic finishes so you can wear your jewellery effortlessly every day.',
    care: "To preserve your jewellery's brilliance, avoid direct contact with perfumes, hairsprays, lotions, and chlorinated pools. Store in the complimentary SOFYRA protective pouch and gently buff with a dry microfibre cloth after wearing."
  },
  bankTransferDetails: {
    bankName: 'HBL BANK TRANSFER',
    accountTitle: '',
    iban: 'PK12HABB0053727000158003',
    instructions: 'Please transfer the order amount directly to our verified HBL account using the IBAN above. Share your payment screenshot on WhatsApp with your Order ID for instant dispatch confirmation.'
  }
};

export const DEFAULT_WORN_BY_YOU: WornByYouItem[] = [
  {
    id: 'wby-1',
    type: 'image',
    mediaUrl: '/uploads/sofyra-IMG_2895jpeg-1788803186058-675f5dbb.jpg',
    caption: 'Styled effortlessly with the Etoile Drop Earrings',
    productId: 'prod-1',
    productName: 'Etoile Sculptural Drop Earrings',
    order: 1
  },
  {
    id: 'wby-2',
    type: 'image',
    mediaUrl: '/uploads/sofyra-IMG_2141jpeg-1788803378479-23755b4a.jpg',
    caption: 'Layered wrists with the Linea Tennis Bracelet',
    productId: 'prod-2',
    productName: 'Linea Tennis Bracelet (2mm)',
    order: 2
  },
  {
    id: 'wby-3',
    type: 'image',
    mediaUrl: '/uploads/sofyra-IMG_2457jpeg-1788803309900-b3862350.jpg',
    caption: 'Everyday ring stacks in 18k gold tone',
    productId: 'prod-3',
    productName: 'Serpent Open Ring Band',
    order: 3
  },
  {
    id: 'wby-4',
    type: 'image',
    mediaUrl: '/uploads/sofyra-IMG_2823jpeg-1788803328716-5f98f1d2.jpg',
    caption: 'Minimalist statement for golden hour',
    productId: 'prod-4',
    productName: 'Aura Freshwater Pearl Pendant',
    order: 4
  }
];

export const DEFAULT_REVIEWS: CustomerReview[] = [];

export const CATEGORIES_DATA = [
  {
    id: 'rings',
    name: 'RINGS',
    slug: 'rings',
    tagline: 'Signature cocktail & eternity bands',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'bracelets',
    name: 'BRACELETS',
    slug: 'bracelets',
    tagline: 'Articulated tennis chains & cuffs',
    image: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'necklaces',
    name: 'NECKLACES',
    slug: 'necklaces',
    tagline: 'Chokers & emerald-cut pendants',
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'earrings',
    name: 'EARRINGS',
    slug: 'earrings',
    tagline: 'Sculptural drops & jacket studs',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'personalized-jewelry',
    name: 'PERSONALIZED JEWELRY',
    slug: 'personalized-jewelry',
    tagline: 'Custom engraved initials, nameplates & bespoke keepsakes',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=85&w=900&auto=format&fit=crop'
  },
  {
    id: 'jhumke',
    name: 'JHUMKE',
    slug: 'jhumke',
    tagline: 'Traditional bell drops, chandbali accents & modern heritage',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=85&w=900&auto=format&fit=crop'
  },
  {
    id: 'handchains',
    name: 'HANDCHAINS',
    slug: 'handchains',
    tagline: 'Delicate ring-to-wrist silhouettes & modern hathphool',
    image: 'https://images.unsplash.com/photo-1611591475824-3453b3df051a?q=85&w=900&auto=format&fit=crop'
  },
  {
    id: 'pendants',
    name: 'PENDANTS',
    slug: 'pendants',
    tagline: 'Solitaire stones, medallions & sculptural charms',
    image: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?q=85&w=900&auto=format&fit=crop'
  }
];

export const DEFAULT_HOMEPAGE_CONTENT = {
  hero: {
    titleLine1: 'JEWELLERY',
    titleLine2: 'THAT SPEAKS YOU',
    ctaText: 'SHOP NOW',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=2000&auto=format&fit=crop'
  },
  categories: {
    rings: {
      name: 'RINGS',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=900&auto=format&fit=crop'
    },
    bracelets: {
      name: 'BRACELETS',
      image: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=85&w=900&auto=format&fit=crop'
    },
    necklaces: {
      name: 'NECKLACES',
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=85&w=900&auto=format&fit=crop'
    },
    earrings: {
      name: 'EARRINGS',
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=85&w=900&auto=format&fit=crop'
    }
  },
  editorial: {
    splitLeftTitle: 'Bestsellers',
    splitLeftSubtitle: 'The Curated Edit',
    splitLeftImage: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=85&w=1200&auto=format&fit=crop',
    splitRightTitle: 'New Collection',
    splitRightSubtitle: 'New Season Launch',
    splitRightImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=85&w=1200&auto=format&fit=crop',
    spotlightDetailImage: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?q=85&w=900&auto=format&fit=crop',
    spotlightLifestyleImage: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=85&w=1400&auto=format&fit=crop',
    spotlightBadge: 'NEW',
    spotlightTitle: 'HYPE CHAIN BRACELET'
  },
  advantagesSection: DEFAULT_ADVANTAGES_SECTION,
  advantages: {
    customDesignImage: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=700&auto=format&fit=crop',
    versatilityImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=700&auto=format&fit=crop',
    qualityMaterialsImage: 'https://images.unsplash.com/photo-1611591475879-11c58d047321?q=80&w=700&auto=format&fit=crop',
    comfortWearingImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=700&auto=format&fit=crop'
  },
  contactPage: {
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop',
    tagline: 'Atelier Concierge',
    heading: 'Contact Us',
    subheading: 'Leave your information — we will be happy to answer your questions and help you choose jewelry.'
  }
};
