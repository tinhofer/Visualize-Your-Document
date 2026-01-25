export enum FileType {
  PDF = 'application/pdf',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  TXT = 'text/plain',
  UNKNOWN = 'unknown'
}

export enum OutputFormat {
  PNG = 'image/png',
  JPG = 'image/jpeg',
  SVG = 'image/svg+xml'
}

export enum VisualType {
  // Text-based
  SUMMARY = 'Summary',
  HIGHLIGHT_BOX = 'Key Facts',
  
  // Charts & Graphs
  BAR_CHART = 'Bar Chart',
  LINE_GRAPH = 'Line Graph',
  TABLE = 'Table',
  
  // Diagrams
  FLOWCHART = 'Flowchart',
  MIND_MAP = 'Mind Map',
  TIMELINE = 'Timeline',
  
  // Visual elements
  DATA_VIS = 'Keyword Cloud',
  ILLUSTRATION = 'AI Illustration',
  ICON_GRID = 'Pictograms',
}

// Group visual types for UI organization
export const VISUAL_TYPE_GROUPS = {
  textBased: [VisualType.SUMMARY, VisualType.HIGHLIGHT_BOX],
  chartsAndData: [VisualType.BAR_CHART, VisualType.LINE_GRAPH, VisualType.TABLE],
  diagrams: [VisualType.FLOWCHART, VisualType.MIND_MAP, VisualType.TIMELINE],
  visuals: [VisualType.DATA_VIS, VisualType.ILLUSTRATION, VisualType.ICON_GRID],
} as const;

export enum Orientation {
  LANDSCAPE = 'landscape',
  PORTRAIT = 'portrait'
}

export interface AppConfig {
  outputFormat: OutputFormat;
  selectedVisuals: VisualType[];
  orientation: Orientation;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface GeneratedChart {
  type: 'bar' | 'line';
  title: string;
  data: ChartDataPoint[];
  xAxisLabel: string;
  yAxisLabel: string;
  description: string;
}

export interface GeneratedDiagram {
  type: 'mermaid';
  title: string;
  code: string; // Mermaid syntax
  description: string;
}

export interface KeywordData {
  text: string;
  value: number; // Importance/Frequency
}

// New: Table data structure
export interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
  description: string;
}

// New: Timeline event
export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

export interface TimelineData {
  title: string;
  events: TimelineEvent[];
  description: string;
}

// New: Highlight box (key facts, quotes, important points)
export interface HighlightBoxData {
  type: 'fact' | 'quote' | 'warning' | 'tip';
  title: string;
  content: string;
  source?: string; // For quotes
}

// New: Icon/Pictogram item
export interface IconItem {
  icon: string; // Icon name from Lucide
  label: string;
  value?: string | number;
  description?: string;
}

export interface IconGridData {
  title: string;
  items: IconItem[];
  description: string;
}

export interface GeneratedContent {
  summary?: string;
  charts: GeneratedChart[];
  diagrams: GeneratedDiagram[];
  keywords: KeywordData[];
  illustration?: string;
  illustrationPrompt?: string;
  // New visualization types
  tables?: TableData[];
  timelines?: TimelineData[];
  highlightBoxes?: HighlightBoxData[];
  iconGrids?: IconGridData[];
}

// Type for the raw API response before illustration is generated
export interface GeminiAnalysisResponse {
  summary?: string;
  charts: GeneratedChart[];
  diagrams: GeneratedDiagram[];
  keywords: KeywordData[];
  illustrationPrompt?: string;
  // New visualization types
  tables?: TableData[];
  timelines?: TimelineData[];
  highlightBoxes?: HighlightBoxData[];
  iconGrids?: IconGridData[];
}

export interface FileData {
  name: string;
  type: FileType;
  base64: string; // Base64 string without prefix for API
  rawText?: string; // For TXT files
}