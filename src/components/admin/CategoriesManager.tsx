import React, { useState, useEffect } from 'react';
import { CategoryHierarchyItem, SubcategoryHierarchyItem } from '../../types';
import { storageService } from '../../services/storageService';
import { ImageUploadField } from './ImageUploadField';
import { Plus, Trash2, Edit2, Check, X, ArrowUpDown, ChevronRight, Layers, Tag } from 'lucide-react';

interface CategoriesManagerProps {
  categories: CategoryHierarchyItem[];
  onCategoriesUpdated: (categories: CategoryHierarchyItem[]) => void;
}

const getSubcategoryName = (sub: unknown): string => {
  if (!sub) return '';
  if (typeof sub === 'string') return sub;
  if (typeof sub === 'object' && sub !== null) {
    const obj = sub as { name?: string; slug?: string; id?: string; title?: string };
    return obj.name || obj.title || obj.slug || obj.id || '';
  }
  return String(sub);
};

const getSubcategoryId = (sub: unknown, index: number): string => {
  if (!sub) return `sub-${index}`;
  if (typeof sub === 'string') return `${sub}-${index}`;
  if (typeof sub === 'object' && sub !== null) {
    const obj = sub as { id?: string; slug?: string; name?: string };
    return obj.id || obj.slug || (obj.name ? `${obj.name}-${index}` : `sub-${index}`);
  }
  return `sub-${index}`;
};

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  onCategoriesUpdated
}) => {
  const [items, setItems] = useState<CategoryHierarchyItem[]>(categories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatTagline, setNewCatTagline] = useState('');
  const [newSubcategoryInputs, setNewSubcategoryInputs] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setItems(categories);
    }
  }, [categories]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleSaveAll = async (updatedItems: CategoryHierarchyItem[]) => {
    setItems(updatedItems);
    try {
      await storageService.saveCategories(updatedItems);
      onCategoriesUpdated(updatedItems);
      showSuccess('Categories updated & synchronized across storefront!');
    } catch (e) {
      console.error('Failed to save categories:', e);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const slug = newCatName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const newCat: CategoryHierarchyItem = {
      id: 'cat-' + Date.now(),
      name: newCatName.trim(),
      slug: slug,
      tagline: newCatTagline.trim() || undefined,
      image: newCatImage.trim() || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=900&auto=format&fit=crop',
      subcategories: [],
      order: items.length + 1
    };

    const next = [...items, newCat];
    handleSaveAll(next);
    setNewCatName('');
    setNewCatImage('');
    setNewCatTagline('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      const next = items.filter((c) => c.id !== catId);
      handleSaveAll(next);
    }
  };

  const handleUpdateCategory = (catId: string, updates: Partial<CategoryHierarchyItem>) => {
    const next = items.map((c) => (c.id === catId ? { ...c, ...updates } : c));
    handleSaveAll(next);
  };

  const handleAddSubcategory = (catId: string) => {
    const subName = newSubcategoryInputs[catId]?.trim();
    if (!subName) return;

    const next = items.map((c) => {
      if (c.id === catId) {
        const existing = c.subcategories || [];
        const alreadyExists = existing.some(
          (s) => getSubcategoryName(s).toLowerCase() === subName.toLowerCase()
        );
        if (alreadyExists) return c;
        const newSubObj: SubcategoryHierarchyItem = {
          id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: subName,
          slug: subName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        };
        return {
          ...c,
          subcategories: [...existing, newSubObj]
        };
      }
      return c;
    });

    handleSaveAll(next);
    setNewSubcategoryInputs((prev) => ({ ...prev, [catId]: '' }));
  };

  const handleDeleteSubcategory = (catId: string, subToRemove: unknown) => {
    const targetName = getSubcategoryName(subToRemove).toLowerCase();
    const targetId =
      typeof subToRemove === 'object' && subToRemove !== null && 'id' in subToRemove
        ? (subToRemove as { id: string }).id
        : null;

    const next = items.map((c) => {
      if (c.id === catId) {
        return {
          ...c,
          subcategories: (c.subcategories || []).filter((s) => {
            if (targetId && typeof s === 'object' && s !== null && 'id' in s) {
              return (s as { id: string }).id !== targetId;
            }
            return getSubcategoryName(s).toLowerCase() !== targetName;
          })
        };
      }
      return c;
    });
    handleSaveAll(next);
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const next = [...items];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;

    // re-assign orders
    const ordered = next.map((cat, i) => ({ ...cat, order: i + 1 }));
    handleSaveAll(ordered);
  };

  return (
    <div className="space-y-8">
      
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between text-xs tracking-wider uppercase font-medium">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
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
            Taxonomy & Navigation
          </span>
          <h2 className="font-editorial text-2xl uppercase tracking-wider text-black">
            Categories & Subcategories
          </h2>
          <p className="text-xs text-stone-500 mt-1 font-light">
            All categories and subcategories defined here automatically populate the navigation menu, shop filters, and product forms.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingCategory(true)}
          className="px-5 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-medium flex items-center gap-2 cursor-pointer transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Add New Category Panel */}
      {isAddingCategory && (
        <div className="p-6 bg-white border border-stone-300 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-editorial text-lg uppercase tracking-wider text-black">
              New Category Information
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingCategory(false)}
              className="text-stone-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Category Title * (e.g. RINGS, CHOKERS, PENDANTS)
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category Name"
                className="w-full border border-stone-300 px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={newCatTagline}
                onChange={(e) => setNewCatTagline(e.target.value)}
                placeholder="e.g. Sculptural drops & eternity bands"
                className="w-full border border-stone-300 px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <ImageUploadField
              label="Category Banner / Card Image"
              currentImage={newCatImage}
              onImageChange={(url) => setNewCatImage(url)}
              aspectHint="Banner card aspect ratio (3:4 or 4:5)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingCategory(false)}
              className="px-4 py-2 border border-stone-300 text-xs tracking-wider uppercase text-stone-600 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="px-6 py-2 bg-black text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              Save Category
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="space-y-6">
        {items.map((cat, index) => (
          <div
            key={cat.id}
            className="bg-white border border-stone-200 p-6 sm:p-8 hover:border-stone-300 transition-colors shadow-xs"
          >
            {/* Top Bar: Name, Order, Image preview, Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
              
              <div className="flex items-center gap-4">
                {/* Category Thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-100 border border-stone-200 shrink-0 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-mono">
                      #{index + 1}
                    </span>
                    <h3 className="font-editorial text-xl sm:text-2xl uppercase tracking-wider text-black">
                      {cat.name}
                    </h3>
                  </div>
                  {cat.tagline && (
                    <p className="text-xs text-stone-500 font-light mt-0.5">{cat.tagline}</p>
                  )}
                  <span className="text-[11px] text-stone-400 font-mono mt-1 block">
                    Slug: /{cat.slug}
                  </span>
                </div>
              </div>

              {/* Actions & Ordering */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMoveOrder(index, 'up')}
                  disabled={index === 0}
                  className="p-2 border border-stone-200 hover:border-black text-stone-700 hover:text-black disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  &uarr;
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveOrder(index, 'down')}
                  disabled={index === items.length - 1}
                  className="p-2 border border-stone-200 hover:border-black text-stone-700 hover:text-black disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  &darr;
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategoryId(editingCategoryId === cat.id ? null : cat.id)}
                  className="px-3 py-2 border border-stone-200 hover:border-black text-stone-700 hover:text-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{editingCategoryId === cat.id ? 'Close' : 'Edit Image & Info'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Editable Details Accordion */}
            {editingCategoryId === cat.id && (
              <div className="py-6 border-b border-stone-100 bg-[#FAF9F6] p-4 sm:p-6 mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => handleUpdateCategory(cat.id, { name: e.target.value })}
                      className="w-full border border-stone-300 bg-white px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={cat.tagline || ''}
                      onChange={(e) => handleUpdateCategory(cat.id, { tagline: e.target.value })}
                      className="w-full border border-stone-300 bg-white px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <ImageUploadField
                    label="Banner / Card Image"
                    currentImage={cat.image}
                    onImageChange={(url) => handleUpdateCategory(cat.id, { image: url })}
                  />
                </div>
              </div>
            )}

            {/* Subcategories Management */}
            <div className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-stone-600" />
                  <span className="text-xs tracking-[0.2em] uppercase font-medium text-black">
                    Subcategories ({cat.subcategories?.length || 0})
                  </span>
                </div>
              </div>

              {/* Existing Subcategory Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(!cat.subcategories || cat.subcategories.length === 0) ? (
                  <span className="text-xs text-stone-400 font-light italic">
                    No subcategories added yet.
                  </span>
                ) : (
                  cat.subcategories.map((sub, sIdx) => {
                    const subName = getSubcategoryName(sub);
                    const subKey = getSubcategoryId(sub, sIdx);
                    return (
                      <span
                        key={subKey}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF9F6] border border-stone-300 text-xs tracking-wider uppercase text-black font-medium"
                      >
                        <span>{subName}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubcategory(cat.id, sub)}
                          className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title={`Remove ${subName}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>

              {/* Add Subcategory Input */}
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={newSubcategoryInputs[cat.id] || ''}
                  onChange={(e) =>
                    setNewSubcategoryInputs({ ...newSubcategoryInputs, [cat.id]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubcategory(cat.id);
                    }
                  }}
                  placeholder="New subcategory (e.g. Band Rings, Cocktail Rings)..."
                  className="flex-1 border border-stone-300 bg-white px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddSubcategory(cat.id)}
                  disabled={!newSubcategoryInputs[cat.id]?.trim()}
                  className="px-4 py-2 bg-black text-white text-xs tracking-wider uppercase font-medium hover:bg-stone-800 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  Add Subcategory
                </button>
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
