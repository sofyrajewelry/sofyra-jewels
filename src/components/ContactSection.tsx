import React, { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { storageService } from '../services/storageService';

interface ContactSectionProps {
  contactPageImage?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ contactPageImage }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultImage = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1200&auto=format&fit=crop";
  const imageSrc = contactPageImage || storageService.getHomepageContent()?.contactPage?.image || storageService.getContactInfo()?.contactImage || defaultImage;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 700);
  };

  return (
    <section id="contact-section" className="py-16 md:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Split Section matching Screenshot 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
          
          {/* Left: Editorial Portrait in full original color */}
          <div className="lg:col-span-5 h-[340px] sm:h-[420px] lg:h-[500px] overflow-hidden bg-stone-100 border border-stone-200">
            <img
              src={imageSrc}
              alt="SOFYRA jewellery styling consultation"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Right: Editorial Minimal Form matching Screenshot 2 */}
          <div className="lg:col-span-7 flex flex-col justify-center lg:pl-6">
            
            <div className="mb-8">
              <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-2">
                Atelier Concierge
              </span>
              <h2 className="font-editorial text-3xl md:text-5xl tracking-[0.06em] font-light text-black uppercase mb-3">
                Contact Us
              </h2>
              <p className="text-xs md:text-sm text-stone-600 font-light uppercase tracking-wider leading-relaxed max-w-lg">
                Leave your information — we will be happy to answer your questions and help you choose jewelry.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 border border-black bg-stone-50 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-black mx-auto" />
                <h4 className="font-editorial text-2xl uppercase tracking-wider">Message Received</h4>
                <p className="text-xs text-stone-600 font-light tracking-wide max-w-sm mx-auto">
                  Our jewellery advisor will reach out to you via WhatsApp or Email within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* NAME */}
                <div>
                  <label className="block text-[11px] tracking-[0.25em] uppercase text-black font-medium mb-1.5">
                    NAME:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="YOUR FULL NAME"
                    className="w-full bg-transparent border-b border-stone-300 py-2.5 text-xs text-black tracking-wider placeholder:text-stone-400 focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                {/* EMAIL & PHONE GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] tracking-[0.25em] uppercase text-black font-medium mb-1.5">
                      EMAIL:
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="NAME@EXAMPLE.COM"
                      className="w-full bg-transparent border-b border-stone-300 py-2.5 text-xs text-black tracking-wider placeholder:text-stone-400 focus:border-black focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-[0.25em] uppercase text-black font-medium mb-1.5">
                      PHONE:
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+92 (300) 000-0000"
                      className="w-full bg-transparent border-b border-stone-300 py-2.5 text-xs text-black tracking-wider placeholder:text-stone-400 focus:border-black focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* MESSAGE */}
                <div>
                  <label className="block text-[11px] tracking-[0.25em] uppercase text-black font-medium mb-1.5">
                    MESSAGE:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="HOW CAN WE ASSIST YOU TODAY?"
                    className="w-full bg-transparent border-b border-stone-300 py-2.5 text-xs text-black tracking-wider placeholder:text-stone-400 focus:border-black focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* SEND BUTTON (Thin border minimal aesthetic matching Screenshot 2) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-10 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-[11px] tracking-[0.3em] uppercase font-medium cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isSubmitting ? 'SENDING...' : 'SEND'}</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
