export type ProductCategory =
  | 'jewellery'
  | 'rings'
  | 'bracelets'
  | 'necklaces'
  | 'earrings'
  | 'personalized-jewelry'
  | 'jhumke'
  | 'handchains'
  | 'pendants'
  | 'bangles'
  | 'chains'
  | 'all'
  | string;

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  subcategories: Subcategory[];
}

export interface ProductVariantOption {
  name: string;
  priceAdjustment?: number;
  inStock: boolean;
  image?: string;
  skuSuffix?: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Finish", "Material", "Color", "Size"
  options: ProductVariantOption[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  category: string; // e.g. "jewellery" or "rings"
  subcategory?: string; // e.g. "rings", "necklaces", "bracelets", "earrings", "bangles", "chains"
  price: number; // in PKR
  compareAtPrice?: number; // original price
  discountPercent?: number;
  description: string;
  details?: string[];
  material: string;
  plating?: string;
  stone?: string;
  dimensions?: string;
  careInfo?: string;
  shippingInfo?: string;
  guaranteeInfo?: string;
  sku: string;
  stockCount: number;
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  isSale?: boolean;
  isBestseller?: boolean;
  bestsellerOrder?: number;
  images: string[];
  wornByYouMedia?: string[];
  variants?: ProductVariant[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface CartItem {
  id: string; // unique item id based on product id + variant selections
  product: Product;
  selectedVariantOptions: Record<string, string>; // e.g. { Finish: '18k Gold Plated' }
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod = 'cod' | 'bank_transfer';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Dispatched' | 'Delivered' | 'Cancelled';

export type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  orderNotes?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    province?: string;
  };
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  createdAt: string;
}

export interface CustomerReview {
  id: string;
  productId?: string;
  productName?: string;
  customerName: string;
  customerCity?: string;
  rating: number;
  title?: string;
  comment: string;
  date?: string;
  verified?: boolean;
  userImage?: string;
  image?: string; // alias for customer photo
  published?: boolean;
  order?: number;
}

export interface WornByYouItem {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  productId?: string;
  productName?: string;
  order: number;
}

export interface ContactInfo {
  email: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  pinterest: string;
  businessHours: string;
  customerSupportMessage: string;
  phone?: string;
  address?: string;
  contactImage?: string;
}

export interface BankTransferDetails {
  bankName: string;
  accountTitle?: string;
  accountNumber?: string;
  iban: string;
  instructions?: string;
  discountPercentage?: number;
}

export interface WhySofyraBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface SiteSettings {
  whySofyra: {
    tagline: string;
    heading: string;
    benefits: WhySofyraBenefit[];
  };
  productBenefitsRow: string[];
  moneyBackGuarantee: {
    title: string;
    description: string;
  };
  accordions: {
    shipping: string;
    payment: string;
    about: string;
    care: string;
  };
  bankTransferDetails?: BankTransferDetails;
}

export interface Advantage {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

export interface AdvantageItem {
  id: string;
  title: string;
  description: string;
  subtitle?: string;
  icon?: string;
  image?: string;
  enabled: boolean;
  order: number;
}

export interface AdvantagesSectionConfig {
  tagline: string;
  heading: string;
  items: AdvantageItem[];
}

export interface WhySofyraSectionConfig {
  tagline: string;
  heading: string;
  benefits?: WhySofyraBenefit[];
}

export interface SubcategoryHierarchyItem {
  id: string;
  name: string;
  slug: string;
  order?: number;
  description?: string;
}

export interface CategoryHierarchyItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  tagline?: string;
  description?: string;
  order?: number;
  hidden?: boolean;
  subcategories: (string | SubcategoryHierarchyItem)[];
}

export interface CategoryCardData {
  id: string;
  name: string;
  image: string;
}

export interface HomepageContent {
  hero: {
    titleLine1: string;
    titleLine2: string;
    ctaText: string;
    image: string;
  };
  categories: {
    rings: { name: string; image: string };
    bracelets: { name: string; image: string };
    necklaces: { name: string; image: string };
    earrings: { name: string; image: string };
    [key: string]: { name: string; image: string };
  };
  editorial: {
    splitLeftTitle: string;
    splitLeftSubtitle: string;
    splitLeftImage: string;
    splitRightTitle: string;
    splitRightSubtitle: string;
    splitRightImage: string;
    spotlightDetailImage: string;
    spotlightLifestyleImage: string;
    spotlightBadge: string;
    spotlightTitle: string;
  };
  advantagesSection?: AdvantagesSectionConfig;
  advantages: {
    customDesignImage: string;
    versatilityImage: string;
    qualityMaterialsImage: string;
    comfortWearingImage: string;
  };
  contactPage?: {
    image: string;
    tagline?: string;
    heading?: string;
    subheading?: string;
  };
}
