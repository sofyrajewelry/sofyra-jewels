import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, GiftOptions } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedOptions?: Record<string, string>,
    giftOptions?: GiftOptions
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  clearCart: () => void;
  subtotal: number;
  giftCharges: number;
  shippingFee: number;
  freeShippingThreshold: number;
  amountUntilFreeShipping: number;
  total: number;
  totalItemsCount: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'sofyra_cart_v1';
const FREE_SHIPPING_THRESHOLD = 3500;
const STANDARD_SHIPPING_FEE = 250;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedOptions: Record<string, string> = {},
    giftOptions?: GiftOptions
  ) => {
    // Generate unique ID based on product id + variant selections + gift options
    const optionKeys = Object.keys(selectedOptions).sort();
    const optionString = optionKeys.map(k => `${k}:${selectedOptions[k]}`).join('|');
    const giftKey = giftOptions
      ? `_note:${giftOptions.hasPersonalNote ? '1' : '0'}_wrap:${giftOptions.hasGiftWrap ? '1' : '0'}_text:${encodeURIComponent(giftOptions.personalNote || '')}`
      : '';
    const itemId = `${product.id}__${optionString}${giftKey}`;

    setItems(prevItems => {
      const existing = prevItems.find(item => item.id === itemId);
      if (existing) {
        return prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [
          ...prevItems,
          {
            id: itemId,
            product,
            selectedVariantOptions: selectedOptions,
            quantity,
            unitPrice: product.price,
            giftOptions: giftOptions && (giftOptions.hasPersonalNote || giftOptions.hasGiftWrap) ? giftOptions : undefined
          }
        ];
      }
    });

    showToast(`Added "${product.name}" to your bag.`);
    setIsCartDrawerOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const giftCharges = items.reduce((sum, item) => {
    let g = 0;
    if (item.giftOptions?.hasPersonalNote) g += 350;
    if (item.giftOptions?.hasGiftWrap) g += 520;
    return sum + g;
  }, 0);
  const totalItemsCount = items.reduce((count, item) => count + item.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const amountUntilFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const total = subtotal + giftCharges + shippingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        giftCharges,
        shippingFee,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        amountUntilFreeShipping,
        total,
        totalItemsCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isSearchOpen,
        setIsSearchOpen,
        toastMessage,
        showToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
