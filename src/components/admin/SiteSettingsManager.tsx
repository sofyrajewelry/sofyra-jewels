import React, { useState } from 'react';
import { SiteSettings } from '../../types';
import { storageService } from '../../services/storageService';
import { ShieldCheck, Truck, CreditCard, Sparkles, HelpCircle, Save, Plus, Trash2 } from 'lucide-react';

interface SiteSettingsManagerProps {
  siteSettings: SiteSettings;
  onSiteSettingsUpdated: (settings: SiteSettings) => void;
}

export const SiteSettingsManager: React.FC<SiteSettingsManagerProps> = ({
  siteSettings,
  onSiteSettingsUpdated
}) => {
  const [form, setForm] = useState<SiteSettings>(siteSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [newBenefitInput, setNewBenefitInput] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await storageService.saveSiteSettings(form);
      onSiteSettingsUpdated(form);
      showSuccess('Product accordions & reassurance benefits successfully updated!');
    } catch (e) {
      console.error('Failed to save site settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBenefit = () => {
    if (!newBenefitInput.trim()) return;
    const current = form.productBenefitsRow || [];
    const next = [...current, newBenefitInput.trim()];
    setForm({ ...form, productBenefitsRow: next });
    setNewBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    const current = form.productBenefitsRow || [];
    const next = current.filter((_, i) => i !== index);
    setForm({ ...form, productBenefitsRow: next });
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
            Storefront Policy & Reassurance
          </span>
          <h2 className="font-editorial text-2xl uppercase tracking-wider text-black">
            Product Accordions & Guarantee Settings
          </h2>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Edit the default Shipping, Payment, About, and Care accordions shown on product detail pages, plus the 30-Day Money-Back Guarantee.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-medium flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* 1. 30-Day Money-Back Guarantee */}
        <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <ShieldCheck className="w-5 h-5 text-black" />
            <h3 className="text-xs tracking-[0.2em] uppercase font-semibold text-black">
              30-Day Money-Back Guarantee Section
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Guarantee Title
              </label>
              <input
                type="text"
                value={form.moneyBackGuarantee?.title || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    moneyBackGuarantee: {
                      ...form.moneyBackGuarantee,
                      title: e.target.value
                    }
                  })
                }
                placeholder="30-DAY MONEY-BACK GUARANTEE"
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Guarantee Description & Terms
              </label>
              <textarea
                rows={3}
                value={form.moneyBackGuarantee?.description || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    moneyBackGuarantee: {
                      ...form.moneyBackGuarantee,
                      description: e.target.value
                    }
                  })
                }
                placeholder="Shop with confidence. If you're not satisfied with your purchase, you're covered by our 30-day money-back guarantee..."
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 2. Product Detail Benefits Row (4 Reassurance Badges) */}
        <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Sparkles className="w-5 h-5 text-black" />
            <div>
              <h3 className="text-xs tracking-[0.2em] uppercase font-semibold text-black">
                Product Page Benefits Row
              </h3>
              <p className="text-[11px] text-stone-500 font-light">
                Displayed as reassuring checklist points on the product page directly adjacent to the order button.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(form.productBenefitsRow || []).map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF9F6] border border-stone-300 text-xs tracking-wider uppercase font-medium text-black"
                >
                  <span>{benefit}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(idx)}
                    className="text-stone-400 hover:text-rose-600"
                    title="Remove Benefit"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-md pt-2">
              <input
                type="text"
                value={newBenefitInput}
                onChange={(e) => setNewBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBenefit();
                  }
                }}
                placeholder="Add benefit item (e.g. Hypoallergenic & Skin-safe)..."
                className="flex-1 border border-stone-300 bg-white px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                disabled={!newBenefitInput.trim()}
                className="px-4 py-2 bg-black text-white text-xs tracking-wider uppercase font-medium hover:bg-stone-800 disabled:opacity-50 shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* 3. The 4 Product Accordions */}
        <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="pb-3 border-b border-stone-100">
            <h3 className="text-xs tracking-[0.2em] uppercase font-semibold text-black">
              The 4 Product Detail Accordions
            </h3>
            <p className="text-[11px] text-stone-500 font-light mt-0.5">
              These descriptions serve as the default content for the accordion drawers on every product page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Accordion 1: Shipping */}
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-stone-500" />
                <span>Shipping Information</span>
              </label>
              <textarea
                rows={4}
                value={form.accordions?.shipping || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accordions: {
                      ...form.accordions,
                      shipping: e.target.value
                    }
                  })
                }
                placeholder="Nationwide delivery across Pakistan..."
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black leading-relaxed"
              />
            </div>

            {/* Accordion 2: Payment */}
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                <span>Secure Payment</span>
              </label>
              <textarea
                rows={4}
                value={form.accordions?.payment || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accordions: {
                      ...form.accordions,
                      payment: e.target.value
                    }
                  })
                }
                placeholder="Checkout securely using available payment methods..."
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black leading-relaxed"
              />
            </div>

            {/* Accordion 3: About */}
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                <span>About This Piece</span>
              </label>
              <textarea
                rows={4}
                value={form.accordions?.about || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accordions: {
                      ...form.accordions,
                      about: e.target.value
                    }
                  })
                }
                placeholder="Each piece is selected with attention to finish, comfort and everyday wearability..."
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black leading-relaxed"
              />
            </div>

            {/* Accordion 4: Care */}
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                <span>Care Instructions</span>
              </label>
              <textarea
                rows={4}
                value={form.accordions?.care || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accordions: {
                      ...form.accordions,
                      care: e.target.value
                    }
                  })
                }
                placeholder="To preserve your jewellery's brilliance, avoid direct contact with perfumes..."
                className="w-full border border-stone-300 px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-semibold transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving Changes...' : 'Save All Settings & Accordions'}
          </button>
        </div>

      </form>
    </div>
  );
};
