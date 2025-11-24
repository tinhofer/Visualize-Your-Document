import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { KeywordData } from '../types';

interface D3BubbleChartProps {
  data: KeywordData[];
  width?: number; // Optional, will use parent width if not provided
  height?: number;
}

const D3BubbleChart: React.FC<D3BubbleChartProps> = ({ data, width: propWidth, height: propHeight }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  // Handle Resize
  useEffect(() => {
    if (propWidth && propHeight) {
      setDimensions({ width: propWidth, height: propHeight });
      return;
    }
    
    const handleResize = () => {
        if (wrapperRef.current) {
            const { clientWidth, clientHeight } = wrapperRef.current;
            // Ensure some minimums
            setDimensions({ 
                width: clientWidth || 600, 
                height: clientHeight || 500 
            });
        }
    };

    window.addEventListener('resize', handleResize);
    // Call once to set initial size
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [propWidth, propHeight]);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // A nice palette suitable for a professional app
    const colors = [
      "#6366f1", // Indigo
      "#ec4899", // Pink
      "#8b5cf6", // Violet
      "#14b8a6", // Teal
      "#f59e0b", // Amber
      "#3b82f6", // Blue
      "#ef4444", // Red
      "#10b981", // Emerald
    ];

    // Process Data
    const root = d3.hierarchy({ children: data })
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Pack Layout
    const pack = d3.pack()
      .size([width, height])
      .padding(10); // Spacing between bubbles

    const nodes = pack(root).leaves();

    // Definitions for shadows/gradients
    const defs = svg.append("defs");
    
    // Drop Shadow
    const filter = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%");
    
    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3)
      .attr("result", "blur");
    
    filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Gradients for each color
    colors.forEach((c, i) => {
        const gradient = defs.append("radialGradient")
            .attr("id", `grad-${i}`)
            .attr("cx", "30%")
            .attr("cy", "30%")
            .attr("r", "70%");
        
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d3.rgb(c).brighter(0.6).toString()); // Light reflection
        
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", c);
    });

    const g = svg.append("g");

    // Render Nodes
    const node = g.selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "default");

    // Bubbles
    node.append("circle")
      .attr("r", 0) // Animate from 0
      .style("fill", (d: any, i) => `url(#grad-${i % colors.length})`)
      .style("filter", "url(#drop-shadow)")
      .style("stroke", "#fff")
      .style("stroke-width", 2)
      .style("stroke-opacity", 0.3)
      .transition().duration(800).ease(d3.easeBackOut)
      .attr("r", d => d.r);

    // Text Labels
    // Only add text to bubbles large enough to hold it
    const textNodes = node.filter(d => d.r > 20);

    textNodes.append("text")
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-family", "'Inter', sans-serif")
      .style("font-weight", "600")
      .style("text-shadow", "0px 1px 2px rgba(0,0,0,0.4)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .each(function(d: any) {
        const el = d3.select(this);
        const text = d.data.text;
        const words = text.split(/\s+/);
        const r = d.r;

        // Smart sizing: smaller bubbles get smaller font, but capped
        // fitSize attempts to fit text width into diameter
        const fitSize = Math.min(r / 2, (r * 3.5) / text.length); 
        const fontSize = Math.max(10, Math.min(18, fitSize)); 

        if (words.length > 1 && r > 35) {
             const mid = Math.ceil(words.length / 2);
             const line1 = words.slice(0, mid).join(" ");
             const line2 = words.slice(mid).join(" ");
             
             el.append("tspan")
                .attr("x", 0)
                .attr("dy", "-0.2em")
                .style("font-size", `${fontSize}px`)
                .text(line1);
                
             el.append("tspan")
                .attr("x", 0)
                .attr("dy", "1.2em")
                .style("font-size", `${fontSize}px`)
                .text(line2);
        } else {
             el.append("tspan")
                .attr("x", 0)
                .attr("dy", "0.35em")
                .style("font-size", `${fontSize}px`)
                .text(text);
        }
      })
      .transition().delay(400).duration(500)
      .style("opacity", 1);

    // Interactive Hover Effect
    node.on("mouseenter", function() {
        d3.select(this).select("circle")
            .transition().duration(200)
            .ease(d3.easeCubicOut)
            .attr("transform", "scale(1.08)");
        
        // Show tooltip via title or custom overlay (using simple title here)
    }).on("mouseleave", function() {
        d3.select(this).select("circle")
            .transition().duration(200)
            .ease(d3.easeCubicOut)
            .attr("transform", "scale(1)");
    });

    node.append("title")
      .text((d: any) => `${d.data.text}\nImportance: ${d.data.value}`);

  }, [data, dimensions]);

  return (
    <div ref={wrapperRef} className="w-full h-full min-h-[400px]">
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="block mx-auto"
        style={{ overflow: 'visible' }} // Allow shadows to spill slightly if near edge
      />
    </div>
  );
};

export default D3BubbleChart;