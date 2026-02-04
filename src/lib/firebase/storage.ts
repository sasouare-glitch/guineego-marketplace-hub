/**
 * Firebase Storage Utilities
 * Image upload with compression and progress tracking
 */

import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject,
  type UploadTask,
  type UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from './config';
import { useState, useCallback } from 'react';

// ============================================
// IMAGE COMPRESSION
// ============================================

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Compress image before upload
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Image compression failed'));
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => reject(new Error('Image loading failed'));
    img.src = URL.createObjectURL(file);
  });
}

// ============================================
// UPLOAD HELPERS
// ============================================

interface UploadResult {
  url: string;
  path: string;
  size: number;
}

/**
 * Upload file to Firebase Storage
 */
export async function uploadFile(
  file: File | Blob,
  path: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          url,
          path,
          size: uploadTask.snapshot.totalBytes
        });
      }
    );
  });
}

/**
 * Upload product image with compression
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  imageIndex: number = 0,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  // Compress image
  const compressedBlob = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    mimeType: 'image/webp'
  });

  // Generate path
  const extension = 'webp';
  const path = `products/${productId}/${imageIndex}.${extension}`;

  return uploadFile(compressedBlob, path, onProgress);
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  // Compress as small square avatar
  const compressedBlob = await compressImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.9,
    mimeType: 'image/webp'
  });

  const path = `avatars/${userId}/avatar.webp`;
  return uploadFile(compressedBlob, path, onProgress);
}

/**
 * Delete file from Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

// ============================================
// REACT HOOKS
// ============================================

interface UploadState {
  uploading: boolean;
  progress: number;
  error: Error | null;
  result: UploadResult | null;
}

/**
 * Hook for file upload with progress
 */
export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null
  });

  const upload = useCallback(async (
    file: File | Blob,
    path: string
  ): Promise<UploadResult> => {
    setState({
      uploading: true,
      progress: 0,
      error: null,
      result: null
    });

    try {
      const result = await uploadFile(file, path, (progress) => {
        setState(prev => ({ ...prev, progress }));
      });

      setState({
        uploading: false,
        progress: 100,
        error: null,
        result
      });

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error as Error
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      result: null
    });
  }, []);

  return {
    ...state,
    upload,
    reset
  };
}

/**
 * Hook for product image upload with compression
 */
export function useProductImageUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null
  });

  const uploadImage = useCallback(async (
    file: File,
    productId: string,
    imageIndex: number = 0
  ): Promise<UploadResult> => {
    setState({
      uploading: true,
      progress: 0,
      error: null,
      result: null
    });

    try {
      const result = await uploadProductImage(file, productId, imageIndex, (progress) => {
        setState(prev => ({ ...prev, progress }));
      });

      setState({
        uploading: false,
        progress: 100,
        error: null,
        result
      });

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error as Error
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      result: null
    });
  }, []);

  return {
    ...state,
    uploadImage,
    reset
  };
}
