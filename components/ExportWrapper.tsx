import React, { useRef, useState } from 'react';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { Download, Check } from 'lucide-react';
import { OutputFormat } from '../types';

interface ExportWrapperProps {
  children: React.ReactNode;
  title: string;
  format: OutputFormat;
  className?: string;
}

const ExportWrapper: React.FC<ExportWrapperProps> = ({ children, title, format, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    if (!ref.current) return;
    setDownloading(true);

    try {
      let dataUrl;
      const filename = `${title.replace(/\s+/g, '_').toLowerCase()}`;

      // Force white background for images
      const options = { backgroundColor: '#ffffff' };

      switch (format) {
        case OutputFormat.JPG:
          dataUrl = await toJpeg(ref.current, { ...options, quality: 0.95 });
          break;
        case OutputFormat.SVG:
          dataUrl = await toSvg(ref.current, options);
          break;
        case OutputFormat.PNG:
        default:
          dataUrl = await toPng(ref.current, options);
          break;
      }

      const link = document.createElement('a');
      link.download = `${filename}${getExtension(format)}`;
      link.href = dataUrl;
      link.click();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const getExtension = (fmt: OutputFormat) => {
    if (fmt === OutputFormat.JPG) return '.jpg';
    if (fmt === OutputFormat.SVG) return '.svg';
    return '.png';
  };

  return (
    <div className={`relative group border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
        <h3 className="font-semibold text-slate-800 truncate pr-4">{title}</h3>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          {success ? <Check size={14} /> : <Download size={14} />}
          {success ? 'Saved' : 'Export'}
        </button>
      </div>
      
      <div ref={ref} className="p-6 bg-white rounded-b-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ExportWrapper;