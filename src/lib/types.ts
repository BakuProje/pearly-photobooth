export type SlotShape = 'rectangle' | 'ellipse' | 'circle' | 'heart';

export interface TemplateSlot {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  borderRadius?: number; // px at standard 1000px width
  rotation?: number; // degrees
  shape?: SlotShape; // 'rectangle' | 'ellipse' | 'circle' | 'heart'
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
  category: TemplateCategory | string;
  imageSrc: string;
  requiredPhotos: number;
  aspectRatio: string;
  description: string;
  slots: TemplateSlot[];
  isTwin?: boolean; // If true, can duplicate photos across twin strips
  isCustom?: boolean; // If true, user uploaded custom template
  createdAt?: number;
}

export type FilterType = 
  | 'normal'
  | 'white-glow'
  | 'snow-white'
  | 'porcelain'
  | 'korean-glow'
  | 'korean-clean'
  | 'korean-film'
  | 'y2k-digicam'
  | 'fuji-chrome'
  | 'kodak-portra'
  | 'polaroid-90s'
  | 'vintage'
  | 'lo-fi'
  | 'peach-blush'
  | 'rose-gold'
  | 'pastel'
  | 'lavender-dream'
  | 'sunset'
  | 'mono'
  | 'classic-bw'
  | 'moody-dark'
  | 'matte-fade'
  | 'cinema-teal'
  | 'cyberpunk'
  | 'emerald-green'
  | 'tokyo-blue'
  | 'sepia'
  | 'dramatic'
  | 'vivid-pop'
  | 'milky-soft';

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

export interface AIEnhanceResult {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth?: number;
  highlights?: number;
  shadows?: number;
  enhance?: number;
  fade?: number;
  filter?: FilterType;
  moodTitle: string;
  explanation: string;
}

export interface AICritiqueResult {
  rating: number; // 1 to 10 scale (e.g., 9.6)
  verdictBadge: string; // e.g. "Super Aesthetic! ✨"
  overallReview: string;
  poseFeedback: string;
  lightingFeedback: string;
  tips: string[];
  suggestedCaptions: string[];
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
