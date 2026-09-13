import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Upload,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Image as ImageIcon
} from 'lucide-react';
import { AdvantageItem, AdvantagesSectionConfig } from '../../types';
import { ADVANTAGE_ICONS, renderAdvantageIcon } from './AdvantageIconHelper';
import { DEFAULT_ADVANTAGES_ITEMS } from '../../data/initialProducts';
import { apiClient } from '../../services/apiClient';

interface AdvantagesManagerProps {
  advantagesSection: AdvantagesSectionConfig;
  onChange: (updated: AdvantagesSectionConfig) => void;
  onSave?: () => void;
}

export const AdvantagesManager: React.FC<AdvantagesManagerProps> = ({
  advantagesSection,
  onChange,
  onSave
}) => {
  const [editingItem, setEditingItem] = useState<AdvantageItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const items = advantagesSection.items || [];
  const activeCount = items.filter((i) => i.enabled !== false).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tagline / Heading handlers
  const handleTaglineChange = (tagline: string) => {
    onChange({
      ...advantagesSection,
      tagline
    });
  };

  const handleHeadingChange = (heading: string) => {
    onChange({
      ...advantagesSection,
      heading
    });
  };

  // Reorder items
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    // Update order numbers
    const updated = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    onChange({
      ...advantagesSection,
      items: updated
    });
    showToast(`Reordered "${moved.title}" ${direction}`);
  };

  // Toggle ON/OFF
  const handleToggleStatus = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const nextState = item.enabled === false ? true : false;
        showToast(`Advantage "${item.title}" turned ${nextState ? 'ON' : 'OFF'}`);
        return { ...item, enabled: nextState };
      }
      return item;
    });

    onChange({
      ...advantagesSection,
      items: updated
    });
  };

  // Delete advantage
  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the Advantages section?`)) {
      return;
    }
    const filtered = items
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, order: idx + 1 }));

    onChange({
      ...advantagesSection,
      items: filtered
    });
    showToast(`Deleted "${title}"`);
  };

  // Start adding new advantage
  const handleStartCreate = () => {
    const newItem: AdvantageItem = {
      id: `adv-${Date.now()}`,
      title: '',
      description: '',
      subtitle: '',
      icon: 'Sparkles',
      image: '',
      enabled: true,
      order: items.length + 1
    };
    setEditingItem(newItem);
    setIsCreatingNew(true);
  };

  // Start editing existing advantage
  const handleStartEdit = (item: AdvantageItem) => {
    setEditingItem({ ...item });
    setIsCreatingNew(false);
  };

  // Save modal edit
  const handleSaveModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.title.trim()) {
      alert('Please enter a heading/title for this advantage');
      return;
    }

    let updatedList: AdvantageItem[];
    if (isCreatingNew) {
      updatedList = [...items, { ...editingItem, order: items.length + 1 }];
      showToast(`Added new advantage: "${editingItem.title}"`);
    } else {
      updatedList = items.map((item) => (item.id === editingItem.id ? editingItem : item));
      showToast(`Updated advantage: "${editingItem.title}"`);
    }

    onChange({
      ...advantagesSection,
      items: updatedList
    });

    setEditingItem(null);
    setIsCreatingNew(false);
  };

  // Reset to default 4 SOFYRA advantages
  const handleRestoreDefaults = () => {
    if (
      window.confirm(
        'Reset advantages to the default 4 SOFYRA standards (Quality Materials, Timeless Design, Money Back Guarantee, Secure Packaging)?'
      )
    ) {
      onChange({
        tagline: 'The Sofyra Standard',
        heading: 'Advantages',
        items: DEFAULT_ADVANTAGES_ITEMS
      });
      showToast('Reset to default 4 SOFYRA advantages');
    }
  };

  // Handle image upload inside modal
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const uploadRes = await apiClient.uploadImage(base64, `adv-${Date.now()}`);
        if (uploadRes.success && uploadRes.url) {
          setEditingItem((prev) => (prev ? { ...prev, image: uploadRes.url } : null));
          showToast('Image uploaded successfully');
        } else {
          // Fallback to data URL
          setEditingItem((prev) => (prev ? { ...prev, image: base64 } : null));
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload image:', err);
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="homepage-advantages-manager">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 shadow-2xl border border-stone-700 flex items-center gap-3 text-xs tracking-wider animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Banner */}
      <div className="bg-stone-900 text-white p-5 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-stone-400 mb-1">
            <span>Homepage Content</span>
            <span>&rarr;</span>
            <span className="text-amber-400 font-semibold">Advantages</span>
          </div>
          <h3 className="font-editorial text-xl uppercase tracking-wider text-white">
            Advantages Section Management
          </h3>
          <p className="text-xs text-stone-300 font-light mt-0.5">
            Add, edit, reorder, and toggle advantages shown on the SOFYRA homepage. Everything saves persistently to the database.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3.5 py-2 border border-stone-700 hover:border-stone-400 text-[11px] tracking-wider uppercase text-stone-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Reset to default 4 cards"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Advantage</span>
          </button>
        </div>
      </div>

      {/* Section Headings Editor */}
      <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-4">
        <div className="border-b border-stone-200 pb-3">
          <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-medium block">
            Section Titles
          </span>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-black">
            Header & Eyebrow Label
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-700 mb-1">
              Top Tagline / Eyebrow
            </label>
            <input
              type="text"
              value={advantagesSection.tagline || ''}
              onChange={(e) => handleTaglineChange(e.target.value)}
              placeholder="e.g. The Sofyra Standard"
              className="w-full px-3.5 py-2 border border-stone-300 text-sm focus:outline-none focus:border-black"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Small uppercase text above the main heading (default: &ldquo;The Sofyra Standard&rdquo;)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-700 mb-1">
              Main Section Heading
            </label>
            <input
              type="text"
              value={advantagesSection.heading || ''}
              onChange={(e) => handleHeadingChange(e.target.value)}
              placeholder="e.g. Advantages"
              className="w-full px-3.5 py-2 border border-stone-300 text-sm focus:outline-none focus:border-black font-editorial text-lg"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Primary display heading on the storefront (default: &ldquo;Advantages&rdquo;)
            </p>
          </div>
        </div>
      </div>

      {/* Advantages Cards List */}
      <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
        <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-black">
                Advantages Cards
              </h4>
              <span className="px-2 py-0.5 text-[11px] bg-stone-100 text-stone-700 font-mono">
                {activeCount} Active on Storefront / {items.length} Total
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Reorder, edit, delete, or turn individual advantage cards ON / OFF.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartCreate}
            className="self-start sm:self-auto px-4 py-2 border border-black hover:bg-black hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Card</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="space-y-3">
          {items.map((item, index) => {
            const isEnabled = item.enabled !== false;
            return (
              <div
                key={item.id}
                className={`p-4 border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isEnabled
                    ? 'border-stone-300 bg-white hover:border-black'
                    : 'border-dashed border-stone-200 bg-stone-50/60 opacity-60'
                }`}
              >
                {/* Left: Ordering + Status + Icon + Content */}
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  {/* Reorder controls */}
                  <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className={`p-1 rounded text-stone-400 hover:text-black hover:bg-stone-100 transition-colors cursor-pointer ${
                        index === 0 ? 'opacity-20 cursor-not-allowed' : ''
                      }`}
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-stone-500 px-1.5 py-0.5 bg-stone-100 border border-stone-200">
                      0{index + 1}
                    </span>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className={`p-1 rounded text-stone-400 hover:text-black hover:bg-stone-100 transition-colors cursor-pointer ${
                        index === items.length - 1 ? 'opacity-20 cursor-not-allowed' : ''
                      }`}
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Icon badge */}
                  <div className="w-11 h-11 shrink-0 bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-800">
                    {renderAdvantageIcon(item.icon, 'w-5 h-5')}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h5 className="font-editorial text-base sm:text-lg uppercase tracking-wider text-black font-medium">
                        {item.title || '(Untitled Advantage)'}
                      </h5>

                      {/* Active Status Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id)}
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border cursor-pointer transition-colors flex items-center gap-1 ${
                          isEnabled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'
                        }`}
                        title="Click to toggle ON / OFF"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEnabled ? 'bg-emerald-600' : 'bg-stone-400'
                          }`}
                        />
                        <span>{isEnabled ? 'ON' : 'OFF'}</span>
                      </button>

                      {item.icon && (
                        <span className="text-[10px] text-stone-400 font-mono border border-stone-200 px-1.5 py-0.5">
                          Icon: {item.icon}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 font-light leading-relaxed max-w-2xl">
                      {item.description || '(No description)'}
                    </p>

                    {item.subtitle && (
                      <p className="text-[11px] text-stone-400 uppercase tracking-wider mt-1.5">
                        &bull; {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Optional Photo + Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                  {/* Photo thumbnail */}
                  {item.image ? (
                    <div className="w-14 h-14 shrink-0 bg-stone-100 border border-stone-300 overflow-hidden relative group">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] uppercase font-semibold">
                        Image
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 shrink-0 border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-300">
                      <ImageIcon className="w-4 h-4 mb-0.5" />
                      <span className="text-[8px] uppercase tracking-wider">No Photo</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Toggle ON/OFF */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className={`p-2 border text-xs transition-colors cursor-pointer ${
                        isEnabled
                          ? 'border-stone-300 text-stone-700 hover:border-black'
                          : 'border-stone-300 text-stone-400 hover:text-black'
                      }`}
                      title={isEnabled ? 'Turn OFF' : 'Turn ON'}
                    >
                      {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="px-3 py-2 bg-stone-100 hover:bg-black hover:text-white border border-stone-300 text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      title="Delete Advantage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDIT / ADD ADVANTAGE MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white max-w-xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto border border-stone-300 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                  {isCreatingNew ? 'New Advantage Card' : 'Edit Advantage Card'}
                </span>
                <h3 className="font-editorial text-2xl uppercase tracking-wider text-black mt-1">
                  {isCreatingNew ? 'Add Advantage' : `Edit "${editingItem.title || 'Advantage'}"`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-stone-400 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-5">
              {/* Field 1: Title / Heading */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-800 mb-1">
                  Heading / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="e.g. QUALITY MATERIALS, MONEY BACK GUARANTEE, TIMELESS DESIGN"
                  required
                  className="w-full px-3.5 py-2.5 border border-stone-300 text-sm focus:outline-none focus:border-black uppercase font-medium"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  The primary uppercase title displayed in the card header.
                </p>
              </div>

              {/* Field 2: Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-800 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="e.g. Shop with confidence, subject to SOFYRA's return and refund policy."
                  required
                  className="w-full px-3.5 py-2.5 border border-stone-300 text-sm focus:outline-none focus:border-black leading-relaxed"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Concise explanation of the advantage for the customer.
                </p>
              </div>

              {/* Field 3: Subtitle / Bullet Tagline */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-800 mb-1">
                  Subtitle / Divider Tagline (Optional)
                </label>
                <input
                  type="text"
                  value={editingItem.subtitle || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                  placeholder="e.g. 925 Silver • Thick 18k Plating • Tarnish Guard"
                  className="w-full px-3.5 py-2.5 border border-stone-300 text-sm focus:outline-none focus:border-black"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Renders as a fine divider note at the bottom of the card.
                </p>
              </div>

              {/* Field 4: Icon Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-800 mb-2">
                  Select Icon
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-stone-200 p-2 bg-stone-50">
                  {ADVANTAGE_ICONS.map((opt) => {
                    const isSelected =
                      (editingItem.icon || '').toLowerCase() === opt.id.toLowerCase();
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, icon: opt.id })}
                        className={`p-2.5 flex items-center gap-2 border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-stone-900'}`} />
                        <span className="text-[11px] truncate font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-stone-600">
                  <span>Current icon:</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] bg-stone-100 px-2 py-0.5 border border-stone-200">
                    {renderAdvantageIcon(editingItem.icon, 'w-3.5 h-3.5')}
                    <span>{editingItem.icon || 'Sparkles'}</span>
                  </div>
                </div>
              </div>

              {/* Field 5: Card Image (Optional) */}
              <div className="border-t border-stone-200 pt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-800 mb-1">
                  Card Visual Photo (Optional)
                </label>
                <p className="text-[11px] text-stone-500 mb-3">
                  Upload an artisan sketch or photo to display on the side of the card (matching the signature Sofyra editorial style).
                </p>

                <div className="flex items-start gap-4">
                  {editingItem.image ? (
                    <div className="w-24 h-24 shrink-0 bg-stone-100 border border-stone-300 relative group overflow-hidden">
                      <img
                        src={editingItem.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, image: '' })}
                        className="absolute inset-0 bg-red-600/80 text-white text-[10px] uppercase font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 shrink-0 border border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 bg-stone-50">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[9px] uppercase tracking-wider">No Photo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium uppercase tracking-wider cursor-pointer border border-stone-300">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={editingItem.image || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full px-3 py-1.5 border border-stone-300 text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* Field 6: Visibility Toggle (ON / OFF) */}
              <div className="border-t border-stone-200 pt-4 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-800">
                    Display Status on Homepage
                  </label>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    When ON, this advantage card appears in the homepage Advantages section.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingItem({
                      ...editingItem,
                      enabled: editingItem.enabled === false ? true : false
                    })
                  }
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    editingItem.enabled !== false
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-stone-200 text-stone-600 border-stone-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>{editingItem.enabled !== false ? 'Active: ON' : 'Hidden: OFF'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-stone-200 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-medium uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white hover:bg-stone-800 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Advantage</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
