'use client';

import { VisualData, SVGData } from '@/types/chat';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface VisualRendererProps {
  visual: VisualData;
}

// Initialize Mermaid
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'system-ui, sans-serif',
    themeVariables: {
      primaryColor: '#4CAF50',
      primaryTextColor: '#000',
      primaryBorderColor: '#2e7d32',
      lineColor: '#666',
      secondaryColor: '#2196F3',
      tertiaryColor: '#FF9800',
    }
  });
}

export function VisualRenderer({ visual }: VisualRendererProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visual.type === 'mermaid' && mermaidRef.current && visual.data) {
      const renderMermaid = async () => {
        try {
          const { svg } = await mermaid.render(
            `mermaid-${Date.now()}`,
            visual.data as string
          );
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaid render error:', error);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `
              <div class="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                <p class="font-medium mb-2">Visual Description:</p>
                <p>${visual.fallback_text}</p>
              </div>
            `;
          }
        }
      };
      renderMermaid();
    }
  }, [visual]);

  // None - show fallback text
  if (visual.type === 'none') {
    return (
      <div className="h-full mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎨</span>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Visual Concept
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {visual.fallback_text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mermaid diagram
  if (visual.type === 'mermaid') {
    return (
      <div className="mt-6">
        <div className="bg-white rounded-2xl border border-black/10 p-6 overflow-x-auto">
          <div ref={mermaidRef} className="flex justify-center items-center min-h-[200px]" />
        </div>
      </div>
    );
  }

  // SVG diagram
  if (visual.type === 'svg' && visual.data) {
    return (
      <div className="mt-6 h-full">
        <div className="bg-white rounded-2xl border border-black/10 p-6">
          <SVGDiagram data={visual.data as SVGData} />
        </div>
      </div>
    );
  }

  // Pre-made asset
  if (visual.type === 'premade' && visual.data) {
    return (
      <div className="mt-6">
        <div className="bg-white rounded-2xl border border-black/10 p-6">
          <PremadeAsset assetName={visual.data as string} fallback={visual.fallback_text} />
        </div>
      </div>
    );
  }

  return null;
}

// SVG Diagram Component
function SVGDiagram({ data }: { data: SVGData }) {
  const { shapes, arrows } = data;

  return (
    <svg viewBox="0 0 450 350" className="w-full h-full max-h-[350px]">
      {/* Define arrow marker */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#666" />
        </marker>
      </defs>

      {/* Render shapes */}
      {shapes.map((shape, idx) => (
        <g key={idx}>
          {shape.type === 'rect' && (
            <rect
              x={shape.x}
              y={shape.y}
              width={shape.width || 100}
              height={shape.height || 60}
              fill={shape.fill}
              stroke="#333"
              strokeWidth="2"
              rx="8"
            />
          )}
          {shape.type === 'circle' && (
            <circle
              cx={shape.x}
              cy={shape.y}
              r={shape.width || 40}
              fill={shape.fill}
              stroke="#333"
              strokeWidth="2"
            />
          )}
          {shape.type === 'ellipse' && (
            <ellipse
              cx={shape.x}
              cy={shape.y}
              rx={shape.width || 60}
              ry={shape.height || 40}
              fill={shape.fill}
              stroke="#333"
              strokeWidth="2"
            />
          )}
          <text
            x={shape.labelX}
            y={shape.labelY}
            textAnchor="middle"
            className="text-sm font-medium fill-gray-800"
            dominantBaseline="middle"
          >
            {shape.label}
          </text>
        </g>
      ))}

      {/* Render arrows */}
      {arrows.map((arrow, idx) => {
        const [x1, y1] = arrow.from;
        const [x2, y2] = arrow.to;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        return (
          <g key={idx}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#666"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            {arrow.label && (
              <text
                x={midX}
                y={midY - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {arrow.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Pre-made Asset Component
function PremadeAsset({ assetName, fallback }: { assetName: string; fallback: string }) {
  // Map of asset names to actual SVG illustrations or images
  const assetMap: Record<string, React.ReactNode> = {
    'cell-structure': <CellStructureSVG />,
    'mitochondria': <MitochondriaSVG />,
    'nucleus': <NucleusSVG />,
    'dna-helix': <DNAHelixSVG />,
  
  };

  const asset = assetMap[assetName];

  if (!asset) {
    // Fallback to description if asset not found
    return (
      <div className="text-center p-8 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600 mb-2">🧬 {assetName}</p>
        <p className="text-xs text-gray-500">{fallback}</p>
      </div>
    );
  }

  return <div className="flex justify-center">{asset}</div>;
}


function CellStructureSVG() {
  return (
    <svg viewBox="0 0 300 300" className="w-full h-auto max-h-[300px]">
      {/* Cell membrane */}
      <ellipse cx="150" cy="150" rx="140" ry="120" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="3" />
      
      {/* Nucleus */}
      <circle cx="150" cy="150" r="50" fill="#BBDEFB" stroke="#2196F3" strokeWidth="2" />
      <text x="150" y="155" textAnchor="middle" className="text-sm font-medium fill-gray-800">
        Nucleus
      </text>
      
      {/* Mitochondria */}
      <ellipse cx="220" cy="120" rx="25" ry="15" fill="#FFECB3" stroke="#FF9800" strokeWidth="2" />
      <text x="220" y="105" textAnchor="middle" className="text-xs fill-gray-700">
        Mitochondria
      </text>
      
      {/* Ribosomes */}
      <circle cx="100" cy="100" r="6" fill="#CE93D8" />
      <circle cx="200" cy="180" r="6" fill="#CE93D8" />
      <circle cx="120" cy="190" r="6" fill="#CE93D8" />
    </svg>
  );
}

function MitochondriaSVG() {
  return (
    <svg viewBox="0 0 250 150" className="w-full h-auto max-h-[200px]">
      {/* Outer membrane */}
      <ellipse cx="125" cy="75" rx="110" ry="60" fill="#FFF3E0" stroke="#FF9800" strokeWidth="3" />
      
      {/* Inner membrane folds (cristae) */}
      <path d="M 40 75 Q 50 60, 60 75 T 80 75" stroke="#F57C00" strokeWidth="2" fill="none" />
      <path d="M 90 75 Q 100 60, 110 75 T 130 75" stroke="#F57C00" strokeWidth="2" fill="none" />
      <path d="M 140 75 Q 150 60, 160 75 T 180 75" stroke="#F57C00" strokeWidth="2" fill="none" />
      
      {/* Labels */}
      <text x="125" y="30" textAnchor="middle" className="text-xs font-medium fill-gray-700">
        Outer Membrane
      </text>
      <text x="125" y="120" textAnchor="middle" className="text-xs font-medium fill-gray-700">
        Cristae (Inner folds)
      </text>
    </svg>
  );
}

function NucleusSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-auto max-h-[200px]">
      {/* Nuclear envelope */}
      <circle cx="100" cy="100" r="80" fill="#E3F2FD" stroke="#2196F3" strokeWidth="3" />
      
      {/* Nucleolus */}
      <circle cx="100" cy="100" r="25" fill="#90CAF9" stroke="#1976D2" strokeWidth="2" />
      <text x="100" y="105" textAnchor="middle" className="text-xs fill-white font-medium">
        Nucleolus
      </text>
      
      {/* Chromatin */}
      <path d="M 60 70 Q 70 60, 80 70" stroke="#1565C0" strokeWidth="2" fill="none" />
      <path d="M 120 70 Q 130 60, 140 70" stroke="#1565C0" strokeWidth="2" fill="none" />
      <path d="M 60 130 Q 70 140, 80 130" stroke="#1565C0" strokeWidth="2" fill="none" />
      
      {/* Nuclear pores */}
      <circle cx="180" cy="100" r="4" fill="#FFC107" />
      <circle cx="20" cy="100" r="4" fill="#FFC107" />
      <circle cx="100" cy="20" r="4" fill="#FFC107" />
    </svg>
  );
}

function DNAHelixSVG() {
  return (
    <svg viewBox="0 0 150 300" className="w-full h-auto max-h-[300px]">
      {/* DNA double helix */}
      <path
        d="M 40 20 Q 75 50, 40 80 T 40 140 T 40 200 T 40 260"
        stroke="#2196F3"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M 110 20 Q 75 50, 110 80 T 110 140 T 110 200 T 110 260"
        stroke="#F44336"
        strokeWidth="4"
        fill="none"
      />
      
      {/* Base pairs */}
      {[40, 70, 100, 130, 160, 190, 220, 250].map((y, i) => (
        <line
          key={i}
          x1="40"
          y1={y}
          x2="110"
          y2={y}
          stroke="#4CAF50"
          strokeWidth="2"
        />
      ))}
      
      {/* Labels */}
      <text x="75" y="290" textAnchor="middle" className="text-xs font-medium fill-gray-700">
        DNA Double Helix
      </text>
    </svg>
  );
}