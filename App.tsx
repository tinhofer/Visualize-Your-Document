import React, { useState, useCallback } from 'react';
import { 
  Upload, FileText, Image as ImageIcon, BarChart2, 
  Settings, CheckCircle, AlertCircle, Loader2, Sparkles,
  Layout, Maximize2, Minimize2
} from 'lucide-react';

import {
  AppConfig, FileData, GeneratedContent,
  OutputFormat, VisualType, Orientation, FileType
} from './types';
import { getFileType, readFileAsBase64, readFileAsText } from './services/fileUtils';
import { generateInfographics } from './services/gemini';
import { FileSizeError } from './services/apiUtils';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from './constants';

import { SimpleChart } from './components/Charts';
import Mermaid from './components/Mermaid';
import D3BubbleChart from './components/D3BubbleChart';
import ExportWrapper from './components/ExportWrapper';

const Steps = {
  UPLOAD: 0,
  CONFIG: 1,
  GENERATING: 2,
  RESULTS: 3
};

const App: React.FC = () => {
  const [step, setStep] = useState(Steps.UPLOAD);
  const [file, setFile] = useState<FileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Configuration State
  const [config, setConfig] = useState<AppConfig>({
    outputFormat: OutputFormat.PNG,
    selectedVisuals: [VisualType.SUMMARY, VisualType.BAR_CHART], // Defaults
    orientation: Orientation.PORTRAIT
  });

  const [results, setResults] = useState<GeneratedContent | null>(null);

  // Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      const type = getFileType(uploadedFile);

      // Validate file type
      if (type === FileType.UNKNOWN) {
        setError("Unsupported file format. Please upload PDF, DOCX, PPTX, or TXT.");
        return;
      }

      // Validate file size
      if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (uploadedFile.size / (1024 * 1024)).toFixed(2);
        setError(`File size (${sizeMB}MB) exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB. Please upload a smaller file.`);
        return;
      }

      // Validate non-empty file
      if (uploadedFile.size === 0) {
        setError("File is empty. Please upload a valid document.");
        return;
      }

      setError(null);
      setUploadingFile(true);

      try {
        let base64 = "";
        let rawText = "";

        // Read file based on type
        if (type === FileType.TXT) {
          rawText = await readFileAsText(uploadedFile);

          // Validate text content
          if (!rawText || rawText.trim().length === 0) {
            throw new Error("Text file is empty or contains no readable content.");
          }
        }

        // Always get base64 for API transmission if needed (e.g. PDF/DOCX as blobs)
        // Note: For TXT we send text directly in prompt, but base64 is harmless to store
        base64 = await readFileAsBase64(uploadedFile);

        setFile({
          name: uploadedFile.name,
          type,
          base64,
          rawText
        });
        setStep(Steps.CONFIG);
      } catch (err: any) {
        console.error("File reading error:", err);
        setError(err.message || "Failed to read file. The file might be corrupted or password-protected.");
      } finally {
        setUploadingFile(false);
      }
    }
  };

  const toggleVisual = (type: VisualType) => {
    setConfig(prev => {
      const exists = prev.selectedVisuals.includes(type);
      return {
        ...prev,
        selectedVisuals: exists 
          ? prev.selectedVisuals.filter(t => t !== type)
          : [...prev.selectedVisuals, type]
      };
    });
  };

  const handleGenerate = async () => {
    if (!file) return;
    
    setStep(Steps.GENERATING);
    setError(null);

    try {
      const data = await generateInfographics(file, config);
      setResults(data);
      setStep(Steps.RESULTS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate content. The document might be too large or empty.");
      setStep(Steps.CONFIG);
    }
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    setStep(Steps.UPLOAD);
    setError(null);
  };

  // -- RENDERERS --

  const renderUploadStep = () => (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors">
      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6" aria-hidden="true">
        {uploadingFile ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        {uploadingFile ? "Processing File..." : "Upload your Document"}
      </h2>
      <p className="text-slate-500 mb-8 text-center max-w-md">
        {uploadingFile
          ? "Reading and validating your file..."
          : `Supports PDF, DOCX, PPTX, and TXT files (max ${MAX_FILE_SIZE_MB}MB). We'll analyze the content to generate visual insights.`}
      </p>

      <label
        className={`${uploadingFile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5`}
        htmlFor="file-upload"
      >
        <span>{uploadingFile ? "Processing..." : "Choose File"}</span>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".pdf,.docx,.pptx,.txt"
          onChange={handleFileChange}
          disabled={uploadingFile}
          aria-label="Upload document file (PDF, DOCX, PPTX, or TXT, max 20MB)"
        />
      </label>

      {error && (
        <div
          className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle size={16} aria-hidden="true" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );

  const renderConfigStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center" aria-hidden="true">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Customize Generation</h2>
            <p className="text-slate-500 text-sm">File: {file?.name}</p>
          </div>
        </div>

        {/* Visual Elements */}
        <fieldset className="mb-8">
          <legend className="block text-sm font-semibold text-slate-700 mb-4">Visual Elements</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Visual element selection">
            {Object.values(VisualType).map((type) => (
              <button
                key={type}
                onClick={() => toggleVisual(type)}
                role="checkbox"
                aria-checked={config.selectedVisuals.includes(type)}
                aria-label={`Include ${type} in visualization`}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  config.selectedVisuals.includes(type)
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-indigo-300 text-slate-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  config.selectedVisuals.includes(type) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                }`} aria-hidden="true">
                  {config.selectedVisuals.includes(type) && <CheckCircle size={14} className="text-white" />}
                </div>
                <span className="font-medium text-sm">{type}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Output & Format */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <fieldset>
            <legend className="block text-sm font-semibold text-slate-700 mb-3">Output Format</legend>
            <div className="flex gap-2" role="group" aria-label="Output format selection">
              {[OutputFormat.PNG, OutputFormat.JPG, OutputFormat.SVG].map(fmt => {
                const label = fmt.split('/')[1].split('+')[0].toUpperCase();
                return (
                  <button
                    key={fmt}
                    onClick={() => setConfig({ ...config, outputFormat: fmt })}
                    role="radio"
                    aria-checked={config.outputFormat === fmt}
                    aria-label={`Export as ${label} format`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.outputFormat === fmt
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="block text-sm font-semibold text-slate-700 mb-3">Dimensions</legend>
            <div className="flex gap-2" role="group" aria-label="Image orientation selection">
              <button
                 onClick={() => setConfig({ ...config, orientation: Orientation.PORTRAIT })}
                 role="radio"
                 aria-checked={config.orientation === Orientation.PORTRAIT}
                 aria-label="Portrait orientation"
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.orientation === Orientation.PORTRAIT
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                 }`}
              >
                <Minimize2 size={16} aria-hidden="true" /> Portrait
              </button>
              <button
                 onClick={() => setConfig({ ...config, orientation: Orientation.LANDSCAPE })}
                 role="radio"
                 aria-checked={config.orientation === Orientation.LANDSCAPE}
                 aria-label="Landscape orientation"
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.orientation === Orientation.LANDSCAPE
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                 }`}
              >
                <Maximize2 size={16} aria-hidden="true" /> Landscape
              </button>
            </div>
          </fieldset>
        </div>

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

        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex-1 py-3.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            aria-label="Cancel and return to upload"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={config.selectedVisuals.length === 0}
            className="flex-[2] py-3.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label={config.selectedVisuals.length === 0 ? "Select at least one visual element to generate infographics" : "Generate infographics with selected options"}
          >
            Generate Infographics
          </button>
        </div>
      </div>
    </div>
  );

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center py-20" role="status" aria-live="polite">
      <div className="relative mb-8" aria-hidden="true">
        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
        <Loader2 className="animate-spin text-indigo-600 relative z-10" size={64} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">Analyzing Document...</h2>
      <p className="text-slate-500 max-w-sm text-center">
        Gemini is extracting data points and designing your infographics. This may take a few seconds.
      </p>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Your Visualizations</h2>
            <p className="text-slate-500">Generated from {file?.name}</p>
          </div>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            aria-label="Start over and upload a new document"
          >
            Start Over
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Summary */}
          {results.summary && config.selectedVisuals.includes(VisualType.SUMMARY) && (
            <ExportWrapper title="Executive Summary" format={config.outputFormat} className="lg:col-span-2">
              <div className="prose prose-slate max-w-none">
                <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                  <p className="text-slate-700 leading-relaxed text-lg">{results.summary}</p>
                </div>
              </div>
            </ExportWrapper>
          )}

          {/* Generated Illustration */}
          {results.illustration && config.selectedVisuals.includes(VisualType.ILLUSTRATION) && (
            <ExportWrapper title="Presentation Illustration" format={config.outputFormat} className="lg:col-span-2">
              <div className="w-full bg-slate-100 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
                <img 
                  src={results.illustration} 
                  alt="Generated Illustration" 
                  className="w-full h-auto max-h-[500px] object-contain" 
                />
              </div>
              <p className="mt-4 text-sm text-slate-500">
                AI-generated illustration based on document themes.
              </p>
            </ExportWrapper>
          )}

          {/* Charts */}
          {results.charts.map((chart, idx) => {
            if (!config.selectedVisuals.includes(chart.type === 'bar' ? VisualType.BAR_CHART : VisualType.LINE_GRAPH)) return null;
            return (
              <ExportWrapper key={`chart-${idx}`} title={chart.title} format={config.outputFormat}>
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

          {/* D3 Keyword Visualization */}
          {results.keywords.length > 0 && config.selectedVisuals.includes(VisualType.DATA_VIS) && (
            <ExportWrapper title="Key Concepts Map" format={config.outputFormat}>
              <div className="h-[500px] w-full bg-white rounded-xl overflow-hidden flex items-center justify-center">
                <D3BubbleChart data={results.keywords} />
              </div>
              <p className="mt-4 text-sm text-slate-500">Size indicates relative importance or frequency in the document.</p>
            </ExportWrapper>
          )}

          {/* Diagrams */}
          {results.diagrams.map((diag, idx) => {
             // Basic mapping for visual type check
             const isFlow = diag.code.includes('graph') || diag.code.includes('flowchart');
             const isMind = diag.code.includes('mindmap');
             
             // Check if user wanted this type (rough check, could be more strict)
             const wantsFlow = config.selectedVisuals.includes(VisualType.FLOWCHART);
             const wantsMind = config.selectedVisuals.includes(VisualType.MIND_MAP);
             
             if ((isFlow && !wantsFlow) && (isMind && !wantsMind)) return null;
             // If user just checked Flowchart but AI returned mindmap, or vice versa, we usually show it if useful, 
             // but let's try to stick to requests. 
             // Simplification: Show all generated diagrams if any diagram type is selected, or filter strictly.
             if (!wantsFlow && !wantsMind) return null;

             return (
              <ExportWrapper key={`diag-${idx}`} title={diag.title} format={config.outputFormat} className="lg:col-span-2">
                <div className="min-h-[300px] w-full bg-white flex justify-center">
                  <Mermaid id={`m-${idx}`} chart={diag.code} />
                </div>
                <p className="mt-4 text-sm text-slate-500">{diag.description}</p>
              </ExportWrapper>
             );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white" aria-hidden="true">
              <Sparkles size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">DocuViz AI</h1>
          </div>
          <nav aria-label="Progress">
            <ol className="flex gap-4 text-sm font-medium text-slate-500">
              <li className={step === Steps.UPLOAD ? "text-indigo-600" : ""} aria-current={step === Steps.UPLOAD ? "step" : undefined}>Upload</li>
              <li aria-hidden="true">&rarr;</li>
              <li className={step === Steps.CONFIG ? "text-indigo-600" : ""} aria-current={step === Steps.CONFIG ? "step" : undefined}>Configure</li>
              <li aria-hidden="true">&rarr;</li>
              <li className={step === Steps.RESULTS ? "text-indigo-600" : ""} aria-current={step === Steps.RESULTS ? "step" : undefined}>Visuals</li>
            </ol>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {step === Steps.UPLOAD && renderUploadStep()}
        {step === Steps.CONFIG && renderConfigStep()}
        {step === Steps.GENERATING && renderGenerating()}
        {step === Steps.RESULTS && renderResults()}
      </main>
    </div>
  );
};

export default App;