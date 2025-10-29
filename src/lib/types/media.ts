export type MediaType = 'image' | 'video';

export interface ProductMedia {
  id: string;
  productId: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  displayOrder: number;
}

export interface MediaLibraryItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  usedCount: number;
  createdAt: number;
}

export interface MediaUploadResult {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}
