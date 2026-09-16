import React, { useState, useEffect, useRef } from 'react';
import { Product, CustomerReview, WornByYouItem, SiteSettings } from '../types';
import { formatPKR } from '../utils/format';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { StickyMobileBar } from '../components/StickyMobileBar';
import { WornByYouSection } from '../components/WornByYouSection';
import { ReviewsSection } from '../components/ReviewsSection';
import {
  Star,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronDown,
  Share2,
  Lock,
  Package,
  RotateCcw,
  Check,
  Maximize2,
  X,
  CreditCard
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onNavigate: (page: string, data?: any) => void;
  siteSettings?: SiteSettings;
  wornByYouItems?: WornByYouItem[];
  reviews?: CustomerReview[];
  onReviewAdded?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  onNavigate,
  siteSettings,
  wornByYouItems = [],
  reviews = [],
  onReviewAdded
}) => {
  const { addToCart } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeAccordion, setActiveAccordion] = useState<string | null>('shipping');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Gift options state
  const [addPersonalNote, setAddPersonalNote] = useState(false);
  const [personalNoteText, setPersonalNoteText] = useState('');
  const [giftWrapOrder, setGiftWrapOrder] = useState(false);

  const purchaseActionRef = useRef<HTMLDivElement>(null);

  const isRing =
    (product.category || '').toLowerCase().trim() === 'rings' ||
    (product.category || '').toLowerCase().trim() === 'ring';

  const giftCharges = (addPersonalNote ? 350 : 0) + (giftWrapOrder ? 520 : 0);

  // Initialize variant defaults and scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    setActiveImageIndex(0);
    setQuantity(1);
    setAddPersonalNote(false);
    setPersonalNoteText('');
    setGiftWrapOrder(false);

    if (isRing) {
      const defaults: Record<string, string> = {};
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((v) => {
          if (!v.name.toLowerCase().includes('size') && v.options.length > 0) {
            defaults[v.name] = v.options[0].name;
          }
        });
      }
      defaults['Size'] = 'Adjustable — One Size';
      setSelectedOptions(defaults);
    } else if (product.variants && product.variants.length > 0) {
      const defaults: Record<string, string> = {};
      product.variants.forEach((v) => {
        if (v.options.length > 0) {
          defaults[v.name] = v.options[0].name;
        }
      });
      setSelectedOptions(defaults);
    } else if (product.plating) {
      setSelectedOptions({ Finish: product.plating });
    } else {
      setSelectedOptions({});
    }
  }, [product.id, product.slug, isRing]);

  // Observer for sticky mobile purchase bar
  useEffect(() => {
    const handleScroll = () => {
      if (purchaseActionRef.current) {
        const rect = purchaseActionRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 80);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOptionSelect = (variantName: string, optionName: string, optionImage?: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [variantName]: optionName
    }));
    if (optionImage) {
      const imgIdx = product.images.findIndex((img) => img === optionImage);
      if (imgIdx >= 0) {
        setActiveImageIndex(imgIdx);
      }
    }
  };

  const getFinalOptionsAndGift = () => {
    const optionsToPass = { ...selectedOptions };
    if (isRing) {
      Object.keys(optionsToPass).forEach((k) => {
        if (k.toLowerCase().includes('size')) {
          delete optionsToPass[k];
        }
      });
      optionsToPass['Size'] = 'Adjustable — One Size';
    }
    const giftOpts =
      addPersonalNote || giftWrapOrder
        ? {
            hasPersonalNote: addPersonalNote,
            personalNote: addPersonalNote ? personalNoteText.trim() : undefined,
            hasGiftWrap: giftWrapOrder
          }
        : undefined;

    return { optionsToPass, giftOpts };
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;
    const { optionsToPass, giftOpts } = getFinalOptionsAndGift();
    addToCart(product, quantity, optionsToPass, giftOpts);
  };

  const handleBuyNow = () => {
    if (!product.inStock) return;
    const { optionsToPass, giftOpts } = getFinalOptionsAndGift();
    addToCart(product, quantity, optionsToPass, giftOpts);
    onNavigate('checkout');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const toggleAccordion = (section: string) => {
    setActiveAccordion((prev) => (prev === section ? null : section));
  };

  // Stock indicator logic
  const stockCount = typeof product.stockCount === 'number' ? product.stockCount : 10;
  const isLowStock = product.inStock && stockCount > 0 && stockCount <= 5;

  // Benefits list from site settings or defaults
  const benefitsList = siteSettings?.productBenefitsRow || [
    'Premium Quality',
    'Secure Packaging',
    'Fast Delivery',
    '30-Day Money-Back Guarantee'
  ];

  // Accordion text from siteSettings or fallback
  const shippingText = siteSettings?.accordions?.shipping || product.shippingInfo || 
    "Nationwide delivery across Pakistan.\nEstimated delivery time: 4–5 business days.\nCash on Delivery is available where applicable.";
  const paymentText = siteSettings?.accordions?.payment || 
    "Checkout securely using Cash on Delivery (COD) and Direct Bank Transfer (HBL).";
  const aboutText = siteSettings?.accordions?.about || product.description ||
    "Each piece is selected with attention to finish, comfort and everyday wearability. We balance sculptural modern forms with hypoallergenic finishes so you can wear your jewellery effortlessly every day.";
  const careText = siteSettings?.accordions?.care || product.careInfo ||
    "To preserve your jewellery's brilliance, avoid direct contact with perfumes, hairsprays, lotions, and chlorinated pools. Store in the complimentary SOFYRA protective pouch and gently buff with a dry microfibre cloth after wearing.";

  // Related products (filtered by category)
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category?.toLowerCase() === product.category?.toLowerCase())
    .slice(0, 4);

  const fallbackRelated = relatedProducts.length > 0 
    ? relatedProducts 
    : allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  // Filter reviews for this product or general
  const productReviews = reviews.filter((r) => r.productId === product.id || !r.productId);

  return (
    <div className="bg-white text-stone-900 pb-20">
      
      {/* 1. TOP BREADCRUMB / CATEGORY & SKU */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between text-[11px] tracking-[0.25em] uppercase text-stone-400 font-light border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => onNavigate('category', { category: product.category })}
              className="hover:text-black transition-colors text-black font-medium"
            >
              {product.category || 'Jewellery'}
            </button>
          </div>
          <div className="text-stone-500 font-normal">
            SKU: <span className="text-black">{product.sku || `SOF-${product.id.toUpperCase()}`}</span>
          </div>
        </div>
      </div>

      {/* MAIN PRODUCT HERO GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* LEFT: 1. PRODUCT IMAGES */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            
            {/* Thumbnail selector */}
            {product.images && product.images.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 shrink-0">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-20 sm:w-20 sm:h-24 border overflow-hidden transition-all duration-200 cursor-pointer bg-stone-50 shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-black ring-1 ring-black'
                        : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="relative flex-1 aspect-4/5 sm:aspect-square md:aspect-4/5 bg-stone-50 border border-stone-200 overflow-hidden group">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
                onClick={() => setIsZoomOpen(true)}
              />

              {/* Zoom Trigger Button */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs border border-stone-200 text-stone-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black cursor-pointer"
                aria-label="Expand image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                {product.isNew && (
                  <span className="px-3 py-1 bg-black text-white text-[10px] tracking-[0.25em] uppercase font-medium">
                    NEW
                  </span>
                )}
                {product.discountPercent && product.discountPercent > 0 && (
                  <span className="px-3 py-1 bg-[#B8860B] text-white text-[10px] tracking-[0.2em] uppercase font-medium">
                    SAVE {product.discountPercent}%
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: PRODUCT DETAILS & PURCHASE AREA */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Category / Subcategory & Ratings */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.3em] uppercase text-stone-400 font-light">
                {product.subcategory || product.category || 'Jewellery'}
              </span>

              {/* Rating stars */}
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
                <span className="text-stone-700 font-medium text-[11px] tracking-wide">
                  {product.rating || 5.0} ({productReviews.length || product.reviewCount || 1} reviews)
                </span>
              </div>
            </div>

            {/* 3. PRODUCT NAME */}
            <div>
              <h1 className="font-editorial text-3xl sm:text-4xl tracking-[0.05em] uppercase text-black font-normal leading-tight">
                {product.name}
              </h1>
              {product.subtitle && (
                <p className="text-xs sm:text-sm text-stone-500 font-light tracking-wider mt-1.5">
                  {product.subtitle}
                </p>
              )}
            </div>

            {/* 6. PRICE DISPLAY */}
            <div className="py-2.5 border-y border-stone-200 flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-medium tracking-tight text-black">
                {formatPKR(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-base text-stone-400 line-through tracking-normal">
                  {formatPKR(product.compareAtPrice)}
                </span>
              )}
              {product.discountPercent && product.discountPercent > 0 && (
                <span className="px-2.5 py-0.5 text-[10px] tracking-[0.15em] uppercase font-medium bg-[#B8860B]/10 text-[#8C6B14] border border-[#B8860B]/20">
                  Save {formatPKR(product.compareAtPrice! - product.price)}
                </span>
              )}
            </div>

            {/* 4. SHORT DESCRIPTION */}
            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed tracking-wide">
              {product.description}
            </p>

            {/* 5. MATERIAL / FINISH SELECTOR & RING SIZE */}
            {isRing && (
              <div className="space-y-1.5 text-xs">
                <span className="tracking-[0.2em] uppercase text-black font-medium">
                  Size: <span className="text-stone-700 font-normal">Adjustable — One Size</span>
                </span>
              </div>
            )}

            {product.variants && product.variants.length > 0 ? (
              product.variants
                .filter((variant) => !isRing || !variant.name.toLowerCase().includes('size'))
                .map((variant) => (
                  <div key={variant.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="tracking-[0.2em] uppercase text-black font-medium">
                        {variant.name}:
                      </span>
                      <span className="text-stone-600 font-normal">
                        {selectedOptions[variant.name] || variant.options[0]?.name}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((opt) => {
                        const isSelected = selectedOptions[variant.name] === opt.name;
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => handleOptionSelect(variant.name, opt.name, opt.image)}
                            className={`px-4 py-2 border text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-black bg-black text-white font-medium'
                                : 'border-stone-300 bg-white text-stone-800 hover:border-black'
                            }`}
                          >
                            {opt.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
            ) : product.material ? (
              <div className="space-y-1.5 text-xs">
                <span className="tracking-[0.2em] uppercase text-black font-medium block">
                  Material & Finish:
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 border border-stone-300 bg-stone-50 text-stone-800 text-xs">
                    {product.material}
                  </span>
                  {product.plating && (
                    <span className="px-3.5 py-1.5 border border-stone-300 bg-stone-50 text-stone-800 text-xs">
                      {product.plating}
                    </span>
                  )}
                </div>
              </div>
            ) : null}

            {/* 7. STOCK STATUS */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    !product.inStock
                      ? 'bg-rose-500'
                      : isLowStock
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-600'
                  }`}
                />
                <span
                  className={
                    !product.inStock
                      ? 'text-rose-600 font-medium'
                      : isLowStock
                      ? 'text-amber-700 font-medium'
                      : 'text-emerald-700 font-medium'
                  }
                >
                  {!product.inStock
                    ? 'Out of Stock'
                    : isLowStock
                    ? `Only ${stockCount} left — Order soon`
                    : 'In Stock (Ready to Ship)'}
                </span>
              </div>
            </div>

            {/* 8. SIMPLE BENEFITS LIST */}
            <div className="p-4 bg-[#FAF9F6] border border-stone-200/80 rounded-none">
              <ul className="grid grid-cols-2 gap-2.5 text-xs text-stone-700 font-light">
                {benefitsList.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-black shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* MAKE IT A GIFT ♡ */}
            <div className="p-4 sm:p-5 bg-[#FAF9F6] border border-stone-200/90 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-black">
                  MAKE IT A GIFT ♡
                </span>
                {giftCharges > 0 && (
                  <span className="text-xs font-semibold text-black tracking-wide">
                    + {formatPKR(giftCharges)}
                  </span>
                )}
              </div>

              {/* Checkbox 1: Personal Note */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addPersonalNote}
                    onChange={(e) => {
                      setAddPersonalNote(e.target.checked);
                      if (!e.target.checked) setPersonalNoteText('');
                    }}
                    className="mt-0.5 w-4 h-4 accent-black rounded-none cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <span className="text-stone-800 tracking-wide font-normal">
                      Add a personal note — <span className="font-semibold text-black">Rs. 350</span>
                    </span>
                  </div>
                </label>

                {addPersonalNote && (
                  <div className="pl-7 pt-1">
                    <textarea
                      rows={3}
                      value={personalNoteText}
                      onChange={(e) => setPersonalNoteText(e.target.value)}
                      placeholder="Enter your personal gift message to be handwritten or printed on our signature card..."
                      className="w-full bg-white border border-stone-300 p-2.5 text-xs text-black placeholder:text-stone-400 focus:border-black focus:outline-none resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-stone-500 font-light mt-1">
                      Your personal note will be elegantly printed and included with the atelier packaging.
                    </p>
                  </div>
                )}
              </div>

              {/* Checkbox 2: Gift Wrap */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={giftWrapOrder}
                    onChange={(e) => setGiftWrapOrder(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-black rounded-none cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <span className="text-stone-800 tracking-wide font-normal">
                      Gift wrap my order — <span className="font-semibold text-black">Rs. 520</span>
                    </span>
                  </div>
                </label>
              </div>

              {/* Selected Options and Charges Breakdown */}
              {(addPersonalNote || giftWrapOrder) && (
                <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-stone-600">
                  <span>
                    Selected:{' '}
                    {addPersonalNote && giftWrapOrder
                      ? 'Personal note (Rs. 350) + Gift wrap (Rs. 520)'
                      : addPersonalNote
                      ? 'Personal note (Rs. 350)'
                      : 'Gift wrap (Rs. 520)'}
                  </span>
                  <span className="font-semibold text-black">
                    Total additional gift charges: Rs. {giftCharges}
                  </span>
                </div>
              )}
            </div>

            {/* 9. QUANTITY SELECTOR & ADD TO CART */}
            <div ref={purchaseActionRef} className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity Box */}
                <div className="flex items-center border border-stone-300 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-stone-600 hover:text-black transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(stockCount, quantity + 1))}
                    className="p-3 text-stone-600 hover:text-black transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 py-4 bg-black text-white hover:bg-stone-800 transition-colors text-xs tracking-[0.25em] uppercase font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{product.inStock ? 'Add to Cart' : 'Sold Out'}</span>
                </button>
              </div>

              {/* Buy It Now Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="w-full py-3.5 border border-black bg-white text-black hover:bg-stone-50 transition-colors text-xs tracking-[0.25em] uppercase font-medium cursor-pointer disabled:opacity-50"
              >
                Buy It Now &bull; Cash on Delivery
              </button>
            </div>

            {/* 10. REASSURANCE ROW */}
            <div className="pt-4 border-t border-stone-200">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-stone-600 font-light">
                <div className="flex flex-col items-center gap-1.5 p-2 bg-stone-50/70 border border-stone-200/60">
                  <Truck className="w-4 h-4 text-black stroke-[1.25]" />
                  <span className="tracking-wider uppercase">Nationwide Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 bg-stone-50/70 border border-stone-200/60">
                  <CreditCard className="w-4 h-4 text-black stroke-[1.25]" />
                  <span className="tracking-wider uppercase">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 bg-stone-50/70 border border-stone-200/60">
                  <ShieldCheck className="w-4 h-4 text-black stroke-[1.25]" />
                  <span className="tracking-wider uppercase">Authenticity Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Share link button */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleShare}
                className="text-[11px] tracking-[0.18em] uppercase text-stone-400 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Link Copied!' : 'Share This Piece'}</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 11. PRODUCT DETAILS ACCORDIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto border-t border-stone-200 divide-y divide-stone-200">
          
          {/* Accordion 1: Shipping Information */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('shipping')}
              className="w-full py-5 flex items-center justify-between text-left cursor-pointer group"
            >
              <span className="text-xs tracking-[0.2em] uppercase font-medium text-black group-hover:text-stone-600 transition-colors">
                Shipping Information
              </span>
              <ChevronDown className={`w-4 h-4 text-black transition-transform duration-300 ${
                activeAccordion === 'shipping' ? 'rotate-180' : ''
              }`} />
            </button>
            {activeAccordion === 'shipping' && (
              <div className="pb-6 text-xs text-stone-600 font-light leading-relaxed whitespace-pre-line">
                {shippingText}
              </div>
            )}
          </div>

          {/* Accordion 2: Secure Payment */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('payment')}
              className="w-full py-5 flex items-center justify-between text-left cursor-pointer group"
            >
              <span className="text-xs tracking-[0.2em] uppercase font-medium text-black group-hover:text-stone-600 transition-colors">
                Secure Payment
              </span>
              <ChevronDown className={`w-4 h-4 text-black transition-transform duration-300 ${
                activeAccordion === 'payment' ? 'rotate-180' : ''
              }`} />
            </button>
            {activeAccordion === 'payment' && (
              <div className="pb-6 text-xs text-stone-600 font-light leading-relaxed whitespace-pre-line">
                {paymentText}
              </div>
            )}
          </div>

          {/* Accordion 3: About This Piece */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('about')}
              className="w-full py-5 flex items-center justify-between text-left cursor-pointer group"
            >
              <span className="text-xs tracking-[0.2em] uppercase font-medium text-black group-hover:text-stone-600 transition-colors">
                About This Piece
              </span>
              <ChevronDown className={`w-4 h-4 text-black transition-transform duration-300 ${
                activeAccordion === 'about' ? 'rotate-180' : ''
              }`} />
            </button>
            {activeAccordion === 'about' && (
              <div className="pb-6 text-xs text-stone-600 font-light leading-relaxed space-y-3">
                <p className="whitespace-pre-line">{aboutText}</p>
                
                {/* Specific Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {product.material && (
                    <div className="p-3 bg-[#FAF9F6] border border-stone-200">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block">Material</span>
                      <span className="font-medium text-black">{product.material}</span>
                    </div>
                  )}
                  {product.plating && (
                    <div className="p-3 bg-[#FAF9F6] border border-stone-200">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block">Plating</span>
                      <span className="font-medium text-black">{product.plating}</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="p-3 bg-[#FAF9F6] border border-stone-200">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block">Dimensions</span>
                      <span className="font-medium text-black">{product.dimensions}</span>
                    </div>
                  )}
                  {product.stone && (
                    <div className="p-3 bg-[#FAF9F6] border border-stone-200">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block">Stone</span>
                      <span className="font-medium text-black">{product.stone}</span>
                    </div>
                  )}
                </div>

                {product.details && product.details.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 pt-2">
                    {product.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Accordion 4: Care Instructions */}
          <div>
            <button
              type="button"
              onClick={() => toggleAccordion('care')}
              className="w-full py-5 flex items-center justify-between text-left cursor-pointer group"
            >
              <span className="text-xs tracking-[0.2em] uppercase font-medium text-black group-hover:text-stone-600 transition-colors">
                Care Instructions
              </span>
              <ChevronDown className={`w-4 h-4 text-black transition-transform duration-300 ${
                activeAccordion === 'care' ? 'rotate-180' : ''
              }`} />
            </button>
            {activeAccordion === 'care' && (
              <div className="pb-6 text-xs text-stone-600 font-light leading-relaxed whitespace-pre-line">
                {careText}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 12. 30-DAY MONEY-BACK GUARANTEE BLOCK */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-8 sm:p-10 bg-[#FAF9F6] border border-stone-200 text-center">
          <div className="w-12 h-12 rounded-full bg-white border border-stone-200 text-stone-800 flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-5 h-5 stroke-[1.25]" />
          </div>
          <h3 className="font-editorial text-xl sm:text-2xl uppercase tracking-wider text-black mb-3">
            {siteSettings?.moneyBackGuarantee?.title || '30-DAY MONEY-BACK GUARANTEE'}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 font-light max-w-xl mx-auto leading-relaxed">
            {siteSettings?.moneyBackGuarantee?.description ||
              "Shop with confidence. If you're not satisfied with your purchase, you're covered by our 30-day money-back guarantee, subject to SOFYRA's return policy."}
          </p>
        </div>
      </section>

      {/* 13. “WORN BY YOU” / CUSTOMER STYLING GALLERY */}
      <WornByYouSection
        items={wornByYouItems}
        allProducts={allProducts}
        onNavigate={onNavigate}
        title="Worn By You"
        subtitle="@sofyra.pk"
      />

      {/* 14. CUSTOMER REVIEWS SECTION */}
      <ReviewsSection
        reviews={reviews}
        onReviewAdded={onReviewAdded}
        productId={product.id}
        productName={product.name}
        title="Customer Reviews"
        subtitle="Verified Feedback"
      />

      {/* 15. RELATED PRODUCTS / “COMPLETE THE LOOK” */}
      {fallbackRelated.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-stone-200">
          <div className="flex items-center justify-between mb-10 pb-4 border-b border-stone-100">
            <div>
              <span className="text-[11px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-1">
                Curated Suggestions
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl uppercase tracking-wider text-black">
                You May Also Like
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="text-xs tracking-[0.2em] uppercase text-stone-600 hover:text-black font-medium border-b border-stone-300 pb-0.5"
            >
              Explore Collection
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {fallbackRelated.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      )}

      {/* STICKY MOBILE PURCHASE BAR */}
      <StickyMobileBar
        product={product}
        selectedOptions={selectedOptions}
        onAddToCart={handleAddToCart}
        isVisible={showStickyBar}
      />

      {/* FULLSCREEN ZOOM MODAL */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-stone-300 p-2 cursor-pointer"
            aria-label="Close zoom"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
};
