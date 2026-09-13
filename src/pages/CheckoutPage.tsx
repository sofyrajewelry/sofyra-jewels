import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { storageService } from '../services/storageService';
import { Order, PaymentMethod } from '../types';
import { formatPKR } from '../utils/format';
import {
  ShieldCheck,
  Truck,
  Building2,
  Phone,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';

interface CheckoutPageProps {
  onOrderPlaced: (order: Order) => void;
  onNavigate: (page: string, data?: any) => void;
}

const PAKISTANI_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Abbottabad',
  'Bahawalpur',
  'Other City'
];

const PAKISTANI_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa (KPK)',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu & Kashmir (AJK)',
  'Gilgit-Baltistan'
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onOrderPlaced, onNavigate }) => {
  const { items, subtotal, shippingFee, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Lahore',
    province: 'Punjab',
    orderNotes: '',
    paymentMethod: 'cod' as PaymentMethod
  });

  const isBankTransfer = formData.paymentMethod === 'bank_transfer';
  const bankTransferDiscount = isBankTransfer ? Math.round(subtotal * 0.10) : 0;
  const finalTotal = Math.max(0, subtotal - bankTransferDiscount + shippingFee);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIban, setCopiedIban] = useState(false);

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2500);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#FAF9F6]">
        <h2 className="font-editorial text-3xl uppercase tracking-wider text-black mb-3">
          Your Bag is Empty
        </h2>
        <p className="text-xs text-stone-500 font-light max-w-sm mb-6">
          Please add fine jewellery pieces to your bag before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('shop')}
          className="px-8 py-3 bg-black text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Explore Collection
        </button>

        {/* Order Benefits & Assurance */}
        <div className="mt-12 w-full max-w-md bg-stone-50/80 border border-stone-300 p-6 space-y-4 text-left">
          <div className="pb-3 border-b border-stone-200">
            <span className="text-[11px] tracking-[0.2em] uppercase text-stone-900 font-bold">
              Order Benefits & Assurance
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
              <div>
                <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                  SAVE 10% WITH BANK TRANSFER
                </span>
                <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                  Pay via Direct Bank Transfer and receive 10% OFF your order.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
              <div>
                <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                  FREE DELIVERY OVER PKR 3,500
                </span>
                <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                  Complimentary delivery across Pakistan on orders over PKR 3,500.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
              <div>
                <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                  PREMIUM QUALITY JEWELLERY
                </span>
                <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                  Carefully selected premium-quality jewellery.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
              <div>
                <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                  BEAUTIFULLY PACKED
                </span>
                <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                  Every order is carefully and beautifully packed.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
              <div>
                <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                  30-DAY MONEY-BACK GUARANTEE
                </span>
                <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                  Shop with confidence with our 30-day money-back guarantee.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setErrorMsg(null);

    // Form validation
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMsg('Please fill in all required shipping fields.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const newOrder = storageService.saveOrder({
          customerName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          orderNotes: formData.orderNotes,
          items: [...items],
          subtotal,
          shippingFee,
          discountAmount: bankTransferDiscount,
          total: finalTotal,
          paymentMethod: formData.paymentMethod
        });

        clearCart();
        setIsProcessing(false);
        onOrderPlaced(newOrder);
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
        setErrorMsg('An error occurred while creating your order. Please try again.');
      }
    }, 800);
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen pt-8 pb-24 sm:pb-28 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          type="button"
          onClick={() => onNavigate('shop')}
          className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-stone-500 hover:text-black mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Shopping</span>
        </button>

        <div className="mb-8 pb-4 border-b border-stone-200">
          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-1">
            Express Nationwide Checkout
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl uppercase tracking-[0.06em] text-black font-light">
            Checkout Details
          </h1>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* LEFT COLUMN: CUSTOMER INFO, DELIVERY & PAYMENT */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* 1. Contact & Customer Information */}
              <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-4">
                <h3 className="font-editorial text-xl uppercase tracking-wider text-black pb-3 border-b border-stone-100">
                  1. Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1.5 font-medium">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Zara Ahmed"
                      className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-xs text-black focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1.5 font-medium">
                      Phone Number (for Courier & SMS) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-xs text-black focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1.5 font-medium">
                    Email Address (for Order Receipt)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="zara.ahmed@example.com"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-xs text-black focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. Shipping Address */}
              <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-4">
                <h3 className="font-editorial text-xl uppercase tracking-wider text-black pb-3 border-b border-stone-100">
                  2. Shipping Address in Pakistan
                </h3>

                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1.5 font-medium">
                    Street Address & House / Flat No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House 12, Street 4, Sector F-7/2 or DHA Phase 5"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-xs text-black focus:border-black focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1.5 font-medium">
                      City *
                    </label>
                    <select
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-xs text-black focus:border-black focus:outline-none uppercase"
                    >
                      {PAKISTANI_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1.5 font-medium">
                      Province *
                    </label>
                    <select
                      value={formData.province}
                      onChange={e => setFormData({ ...formData, province: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-xs text-black focus:border-black focus:outline-none"
                    >
                      {PAKISTANI_PROVINCES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1.5 font-medium">
                    Order Delivery Notes / Landmark (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.orderNotes}
                    onChange={e => setFormData({ ...formData, orderNotes: e.target.value })}
                    placeholder="e.g. Please deliver after 2 PM or leave with security"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-xs text-black focus:border-black focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* 3. Payment Method */}
              <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-4">
                <h3 className="font-editorial text-xl uppercase tracking-wider text-black pb-3 border-b border-stone-100">
                  3. Select Payment Method
                </h3>

                <div className="space-y-3">
                  
                  {/* Option 1: Cash on Delivery */}
                  <label
                    className={`flex items-start gap-4 p-4 border cursor-pointer transition-all duration-200 ${
                      formData.paymentMethod === 'cod'
                        ? 'border-black bg-[#FAF9F6]'
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                      className="mt-1 accent-black"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-black">
                          Cash on Delivery (COD)
                        </span>
                        <Truck className="w-4 h-4 text-stone-700" />
                      </div>
                      <p className="text-[11px] text-stone-500 font-light mt-1">
                        Pay with cash to the courier upon delivery at your doorstep anywhere in Pakistan.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Bank Transfer */}
                  <div
                    className={`p-4 border transition-all duration-200 ${
                      formData.paymentMethod === 'bank_transfer'
                        ? 'border-black bg-[#FAF9F6]'
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={formData.paymentMethod === 'bank_transfer'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'bank_transfer' })}
                        className="mt-1 accent-black"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-black">
                            Direct Bank Transfer (HBL)
                          </span>
                          <Building2 className="w-4 h-4 text-stone-700" />
                        </div>
                        <p className="text-[11px] text-stone-500 font-light mt-1">
                          Transfer directly to our atelier corporate HBL bank account.
                        </p>
                      </div>
                    </label>

                    {formData.paymentMethod === 'bank_transfer' && (
                      <div className="mt-4 pt-3 border-t border-stone-200/80 bg-white p-3.5 space-y-2.5 text-xs">
                        <div className="p-3 bg-stone-50 border border-stone-200">
                          <span className="font-semibold uppercase tracking-wider text-[11px] block text-black">
                            SAVE 10% WITH BANK TRANSFER
                          </span>
                          <p className="text-[11px] text-stone-600 mt-0.5">
                            Pay via Direct Bank Transfer and receive 10% OFF your order.
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] tracking-wider uppercase text-stone-500 font-medium">Bank Name</span>
                          <span className="font-semibold text-black">Habib Bank Limited (HBL)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] tracking-wider uppercase text-stone-500 font-medium">Account Number</span>
                          <span className="font-mono font-medium text-black">0053727000158003</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                          <div>
                            <span className="text-[10px] tracking-wider uppercase text-stone-500 font-medium block">HBL IBAN</span>
                            <span className="font-mono text-xs font-bold text-black tracking-wider">
                              PK12HABB0053727000158003
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyIban('PK12HABB0053727000158003')}
                            className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border border-black bg-black text-white hover:bg-stone-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedIban ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy IBAN</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-500 font-light pt-1 border-t border-stone-100">
                          Please share transaction confirmation receipt or screenshot on WhatsApp after placing order.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                <div className="pt-2 text-[11px] text-stone-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-700" />
                  <span>Your information is encrypted and securely processed. Online payment gateways will be seamlessly integrated upon official merchant expansion.</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY & SUBMIT */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6 lg:sticky lg:top-28 shadow-xs">
                <h3 className="font-editorial text-xl uppercase tracking-wider text-black pb-3 border-b border-stone-100">
                  Order Summary
                </h3>

                {/* Items in Checkout */}
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.id} className="py-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-12 h-14 object-cover border border-stone-200 bg-stone-100 shrink-0"
                        />
                        <div>
                          <h4 className="font-medium text-black uppercase tracking-wider line-clamp-1">
                            {item.product.name}
                          </h4>
                          <span className="text-stone-500 text-[11px]">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                      <span className="font-semibold text-black shrink-0">
                        {formatPKR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Breakdown */}
                <div className="space-y-2 pt-3 border-t border-stone-200 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-black">{formatPKR(subtotal)}</span>
                  </div>

                  {isBankTransfer && bankTransferDiscount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-medium">
                      <span>Bank Transfer Discount (10%)</span>
                      <span>-{formatPKR(bankTransferDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>Delivery Across Pakistan</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-emerald-800 font-semibold uppercase text-[11px]">Free</span>
                      ) : (
                        formatPKR(shippingFee)
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-between text-base font-bold text-black">
                    <span>Total Amount</span>
                    <span>{formatPKR(finalTotal)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-black text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs tracking-[0.25em] uppercase font-semibold cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isProcessing ? 'Confirming Order...' : 'Confirm Order & Place'}</span>
                </button>

                <div className="pt-2 text-[10px] tracking-wider uppercase text-stone-400 text-center font-light">
                  Free returns within 7 days &bull; Authentic 925 Silver
                </div>

              </div>

              {/* CHECKOUT BENEFITS & SAVINGS */}
              <div className="bg-stone-50/80 border border-stone-300 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <span className="text-[11px] tracking-[0.2em] uppercase text-stone-900 font-bold">
                    Order Benefits & Assurance
                  </span>
                  {shippingFee === 0 ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] uppercase font-semibold tracking-wider border border-emerald-300">
                      Free Delivery
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-700 font-medium tracking-wide">
                      Add {formatPKR(3500 - subtotal)} for Free Shipping
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                        SAVE 10% WITH BANK TRANSFER
                      </span>
                      <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                        Pay via Direct Bank Transfer and receive 10% OFF your order.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                        FREE DELIVERY OVER PKR 3,500
                      </span>
                      <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                        Complimentary delivery across Pakistan on orders over PKR 3,500.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                        PREMIUM QUALITY JEWELLERY
                      </span>
                      <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                        Carefully selected premium-quality jewellery.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                        BEAUTIFULLY PACKED
                      </span>
                      <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                        Every order is carefully and beautifully packed.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="text-black font-bold text-xs shrink-0 mt-0.5">✓</span>
                    <div>
                      <span className="font-semibold text-black uppercase tracking-wider text-xs block">
                        30-DAY MONEY-BACK GUARANTEE
                      </span>
                      <span className="text-stone-600 text-xs mt-0.5 block leading-relaxed">
                        Shop with confidence with our 30-day money-back guarantee.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </form>

      </div>
    </div>
  );
};
