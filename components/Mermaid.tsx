import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
  id: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart, id }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
    
    const renderChart = async () => {
      if (containerRef.current) {
        try {
          containerRef.current.innerHTML = '';
          const { svg } = await mermaid.render(`mermaid-${id}`, chart);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error("Mermaid rendering failed", error);
          if (containerRef.current) {
            containerRef.current.innerHTML = `<div class="text-red-500 text-sm p-4">Failed to render diagram. Syntax might be invalid.</div>`;
          }
        }
      }
    };

    renderChart();
  }, [chart, id]);

  return <div ref={containerRef} className="w-full flex justify-center items-center overflow-x-auto p-4" />;
};

export default Mermaid;