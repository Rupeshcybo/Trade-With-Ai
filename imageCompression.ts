/**
 * Image Compression and Optimization Utilities
 * Handles image validation, compression, and size optimization
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  maxSizeMB: 5,
};

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check if it's actually an image
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File must be an image',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, and WebP images are supported',
    };
  }

  return { valid: true };
}

/**
 * Compress image and convert to base64
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(
              opts.maxWidth / width,
              opts.maxHeight / height
            );
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Use better quality scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with specified quality
          const base64 = canvas.toDataURL('image/jpeg', opts.quality);

          // Check if compressed size is acceptable
          const sizeInMB = (base64.length * 3) / 4 / 1024 / 1024;
          
          if (sizeInMB > opts.maxSizeMB) {
            // If still too large, try with lower quality
            const lowerQuality = opts.quality * 0.7;
            const smallerBase64 = canvas.toDataURL('image/jpeg', lowerQuality);
            resolve(smallerBase64);
          } else {
            resolve(base64);
          }
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calculate base64 string size in MB
 */
export function getBase64SizeMB(base64String: string): number {
  // Base64 encoding increases size by ~33%
  // Remove data URI prefix if present
  const base64Data = base64String.split(',')[1] || base64String;
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / 1024 / 1024;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Process image file: validate, compress, and return base64
 */
export async function processImageFile(
  file: File,
  options?: CompressionOptions
): Promise<{
  base64: string;
  originalSize: string;
  compressedSize: string;
  dimensions: { width: number; height: number };
}> {
  // Validate
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Get dimensions
  const dimensions = await getImageDimensions(file);

  // Compress
  const base64 = await compressImage(file, options);

  // Calculate sizes
  const originalSize = formatFileSize(file.size);
  const compressedSizeMB = getBase64SizeMB(base64);
  const compressedSize = formatFileSize(compressedSizeMB * 1024 * 1024);

  return {
    base64,
    originalSize,
    compressedSize,
    dimensions,
  };
}
