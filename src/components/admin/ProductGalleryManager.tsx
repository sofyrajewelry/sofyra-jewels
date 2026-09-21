import React, { useRef, useState } from 'react';
import { Upload, Trash2, ArrowLeft, ArrowRight, Star, Plus, Link as LinkIcon, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ProductGalleryManagerProps {
  images: string[];
  onChange: (newImages: string[]) => void;
  productName?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

export const ProductGalleryManager: React.FC<ProductGalleryManagerProps> = ({
  images,
  onChange,
  productName,
  onUploadingChange
}) => {
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const singleReplaceRef = useRef<HTMLInputElement>(null);
  const primaryUploadRef = useRef<HTMLInputElement>(null);

  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; filename?: string } | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setUploadFeedback(msg);
    setTimeout(() => setUploadFeedback(null), 4000);
  };

  // High-performance client-side image compression: native canvas.toBlob for fast uploads
  const compressImageToBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error(`"${file.name}" is not a valid image file.`));
        return;
      }

      // If already a small, optimized web image (< 350KB), skip canvas re-compression
      if (file.size < 350 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp' || file.type === 'image/png')) {
        resolve(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1400;
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
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.85
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to process image data for "${file.name}".`));
      };
      img.src = objectUrl;
    });
  };

  // Upload file to server and retrieve permanent persistent URL
  const processAndUploadFile = async (file: File): Promise<string> => {
    const compressedBlob = await compressImageToBlob(file);
    const uploadRes = await apiClient.uploadImage(compressedBlob, file.name);

    if (uploadRes.success && uploadRes.url) {
      return uploadRes.url;
    }

    throw new Error(uploadRes.error || `Upload failed for ${file.name}`);
  };

  // Handle multi-file selection from user device with CONCURRENT (parallel) uploads
  const handleMultiFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    setIsUploading(true);
    onUploadingChange?.(true);
    setUploadError(null);
    setUploadProgress({ current: 0, total: fileList.length });

    try {
      let completedCount = 0;

      // CONCURRENT UPLOADS via Promise.all to avoid slow sequential bottlenecks
      const uploadPromises = fileList.map(async (file) => {
        try {
          const url = await processAndUploadFile(file);
          completedCount++;
          setUploadProgress({ current: completedCount, total: fileList.length });
          return { success: true, url, name: file.name };
        } catch (err: any) {
          completedCount++;
          setUploadProgress({ current: completedCount, total: fileList.length });
          return {
            success: false,
            error: err.message || `Failed to upload "${file.name}"`,
            name: file.name
          };
        }
      });

      const results = await Promise.all(uploadPromises);

      const successfulUrls = results
        .filter((r) => r.success && r.url)
        .map((r) => r.url as string);

      const errors = results
        .filter((r) => !r.success && r.error)
        .map((r) => r.error as string);

      // Preserve all existing images and append newly uploaded permanent URLs
      if (successfulUrls.length > 0) {
        onChange([...images, ...successfulUrls]);
        showNotification(`Saved ${successfulUrls.length} photo(s) to permanent product storage.`);
      }

      if (errors.length > 0) {
        setUploadError(errors.join('. '));
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process images.');
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      setUploadProgress(null);
      if (multiFileInputRef.current) {
        multiFileInputRef.current.value = '';
      }
    }
  };

  // Upload directly as the primary image
  const handlePrimaryUploadSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    onUploadingChange?.(true);
    setUploadError(null);
    setUploadProgress({ current: 0, total: 1, filename: file.name });
    try {
      const uploadedUrl = await processAndUploadFile(file);
      // Put at index 0 as cover, preserving all existing images
      onChange([uploadedUrl, ...images]);
      showNotification('New photo uploaded to permanent storage and set as PRIMARY MAIN IMAGE.');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload primary image.');
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      setUploadProgress(null);
      if (primaryUploadRef.current) {
        primaryUploadRef.current.value = '';
      }
    }
  };

  // Replace single image at index
  const handleReplaceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceIndex === null) return;

    setIsUploading(true);
    onUploadingChange?.(true);
    setUploadError(null);
    setUploadProgress({ current: 0, total: 1, filename: file.name });
    try {
      const uploadedUrl = await processAndUploadFile(file);
      const updated = [...images];
      updated[replaceIndex] = uploadedUrl;
      onChange(updated);
      showNotification(
        replaceIndex === 0
          ? 'Primary image replaced and permanently saved. BEST SELLERS will display this new photo.'
          : `Photo #${replaceIndex + 1} permanently updated.`
      );
    } catch (err: any) {
      setUploadError(err.message || 'Failed to replace image.');
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      setUploadProgress(null);
      setReplaceIndex(null);
      if (singleReplaceRef.current) {
        singleReplaceRef.current.value = '';
      }
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    const url = manualUrl.trim();
    onChange([...images, url]);
    setManualUrl('');
    setShowUrlInput(false);
    showNotification('Image URL added to gallery.');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (images.length === 1) {
      if (!window.confirm('Removing the only photo will leave this product without an image. Continue?')) {
        return;
      }
    }
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    showNotification(indexToRemove === 0 ? 'Primary image removed. Next photo became primary.' : 'Photo removed.');
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const updated = [...images];
    const item = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, item);
    onChange(updated);
    if (toIndex === 0) {
      showNotification('New primary image selected! BEST SELLERS will show this image.');
    }
  };

  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const [chosen] = updated.splice(index, 1);
    updated.unshift(chosen);
    onChange(updated);
    showNotification('★ Selected as PRIMARY MAIN IMAGE. Homepage BEST SELLERS will automatically display this photo!');
  };

  const primaryImage = images[0];

  return (
    <div className="space-y-4 bg-stone-50 border border-stone-200 p-4 sm:p-5">
      {/* Hidden file inputs */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleMultiFileSelect}
      />
      <input
        ref={singleReplaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplaceFileSelect}
      />
      <input
        ref={primaryUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePrimaryUploadSelect}
      />

      {/* Header with Title and Primary Upload Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-black">
              Product Images & Gallery ({images.length} photos)
            </h4>
            {isUploading && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                <span>
                  {uploadProgress && uploadProgress.total > 1
                    ? `Uploading photos (${uploadProgress.current} of ${uploadProgress.total} completed)...`
                    : uploadProgress?.filename
                    ? `Uploading "${uploadProgress.filename}"...`
                    : 'Uploading photo to permanent storage...'}
                </span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-500 font-light mt-0.5">
            The 1st image is the <strong>Primary Main Image</strong> displayed in BEST SELLERS, catalog cards, and search results.
          </p>
        </div>

        {/* Multi-file Upload Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => primaryUploadRef.current?.click()}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-[11px] tracking-wider uppercase font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            title="Upload a new photo directly as the primary image"
          >
            <Star className="w-3 h-3 fill-black" />
            <span>Upload New Main Image</span>
          </button>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => multiFileInputRef.current?.click()}
            className="px-3 py-1.5 bg-black text-white hover:bg-stone-800 text-[11px] tracking-wider uppercase font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            <span>Add Photos</span>
          </button>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {isUploading && uploadProgress && uploadProgress.total > 1 && (
        <div className="w-full bg-stone-200 h-1.5 overflow-hidden rounded-xs">
          <div
            className="bg-black h-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, Math.round((uploadProgress.current / uploadProgress.total) * 100))}%` }}
          />
        </div>
      )}

      {/* Notification Toast */}
      {uploadFeedback && (
        <div className="p-2.5 bg-black text-white text-[11px] flex items-center justify-between tracking-wide animate-fade-in">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-amber-400" />
            {uploadFeedback}
          </span>
          <button
            type="button"
            onClick={() => setUploadFeedback(null)}
            className="text-stone-400 hover:text-white text-xs cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{uploadError}</span>
          </span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-800 text-xs font-bold cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. PRIMARY COVER SHOWCASE CARD */}
      {primaryImage ? (
        <div className="p-3.5 bg-white border-2 border-stone-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-stone-100 border border-stone-200 shrink-0 overflow-hidden">
            <img
              src={primaryImage}
              alt={productName || 'Primary product image'}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black text-amber-300 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
              <Star className="w-2.5 h-2.5 fill-amber-300" /> Primary
            </span>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-900 bg-amber-100 px-2 py-0.5 border border-amber-300">
                ★ Active Primary Main Image
              </span>
            </div>
            <p className="text-xs text-black font-medium">
              This photo is currently displayed on the <strong>BEST SELLERS</strong> homepage section and main product cards.
            </p>
            <p className="text-[10px] text-stone-500 font-light truncate max-w-md">
              URL: {primaryImage}
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  setReplaceIndex(0);
                  singleReplaceRef.current?.click();
                }}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-black text-[10px] uppercase tracking-wider font-semibold border border-stone-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replace Main Image</span>
              </button>

              {images.length > 1 && (
                <span className="text-[10px] text-stone-500 self-center">
                  Or click <strong>&ldquo;Set as Primary&rdquo;</strong> on any photo below to swap.
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-stone-300 text-center bg-white">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          <p className="text-xs font-medium uppercase tracking-wider text-stone-600 mb-1">
            No Images Added Yet
          </p>
          <p className="text-[11px] text-stone-400 font-light max-w-sm mx-auto mb-4">
            Upload high-resolution photos of this jewellery piece to display on the storefront and in BEST SELLERS.
          </p>
          <button
            type="button"
            onClick={() => multiFileInputRef.current?.click()}
            className="px-4 py-2 bg-black text-white hover:bg-stone-800 text-xs uppercase tracking-wider font-medium cursor-pointer transition-colors"
          >
            Upload Photos
          </button>
        </div>
      )}

      {/* 2. GALLERY GRID OF ALL PRODUCT IMAGES */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">
              All Gallery Images (Click &ldquo;★ Set as Primary&rdquo; to change the main image)
            </span>
            <span className="text-[10px] text-stone-400">
              Total {images.length} photo(s)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((imgUrl, index) => {
              const isCover = index === 0;
              return (
                <div
                  key={index}
                  className={`relative bg-white border transition-all ${
                    isCover
                      ? 'border-black ring-2 ring-black shadow-sm'
                      : 'border-stone-200 hover:border-stone-400 shadow-2xs'
                  } group flex flex-col overflow-hidden`}
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-square bg-stone-100 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badge: Cover Image */}
                    {isCover ? (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black text-amber-300 text-[9px] uppercase tracking-wider font-bold flex items-center gap-1 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-amber-300" /> Primary
                      </span>
                    ) : (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white text-[9px] uppercase tracking-wider font-light">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Primary Action Button (Prominent for non-primary images) */}
                  {!isCover ? (
                    <button
                      type="button"
                      onClick={() => handleSetAsCover(index)}
                      className="w-full py-1.5 bg-stone-900 hover:bg-black text-white hover:text-amber-300 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer border-t border-stone-300"
                      title="Set this image as the primary cover shown in BEST SELLERS"
                    >
                      <Star className="w-3 h-3 fill-current" />
                      <span>Set as Primary</span>
                    </button>
                  ) : (
                    <div className="w-full py-1 bg-amber-400 text-black text-[9px] font-bold uppercase tracking-wider text-center border-t border-black">
                      Current Main Image
                    </div>
                  )}

                  {/* Secondary Controls: Reorder, Replace, Delete */}
                  <div className="p-1.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-stone-600 text-xs">
                    {/* Reorder Arrows */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveImage(index, index - 1)}
                        className="p-1 hover:text-black disabled:opacity-20 disabled:hover:text-stone-600 cursor-pointer"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => handleMoveImage(index, index + 1)}
                        className="p-1 hover:text-black disabled:opacity-20 disabled:hover:text-stone-600 cursor-pointer"
                        title="Move right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Replace button */}
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => {
                        setReplaceIndex(index);
                        singleReplaceRef.current?.click();
                      }}
                      className="px-1.5 py-0.5 text-[9px] text-stone-700 hover:text-black hover:bg-stone-200 uppercase tracking-wider font-medium cursor-pointer transition-colors"
                      title="Replace with new photo"
                    >
                      Replace
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-1 text-stone-400 hover:text-red-600 cursor-pointer transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual URL entry toggle */}
      <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-[11px] text-stone-500 hover:text-black tracking-wider uppercase font-medium inline-flex items-center gap-1.5 cursor-pointer underline"
          >
            <LinkIcon className="w-3 h-3" />
            <span>Or paste direct image URL</span>
          </button>
        ) : (
          <div className="w-full flex items-center gap-2">
            <input
              type="url"
              value={manualUrl}
              onChange={e => setManualUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or https://..."
              className="flex-1 bg-white border border-stone-300 p-2 text-xs text-black focus:border-black focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddManualUrl}
              className="px-3 py-2 bg-black text-white text-xs uppercase tracking-wider font-medium hover:bg-stone-800 cursor-pointer transition-colors"
            >
              Add URL
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="px-2 py-2 text-stone-400 hover:text-black text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
