import React, { useState } from 'react';

interface PoliciesPageProps {
  initialTab?: string;
  onNavigate: (page: string, data?: any) => void;
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ initialTab = 'shipping', onNavigate }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10 pb-6 border-b border-stone-200">
          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-2">
            Transparency & Trust
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl uppercase tracking-[0.06em] text-black font-light">
            Customer Care & Policies
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-2 sm:gap-6 border-b border-stone-200 mb-8 overflow-x-auto text-xs pb-3">
          {[
            { id: 'shipping', label: 'Shipping' },
            { id: 'returns', label: 'Returns & Exchange' },
            { id: 'privacy', label: 'Privacy Policy' },
            { id: 'terms', label: 'Terms of Service' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-b-2 border-black text-black font-semibold'
                  : 'text-stone-400 hover:text-black font-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-stone-200 p-6 sm:p-10 text-xs sm:text-sm text-stone-600 font-light leading-relaxed space-y-4">
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <h3 className="font-editorial text-xl uppercase tracking-wider text-black">
                Nationwide Delivery in Pakistan
              </h3>
              <p>
                SOFYRA delivers nationwide across Pakistan using leading courier partners (TCS, Leopard Courier, Trax).
              </p>
              <h4 className="font-semibold text-black uppercase tracking-wider text-xs pt-2">Delivery Times:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Major Metros (Lahore, Karachi, Islamabad, Rawalpindi): 2-3 business days.</li>
                <li>Other Cities & Towns: 3-5 business days.</li>
              </ul>
              <h4 className="font-semibold text-black uppercase tracking-wider text-xs pt-2">Shipping Charges:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Orders PKR 3,500 and above: FREE Nationwide Express Delivery.</li>
                <li>Orders below PKR 3,500: Flat PKR 250 delivery fee.</li>
              </ul>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4">
              <h3 className="font-editorial text-xl uppercase tracking-wider text-black">
                7-Day Replacement Guarantee
              </h3>
              <p>
                We stand behind our craftsmanship. If your jewellery piece arrives damaged, defective, or with an incorrect ring size, we offer an effortless exchange within 7 days of package delivery.
              </p>
              <h4 className="font-semibold text-black uppercase tracking-wider text-xs pt-2">Exchange Requirements:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Items must be unworn and in original condition with the security tag intact.</li>
                <li>Original velvet box and packaging must be included.</li>
                <li>Contact our concierge on WhatsApp (+92 300 1234567) with your order number and photos.</li>
              </ul>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="font-editorial text-xl uppercase tracking-wider text-black">
                Privacy & Data Protection
              </h3>
              <p>
                At SOFYRA, we take your personal data privacy seriously. Your contact information, delivery addresses, and order history are kept confidential and are used strictly to fulfill your orders and keep you updated on shipments.
              </p>
              <p>
                We never sell, rent, or trade your personal information to third-party marketing brokers.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h3 className="font-editorial text-xl uppercase tracking-wider text-black">
                Terms of Service
              </h3>
              <p>
                By placing an order on SOFYRA, you agree to these terms. All prices listed are in Pakistani Rupees (PKR). While we strive for photographic accuracy, minor differences in stone refraction and hand-finishing may naturally occur due to the artisanal nature of fine jewellery.
              </p>
              <p>
                SOFYRA reserves the right to verify high-value cash-on-delivery orders via phone call or WhatsApp before dispatch.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
