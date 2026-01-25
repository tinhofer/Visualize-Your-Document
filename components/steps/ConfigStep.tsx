import React from 'react';
import { 
  Settings, FileText, Image as ImageIcon, BarChart2, 
  Layout, Maximize2, Minimize2, AlertCircle,
  Table, Clock, Sparkles, Grid3X3
} from 'lucide-react';
import { AppConfig, FileData, OutputFormat, VisualType, Orientation, VISUAL_TYPE_GROUPS } from '../../types';

// Visual option configuration with icons and labels
const VISUAL_OPTIONS: ReadonlyArray<{
  readonly type: VisualType;
  readonly icon: React.FC<{ size?: number }>;
  readonly label: string;
}> = [
  // Text-based
  { type: VisualType.SUMMARY, icon: FileText, label: 'Summary' },
  { type: VisualType.HIGHLIGHT_BOX, icon: Sparkles, label: 'Key Facts' },
  // Charts & Data
  { type: VisualType.BAR_CHART, icon: BarChart2, label: 'Bar Chart' },
  { type: VisualType.LINE_GRAPH, icon: BarChart2, label: 'Line Graph' },
  { type: VisualType.TABLE, icon: Table, label: 'Table' },
  // Diagrams
  { type: VisualType.FLOWCHART, icon: Layout, label: 'Flowchart' },
  { type: VisualType.MIND_MAP, icon: Layout, label: 'Mind Map' },
  { type: VisualType.TIMELINE, icon: Clock, label: 'Timeline' },
  // Visuals
  { type: VisualType.DATA_VIS, icon: Grid3X3, label: 'Keyword Cloud' },
  { type: VisualType.ILLUSTRATION, icon: ImageIcon, label: 'AI Illustration' },
  { type: VisualType.ICON_GRID, icon: Grid3X3, label: 'Pictograms' },
];

// Group configuration for UI
const VISUAL_GROUPS: ReadonlyArray<{
  readonly key: keyof typeof VISUAL_TYPE_GROUPS;
  readonly label: string;
  readonly emoji: string;
}> = [
  { key: 'textBased', label: 'Text', emoji: '📝' },
  { key: 'chartsAndData', label: 'Daten', emoji: '📊' },
  { key: 'diagrams', label: 'Diagramme', emoji: '🔀' },
  { key: 'visuals', label: 'Visuals', emoji: '🎨' },
];

const OUTPUT_FORMAT_OPTIONS = [
  { format: OutputFormat.PNG, label: 'PNG' },
  { format: OutputFormat.JPG, label: 'JPG' },
  { format: OutputFormat.SVG, label: 'SVG' },
] as const;

interface ConfigStepProps {
  readonly file: FileData;
  readonly config: AppConfig;
  readonly error: string | null;
  readonly onConfigChange: (updater: (prev: AppConfig) => AppConfig) => void;
  readonly onGenerate: () => void;
  readonly onReset: () => void;
}

const ConfigStep: React.FC<ConfigStepProps> = ({
  file,
  config,
  error,
  onConfigChange,
  onGenerate,
  onReset,
}) => {
  const toggleVisual = (type: VisualType): void => {
    onConfigChange(prev => {
      const exists = prev.selectedVisuals.includes(type);
      return {
        ...prev,
        selectedVisuals: exists
          ? prev.selectedVisuals.filter(t => t !== type)
          : [...prev.selectedVisuals, type],
      };
    });
  };

  const setOutputFormat = (format: OutputFormat): void => {
    onConfigChange(prev => ({ ...prev, outputFormat: format }));
  };

  const setOrientation = (orientation: Orientation): void => {
    onConfigChange(prev => ({ ...prev, orientation }));
  };

  const isVisualSelected = (type: VisualType): boolean => {
    return config.selectedVisuals.includes(type);
  };

  const getOptionConfig = (type: VisualType) => {
    return VISUAL_OPTIONS.find(opt => opt.type === type);
  };

  const canGenerate = config.selectedVisuals.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div 
            className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center" 
            aria-hidden="true"
          >
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Visualisierungen wählen</h2>
            <p className="text-slate-500 text-sm">Datei: {file.name}</p>
          </div>
        </div>

        {/* Grouped Visual Types Selection */}
        <div className="space-y-6 mb-8">
          {VISUAL_GROUPS.map(group => (
            <fieldset key={group.key}>
              <legend className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>{group.emoji}</span>
                <span>{group.label}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {VISUAL_TYPE_GROUPS[group.key].map(type => {
                  const optionConfig = getOptionConfig(type);
                  if (!optionConfig) return null;
                  
                  const Icon = optionConfig.icon;
                  const isSelected = isVisualSelected(type);
                  
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleVisual(type)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {optionConfig.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {/* Output Format Selection */}
        <fieldset className="mb-6">
          <legend className="text-sm font-semibold text-slate-700 mb-3">
            Export-Format
          </legend>
          <div className="flex gap-2">
            {OUTPUT_FORMAT_OPTIONS.map(({ format, label }) => (
              <button
                key={format}
                type="button"
                onClick={() => setOutputFormat(format)}
                aria-pressed={config.outputFormat === format}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  config.outputFormat === format
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Orientation Selection */}
        <fieldset className="mb-8">
          <legend className="text-sm font-semibold text-slate-700 mb-3">
            Ausrichtung
          </legend>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOrientation(Orientation.PORTRAIT)}
              aria-label="Hochformat"
              aria-pressed={config.orientation === Orientation.PORTRAIT}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                config.orientation === Orientation.PORTRAIT
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Minimize2 size={16} aria-hidden="true" /> Hochformat
            </button>
            <button
              type="button"
              onClick={() => setOrientation(Orientation.LANDSCAPE)}
              aria-label="Querformat"
              aria-pressed={config.orientation === Orientation.LANDSCAPE}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                config.orientation === Orientation.LANDSCAPE
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Maximize2 size={16} aria-hidden="true" /> Querformat
            </button>
          </div>
        </fieldset>

        {/* Error Display */}
        {error && (
          <div
            className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={16} aria-hidden="true" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-3.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            aria-label="Abbrechen und zurück"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="flex-[2] py-3.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label={
              canGenerate
                ? "Visualisierungen generieren"
                : "Mindestens eine Option auswählen"
            }
          >
            Generieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigStep;
