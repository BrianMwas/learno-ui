'use client';

import { Slide, SVGData } from '@/types/chat';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface VisualRendererProps {
  slide: Slide;
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

export function VisualRenderer({ slide }: VisualRendererProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  
  const visualType = slide.visual_type || 'none';
  const visualData = slide.visual_data;
  const fallbackText = slide.visual_description || 'No visual available';

  useEffect(() => {
    if (visualType === 'mermaid' && mermaidRef.current && visualData && typeof visualData === 'string') {
      const renderMermaid = async () => {
        try {
          const { svg } = await mermaid.render(
            `mermaid-${Date.now()}`,
            visualData
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
                <p>${fallbackText}</p>
              </div>
            `;
          }
        }
      };
      renderMermaid();
    }
  }, [visualType, visualData, fallbackText]);

  // None - show fallback text
  if (visualType === 'none' || !visualData) {
    return (
      <div className="h-full mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎨</span>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Visual Concept
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {fallbackText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mermaid diagram
  if (visualType === 'mermaid' && typeof visualData === 'string') {
    return (
      <div className="mt-6">
        <div className="bg-white rounded-2xl border border-black/10 p-6 overflow-x-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-purple-600 font-semibold text-sm">📊 Diagram</span>
          </div>
          <div ref={mermaidRef} className="flex justify-center items-center min-h-[200px]" />
          {fallbackText && (
            <p className="text-xs text-gray-500 mt-4 text-center italic">
              {fallbackText}
            </p>
          )}
        </div>
      </div>
    );
  }

  // SVG diagram
  if (visualType === 'svg' && visualData && typeof visualData === 'object') {
    return (
      <div className="mt-6 h-full">
        <div className="bg-white rounded-2xl border border-black/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-600 font-semibold text-sm">🎨 Visual Diagram</span>
          </div>
          <SVGDiagram data={visualData as SVGData} />
          {fallbackText && (
            <p className="text-xs text-gray-500 mt-4 text-center italic">
              {fallbackText}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Pre-made asset
  if (visualType === 'premade' && typeof visualData === 'string') {
    return (
      <div className="mt-6">
        <div className="bg-white rounded-2xl border border-black/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-600 font-semibold text-sm">🧬 Biology Asset</span>
          </div>
          <PremadeAsset assetName={visualData} fallback={fallbackText} />
          {fallbackText && (
            <p className="text-xs text-gray-500 mt-4 text-center italic">
              {fallbackText}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800">
        ⚠️ Unknown visual type: {visualType}
      </p>
      <p className="text-xs text-yellow-600 mt-2">{fallbackText}</p>
    </div>
  );
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
            <>
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
              {shape.label && (
                <text
                  x={shape.labelX || shape.x + (shape.width || 100) / 2}
                  y={shape.labelY || shape.y + (shape.height || 60) / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-medium fill-white"
                >
                  {shape.label}
                </text>
              )}
            </>
          )}
          {shape.type === 'circle' && (
            <>
              <circle
                cx={shape.x}
                cy={shape.y}
                r={shape.rx || shape.width || 40}
                fill={shape.fill}
                stroke="#333"
                strokeWidth="2"
              />
              {shape.label && (
                <text
                  x={shape.labelX || shape.x}
                  y={shape.labelY || shape.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-medium fill-white"
                >
                  {shape.label}
                </text>
              )}
            </>
          )}
          {shape.type === 'ellipse' && (
            <>
              <ellipse
                cx={shape.x}
                cy={shape.y}
                rx={shape.rx || shape.width || 60}
                ry={shape.ry || shape.height || 40}
                fill={shape.fill}
                stroke="#333"
                strokeWidth="2"
              />
              {shape.label && (
                <text
                  x={shape.labelX || shape.x}
                  y={shape.labelY || shape.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-medium fill-white"
                >
                  {shape.label}
                </text>
              )}
            </>
          )}
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
    'ribosome': <RibosomeSVG />,
    'dna-helix': <DNAHelixSVG />,
    'chromosome': <ChromosomeSVG />,
    'cell-membrane': <CellMembraneSVG />,
    'protein-structure': <ProteinStructureSVG />,
    'enzyme-substrate': <EnzymeSubstrateSVG />,
    'photosynthesis-cycle': <PhotosynthesisCycleSVG />,
    'cellular-respiration': <CellularRespirationSVG />,
    'mitosis-stages': <MitosisStagesSVG />,
    'meiosis-stages': <MeiosisStagesSVG />,
  };

  const asset = assetMap[assetName];

  if (!asset) {
    // Fallback to description if asset not found
    return (
      <div className="text-center p-8 bg-gray-50 rounded-xl">
        <p className="text-2xl mb-2">🧬</p>
        <p className="text-sm font-medium text-gray-700 mb-1">{assetName}</p>
        <p className="text-xs text-gray-500">{fallback}</p>
      </div>
    );
  }

  return <div className="flex justify-center">{asset}</div>;
}

// ============ PREMADE BIOLOGY ASSETS ============

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

function RibosomeSVG() {
  return (
    <svg viewBox="0 0 150 150" className="w-full h-auto max-h-[150px]">
      {/* Large subunit */}
      <circle cx="75" cy="60" r="35" fill="#CE93D8" stroke="#9C27B0" strokeWidth="2" />
      {/* Small subunit */}
      <circle cx="75" cy="95" r="25" fill="#E1BEE7" stroke="#9C27B0" strokeWidth="2" />
      <text x="75" y="130" textAnchor="middle" className="text-xs fill-gray-700">
        Ribosome
      </text>
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

function ChromosomeSVG() {
  return (
    <svg viewBox="0 0 200 250" className="w-full h-auto max-h-[250px]">
      {/* Chromosome */}
      <rect x="80" y="40" width="40" height="90" rx="20" fill="#5C6BC0" stroke="#303F9F" strokeWidth="2" />
      <rect x="80" y="130" width="40" height="90" rx="20" fill="#5C6BC0" stroke="#303F9F" strokeWidth="2" />
      {/* Centromere */}
      <ellipse cx="100" cy="125" rx="30" ry="15" fill="#FF9800" stroke="#F57C00" strokeWidth="2" />
      <text x="100" y="240" textAnchor="middle" className="text-xs fill-gray-700">
        Chromosome
      </text>
    </svg>
  );
}

function CellMembraneSVG() {
  return (
    <svg viewBox="0 0 300 150" className="w-full h-auto max-h-[150px]">
      {/* Phospholipid bilayer */}
      <ellipse cx="50" cy="50" rx="8" ry="8" fill="#FF9800" />
      <line x1="50" y1="58" x2="50" y2="90" stroke="#4CAF50" strokeWidth="3" />
      <line x1="50" y1="58" x2="50" y2="90" stroke="#4CAF50" strokeWidth="3" />
      
      {[100, 150, 200, 250].map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy="50" rx="8" ry="8" fill="#FF9800" />
          <line x1={x} y1="58" x2={x} y2="90" stroke="#4CAF50" strokeWidth="3" />
        </g>
      ))}
      
      <text x="150" y="120" textAnchor="middle" className="text-xs fill-gray-700">
        Cell Membrane
      </text>
    </svg>
  );
}

function ProteinStructureSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-auto max-h-[200px]">
      {/* Protein folding */}
      <path
        d="M 30 100 Q 50 50, 80 80 T 120 100 T 170 120"
        stroke="#E91E63"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <text x="100" y="180" textAnchor="middle" className="text-xs fill-gray-700">
        Protein Structure
      </text>
    </svg>
  );
}

function EnzymeSubstrateSVG() {
  return (
    <svg viewBox="0 0 250 200" className="w-full h-auto max-h-[200px]">
      {/* Enzyme */}
      <path d="M 50 100 Q 50 50, 100 50 T 150 100 Q 150 150, 100 150 T 50 100" fill="#9C27B0" stroke="#6A1B9A" strokeWidth="2" />
      {/* Active site */}
      <ellipse cx="100" cy="100" rx="20" ry="15" fill="#FFF" stroke="#6A1B9A" strokeWidth="2" />
      {/* Substrate */}
      <rect x="180" y="90" width="40" height="20" rx="5" fill="#FF9800" stroke="#F57C00" strokeWidth="2" />
      <text x="125" y="180" textAnchor="middle" className="text-xs fill-gray-700">
        Enzyme-Substrate Complex
      </text>
    </svg>
  );
}

function PhotosynthesisCycleSVG() {
  return (
    <svg viewBox="0 0 300 300" className="w-full h-auto max-h-[300px]">
      {/* Sun */}
      <circle cx="150" cy="50" r="25" fill="#FFC107" stroke="#F57C00" strokeWidth="2" />
      <text x="150" y="35" textAnchor="middle" className="text-xs fill-gray-700">☀️</text>
      
      {/* Chloroplast */}
      <ellipse cx="150" cy="150" rx="80" ry="50" fill="#C8E6C9" stroke="#4CAF50" strokeWidth="3" />
      
      {/* Arrows */}
      <path d="M 150 80 L 150 100" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />
      
      {/* Products */}
      <text x="150" y="155" textAnchor="middle" className="text-sm font-medium fill-gray-800">
        Photosynthesis
      </text>
      
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#333" />
        </marker>
      </defs>
    </svg>
  );
}

function CellularRespirationSVG() {
  return (
    <svg viewBox="0 0 300 250" className="w-full h-auto max-h-[250px]">
      {/* Mitochondrion */}
      <ellipse cx="150" cy="125" rx="100" ry="60" fill="#FFF3E0" stroke="#FF9800" strokeWidth="3" />
      
      {/* Labels */}
      <text x="70" y="70" className="text-xs fill-gray-700">Glucose</text>
      <text x="190" y="70" className="text-xs fill-gray-700">O₂</text>
      <text x="70" y="190" className="text-xs fill-gray-700">CO₂</text>
      <text x="180" y="190" className="text-xs fill-gray-700">ATP</text>
      
      <text x="150" y="135" textAnchor="middle" className="text-sm font-medium fill-gray-800">
        Cellular Respiration
      </text>
    </svg>
  );
}

function MitosisStagesSVG() {
  return (
    <svg viewBox="0 0 400 150" className="w-full h-auto max-h-[150px]">
      {/* Prophase */}
      <g transform="translate(50, 75)">
        <circle r="40" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
        <path d="M -15 0 L 15 0 M 0 -15 L 0 15" stroke="#5C6BC0" strokeWidth="3" />
        <text y="60" textAnchor="middle" className="text-xs fill-gray-700">Prophase</text>
      </g>
      
      {/* Metaphase */}
      <g transform="translate(150, 75)">
        <circle r="40" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
        <line x1="-20" y1="0" x2="20" y2="0" stroke="#5C6BC0" strokeWidth="3" />
        <text y="60" textAnchor="middle" className="text-xs fill-gray-700">Metaphase</text>
      </g>
      
      {/* Anaphase */}
      <g transform="translate(250, 75)">
        <circle r="40" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
        <line x1="-15" y1="0" x2="-25" y2="0" stroke="#5C6BC0" strokeWidth="3" />
        <line x1="15" y1="0" x2="25" y2="0" stroke="#5C6BC0" strokeWidth="3" />
        <text y="60" textAnchor="middle" className="text-xs fill-gray-700">Anaphase</text>
      </g>
      
      {/* Telophase */}
      <g transform="translate(350, 75)">
        <ellipse cx="-10" cy="0" rx="20" ry="30" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
        <ellipse cx="10" cy="0" rx="20" ry="30" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2" />
        <text y="60" textAnchor="middle" className="text-xs fill-gray-700">Telophase</text>
      </g>
    </svg>
  );
}

function MeiosisStagesSVG() {
  return (
    <svg viewBox="0 0 400 200" className="w-full h-auto max-h-[200px]">
      <text x="200" y="30" textAnchor="middle" className="text-sm font-medium fill-gray-800">
        Meiosis: Reduction Division
      </text>
      
      {/* Meiosis I */}
      <g transform="translate(100, 100)">
        <circle r="35" fill="#F3E5F5" stroke="#9C27B0" strokeWidth="2" />
        <text y="55" textAnchor="middle" className="text-xs fill-gray-700">Meiosis I</text>
      </g>
      
      {/* Arrow */}
      <line x1="140" y1="100" x2="180" y2="100" stroke="#666" strokeWidth="2" markerEnd="url(#arrow2)" />
      
      {/* Meiosis II */}
      <g transform="translate(240, 80)">
        <circle r="25" fill="#F3E5F5" stroke="#9C27B0" strokeWidth="2" />
      </g>
      <g transform="translate(240, 120)">
        <circle r="25" fill="#F3E5F5" stroke="#9C27B0" strokeWidth="2" />
      </g>
      
      <text x="240" y="165" textAnchor="middle" className="text-xs fill-gray-700">Meiosis II</text>
      
      {/* Arrow */}
      <line x1="270" y1="100" x2="310" y2="100" stroke="#666" strokeWidth="2" markerEnd="url(#arrow2)" />
      
      {/* Four cells */}
      {[0, 30, 60, 90].map((offset, i) => (
        <circle key={i} cx="340" cy={60 + offset/2} r="15" fill="#F3E5F5" stroke="#9C27B0" strokeWidth="2" />
      ))}
      
      <defs>
        <marker id="arrow2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#666" />
        </marker>
      </defs>
    </svg>
  );
}