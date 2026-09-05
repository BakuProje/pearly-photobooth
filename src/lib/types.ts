export interface TemplateSlot {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  borderRadius?: number; // px at standard 1000px width
  rotation?: number; // degrees
  label?: string;
}

export type TemplateCategory =
  | 'Twin Strip'
  | 'Filmstrip'
  | 'Newspaper'
  | 'Cute Chibi'
  | 'Vintage Collage'
  | 'Postage Stamp'
  | 'Y2K Digicam'
  | 'Story 9:16'
  | 'Minimalist'
  | 'Aesthetic Board'
  | 'Scrapbook'
  | 'Collage'
  | 'Polaroid';

export interface PhotoboothTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  imageSrc: string;
  requiredPhotos: number;
  aspectRatio: string;
  description: string;
  slots: TemplateSlot[];
  isTwin?: boolean; // If true, can duplicate photos across twin strips
}

export type FilterType = 
  | 'normal'
  | 'white-glow'
  | 'snow-white'
  | 'porcelain'
  | 'korean-glow'
  | 'korean-clean'
  | 'korean-film'
  | 'vintage'
  | 'mono'
  | 'cyberpunk'
  | 'sepia'
  | 'sunset'
  | 'pastel'
  | 'dramatic';

export interface StickerItem {
  id: string;
  src: string;
  isEmoji?: boolean;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale: number; // 0.5 to 3
  rotation: number; // -180 to 180
}

export interface DoodlePoint {
  x: number;
  y: number;
}

export interface DoodlePath {
  points: DoodlePoint[];
  color: string;
  size: number;
}

export interface PhotoBoothConfig {
  selectedTemplateId: string;
  filter: FilterType;
  headerText: string;
  footerText: string;
  showDate: boolean;
  showWatermark: boolean;
  stickers: StickerItem[];
  doodles: DoodlePath[];
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -50 to 50
  vignette?: number; // 0 to 100
  warmth?: number; // -50 to 50
  enhance?: number; // 0 to 100
  fade?: number; // 0 to 100
  highlights?: number; // -50 to 50
  shadows?: number; // -50 to 50
  photoScales?: number[]; // zoom per slot (1.0 to 3.0)
  photoOffsets?: { x: number; y: number }[]; // pan offset per slot (-0.5 to 0.5)
}

export interface GalleryItem {
  id: string;
  previewUrl: string;
  photos: string[];
  config: PhotoBoothConfig;
  createdAt: number;
}
