import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Trash2, Eye, RefreshCw, Check, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ImageUploadFieldProps {
  label: string;
  sublabel?: string;
  value?: string;
  currentImage?: string;
  onChange?: (newImageUrl: string) => void;
  onImageChange?: (newImageUrl: string) => void;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'hero';
  aspectHint?: string;
  presetOptions?: { label: string; url: string }[];
}

// Client-side image compression to ensure smooth uploading on mobile devices & high-res cameras
function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  sublabel,
  value,
  currentImage,
  onChange,
  onImageChange,
  aspectRatio = 'video',
  aspectHint,
  presetOptions
}) => {
  const activeValue = (value !== undefined ? value : currentImage) || '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState(activeValue);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync state if external value changes
  React.useEffect(() => {
    setUrlInput(activeValue);
  }, [activeValue]);

  const triggerChange = (newUrl: string) => {
    if (onChange) onChange(newUrl);
    if (onImageChange) onImageChange(newUrl);
    setUrlInput(newUrl);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WEBP, etc.)');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // 1. Compress image for mobile/desktop performance
      const compressedDataUrl = await compressImageFile(file);
      if (!compressedDataUrl) {
        throw new Error('Could not read image file');
      }

      // 2. Upload to persistent server storage
      const result = await apiClient.uploadImage(compressedDataUrl, file.name);
      if (result.success && result.url) {
        triggerChange(result.url);
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 2500);
      } else {
        setUploadError(result.error || 'Server upload failed. Image was not stored.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed due to network error.');
    } finally {
      setIsUploading(false);
    }

    // Reset input so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      triggerChange(urlInput.trim());
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 2000);
    }
  };

  const effectiveAspectRatio = aspectHint && aspectHint.toLowerCase().includes('square') ? 'square' : aspectRatio;

  const getAspectClass = () => {
    switch (effectiveAspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'portrait':
        return 'aspect-[3/4]';
      case 'hero':
        return 'aspect-[16/9] sm:aspect-[21/9]';
      case 'video':
      default:
        return 'aspect-[16/9]';
    }
  };

  return (
    <div className="bg-white border border-stone-200 p-4 sm:p-5 transition-all">
      {/* Label and description */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-black block">
            {label}
          </label>
          {(sublabel || aspectHint) && (
            <p className="text-[11px] text-stone-500 font-light mt-0.5">
              {sublabel || aspectHint}
            </p>
          )}
        </div>

        {justUploaded && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Updated
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Visual Preview Box */}
        <div className="sm:col-span-4">
          <div
            className={`relative w-full ${getAspectClass()} bg-stone-100 border border-stone-300 overflow-hidden group flex items-center justify-center`}
          >
            {activeValue ? (
              <>
                <img
                  src={activeValue}
                  alt={label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a
                    href={activeValue}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-white text-black text-xs hover:bg-stone-200"
                    title="Open Full Image"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => triggerChange('')}
                    className="p-1.5 bg-red-600 text-white text-xs hover:bg-red-700 cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-3 text-stone-400">
                <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <span className="text-[10px] uppercase tracking-wider block">No Image Set</span>
              </div>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        <div className="sm:col-span-8 space-y-3">
          {/* File Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-4 py-2.5 bg-black text-white hover:bg-stone-800 text-xs tracking-wider uppercase font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading & Storing Image...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Choose Image File From Device</span>
                </>
              )}
            </button>
            <span className="block sm:inline sm:ml-3 text-[11px] text-stone-400 mt-1 sm:mt-0 font-light">
              Permanently saved to store storage
            </span>
            {uploadError && (
              <p className="text-red-600 text-xs mt-1">{uploadError}</p>
            )}
          </div>

          {/* Toggle URL input option */}
          <div className="pt-1">
            {!isUrlMode ? (
              <button
                type="button"
                onClick={() => setIsUrlMode(true)}
                className="text-[11px] uppercase tracking-wider text-stone-500 hover:text-black font-medium inline-flex items-center gap-1 cursor-pointer underline"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Or paste direct image URL</span>
              </button>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-300 text-xs text-black focus:border-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleUrlApply}
                    className="px-3 py-1.5 bg-stone-200 hover:bg-black hover:text-white text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUrlMode(false)}
                    className="px-2 py-1.5 text-xs text-stone-400 hover:text-black cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preset Options if provided */}
          {presetOptions && presetOptions.length > 0 && (
            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-stone-400">Presets:</span>
              {presetOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    triggerChange(opt.url);
                  }}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-[10px] text-stone-700 tracking-wider uppercase font-light border border-stone-200 cursor-pointer transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
