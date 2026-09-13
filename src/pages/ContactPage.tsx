import React, { useState } from 'react';
import { ContactInfo } from '../types';
import { Mail, MessageCircle, Clock, MapPin, Send, CheckCircle2, Phone, ShieldCheck, HelpCircle } from 'lucide-react';

interface ContactPageProps {
  contactInfo?: ContactInfo;
  onNavigate?: (page: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ contactInfo, onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const email = contactInfo?.email || 'sofyrastore@gmail.com';
  const whatsapp = contactInfo?.whatsapp || '+92 300 1234567';
  const businessHours = contactInfo?.businessHours || 'Monday – Saturday: 10:00 AM – 7:00 PM PKT';
  const messageText = contactInfo?.customerSupportMessage || 'Our customer care team is available to assist with order tracking, sizing guidance, and product enquiries.';
  const address = contactInfo?.address || 'Lahore, Pakistan';

  const cleanWhatsappNumber = whatsapp.replace(/[^0-9]/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', orderNumber: '', message: '' });
      setTimeout(() => setSubmitted(false), 8000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="bg-[#FAF9F6] border-b border-stone-200 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[11px] tracking-[0.35em] uppercase text-stone-400 font-light block mb-3">
            Atelier Care & Support
          </span>
          <h1 className="font-editorial text-4xl md:text-5xl lg:text-6xl tracking-[0.06em] font-light text-black uppercase mb-4">
            Contact Us
          </h1>
          <p className="text-xs md:text-sm text-stone-600 font-light max-w-xl mx-auto leading-relaxed">
            {messageText}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Direct Channels & Information */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-2">
                Direct Channels
              </span>
              <h2 className="font-editorial text-2xl md:text-3xl tracking-[0.05em] uppercase text-black font-normal mb-6">
                Get in Touch
              </h2>
              <p className="text-xs md:text-sm text-stone-600 font-light leading-relaxed mb-8">
                Whether you have an enquiry about bespoke sizing, order tracking, or styling recommendations, our concierge is here to assist.
              </p>
            </div>

            {/* Contact Channels Cards */}
            <div className="space-y-4">
              
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${cleanWhatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 border border-stone-200 hover:border-black transition-colors group bg-white"
              >
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-black shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                  <MessageCircle className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block font-medium">
                    WhatsApp Chat (Instant Assistance)
                  </span>
                  <span className="text-sm font-medium text-black mt-0.5 block">
                    {whatsapp}
                  </span>
                  <span className="text-xs text-stone-500 font-light mt-1 block">
                    Click to start chat with our team
                  </span>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${email}`}
                className="flex items-start gap-4 p-5 border border-stone-200 hover:border-black transition-colors group bg-white"
              >
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-black shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                  <Mail className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block font-medium">
                    Email Enquiries
                  </span>
                  <span className="text-sm font-medium text-black mt-0.5 block">
                    {email}
                  </span>
                  <span className="text-xs text-stone-500 font-light mt-1 block">
                    Response within 24 business hours
                  </span>
                </div>
              </a>

              {/* Business Hours */}
              <div className="flex items-start gap-4 p-5 border border-stone-200 bg-stone-50/50">
                <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                  <Clock className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block font-medium">
                    Operating Hours
                  </span>
                  <span className="text-sm font-medium text-black mt-0.5 block">
                    {businessHours}
                  </span>
                  <span className="text-xs text-stone-500 font-light mt-1 block">
                    Pakistan Standard Time (PKT)
                  </span>
                </div>
              </div>

              {/* Atelier Studio */}
              <div className="flex items-start gap-4 p-5 border border-stone-200 bg-stone-50/50">
                <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                  <MapPin className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block font-medium">
                    Atelier Location
                  </span>
                  <span className="text-sm font-medium text-black mt-0.5 block">
                    {address}
                  </span>
                  <span className="text-xs text-stone-500 font-light mt-1 block">
                    Nationwide shipping across all cities
                  </span>
                </div>
              </div>

            </div>

            {/* Reassurance Box */}
            <div className="p-6 border border-stone-200 bg-[#FAF9F6]">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="w-5 h-5 text-black" />
                <h4 className="font-editorial text-lg uppercase tracking-wider text-black">
                  Order Tracking & Support
                </h4>
              </div>
              <p className="text-xs text-stone-600 font-light leading-relaxed">
                Have an existing order? Please include your order confirmation ID (e.g. #SOF-...) so our team can immediately look up tracking details and carrier dispatch status.
              </p>
            </div>

          </div>

          {/* Right Column: Clean Minimal Contact Form */}
          <div className="lg:col-span-7 bg-[#FAF9F6] p-8 sm:p-12 border border-stone-200">
            <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-2">
              Send a Message
            </span>
            <h2 className="font-editorial text-2xl md:text-3xl tracking-[0.05em] uppercase text-black font-normal mb-8">
              Enquiry Form
            </h2>

            {submitted ? (
              <div className="p-8 border border-black bg-white text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-black mx-auto" />
                <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                  Message Sent
                </h3>
                <p className="text-xs md:text-sm text-stone-600 font-light max-w-md mx-auto leading-relaxed">
                  Thank you for contacting SOFYRA. Our concierge team has received your message and will respond to <span className="font-medium text-black">{formData.email || 'your email'}</span> within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-6 py-2.5 border border-black text-xs tracking-[0.2em] uppercase font-medium hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase font-medium text-stone-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ayesha Khan"
                      className="w-full bg-white border border-stone-300 px-4 py-3 text-xs tracking-wide text-black placeholder:text-stone-400 focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase font-medium text-stone-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. ayesha@example.com"
                      className="w-full bg-white border border-stone-300 px-4 py-3 text-xs tracking-wide text-black placeholder:text-stone-400 focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase font-medium text-stone-700 mb-2">
                    Order Number <span className="text-stone-400 font-light text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    placeholder="e.g. SOF-ORD-1049"
                    className="w-full bg-white border border-stone-300 px-4 py-3 text-xs tracking-wide text-black placeholder:text-stone-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase font-medium text-stone-700 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us how we can help you with styling, ring sizes, or order enquiries..."
                    className="w-full bg-white border border-stone-300 px-4 py-3 text-xs tracking-wide text-black placeholder:text-stone-400 focus:outline-none focus:border-black transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-10 py-4 bg-black text-white text-xs tracking-[0.25em] uppercase font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sending Enquiry...' : 'Submit Message'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Response Time Guarantee */}
            <div className="mt-8 pt-6 border-t border-stone-200/80 flex items-center gap-3 text-xs text-stone-500">
              <Clock className="w-4 h-4 text-stone-700 shrink-0" />
              <span>Standard Concierge Response Time: within 24 business hours.</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
