import React, { useState, useEffect } from 'react';
import { CategoryHierarchyItem } from '../../types';
import { storageService } from '../../services/storageService';
import { ImageUploadField } from './ImageUploadField';
import { Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';

interface CategoriesManagerProps {
  categories: CategoryHierarchyItem[];
  onCategoriesUpdated: (categories: CategoryHierarchyItem[]) => void;
}

interface CategoryFormData {
  id?: string;
  name: string;
  slug: string;
  eyebrowText: string;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  heroImage: string;
  displayOrder: number;
  enabled: boolean;
}

const emptyCategoryForm = (): CategoryFormData => ({
  name: '',
  slug: '',
  eyebrowText: 'SOFYRA FINE COLLECTION',
  heroTitle: '',
  heroSubtitle: '',
  description: '',
  heroImage: '',
  displayOrder: 1,
  enabled: true
});

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  onCategoriesUpdated
}) => {
  const [items, setItems] = useState<CategoryHierarchyItem[]>(categories || []);
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    if (categories && categories.length > 0) {
      // Sort by displayOrder or order
      const sorted = [...categories].sort((a, b) => {
        const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : (a.order || 999);
        const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : (b.order || 999);
        return orderA - orderB;
      });
      setItems(sorted);
    }
  }, [categories]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setSaveStatus('idle');
    const nextOrder = items.length > 0 
      ? Math.max(...items.map(c => typeof c.displayOrder === 'number' ? c.displayOrder : (c.order || 0))) + 1 
      : 1;
    setEditingCategory({
      ...emptyCategoryForm(),
      displayOrder: nextOrder
    });
    setIsAddingCategory(true);
  };

  const handleOpenEdit = (cat: CategoryHierarchyItem) => {
    setSaveStatus('idle');
    setEditingCategory({
      id: cat.id,
      name: cat.name || '',
      slug: cat.slug || '',
      eyebrowText: cat.eyebrowText || 'SOFYRA FINE COLLECTION',
      heroTitle: cat.heroTitle || cat.name.toUpperCase(),
      heroSubtitle: cat.heroSubtitle || cat.tagline || '',
      description: cat.description || '',
      heroImage: cat.heroImage || cat.image || '',
      displayOrder: typeof cat.displayOrder === 'number' ? cat.displayOrder : (cat.order || 1),
      enabled: cat.enabled !== false && !cat.hidden
    });
    setIsAddingCategory(false);
  };

  const handleCloseModal = () => {
    setSaveStatus('idle');
    setEditingCategory(null);
    setIsAddingCategory(false);
  };

  const handleFormNameChange = (name: string) => {
    if (!editingCategory) return;
    const updates: Partial<CategoryFormData> = { name };
    // Auto-generate slug and heroTitle if adding or if slug matches name
    if (isAddingCategory || !editingCategory.slug) {
      updates.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (isAddingCategory || !editingCategory.heroTitle) {
      updates.heroTitle = name.toUpperCase();
    }
    setEditingCategory({ ...editingCategory, ...updates });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    setIsSaving(true);
    setSaveStatus('saving');
    const slug = (editingCategory.slug || editingCategory.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, '');
    const id = editingCategory.id || `cat-${slug || Date.now()}`;

    const categoryItem: CategoryHierarchyItem = {
      id,
      name: editingCategory.name.trim(),
      slug,
      eyebrowText: editingCategory.eyebrowText.trim() || 'SOFYRA FINE COLLECTION',
      heroTitle: editingCategory.heroTitle.trim() || editingCategory.name.trim().toUpperCase(),
      heroSubtitle: editingCategory.heroSubtitle.trim() || undefined,
      tagline: editingCategory.heroSubtitle.trim() || undefined,
      description: editingCategory.description.trim() || undefined,
      heroImage: editingCategory.heroImage.trim() || '',
      image: editingCategory.heroImage.trim() || '',
      displayOrder: Number(editingCategory.displayOrder) || 1,
      order: Number(editingCategory.displayOrder) || 1,
      enabled: editingCategory.enabled,
      hidden: !editingCategory.enabled
    };

    try {
      await storageService.saveCategory(categoryItem);
      // Actual save successfully completed!
      setSaveStatus('saved');
      const allUpdated = storageService.getCategories();
      setItems(allUpdated);
      onCategoriesUpdated(allUpdated);
      showSuccess(isAddingCategory ? `Category "${categoryItem.name}" created!` : `Category "${categoryItem.name}" updated!`);
      await new Promise(res => setTimeout(res, 800));
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save category:', err);
      setSaveStatus('failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async (cat: CategoryHierarchyItem) => {
    const nextEnabled = !(cat.enabled !== false && !cat.hidden);
    const updatedCat: CategoryHierarchyItem = {
      ...cat,
      enabled: nextEnabled,
      hidden: !nextEnabled
    };
    try {
      await storageService.saveCategory(updatedCat);
      const all = storageService.getCategories();
      setItems(all);
      onCategoriesUpdated(all);
      showSuccess(`Category "${cat.name}" is now ${nextEnabled ? 'enabled' : 'hidden'}.`);
    } catch (err) {
      console.error('Failed to toggle category enabled status:', err);
    }
  };

  const handleDelete = async (cat: CategoryHierarchyItem) => {
    if (window.confirm(`Are you sure you want to permanently delete category "${cat.name}"? Products in this category will not be deleted.`)) {
      try {
        await storageService.deleteCategory(cat.id);
        const all = storageService.getCategories();
        setItems(all);
        onCategoriesUpdated(all);
        showSuccess(`Category "${cat.name}" deleted.`);
      } catch (err) {
        console.error('Failed to delete category:', err);
      }
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    // Reassign sequential display orders
    const reordered = copy.map((cat, i) => ({
      ...cat,
      displayOrder: i + 1,
      order: i + 1
    }));

    setItems(reordered);
    try {
      await storageService.saveCategories(reordered);
      onCategoriesUpdated(reordered);
      showSuccess('Category display order updated.');
    } catch (err) {
      console.error('Failed to update category order:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs tracking-wider uppercase font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-stone-200">
        <div>
          <h3 className="font-editorial text-xl uppercase tracking-wider text-black">
            Category Management
          </h3>
          <p className="text-xs text-stone-500 font-light mt-0.5">
            Every product belongs to exactly one category. All categories and hero banners are persistently saved.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-semibold transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories List Table */}
      <div className="bg-white border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[10px] tracking-[0.2em] uppercase text-stone-500 font-medium">
                <th className="py-3.5 px-4 w-16 text-center">Order</th>
                <th className="py-3.5 px-4 w-24">Hero Image</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Eyebrow & Subtitle</th>
                <th className="py-3.5 px-4 w-28 text-center">Status</th>
                <th className="py-3.5 px-4 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400 font-light">
                    No categories found. Click "Add Category" above to create one.
                  </td>
                </tr>
              ) : (
                items.map((cat, index) => {
                  const isEnabled = cat.enabled !== false && !cat.hidden;
                  const heroImg = cat.heroImage || cat.image;

                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        !isEnabled ? 'opacity-50 bg-stone-50/30' : ''
                      }`}
                    >
                      {/* Order Controls */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(index, 'up')}
                            className="p-1 hover:text-black disabled:opacity-20 transition-opacity"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-xs font-semibold text-black w-5 text-center">
                            {cat.displayOrder || cat.order || index + 1}
                          </span>
                          <button
                            type="button"
                            disabled={index === items.length - 1}
                            onClick={() => handleMoveOrder(index, 'down')}
                            className="p-1 hover:text-black disabled:opacity-20 transition-opacity"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Hero Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-14 h-14 bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                          {heroImg ? (
                            <img
                              src={heroImg}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-stone-400 p-1 text-center">
                              <ImageIcon className="w-4 h-4 mb-0.5" />
                              <span className="text-[8px] uppercase tracking-wider font-mono">No Hero</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category Name & Slug */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-black text-sm">
                          {cat.name}
                        </div>
                        <div className="font-mono text-[11px] text-stone-400 mt-0.5">
                          slug: /{cat.slug}
                        </div>
                        {cat.heroTitle && cat.heroTitle !== cat.name.toUpperCase() && (
                          <div className="text-[10px] text-stone-500 uppercase tracking-wider mt-0.5">
                            Title: {cat.heroTitle}
                          </div>
                        )}
                      </td>

                      {/* Eyebrow & Subtitle */}
                      <td className="py-3 px-4 hidden md:table-cell text-stone-500 max-w-xs">
                        <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                          {cat.eyebrowText || 'SOFYRA FINE COLLECTION'}
                        </div>
                        <div className="text-xs truncate text-stone-600 mt-0.5">
                          {cat.heroSubtitle || cat.tagline || cat.description || '—'}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(cat)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border cursor-pointer transition-colors ${
                            isEnabled
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                          }`}
                        >
                          {isEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{isEnabled ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-stone-600 hover:text-black border border-stone-200 hover:border-black transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 text-stone-400 hover:text-red-700 border border-stone-200 hover:border-red-300 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT / ADD CATEGORY MODAL DIALOG */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase text-stone-500 font-medium block">
                  Category Configuration
                </span>
                <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                  {isAddingCategory ? 'Add New Category' : `Edit Category: ${editingCategory.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-stone-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. CATEGORY NAME */}
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1 font-semibold">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name}
                    onChange={e => handleFormNameChange(e.target.value)}
                    placeholder="e.g. Pendants, Bangles, Payal"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-xs text-black focus:border-black focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Displayed in category menus and grids.</p>
                </div>

                {/* 2. SLUG */}
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1 font-semibold">
                    Slug / URL Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.slug}
                    onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                    placeholder="e.g. pendants, bangles"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-xs font-mono text-black focus:border-black focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Direct URL route identifier (e.g. #category=pendants).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 3. EYEBROW / SMALL HEADING */}
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1 font-semibold">
                    Eyebrow / Small Heading
                  </label>
                  <input
                    type="text"
                    value={editingCategory.eyebrowText}
                    onChange={e => setEditingCategory({ ...editingCategory, eyebrowText: e.target.value })}
                    placeholder="e.g. SOFYRA FINE COLLECTION"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-xs text-black focus:border-black focus:outline-none uppercase"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Subtle uppercase label above the main hero heading.</p>
                </div>

                {/* 4. CATEGORY TITLE */}
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1 font-semibold">
                    Category Hero Title
                  </label>
                  <input
                    type="text"
                    value={editingCategory.heroTitle}
                    onChange={e => setEditingCategory({ ...editingCategory, heroTitle: e.target.value })}
                    placeholder="e.g. PENDANTS"
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-xs text-black focus:border-black focus:outline-none uppercase"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Large display heading on the category page hero.</p>
                </div>
              </div>

              {/* 5. CATEGORY SUBTITLE */}
              <div>
                <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1 font-semibold">
                  Category Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={editingCategory.heroSubtitle}
                  onChange={e => setEditingCategory({ ...editingCategory, heroSubtitle: e.target.value })}
                  placeholder="e.g. SOLITAIRE STONES, MEDALLIONS & SCULPTURAL CHARMS"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-xs text-black focus:border-black focus:outline-none"
                />
                <p className="text-[10px] text-stone-500 mt-1">Featured below the category hero title.</p>
              </div>

              {/* 6. DESCRIPTION */}
              <div>
                <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1 font-semibold">
                  Editorial Description
                </label>
                <textarea
                  rows={3}
                  value={editingCategory.description}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Detailed description of the category's craftsmanship, materials, and design philosophy..."
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-xs text-black focus:border-black focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* 7. HERO IMAGE (Upload / Replace / Remove / Preview) */}
              <div>
                <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1.5 font-semibold">
                  Category Hero Image
                </label>
                <ImageUploadField
                  value={editingCategory.heroImage}
                  onChange={(url) => setEditingCategory({ ...editingCategory, heroImage: url })}
                  aspectRatio="hero"
                  placeholder="Upload category hero photo or paste direct image URL"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Upload a high-resolution jewellery image. If left empty, the page will display a clean, elegant typographic header without any placeholder or watch image.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200">
                {/* 8. DISPLAY ORDER */}
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-1 font-semibold">
                    Display Order (Numeric)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingCategory.displayOrder}
                    onChange={e => setEditingCategory({ ...editingCategory, displayOrder: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#FAF9F6] border border-stone-300 p-2.5 text-xs font-mono text-black focus:border-black focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Lower numbers appear first in navigation and grids.</p>
                </div>

                {/* 9. ENABLED (Toggle) */}
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-stone-700 mb-2 font-semibold">
                    Visibility Status
                  </label>
                  <label className="flex items-center gap-3 p-2.5 border border-stone-200 bg-[#FAF9F6] cursor-pointer hover:border-black transition-colors">
                    <input
                      type="checkbox"
                      checked={editingCategory.enabled}
                      onChange={e => setEditingCategory({ ...editingCategory, enabled: e.target.checked })}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-black uppercase tracking-wider block">
                        {editingCategory.enabled ? 'Category Enabled' : 'Category Hidden / Disabled'}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {editingCategory.enabled
                          ? 'Visible to customers on public storefront navigation and filters.'
                          : 'Hidden from public storefront navigation and collections.'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="px-5 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs tracking-[0.2em] uppercase font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-semibold cursor-pointer shadow-sm transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {saveStatus === 'saving'
                      ? 'Saving…'
                      : saveStatus === 'saved'
                      ? 'Saved ✓'
                      : saveStatus === 'failed'
                      ? 'Save failed — try again'
                      : (isAddingCategory ? 'Create Category' : 'Save Changes')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
