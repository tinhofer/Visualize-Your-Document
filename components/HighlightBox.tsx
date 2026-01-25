import React from 'react';
import { 
  Lightbulb, 
  Quote, 
  AlertTriangle, 
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { HighlightBoxData } from '../types';

interface HighlightBoxProps {
  readonly data: HighlightBoxData;
}

interface BoxStyle {
  readonly icon: LucideIcon;
  readonly bgColor: string;
  readonly borderColor: string;
  readonly iconBgColor: string;
  readonly iconColor: string;
  readonly titleColor: string;
}

const BOX_STYLES: Readonly<Record<HighlightBoxData['type'], BoxStyle>> = {
  fact: {
    icon: Sparkles,
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    iconBgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    titleColor: 'text-indigo-800',
  },
  quote: {
    icon: Quote,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconBgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconBgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
  },
  tip: {
    icon: Lightbulb,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconBgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-800',
  },
};

const HighlightBox: React.FC<HighlightBoxProps> = ({ data }) => {
  const style = BOX_STYLES[data.type];
  const Icon = style.icon;

  return (
    <div 
      className={`${style.bgColor} ${style.borderColor} border rounded-xl p-5`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div 
          className={`${style.iconBgColor} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}
          aria-hidden="true"
        >
          <Icon size={20} className={style.iconColor} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`${style.titleColor} font-semibold text-base mb-1`}>
            {data.title}
          </h4>
          <p className="text-slate-700 text-sm leading-relaxed">
            {data.content}
          </p>
          
          {/* Source for quotes */}
          {data.type === 'quote' && data.source && (
            <p className="text-slate-500 text-xs mt-2 italic">
              — {data.source}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for rendering multiple highlight boxes
interface HighlightBoxListProps {
  readonly boxes: ReadonlyArray<HighlightBoxData>;
}

export const HighlightBoxList: React.FC<HighlightBoxListProps> = ({ boxes }) => {
  return (
    <div className="space-y-4">
      {boxes.map((box, idx) => (
        <HighlightBox key={idx} data={box} />
      ))}
    </div>
  );
};

export default HighlightBox;
