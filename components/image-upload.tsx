'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { usePassEditorStore } from '@/stores/pass-editor-store';

interface ImageUploadProps {
  imageType: 'logo' | 'icon' | 'strip';
  label: string;
  required?: boolean;
}

const dimensions = {
  logo: { '1x': [160, 50], '2x': [320, 100], '3x': [480, 150] },
  icon: { '1x': [29, 29], '2x': [58, 58], '3x': [87, 87] },
  strip: { '1x': [375, 123], '2x': [750, 246], '3x': [1125, 369] },
};

export function ImageUpload({ imageType, label, required = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const store = usePassEditorStore();
  
  // Get current image URL (prefer @2x, fallback to @1x)
  const currentUrl = store[`${imageType}_2x_url` as keyof typeof store] as string || 
                     store[`${imageType}_1x_url` as keyof typeof store] as string || '';

  async function resizeImage(file: File, width: number, height: number): Promise<File> {
    const options = {
      maxWidth: width,
      maxHeight: height,
      useWebWorker: true,
      fileType: 'image/png',
    };
    
    try {
      const compressed = await imageCompression(file, options);
      return compressed;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }

  async function handleFileSelect(file: File) {
    setUploading(true);
    try {
      const dims = dimensions[imageType];
      
      // Resize to @1x, @2x, @3x
      const resized_1x = await resizeImage(file, dims['1x'][0], dims['1x'][1]);
      const resized_2x = await resizeImage(file, dims['2x'][0], dims['2x'][1]);
      const resized_3x = await resizeImage(file, dims['3x'][0], dims['3x'][1]);

      // Convert to base64 data URLs (for now - in production, upload to Vercel Blob)
      const toDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const url_1x = await toDataURL(resized_1x);
      const url_2x = await toDataURL(resized_2x);
      const url_3x = await toDataURL(resized_3x);

      // Update Zustand store
      store.setPassProperty(`${imageType}_1x_url` as any, url_1x);
      store.setPassProperty(`${imageType}_2x_url` as any, url_2x);
      store.setPassProperty(`${imageType}_3x_url` as any, url_3x);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label htmlFor={imageType} className="flex items-center gap-2 mb-2">
        {label}
        {required && <span className="text-xs text-gray-500">(Required)</span>}
      </Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        {currentUrl ? (
          <div className="space-y-2">
            <img
              src={currentUrl}
              alt={label}
              className={`max-w-full mx-auto ${
                imageType === 'icon' ? 'max-h-32' : imageType === 'logo' ? 'max-h-16' : 'max-h-48'
              }`}
            />
            <p className="text-sm text-gray-600">Current {label}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`${imageType}-upload`)?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Processing...' : 'Click to replace'}
            </Button>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Click to upload {label.toLowerCase()}</p>
            <p className="text-xs text-gray-500 mb-2">
              {imageType === 'logo' && '160x50, 320x100, 480x150 (pt)'}
              {imageType === 'icon' && '29x29, 58x58, 87x87 (pt)'}
              {imageType === 'strip' && '375x123, 750x246, 1125x369 (pt)'}
            </p>
            <Button
              variant="outline"
              onClick={() => document.getElementById(`${imageType}-upload`)?.click()}
              disabled={uploading}
            >
              {uploading ? 'Processing...' : `Upload ${label}`}
            </Button>
          </div>
        )}
        <input
          id={`${imageType}-upload`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>
    </div>
  );
}

