import React, { useState } from 'react';
import { ContactInfo } from '../../types';
import { storageService } from '../../services/storageService';
import { Mail, Phone, Clock, Instagram, Facebook, MessageSquare, MapPin, Check, Save } from 'lucide-react';

interface ContactInfoManagerProps {
  contactInfo: ContactInfo;
  onContactInfoUpdated: (info: ContactInfo) => void;
}

export const ContactInfoManager: React.FC<ContactInfoManagerProps> = ({
  contactInfo,
  onContactInfoUpdated
}) => {
  const [form, setForm] = useState<ContactInfo>(contactInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await storageService.saveContactInfo(form);
      onContactInfoUpdated(form);
      showSuccess('Contact details successfully updated across Contact Page, Footer, and Storefront!');
    } catch (e) {
      console.error('Failed to save contact info:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {successToast && (
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between text-xs tracking-wider uppercase font-medium">
          <span>{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-stone-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-1">
            Brand Communications
          </span>
          <h2 className="font-editorial text-2xl uppercase tracking-wider text-black">
            Editable Contact Information
          </h2>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Update your public client concierge email, direct WhatsApp support line, social handles, and working hours.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-medium flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Contact Info'}</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
        
        {/* Support Direct Lines */}
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase font-semibold text-black mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-stone-500" />
            <span>Direct Client Support</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Customer Service Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="care@sofyra.com"
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Displayed on the Contact Us page, product enquiry forms, and order confirmations.
              </span>
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                WhatsApp Concierge Number *
              </label>
              <input
                type="text"
                required
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black font-mono"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Direct WhatsApp link for instant client inquiries and custom sizing assistance.
              </span>
            </div>
          </div>
        </div>

        {/* Business Hours & Support Message */}
        <div className="pt-6 border-t border-stone-100">
          <h3 className="text-xs tracking-[0.2em] uppercase font-semibold text-black mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-500" />
            <span>Operating Hours & Concierge Message</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Business & Atelier Hours
              </label>
              <input
                type="text"
                value={form.businessHours}
                onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
                placeholder="Monday – Saturday: 10:00 AM – 8:00 PM PKT"
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Atelier Location / Studio Address
              </label>
              <input
                type="text"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Gulberg III, Lahore, Pakistan"
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Customer Support Message / Service Promise
              </label>
              <textarea
                rows={2}
                value={form.supportMessage}
                onChange={(e) => setForm({ ...form, supportMessage: e.target.value })}
                placeholder="Our client advisors are devoted to answering inquiries within 12 hours..."
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Social Media Channels */}
        <div className="pt-6 border-t border-stone-100">
          <h3 className="text-xs tracking-[0.2em] uppercase font-semibold text-black mb-4 flex items-center gap-2">
            <Instagram className="w-4 h-4 text-stone-500" />
            <span>Social Media Channels</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Instagram Handle / URL
              </label>
              <input
                type="text"
                value={form.instagram || ''}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@sofyrajewellery or https://instagram.com/sofyrajewellery"
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                TikTok Handle / URL
              </label>
              <input
                type="text"
                value={form.tiktok || ''}
                onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                placeholder="@sofyrajewellery"
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Facebook Page / URL
              </label>
              <input
                type="text"
                value={form.facebook || ''}
                onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                placeholder="https://facebook.com/sofyrajewellery"
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Pinterest Board / URL
              </label>
              <input
                type="text"
                value={form.pinterest || ''}
                onChange={(e) => setForm({ ...form, pinterest: e.target.value })}
                placeholder="https://pinterest.com/sofyrajewellery"
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-semibold transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving Changes...' : 'Save All Contact Information'}
          </button>
        </div>

      </form>

    </div>
  );
};
