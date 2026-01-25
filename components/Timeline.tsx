import React from 'react';
import { Circle } from 'lucide-react';
import { TimelineData } from '../types';

interface TimelineProps {
  readonly data: TimelineData;
}

const Timeline: React.FC<TimelineProps> = ({ data }) => {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div 
        className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-indigo-400 to-indigo-300"
        aria-hidden="true"
      />
      
      <div className="space-y-8">
        {data.events.map((event, idx) => (
          <div key={idx} className="relative pl-12">
            {/* Timeline dot */}
            <div 
              className="absolute left-0 top-1 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-500 shadow-sm"
              aria-hidden="true"
            >
              <Circle size={8} className="text-indigo-600 fill-indigo-600" />
            </div>
            
            {/* Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {event.date}
                </span>
              </div>
              <h4 className="text-base font-semibold text-slate-800 mb-1">
                {event.title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
