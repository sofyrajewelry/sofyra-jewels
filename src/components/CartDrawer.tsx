import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { formatPKR } from '../utils/format';

interface CartDrawerProps {
  onNavigate: (page: string, data?: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    shippingFee,
    total,
    freeShippingThreshold,
    amountUntilFreeShipping,
    totalItemsCount
  } = useCart();

  if (!isCartDrawerOpen) return null;

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false);
    onNavigate('checkout');
  };

  const handleProductClick = (slug: string) => {
    setIsCartDrawerOpen(false);
    onNavigate('product', { slug });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-black" />
            <h3 className="font-editorial text-xl uppercase tracking-wider text-black">
              Shopping Bag ({totalItemsCount})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1.5 text-stone-500 hover:text-black transition-colors cursor-pointer"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-b border-stone-200 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Truck className="w-3.5 h-3.5 text-[#B8860B]" />
            {amountUntilFreeShipping > 0 ? (
              <span className="text-stone-700 tracking-wide font-light">
                Add <span className="font-medium text-black">{formatPKR(amountUntilFreeShipping)}</span> for free nationwide delivery!
              </span>
            ) : (
              <span className="text-emerald-700 font-medium tracking-wide">
                You have unlocked Free Nationwide Delivery!
              </span>
            )}
          </div>
          <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
            <div
              className="bg-black h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-stone-100">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <ShoppingBag className="w-8 h-8 stroke-[1.2]" />
              </div>
              <h4 className="font-editorial text-2xl uppercase tracking-wide">Your Bag is Empty</h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto font-light leading-relaxed">
                Discover our signature rings, earrings, and tennis bracelets handcrafted in fine 925 silver.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  onNavigate('shop');
                }}
                className="mt-2 px-8 py-3 bg-black text-white text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 flex gap-4">
                {/* Thumbnail */}
                <div
                  onClick={() => handleProductClick(item.product.slug)}
                  className="w-20 h-24 bg-stone-100 border border-stone-200 overflow-hidden shrink-0 cursor-pointer"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        onClick={() => handleProductClick(item.product.slug)}
                        className="text-xs font-normal tracking-wider uppercase text-black hover:underline cursor-pointer line-clamp-1"
                      >
                        {item.product.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Selected Variants */}
                    {Object.entries(item.selectedVariantOptions).map(([key, val]) => (
                      <p key={key} className="text-[11px] text-stone-500 font-light mt-0.5">
                        {key}: <span className="text-stone-700">{val}</span>
                      </p>
                    ))}

                    <p className="text-xs font-medium text-black mt-1">
                      {formatPKR(item.unitPrice)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-stone-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 text-stone-600 hover:text-black hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 text-stone-600 hover:text-black hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs font-semibold text-black ml-auto">
                      {formatPKR(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout CTA */}
        {items.length > 0 && (
          <div className="p-6 border-t border-stone-200 bg-[#FAFAF8] space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium text-black">{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Nationwide Shipping</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-medium uppercase tracking-wider text-[11px]">Free</span>
                  ) : (
                    formatPKR(shippingFee)
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-medium text-black">
                <span>Total</span>
                <span className="font-semibold">{formatPKR(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckoutClick}
              className="w-full py-3.5 bg-black text-white hover:bg-stone-800 transition-colors text-xs tracking-[0.25em] uppercase font-medium flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCartDrawerOpen(false);
                onNavigate('shop');
              }}
              className="w-full py-2 text-center text-[11px] tracking-[0.2em] uppercase text-stone-500 hover:text-black transition-colors cursor-pointer"
            >
              Continue Browsing
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
