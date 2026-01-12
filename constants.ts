// File size limits
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_FILE_SIZE_MB = 20;

// API configuration
export const GEMINI_MODEL_ANALYSIS = 'gemini-2.5-flash';
export const GEMINI_MODEL_IMAGE = 'gemini-2.5-flash-image';
export const MAX_API_RETRIES = 3;
export const IMAGE_GENERATION_RETRIES = 2;
export const INITIAL_RETRY_DELAY_MS = 1000;

// D3 Bubble Chart configuration
export const BUBBLE_CHART_DEFAULTS = {
  width: 600,
  height: 500,
  minHeight: 400,
  padding: 10,
  minBubbleRadius: 20,
  minFontSize: 10,
  maxFontSize: 18,
  animationDuration: 800,
  textAnimationDelay: 400,
  textAnimationDuration: 500,
  hoverTransitionDuration: 200,
} as const;

// Color palette for visualizations
export const VISUALIZATION_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
] as const;

// Image aspect ratios
export const ASPECT_RATIOS = {
  landscape: '16:9',
  portrait: '3:4',
} as const;

// Export quality settings
export const EXPORT_QUALITY = {
  jpeg: 0.95,
} as const;
