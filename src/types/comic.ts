export type BubbleType = 'speech' | 'thought' | 'narration' | 'shout' | 'sfx' | 'caption';
export type BubbleShape = 'oval' | 'rectangle' | 'cloud' | 'none';
export type ComicFontFamily = 'Comic Neue' | 'Bangers' | 'Balsamiq Sans' | 'Inter' | 'sans-serif';

export interface TextBlock {
  id: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  original_text: string;
  translated_text: string;
  bubble_type: BubbleType;
  shape: BubbleShape;
  bg_color: string;
  text_color: string;
  font_style?: 'normal' | 'bold' | 'italic' | 'uppercase';
  reading_order: number;
  notes?: string;

  // Visual override properties for custom editing
  customFontSize?: number; // scale multiplier e.g. 1.0
  customFontFamily?: ComicFontFamily;
  customTextColor?: string;
  customBgColor?: string;
  customUppercase?: boolean;
  customBold?: boolean;
  customOutline?: boolean;
  customOutlineColor?: string;
  bgOpacity?: number; // 0 to 1
  lineHeight?: number; // default 1.2
  hidden?: boolean;
}

export type ViewMode = 'translated' | 'split' | 'side-by-side' | 'original' | 'boxes';

export interface TranslationHistoryItem {
  id: string;
  timestamp: number;
  imagePreview: string;
  pageSummary: string;
  blockCount: number;
}

export interface ComicPageItem {
  id: string;
  name: string;
  originalDataUrl: string;
  blocks: TextBlock[];
  pageSummary: string;
  status: 'pending' | 'translating' | 'completed' | 'error';
  errorMessage?: string;
  customPatches?: Array<{ x: number; y: number; radius: number; color: string }>;
}
