import React, { useState } from 'react';
import { CustomerReview, Product } from '../../types';
import { storageService } from '../../services/storageService';
import { ImageUploadField } from './ImageUploadField';
import {
  Star,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Tag,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ImageIcon
} from 'lucide-react';

interface ReviewsManagerProps {
  reviews: CustomerReview[];
  products: Product[];
  onReviewsUpdated: (reviews: CustomerReview[]) => void;
}

export const ReviewsManager: React.FC<ReviewsManagerProps> = ({
  reviews,
  products,
  onReviewsUpdated
}) => {
  const [items, setItems] = useState<CustomerReview[]>(() =>
    [...reviews].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New review form state
  const [newForm, setNewForm] = useState<{
    customerName: string;
    customerCity: string;
    rating: number;
    title: string;
    comment: string;
    productId: string;
    verified: boolean;
    userImage: string;
    published: boolean;
  }>({
    customerName: '',
    customerCity: '',
    rating: 5,
    title: '',
    comment: '',
    productId: '',
    verified: true,
    userImage: '',
    published: true
  });

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleAdd = () => {
    if (!newForm.customerName.trim() || !newForm.comment.trim()) return;

    const matchedProduct = products.find((p) => p.id === newForm.productId);

    const added = storageService.addReview({
      customerName: newForm.customerName.trim(),
      customerCity: newForm.customerCity.trim() || undefined,
      rating: Number(newForm.rating),
      title: newForm.title.trim() || undefined,
      comment: newForm.comment.trim(),
      productId: newForm.productId || undefined,
      productName: matchedProduct ? matchedProduct.name : undefined,
      verified: Boolean(newForm.verified),
      userImage: newForm.userImage || undefined,
      image: newForm.userImage || undefined,
      published: Boolean(newForm.published),
      order: items.length + 1
    });

    const next = [...items, added].map((r, i) => ({ ...r, order: i + 1 }));
    setItems(next);
    storageService.saveAllReviews(next);
    onReviewsUpdated(next);
    showSuccess('Customer review added successfully!');
    setIsAdding(false);
    setNewForm({
      customerName: '',
      customerCity: '',
      rating: 5,
      title: '',
      comment: '',
      productId: '',
      verified: true,
      userImage: '',
      published: true
    });
  };

  const handleStartEdit = (rev: CustomerReview) => {
    setEditingReview({ ...rev });
  };

  const handleSaveEdit = () => {
    if (!editingReview || !editingReview.customerName.trim() || !editingReview.comment.trim()) return;

    const matchedProduct = products.find((p) => p.id === editingReview.productId);
    const updatedReview: CustomerReview = {
      ...editingReview,
      productName: matchedProduct ? matchedProduct.name : editingReview.productName,
      userImage: editingReview.userImage || editingReview.image || undefined,
      image: editingReview.userImage || editingReview.image || undefined
    };

    const next = items.map((r) => (r.id === updatedReview.id ? updatedReview : r));
    setItems(next);
    storageService.saveAllReviews(next);
    onReviewsUpdated(next);
    setEditingReview(null);
    showSuccess('Review updated successfully!');
  };

  const handleDelete = (id: string, customerName: string) => {
    if (window.confirm(`Delete review from "${customerName}"? This cannot be undone.`)) {
      storageService.deleteReview(id);
      const next = items.filter((r) => r.id !== id).map((r, i) => ({ ...r, order: i + 1 }));
      setItems(next);
      storageService.saveAllReviews(next);
      onReviewsUpdated(next);
      showSuccess('Review deleted.');
    }
  };

  const handleTogglePublish = (id: string) => {
    const next = items.map((r) => {
      if (r.id === id) {
        const nextPub = r.published === false ? true : false;
        return { ...r, published: nextPub };
      }
      return r;
    });
    setItems(next);
    storageService.saveAllReviews(next);
    onReviewsUpdated(next);
    const current = next.find((r) => r.id === id);
    showSuccess(
      current?.published !== false
        ? 'Review is now LIVE on store.'
        : 'Review is now HIDDEN from store.'
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const reordered = copy.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    setItems(reordered);
    storageService.saveAllReviews(reordered);
    onReviewsUpdated(reordered);
    showSuccess(`Moved review ${direction}. New display sequence saved!`);
  };

  return (
    <div className="space-y-8">
      {successToast && (
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between text-xs tracking-wider uppercase font-medium shadow-xs">
          <span>{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-stone-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-1">
            Social Proof & Testimonials
          </span>
          <h2 className="font-editorial text-2xl uppercase tracking-wider text-black">
            Customer Reviews ({items.length})
          </h2>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Manage genuine client reviews, star ratings, publish/hide status, and genuine customer jewellery photos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="px-5 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-[0.2em] uppercase font-medium flex items-center gap-2 cursor-pointer transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Review</span>
        </button>
      </div>

      {/* Add Review Panel */}
      {isAdding && (
        <div className="p-6 bg-white border border-stone-300 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-editorial text-lg uppercase tracking-wider text-black">
              Add Customer Review
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-stone-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={newForm.customerName}
                onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
                placeholder="e.g. Maham S."
                className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                City / Location (Optional)
              </label>
              <input
                type="text"
                value={newForm.customerCity}
                onChange={(e) => setNewForm({ ...newForm, customerCity: e.target.value })}
                placeholder="e.g. Lahore, Karachi, Islamabad"
                className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Star Rating (1 to 5)
              </label>
              <select
                value={newForm.rating}
                onChange={(e) => setNewForm({ ...newForm, rating: Number(e.target.value) })}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
              >
                <option value={5}>5 Stars ★★★★★</option>
                <option value={4}>4 Stars ★★★★☆</option>
                <option value={3}>3 Stars ★★★☆☆</option>
                <option value={2}>2 Stars ★★☆☆☆</option>
                <option value={1}>1 Star ★☆☆☆☆</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Review Headline / Title (Optional)
              </label>
              <input
                type="text"
                value={newForm.title}
                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                placeholder="e.g. Exquisite Craftsmanship"
                className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Tag Related Product (Optional)
              </label>
              <select
                value={newForm.productId}
                onChange={(e) => setNewForm({ ...newForm, productId: e.target.value })}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
              >
                <option value="">-- General Store Review --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
              Review Content *
            </label>
            <textarea
              rows={3}
              value={newForm.comment}
              onChange={(e) => setNewForm({ ...newForm, comment: e.target.value })}
              placeholder="Write the customer's authentic review here..."
              className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <ImageUploadField
              label="Customer Photo (Optional — Genuine client unboxing or look)"
              currentImage={newForm.userImage}
              onImageChange={(url) => setNewForm({ ...newForm, userImage: url })}
              aspectHint="Genuine jewellery photo taken by customer"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newForm.published}
                onChange={(e) => setNewForm({ ...newForm, published: e.target.checked })}
                className="w-4 h-4 text-black border-stone-300 focus:ring-0"
              />
              <span>Publish Live on Store immediately</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newForm.verified}
                onChange={(e) => setNewForm({ ...newForm, verified: e.target.checked })}
                className="w-4 h-4 text-black border-stone-300 focus:ring-0"
              />
              <span>Verified Purchase badge</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-stone-300 text-xs tracking-wider uppercase text-stone-600 hover:text-black cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newForm.customerName.trim() || !newForm.comment.trim()}
              className="px-6 py-2 bg-black text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
            >
              Save & Publish Review
            </button>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white w-full max-w-xl p-6 sm:p-8 border border-stone-200 shadow-xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-editorial text-xl uppercase tracking-wider text-black">
                Edit Customer Review
              </h3>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="text-stone-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={editingReview.customerName}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, customerName: e.target.value })
                  }
                  className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={editingReview.customerCity || ''}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, customerCity: e.target.value })
                  }
                  placeholder="e.g. Lahore"
                  className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                  Star Rating
                </label>
                <select
                  value={editingReview.rating}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, rating: Number(e.target.value) })
                  }
                  className="w-full border border-stone-300 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                >
                  <option value={5}>5 Stars ★★★★★</option>
                  <option value={4}>4 Stars ★★★★☆</option>
                  <option value={3}>3 Stars ★★★☆☆</option>
                  <option value={2}>2 Stars ★★☆☆☆</option>
                  <option value={1}>1 Star ★☆☆☆☆</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                  Title / Headline
                </label>
                <input
                  type="text"
                  value={editingReview.title || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, title: e.target.value })}
                  className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                  Related Product
                </label>
                <select
                  value={editingReview.productId || ''}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, productId: e.target.value })
                  }
                  className="w-full border border-stone-300 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                >
                  <option value="">-- General Store Review --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                Review Text *
              </label>
              <textarea
                rows={3}
                value={editingReview.comment}
                onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <ImageUploadField
                label="Customer Photo (Optional)"
                currentImage={editingReview.userImage || editingReview.image || ''}
                onImageChange={(url) =>
                  setEditingReview({ ...editingReview, userImage: url, image: url })
                }
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingReview.published !== false}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, published: e.target.checked })
                  }
                  className="w-4 h-4 text-black border-stone-300 focus:ring-0"
                />
                <span>Published / Live on Store</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingReview.verified)}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, verified: e.target.checked })
                  }
                  className="w-4 h-4 text-black border-stone-300 focus:ring-0"
                />
                <span>Verified Purchase badge</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 border border-stone-300 text-xs tracking-wider uppercase text-stone-600 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editingReview.customerName.trim() || !editingReview.comment.trim()}
                className="px-6 py-2 bg-black text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Cards List */}
      {items.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200 space-y-3">
          <p className="font-editorial text-lg uppercase tracking-wider text-black">
            No Customer Reviews Yet
          </p>
          <p className="text-xs text-stone-500 font-light max-w-md mx-auto">
            Zero reviews are currently recorded. Click &ldquo;Add New Review&rdquo; above to publish genuine customer testimonials, star ratings, and unboxing photos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((rev, index) => {
            const photo = rev.userImage || rev.image;
            const isLive = rev.published !== false;
            return (
              <div
                key={rev.id}
                className={`bg-white border p-5 transition-colors shadow-2xs ${
                  isLive ? 'border-stone-200' : 'border-stone-300 opacity-75 bg-stone-50/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Sequence + Photo + Content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                        title="Move Up in Display Sequence"
                        className="p-1 border border-stone-200 text-stone-500 hover:text-black hover:border-black disabled:opacity-30 disabled:hover:border-stone-200 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-medium text-stone-400">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        title="Move Down in Display Sequence"
                        className="p-1 border border-stone-200 text-stone-500 hover:text-black hover:border-black disabled:opacity-30 disabled:hover:border-stone-200 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Customer Photo Thumbnail if provided */}
                    {photo ? (
                      <div className="w-16 h-16 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                        <img
                          src={photo}
                          alt="Customer review photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-stone-50 border border-dashed border-stone-200 flex items-center justify-center text-stone-300 shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Rating Stars */}
                        <div className="flex items-center text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating
                                  ? 'fill-current text-amber-500'
                                  : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Published Status Badge */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(rev.id)}
                          className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 border cursor-pointer ${
                            isLive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300'
                          }`}
                          title="Click to toggle published / hidden status"
                        >
                          {isLive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{isLive ? 'Live on Store' : 'Hidden'}</span>
                        </button>

                        {rev.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>

                      {/* Title & Comment */}
                      {rev.title && (
                        <h4 className="font-editorial text-sm uppercase tracking-wider text-black pt-1">
                          {rev.title}
                        </h4>
                      )}
                      <p className="text-xs text-stone-600 font-light leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>

                      {/* Customer Info */}
                      <div className="pt-1 flex items-center gap-2 text-xs text-stone-500 font-medium flex-wrap">
                        <span className="text-black font-semibold uppercase text-[11px]">
                          {rev.customerName}
                        </span>
                        {rev.customerCity && <span>• {rev.customerCity}</span>}
                        {rev.productName && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5">
                            <Tag className="w-2.5 h-2.5" />
                            {rev.productName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(rev)}
                      className="px-3 py-1.5 border border-stone-200 hover:border-black text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id, rev.customerName)}
                      className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
