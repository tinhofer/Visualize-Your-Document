import React from 'react';
import { AppConfig, FileData, GeneratedContent, VisualType } from '../../types';
import { SimpleChart } from '../Charts';
import Mermaid from '../Mermaid';
import D3BubbleChart from '../D3BubbleChart';
import ExportWrapper from '../ExportWrapper';
import TableVisualization from '../TableVisualization';
import Timeline from '../Timeline';
import { HighlightBoxList } from '../HighlightBox';
import IconGrid from '../IconGrid';

interface ResultsStepProps {
  readonly file: FileData;
  readonly config: AppConfig;
  readonly results: GeneratedContent;
  readonly onReset: () => void;
}

// Helper to check if a visual type is selected
const isSelected = (config: AppConfig, type: VisualType): boolean => {
  return config.selectedVisuals.includes(type);
};

// Helper to determine diagram type from Mermaid code
type DiagramType = 'flow' | 'mind' | 'other';

const getDiagramType = (code: string): DiagramType => {
  if (code.includes('mindmap')) return 'mind';
  if (code.includes('graph') || code.includes('flowchart')) return 'flow';
  return 'other';
};

// Check if diagram should be shown based on user selection and diagram type
const shouldShowDiagram = (
  code: string,
  wantsFlowchart: boolean,
  wantsMindMap: boolean
): boolean => {
  const diagramType = getDiagramType(code);
  
  if (diagramType === 'flow' && wantsFlowchart) return true;
  if (diagramType === 'mind' && wantsMindMap) return true;
  if (diagramType === 'other' && (wantsFlowchart || wantsMindMap)) return true;
  
  return false;
};

const ResultsStep: React.FC<ResultsStepProps> = ({
  file,
  config,
  results,
  onReset,
}) => {
  const wantsFlowchart = isSelected(config, VisualType.FLOWCHART);
  const wantsMindMap = isSelected(config, VisualType.MIND_MAP);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Deine Visualisierungen</h2>
          <p className="text-slate-500">Generiert aus {file.name}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          aria-label="Neu starten"
        >
          Neu starten
        </button>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* === TEXT-BASED === */}
        
        {/* Summary */}
        {results.summary && isSelected(config, VisualType.SUMMARY) && (
          <ExportWrapper 
            title="Zusammenfassung" 
            format={config.outputFormat} 
            className="lg:col-span-2"
          >
            <div className="prose prose-slate max-w-none">
              <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                <p className="text-slate-700 leading-relaxed text-lg">
                  {results.summary}
                </p>
              </div>
            </div>
          </ExportWrapper>
        )}

        {/* Highlight Boxes (Key Facts) */}
        {results.highlightBoxes && results.highlightBoxes.length > 0 && isSelected(config, VisualType.HIGHLIGHT_BOX) && (
          <ExportWrapper 
            title="Wichtige Erkenntnisse" 
            format={config.outputFormat} 
            className="lg:col-span-2"
          >
            <HighlightBoxList boxes={results.highlightBoxes} />
          </ExportWrapper>
        )}

        {/* === CHARTS & DATA === */}

        {/* Charts (Bar/Line) */}
        {results.charts.map((chart, idx) => {
          const visualType = chart.type === 'bar' 
            ? VisualType.BAR_CHART 
            : VisualType.LINE_GRAPH;
          
          if (!isSelected(config, visualType)) {
            return null;
          }

          return (
            <ExportWrapper 
              key={`chart-${idx}`} 
              title={chart.title} 
              format={config.outputFormat}
            >
              <div className="h-80 w-full">
                <SimpleChart
                  data={chart.data}
                  type={chart.type}
                  xAxisLabel={chart.xAxisLabel}
                  yAxisLabel={chart.yAxisLabel}
                />
              </div>
              <p className="mt-4 text-sm text-slate-500">{chart.description}</p>
            </ExportWrapper>
          );
        })}

        {/* Tables */}
        {results.tables && results.tables.map((table, idx) => {
          if (!isSelected(config, VisualType.TABLE)) return null;
          
          return (
            <ExportWrapper
              key={`table-${idx}`}
              title={table.title}
              format={config.outputFormat}
              className="lg:col-span-2"
            >
              <TableVisualization data={table} />
              <p className="mt-4 text-sm text-slate-500">{table.description}</p>
            </ExportWrapper>
          );
        })}

        {/* === DIAGRAMS === */}

        {/* Mermaid Diagrams (Flowchart/Mind Map) */}
        {results.diagrams.map((diagram, idx) => {
          if (!shouldShowDiagram(diagram.code, wantsFlowchart, wantsMindMap)) {
            return null;
          }

          return (
            <ExportWrapper
              key={`diagram-${idx}`}
              title={diagram.title}
              format={config.outputFormat}
              className="lg:col-span-2"
            >
              <div className="min-h-[300px] w-full bg-white flex justify-center">
                <Mermaid id={`mermaid-${idx}`} chart={diagram.code} />
              </div>
              <p className="mt-4 text-sm text-slate-500">{diagram.description}</p>
            </ExportWrapper>
          );
        })}

        {/* Timelines */}
        {results.timelines && results.timelines.map((timeline, idx) => {
          if (!isSelected(config, VisualType.TIMELINE)) return null;
          
          return (
            <ExportWrapper
              key={`timeline-${idx}`}
              title={timeline.title}
              format={config.outputFormat}
              className="lg:col-span-2"
            >
              <Timeline data={timeline} />
              <p className="mt-4 text-sm text-slate-500">{timeline.description}</p>
            </ExportWrapper>
          );
        })}

        {/* === VISUALS === */}

        {/* D3 Keyword Visualization */}
        {results.keywords.length > 0 && isSelected(config, VisualType.DATA_VIS) && (
          <ExportWrapper 
            title="Schlüsselbegriffe" 
            format={config.outputFormat}
          >
            <div className="h-[500px] w-full bg-white rounded-xl overflow-hidden flex items-center justify-center">
              <D3BubbleChart data={results.keywords} />
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Größe zeigt relative Wichtigkeit im Dokument.
            </p>
          </ExportWrapper>
        )}

        {/* AI-Generated Illustration */}
        {results.illustration && isSelected(config, VisualType.ILLUSTRATION) && (
          <ExportWrapper 
            title="KI-Illustration" 
            format={config.outputFormat} 
            className="lg:col-span-2"
          >
            <div className="w-full bg-slate-100 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
              <img
                src={results.illustration}
                alt="KI-generierte Illustration basierend auf den Hauptthemen des Dokuments"
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>
            <p className="mt-4 text-sm text-slate-500">
              KI-generierte Illustration basierend auf den Dokumentthemen.
            </p>
          </ExportWrapper>
        )}

        {/* Icon Grid (Pictograms) */}
        {results.iconGrids && results.iconGrids.map((iconGrid, idx) => {
          if (!isSelected(config, VisualType.ICON_GRID)) return null;
          
          return (
            <ExportWrapper
              key={`icongrid-${idx}`}
              title={iconGrid.title}
              format={config.outputFormat}
              className="lg:col-span-2"
            >
              <IconGrid data={iconGrid} />
              <p className="mt-4 text-sm text-slate-500">{iconGrid.description}</p>
            </ExportWrapper>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsStep;
