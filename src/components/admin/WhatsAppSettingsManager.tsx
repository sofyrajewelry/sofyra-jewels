import React, { useState } from 'react';
import { WhatsAppSettings } from '../../types';
import { storageService } from '../../services/storageService';
import { MessageSquare, Phone, Link2, Sparkles, Check, Save } from 'lucide-react';

interface WhatsAppSettingsManagerProps {
  whatsappSettings?: WhatsAppSettings;
  fallbackPhone?: string;
  onSettingsUpdated: (updated: WhatsAppSettings) => void;
}

export const WhatsAppSettingsManager: React.FC<WhatsAppSettingsManagerProps> = ({
  whatsappSettings,
  fallbackPhone = '',
  onSettingsUpdated
}) => {
  const [form, setForm] = useState<WhatsAppSettings>({
    enabled: whatsappSettings?.enabled !== false,
    phoneNumber: whatsappSettings?.phoneNumber || fallbackPhone || '',
    customLink: whatsappSettings?.customLink || '',
    prefilledMessage:
      whatsappSettings?.prefilledMessage ||
      "Hi! I'm interested in ordering from your store. Can you help me?"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const currentSiteSettings = storageService.getSiteSettings();
      const updatedSiteSettings = {
        ...currentSiteSettings,
        whatsappButton: form
      };
      await storageService.saveSiteSettings(updatedSiteSettings);
      onSettingsUpdated(form);
      showSuccess('Floating WhatsApp button settings saved successfully!');
    } catch (err) {
      console.error('Failed to save WhatsApp settings:', err);
      alert('Failed to save WhatsApp settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Compute live preview link
  const previewDigits = form.phoneNumber.replace(/[^0-9]/g, '');
  const previewUrl = form.customLink?.trim()
    ? form.customLink.trim()
    : previewDigits
    ? `https://wa.me/${previewDigits}?text=${encodeURIComponent(form.prefilledMessage || '')}`
    : '';

  return (
    <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
      {successToast && (
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between text-xs tracking-wider uppercase font-medium">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{successToast}</span>
          </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-medium block mb-1">
            Homepage Customer Concierge
          </span>
          <h3 className="font-editorial text-2xl uppercase tracking-wider text-black flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#25D366]" />
            <span>Floating WhatsApp Button (Homepage Only)</span>
          </h3>
          <p className="text-xs text-stone-500 font-light mt-1">
            Configure the circular floating WhatsApp button displayed exclusively at the bottom-right of the homepage.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="px-6 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save WhatsApp Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Toggle Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#FAF9F6] border border-stone-200 gap-3">
          <div>
            <span className="font-semibold text-black uppercase tracking-wider block text-xs">
              Floating WhatsApp Button Visibility
            </span>
            <p className="text-[11px] text-stone-500 font-light mt-0.5">
              When enabled, the button appears fixed at the bottom-right of the homepage only (hidden on Product, Shop, Cart, Checkout, Admin, and other pages).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={form.enabled}
              onClick={() => setForm({ ...form, enabled: !form.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                form.enabled ? 'bg-[#25D366]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-[11px] font-bold uppercase tracking-wider text-black w-20">
              {form.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp Phone Number */}
          <div>
            <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-500" />
              <span>WhatsApp Phone Number (with Country Code) *</span>
            </label>
            <input
              type="text"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="e.g. +92 300 1234567 or 923001234567"
              className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black font-mono"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Include full country code (e.g. +92 for Pakistan). Special symbols (+, -, spaces) are cleaned automatically.
            </span>
          </div>

          {/* Custom WhatsApp Chat Link (Optional) */}
          <div>
            <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Custom WhatsApp Chat Link (Optional)</span>
            </label>
            <input
              type="url"
              value={form.customLink || ''}
              onChange={(e) => setForm({ ...form, customLink: e.target.value })}
              placeholder="e.g. https://wa.me/message/YOURCODE or https://chat.whatsapp.com/..."
              className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black font-mono"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Leave blank to automatically generate link from the phone number and pre-filled message.
            </span>
          </div>

          {/* Pre-filled Message */}
          <div className="md:col-span-2">
            <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-stone-500" />
              <span>Default Pre-filled Message</span>
            </label>
            <textarea
              rows={2}
              value={form.prefilledMessage}
              onChange={(e) => setForm({ ...form, prefilledMessage: e.target.value })}
              placeholder="Hi! I’m interested in ordering from your store. Can you help me?"
              className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black leading-relaxed"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              When customers click the button, this text opens pre-filled in their WhatsApp app ready to send.
            </span>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="p-4 bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-stone-500 block">
              Target Link Preview
            </span>
            <p className="font-mono text-[11px] text-stone-700 break-all">
              {previewUrl ? previewUrl : <span className="text-stone-400 italic">No number or link provided — button will remain hidden</span>}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 32 32">
                <path d="M16.002 2C8.28 2 2.02 8.26 2.02 15.982c0 2.607.714 5.15 2.07 7.37L2 30l6.837-2.043a13.93 13.93 0 0 0 7.165 1.988h.006c7.72 0 13.98-6.26 13.98-13.982 0-3.737-1.455-7.25-4.1-9.894A13.91 13.91 0 0 0 16.002 2zm8.167 19.897c-.34.957-1.705 1.76-2.39 1.838-.642.072-1.472.102-4.275-1.06-3.32-1.378-5.46-4.75-5.626-4.97-.16-.22-1.34-1.784-1.34-3.403 0-1.618.848-2.414 1.15-2.744.3-.33.655-.413.874-.413.22 0 .44.002.633.011.205.01.479-.078.75.57.28.667.954 2.33.1037 2.497.083.167.138.363.028.583-.11.22-.165.357-.33.55-.165.193-.347.43-.495.578-.165.165-.337.345-.145.675.192.33 1.853 3.037 3.326 4.35 1.892 1.688 3.518 2.215 4.02 2.463.502.248.796.22 1.09-.11.293-.33 1.258-1.468 1.593-1.974.335-.506.67-.422 1.127-.253.457.17 2.898 1.367 3.395 1.615.497.248.828.371.948.577.12.206.12 1.196-.22 2.153z" />
              </svg>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              {form.enabled ? 'Active on Homepage' : 'Hidden'}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Saving Changes...' : 'Save WhatsApp Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
