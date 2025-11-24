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
  BAR_CHART = 'Bar Chart',
  LINE_GRAPH = 'Line Graph',
  FLOWCHART = 'Flowchart',
  MIND_MAP = 'Mind Map',
  SUMMARY = 'Summary',
  DATA_VIS = 'Data Visualization',
  ILLUSTRATION = 'Illustration'
}

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

export interface GeneratedContent {
  summary?: string;
  charts: GeneratedChart[];
  diagrams: GeneratedDiagram[];
  keywords: KeywordData[]; // For D3 visualization
  illustration?: string; // Base64 string of the generated image
}

export interface FileData {
  name: string;
  type: FileType;
  base64: string; // Base64 string without prefix for API
  rawText?: string; // For TXT files
}