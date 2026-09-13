import React from 'react';
import { Order } from '../types';
import { formatPKR } from '../utils/format';
import { CheckCircle2, Truck, Package, MessageSquare, ArrowRight, Printer } from 'lucide-react';

interface OrderConfirmationPageProps {
  order: Order;
  onNavigate: (page: string, data?: any) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  onNavigate
}) => {
  const getPaymentInstructions = () => {
    switch (order.paymentMethod) {
      case 'cod':
        return (
          <div className="p-4 bg-stone-50 border border-stone-200 text-xs space-y-1">
            <span className="font-semibold text-black uppercase tracking-wider block">Cash on Delivery</span>
            <p className="text-stone-600">
              Please have exact cash of <strong>{formatPKR(order.total)}</strong> ready when the courier rider arrives at your doorstep. You will receive an SMS when the parcel is out for delivery.
            </p>
          </div>
        );
      case 'bank_transfer':
        return (
          <div className="p-4 bg-stone-50 border border-stone-200 text-xs space-y-2">
            <span className="font-semibold text-black uppercase tracking-wider block">HBL Bank Transfer Details</span>
            <div className="text-stone-700 space-y-1 font-mono text-[11px]">
              <p><strong>Bank:</strong> Habib Bank Limited (HBL)</p>
              <p><strong>Account Number:</strong> 0053727000158003</p>
              <p><strong>IBAN:</strong> PK12HABB0053727000158003</p>
            </div>
            <p className="text-stone-500 text-[11px]">
              After transferring, please share a screenshot of the payment receipt along with your Order #{order.orderNumber} to our WhatsApp at +92 300 1234567 for immediate dispatch.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Top Celebration Card */}
        <div className="bg-white border border-stone-200 p-8 md:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 border border-stone-200">
            <CheckCircle2 className="w-8 h-8 text-black" />
          </div>

          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-2">
            Order Successfully Placed
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl uppercase tracking-[0.06em] text-black font-light mb-3">
            Thank You, {order.customerName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-light max-w-md mx-auto leading-relaxed">
            Your order has been recorded in our atelier dispatch system. Our team is preparing your signature velvet box.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-stone-100 border border-stone-200 text-xs tracking-wider uppercase font-mono">
            <span>Order Number:</span>
            <span className="font-bold text-black">{order.orderNumber}</span>
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="mt-8 bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
          <h3 className="font-editorial text-xl uppercase tracking-wider text-black pb-3 border-b border-stone-100">
            Order Summary
          </h3>

          {/* Items */}
          <div className="divide-y divide-stone-100">
            {order.items.map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-14 h-16 object-cover border border-stone-200 bg-stone-100 shrink-0"
                  />
                  <div>
                    <h4 className="font-medium text-black uppercase tracking-wider">
                      {item.product.name}
                    </h4>
                    {Object.entries(item.selectedVariantOptions).map(([k, v]) => (
                      <p key={k} className="text-[10px] text-stone-500 font-light">
                        {k}: {v}
                      </p>
                    ))}
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Qty: {item.quantity} &times; {formatPKR(item.unitPrice)}
                    </p>
                  </div>
                </div>

                <span className="font-semibold text-black">
                  {formatPKR(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Calculations */}
          <div className="pt-4 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-black font-medium">{formatPKR(order.subtotal)}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 ? (
              <div className="flex justify-between text-emerald-800 font-medium">
                <span>Bank Transfer Discount (10%)</span>
                <span>-{formatPKR(order.discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span>Shipping Fee (TCS/Leopard)</span>
              <span>{order.shippingFee === 0 ? 'FREE' : formatPKR(order.shippingFee)}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-bold text-black">
              <span>Total Payable</span>
              <span>{formatPKR(order.total)}</span>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="pt-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-2 font-medium">
              Payment & Dispatch Instructions
            </span>
            {getPaymentInstructions()}
          </div>

          {/* Delivery Address */}
          <div className="pt-4 border-t border-stone-200 text-xs">
            <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1 font-medium">
              Shipping Destination
            </span>
            <p className="text-stone-800 font-medium">{order.customerName}</p>
            <p className="text-stone-600">{order.address}</p>
            <p className="text-stone-600">{order.city}, {order.province}</p>
            <p className="text-stone-600 mt-1">Phone: {order.phone}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href={`https://wa.me/923001234567?text=Hi%20SOFYRA%2C%20I%20just%20placed%20order%20%23${order.orderNumber}.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 border border-black bg-white text-black text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Chat On WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
};
