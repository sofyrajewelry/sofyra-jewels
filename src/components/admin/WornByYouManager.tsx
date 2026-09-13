import React, { useState } from 'react';
import { WornByYouItem, Product } from '../../types';
import { storageService } from '../../services/storageService';
import { ImageUploadField } from './ImageUploadField';
import { Plus, Trash2, Edit2, ArrowUpDown, Check, X, Eye, EyeOff, Tag } from 'lucide-react';

interface WornByYouManagerProps {
  items: WornByYouItem[];
  products: Product[];
  onItemsUpdated: (items: WornByYouItem[]) => void;
}

export const WornByYouManager: React.FC<WornByYouManagerProps> = ({
  items,
  products,
  onItemsUpdated
}) => {
  const [galleryItems, setGalleryItems] = useState<WornByYouItem[]>(items);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New item form
  const [newItem, setNewItem] = useState<{
    mediaUrl: string;
    caption: string;
    productId: string;
    order: number;
  }>({
    mediaUrl: '',
    caption: '',
    productId: products[0]?.id || '',
    order: items.length + 1
  });

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSaveAll = async (updated: WornByYouItem[]) => {
    setGalleryItems(updated);
    try {
      await storageService.saveWornByYou(updated);
      onItemsUpdated(updated);
      showSuccess('Worn By You gallery updated & live!');
    } catch (e) {
      console.error('Failed to save gallery:', e);
    }
  };

  const handleAddItem = () => {
    if (!newItem.mediaUrl) return;

    const matchedProduct = products.find((p) => p.id === newItem.productId);

    const created: WornByYouItem = {
      id: 'wby-' + Date.now(),
      type: 'image',
      mediaUrl: newItem.mediaUrl,
      caption: newItem.caption || undefined,
      productId: newItem.productId || undefined,
      productName: matchedProduct ? matchedProduct.name : undefined,
      order: galleryItems.length + 1
    };

    const next = [...galleryItems, created];
    handleSaveAll(next);
    setIsAdding(false);
    setNewItem({
      mediaUrl: '',
      caption: '',
      productId: products[0]?.id || '',
      order: next.length + 1
    });
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Remove this photo from the Worn By You gallery?')) {
      const next = galleryItems.filter((i) => i.id !== id);
      handleSaveAll(next);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<WornByYouItem>) => {
    const next = galleryItems.map((i) => {
      if (i.id === id) {
        let updatedProdName = i.productName;
        if (updates.productId) {
          const p = products.find((prod) => prod.id === updates.productId);
          if (p) updatedProdName = p.name;
        }
        return { ...i, ...updates, productName: updatedProdName };
      }
      return i;
    });
    handleSaveAll(next);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= galleryItems.length) return;

    const next = [...galleryItems];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;

    const ordered = next.map((item, i) => ({ ...item, order: i + 1 }));
    handleSaveAll(ordered);
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
            Community Visuals
          </span>
          <h2 className="font-editorial text-2xl uppercase tracking-wider text-black">
            &ldquo;Worn By You&rdquo; Customer Styling Gallery
          </h2>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Customer styling moments displayed on product pages and brand lookbooks. Tag real pieces to drive shopping engagement.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="px-5 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-medium flex items-center gap-2 cursor-pointer transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Styling Photo</span>
        </button>
      </div>

      {/* Add New Item Panel */}
      {isAdding && (
        <div className="p-6 bg-white border border-stone-300 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-editorial text-lg uppercase tracking-wider text-black">
              Add Customer Styling Photo
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-stone-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ImageUploadField
            label="Styling Image *"
            currentImage={newItem.mediaUrl}
            onImageChange={(url) => setNewItem({ ...newItem, mediaUrl: url })}
            aspectHint="Square (1:1) customer look photo"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Customer Handle / Caption
              </label>
              <input
                type="text"
                value={newItem.caption}
                onChange={(e) => setNewItem({ ...newItem, caption: e.target.value })}
                placeholder="e.g. Styled effortlessly with Etoile drops @mahams"
                className="w-full border border-stone-300 px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Tag Featured Product
              </label>
              <select
                value={newItem.productId}
                onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
                className="w-full border border-stone-300 bg-white px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku || p.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-stone-300 text-xs tracking-wider uppercase text-stone-600 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItem.mediaUrl}
              className="px-6 py-2 bg-black text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              Add to Gallery
            </button>
          </div>
        </div>
      )}

      {/* Grid of Existing Gallery Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item, idx) => (
          <div
            key={item.id}
            className="bg-white border border-stone-200 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-stone-300 transition-colors"
          >
            <div>
              {/* Media Preview */}
              <div className="aspect-square bg-stone-100 border border-stone-200 overflow-hidden mb-4 relative group">
                <img
                  src={item.mediaUrl}
                  alt={item.caption || 'Worn by you'}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[10px] tracking-wider uppercase font-mono">
                  #{idx + 1}
                </span>
              </div>

              {/* Caption & Product */}
              <p className="text-xs font-light text-stone-800 mb-1">
                {item.caption || <span className="text-stone-400 italic">No caption</span>}
              </p>

              {item.productName && (
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                  <Tag className="w-3 h-3 text-stone-400" />
                  <span>{item.productName}</span>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between mt-4">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 border border-stone-200 hover:border-black text-xs disabled:opacity-30 cursor-pointer"
                  title="Move Left/Up"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === galleryItems.length - 1}
                  className="p-1.5 border border-stone-200 hover:border-black text-xs disabled:opacity-30 cursor-pointer"
                  title="Move Right/Down"
                >
                  &rarr;
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                  className="px-2.5 py-1.5 border border-stone-200 text-xs tracking-wider uppercase hover:border-black text-stone-700"
                >
                  {editingId === item.id ? 'Close' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inline Editor */}
            {editingId === item.id && (
              <div className="mt-4 pt-4 border-t border-stone-200 space-y-3 bg-[#FAF9F6] p-3 text-xs">
                <div>
                  <label className="block text-[10px] tracking-wider uppercase font-medium text-stone-600 mb-1">
                    Caption / Handle
                  </label>
                  <input
                    type="text"
                    value={item.caption || ''}
                    onChange={(e) => handleUpdateItem(item.id, { caption: e.target.value })}
                    className="w-full border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-wider uppercase font-medium text-stone-600 mb-1">
                    Tagged Product
                  </label>
                  <select
                    value={item.productId || ''}
                    onChange={(e) => handleUpdateItem(item.id, { productId: e.target.value })}
                    className="w-full border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-black"
                  >
                    <option value="">-- None --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <ImageUploadField
                    label="Replace Image"
                    currentImage={item.mediaUrl}
                    onImageChange={(url) => handleUpdateItem(item.id, { mediaUrl: url })}
                  />
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
};
