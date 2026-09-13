import React, { useState } from 'react';
import { CustomerReview } from '../types';
import { storageService } from '../services/storageService';
import { apiClient } from '../services/apiClient';
import { Star, ShieldCheck, ChevronLeft, ChevronRight, Plus, X, Tag, Loader2 } from 'lucide-react';

interface ReviewsSectionProps {
  reviews: CustomerReview[];
  title?: string;
  subtitle?: string;
  productId?: string;
  productName?: string;
  onReviewAdded?: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  title = 'Customer Reviews',
  subtitle = 'Client Testimonials',
  productId,
  productName,
  onReviewAdded
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // New review modal state
  const [newReview, setNewReview] = useState({
    customerName: '',
    customerCity: '',
    rating: 5,
    title: '',
    comment: '',
    productName: productName || '',
    userImage: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter only published reviews, sorted by admin-specified order
  const validReviews = reviews
    .filter((r) => r.published !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  // Filter reviews if specific to a product, or show all if on homepage/general
  const displayedReviews = productId
    ? validReviews.filter((r) => r.productId === productId || !r.productId)
    : validReviews;

  // On the homepage (when !productId): if zero reviews exist, hide the section completely
  // (per requirement: no fake social proof or empty placeholder blocks on homepage)
  if (!productId && displayedReviews.length === 0) {
    return null;
  }

  // Calculate average rating
  const avgRating = displayedReviews.length > 0
    ? (displayedReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / displayedReviews.length).toFixed(1)
    : '5.0';

  const maxPages = Math.max(1, Math.ceil(displayedReviews.length / 3));

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % maxPages);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + maxPages) % maxPages);
  };

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WEBP, etc.)');
      return;
    }

    setIsUploadingPhoto(true);

    // Helper to compress image
    const compress = (f: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const MAX_DIM = 1200;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.85));
            } else {
              resolve(ev.target?.result as string);
            }
          };
          img.onerror = () => resolve(ev.target?.result as string);
          img.src = ev.target?.result as string;
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(f);
      });
    };

    try {
      const dataUrl = await compress(file);
      if (dataUrl) {
        const res = await apiClient.uploadImage(dataUrl, file.name);
        if (res.success && res.url) {
          setNewReview((prev) => ({ ...prev, userImage: res.url }));
        } else {
          setNewReview((prev) => ({ ...prev, userImage: dataUrl }));
        }
      }
    } catch (err) {
      console.warn('Fallback reading image:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewReview((prev) => ({ ...prev, userImage: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.customerName.trim() || !newReview.comment.trim()) return;

    setIsSubmitting(true);

    try {
      storageService.addReview({
        customerName: newReview.customerName.trim(),
        customerCity: newReview.customerCity.trim() || undefined,
        rating: newReview.rating,
        title: newReview.title.trim() || undefined,
        comment: newReview.comment.trim(),
        productName: productName || newReview.productName.trim() || undefined,
        productId: productId || undefined,
        verified: false, // will be verified by admin
        userImage: newReview.userImage || undefined,
        published: true
      });

      setIsSubmitting(false);
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        setIsModalOpen(false);
        setNewReview({
          customerName: '',
          customerCity: '',
          rating: 5,
          title: '',
          comment: '',
          productName: productName || '',
          userImage: ''
        });
        if (onReviewAdded) onReviewAdded();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setIsSubmitting(false);
    }
  };

  // 3 reviews per page on desktop
  const visibleReviews = displayedReviews.slice(currentIndex * 3, currentIndex * 3 + 3);

  return (
    <section id="reviews-section" className="py-16 md:py-24 bg-[#FAF9F6] border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-stone-200 gap-4">
          <div>
            <span className="text-[10px] tracking-[0.35em] uppercase text-stone-400 font-light block mb-1.5">
              {subtitle}
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="font-editorial text-2xl md:text-3xl lg:text-4xl tracking-[0.06em] font-light text-black uppercase">
                {title}
              </h2>
              {displayedReviews.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-white border border-stone-200 text-xs">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                  </div>
                  <span className="font-medium text-black">{avgRating} / 5.0</span>
                  <span className="text-stone-400">({displayedReviews.length})</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-black text-white hover:bg-stone-800 text-[11px] tracking-[0.2em] uppercase font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write a Review</span>
            </button>

            {maxPages > 1 && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-2.5 border border-stone-300 hover:border-black text-black bg-white transition-colors cursor-pointer"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-2.5 border border-stone-300 hover:border-black text-black bg-white transition-colors cursor-pointer"
                  aria-label="Next reviews"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Grid or Product Detail Empty State */}
        {displayedReviews.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-stone-300 bg-white p-8">
            <p className="font-editorial text-lg uppercase tracking-wider text-black mb-2">No Reviews Yet</p>
            <p className="text-xs text-stone-500 font-light max-w-sm mx-auto mb-6">
              Be the first to share your experience with this piece.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-black text-white text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleReviews.map((rev) => {
              const photo = rev.userImage || rev.image;
              return (
                <div
                  key={rev.id}
                  className="bg-white border border-stone-200 p-6 md:p-8 flex flex-col justify-between hover:border-stone-300 transition-colors shadow-2xs"
                >
                  <div>
                    {/* Rating Stars & Optional Verified Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'fill-amber-400 stroke-amber-400'
                                : 'fill-stone-200 stroke-stone-200'
                            }`}
                          />
                        ))}
                      </div>

                      {rev.verified === true && (
                        <span className="flex items-center gap-1 text-[10px] tracking-[0.12em] uppercase text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>

                    {/* Headline */}
                    {rev.title && (
                      <h4 className="font-editorial text-base uppercase tracking-wider text-black mb-2 font-normal">
                        &ldquo;{rev.title}&rdquo;
                      </h4>
                    )}

                    {/* Review comment */}
                    <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed mb-4">
                      {rev.comment}
                    </p>

                    {/* Customer photo (only displayed when genuine customer photo is attached) */}
                    {photo && (
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(photo)}
                          className="w-20 h-20 border border-stone-200 overflow-hidden bg-stone-100 cursor-pointer block hover:opacity-90 transition-opacity text-left"
                          title="Click to view customer photo"
                        >
                          <img
                            src={photo}
                            alt={`Review photo from ${rev.customerName}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer / Customer details */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs gap-2">
                    <div>
                      <span className="font-medium text-black block tracking-wide uppercase text-[11px]">
                        {rev.customerName}
                      </span>
                      {rev.customerCity && (
                        <span className="text-[10px] text-stone-400 font-light block">
                          {rev.customerCity}
                        </span>
                      )}
                    </div>

                    {rev.productName && (
                      <span className="text-[10px] text-stone-500 font-light flex items-center gap-1 max-w-[150px] truncate">
                        <Tag className="w-2.5 h-2.5 shrink-0 text-stone-400" />
                        <span className="truncate">{rev.productName}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Lightbox for customer photo */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 cursor-pointer p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Customer review piece"
              className="max-h-[80vh] w-auto mx-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Modal: Write a Review */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white w-full max-w-lg p-6 sm:p-8 border border-stone-200 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 pb-4 border-b border-stone-200">
              <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light block mb-1">
                Share Your Experience
              </span>
              <h3 className="font-editorial text-2xl uppercase tracking-wider text-black">
                Write a Review
              </h3>
              {productName && (
                <p className="text-xs text-stone-500 font-light mt-1">
                  For: <span className="text-black font-medium">{productName}</span>
                </p>
              )}
            </div>

            {submitted ? (
              <div className="py-12 text-center">
                <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-editorial text-xl uppercase tracking-wider text-black mb-1">
                  Thank You
                </h4>
                <p className="text-xs text-stone-500 font-light">
                  Your review has been successfully submitted.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newReview.customerName}
                      onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                      placeholder="e.g. Maham S."
                      className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                      City (Optional)
                    </label>
                    <input
                      type="text"
                      value={newReview.customerCity}
                      onChange={(e) => setNewReview({ ...newReview, customerCity: e.target.value })}
                      placeholder="e.g. Lahore, Karachi"
                      className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                    Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="p-1 text-stone-300 hover:text-amber-400 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newReview.rating
                              ? 'fill-amber-400 stroke-amber-400'
                              : 'fill-stone-100 stroke-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-stone-500 ml-2 font-medium">
                      {newReview.rating} out of 5 stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                    Headline / Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="e.g. Exquisite quality and brilliance"
                    className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700 mb-1">
                    Review *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your thoughts on craftsmanship, styling, or delivery..."
                    className="w-full border border-stone-300 px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] tracking-wider uppercase font-medium text-stone-700">
                      Photo of Piece / Unboxing (Optional)
                    </label>
                    {isUploadingPhoto && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 uppercase tracking-wider">
                        <Loader2 className="w-3 h-3 animate-spin" /> Processing Photo...
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingPhoto}
                    onChange={handleImageUpload}
                    className="w-full border border-stone-300 px-3 py-2 text-xs text-stone-600 file:mr-4 file:py-1 file:px-2 file:border-0 file:text-xs file:bg-stone-100 file:text-black cursor-pointer disabled:opacity-50"
                  />
                  {newReview.userImage && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-16 h-16 border border-stone-200 overflow-hidden relative group">
                        <img src={newReview.userImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewReview((prev) => ({ ...prev, userImage: '' }))}
                        className="text-[11px] text-red-600 hover:text-red-700 tracking-wider uppercase underline cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-stone-300 text-xs tracking-wider uppercase text-stone-600 hover:text-black cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-black text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
