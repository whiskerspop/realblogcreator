export enum ContentType {
  Review = 'Review',
  Article = 'Article',
}

export interface ProductDetails {
  title: string;
  url: string;
  contentType: ContentType;
  imageFile: File | null;
  imageBase64: string | null;
  imageUrl?: string;
}

export interface GeneratedImage {
  dataUrl: string;
  aspectRatio: string;
  label: string;
}

export interface GeneratedContent {
  blogHtml: string;
  pinterestPack: string;
  images: GeneratedImage[];
  structuredPins?: any[];
}

export interface ApiError {
  message: string;
}