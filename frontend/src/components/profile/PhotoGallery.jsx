import React from 'react';
import { Camera, Lock, X, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MAX_PHOTOS = 6;
const PHOTO_TIPS = ['Formal', 'Casual', 'Social'];

const PhotoGallery = ({ photos, isOwnProfile, uploading, onUpload, onDelete, onTogglePrivacy }) => {
  const showTip = isOwnProfile && photos.length < 3;

  return (
    <div className="card-surface rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <h2 className="font-heading text-base font-semibold text-foreground">Photos</h2>
          {photos.length > 0 && (
            <span className="text-xs text-muted-foreground">({photos.length}/{MAX_PHOTOS})</span>
          )}
        </div>
        {isOwnProfile && photos.length < MAX_PHOTOS && (
          <label htmlFor="photo-upload" className="cursor-pointer">
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={onUpload}
              data-testid="upload-photo-input"
            />
            <Button variant="outline" size="sm" disabled={uploading} asChild data-testid="upload-photo-btn">
              <span className="flex items-center gap-2">
                {uploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  : <><Camera className="w-4 h-4" /> Add Photo</>
                }
              </span>
            </Button>
          </label>
        )}
      </div>

      {/* Social proof tip */}
      {showTip && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20 mb-4">
          <TrendingUp className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <p className="text-xs text-primary/80 font-medium">
            Profiles with 3+ photos get <span className="font-bold text-primary">5× more interest</span>
          </p>
        </div>
      )}

      {/* Photo type suggestions for own empty profile */}
      {isOwnProfile && photos.length < 3 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Suggested:</span>
          {PHOTO_TIPS.map(tip => (
            <label
              key={tip}
              htmlFor="photo-upload"
              className="cursor-pointer text-[10px] px-2 py-1 rounded-full border border-border/40 text-muted-foreground/60 hover:border-primary/40 hover:text-primary/70 transition-colors"
            >
              {tip}
            </label>
          ))}
        </div>
      )}

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            {isOwnProfile ? 'Add photos to attract more matches' : 'No photos available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.photo_id}
              className="relative group aspect-square rounded-xl overflow-hidden bg-card border border-border/30"
            >
              {photo.is_hidden && !isOwnProfile ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Lock className="w-7 h-7 text-muted-foreground/40" />
                </div>
              ) : (
                <img
                  src={photo.s3_url}
                  alt="Profile"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}

              {/* Own profile controls */}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => onTogglePrivacy(photo.photo_id, photo.is_hidden)}
                    className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title={photo.is_hidden ? 'Make visible' : 'Make private'}
                  >
                    <Lock className="w-3.5 h-3.5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => onDelete(photo.photo_id)}
                    className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-red-600" />
                  </button>
                </div>
              )}

              {photo.is_primary && (
                <div className="absolute bottom-2 left-2">
                  <Badge className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5">Primary</Badge>
                </div>
              )}
              {photo.is_hidden && isOwnProfile && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    <Lock className="w-2.5 h-2.5 mr-1" />Private
                  </Badge>
                </div>
              )}
            </div>
          ))}

          {/* Empty slot placeholders */}
          {isOwnProfile && photos.length < MAX_PHOTOS &&
            Array.from({ length: Math.min(2, MAX_PHOTOS - photos.length) }).map((_, i) => (
              <label
                key={`slot-${i}`}
                htmlFor="photo-upload"
                className="aspect-square rounded-xl border-2 border-dashed border-border/25 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-white/[0.02] transition-all duration-200"
              >
                <Camera className="w-6 h-6 text-muted-foreground/25" />
                <span className="text-[10px] text-muted-foreground/35">Add photo</span>
              </label>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
