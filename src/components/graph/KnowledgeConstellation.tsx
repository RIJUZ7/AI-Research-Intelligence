import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Filter,
  FileText,
  Sparkles,
  ExternalLink,
  Info,
  RefreshCw,
} from 'lucide-react';
import { KnowledgeGraphData, KnowledgeGraphNode, KnowledgeGraphEdge, Collection } from '../../types';
import { api } from '../../lib/api';

interface KnowledgeConstellationProps {
  collections: Collection[];
  onOpenDocument: (docId: string) => void;
}

interface NodeLayoutPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const KnowledgeConstellation: React.FC<KnowledgeConstellationProps> = ({
  collections,
  onOpenDocument,
}) => {
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<KnowledgeGraphNode | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Canvas pan & zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchGraph = () => {
    setLoading(true);
    api.getKnowledgeGraph()
      .then(data => setGraphData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  // Compute node coordinates using an orbital deterministic layout
  const nodePositions = useMemo(() => {
    if (!graphData || graphData.nodes.length === 0) return new Map<string, NodeLayoutPosition>();

    const positions = new Map<string, NodeLayoutPosition>();
    const docNodes = graphData.nodes.filter(n => n.type === 'document');
    const conceptNodes = graphData.nodes.filter(n => n.type !== 'document');

    const width = 850;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    // Place document nodes on an outer circle
    const docRadius = Math.min(width, height) * 0.38;
    docNodes.forEach((node, idx) => {
      const angle = (idx / Math.max(1, docNodes.length)) * 2 * Math.PI - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * docRadius,
        y: centerY + Math.sin(angle) * docRadius,
        vx: 0,
        vy: 0,
        radius: 20 + Math.min(16, node.frequency * 2),
      });
    });

    // Place concept nodes on inner golden ratio spiral / concentric rings
    const innerRadius = Math.min(width, height) * 0.22;
    conceptNodes.forEach((node, idx) => {
      const ring = (idx % 2 === 0) ? innerRadius : innerRadius * 0.6;
      const angle = (idx / Math.max(1, conceptNodes.length)) * 2 * Math.PI;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * ring,
        y: centerY + Math.sin(angle) * ring,
        vx: 0,
        vy: 0,
        radius: 12 + Math.min(12, node.frequency * 2),
      });
    });

    return positions;
  }, [graphData]);

  // Handle Pan & Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Filter nodes
  const visibleNodes = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.filter(node => {
      if (selectedType !== 'all' && node.type !== selectedType) return false;
      if (searchFilter.trim()) {
        return node.label.toLowerCase().includes(searchFilter.toLowerCase());
      }
      return true;
    });
  }, [graphData, selectedType, searchFilter]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  const getNodeColor = (type: KnowledgeGraphNode['type']) => {
    switch (type) {
      case 'document':
        return { fill: '#C69A57', stroke: '#A87E3E', text: '#593B09' }; // Warm ochre
      case 'concept':
        return { fill: '#506B58', stroke: '#3F5445', text: '#1E2C22' }; // Muted forest
      case 'method':
        return { fill: '#748AA0', stroke: '#566E87', text: '#2A3C4D' }; // Desaturated blue
      default:
        return { fill: '#B6ACD6', stroke: '#9284BD', text: '#3E345C' }; // Soft lavender
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-[#F6F4EE] overflow-hidden">
      {/* Constellation Toolbar */}
      <div className="px-6 py-3 bg-[#FFFEFA] border-b border-[#E5E2D9] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-editorial text-lg font-semibold text-[#222822]">
            Knowledge Constellation
          </h2>
          <p className="text-[11px] text-[#8A9088] font-mono">
            Interactive map of extracted concepts, methodologies, and cross-document relationships
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Concepts */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8A9088] absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Find concept or document..."
              className="pl-8 pr-3 py-1 text-xs bg-[#F6F4EE] border border-[#E5E2D9] rounded-md text-[#222822] placeholder-[#8A9088] focus:outline-none focus:border-[#506B58] w-52"
            />
          </div>

          {/* Node Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-xs bg-[#F6F4EE] border border-[#E5E2D9] rounded-md px-2.5 py-1 text-[#222822] focus:outline-none focus:border-[#506B58]"
          >
            <option value="all">All Elements</option>
            <option value="document">Documents Only</option>
            <option value="concept">Concepts Only</option>
            <option value="method">Methodologies</option>
          </select>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 p-0.5 bg-[#F6F4EE] border border-[#E5E2D9] rounded">
            <button
              onClick={() => setZoom(z => Math.min(2.5, z * 1.15))}
              className="p-1 text-[#575D56] hover:text-[#222822] rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.4, z * 0.85))}
              className="p-1 text-[#575D56] hover:text-[#222822] rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1 text-[#575D56] hover:text-[#222822] rounded"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={fetchGraph}
            className="p-1.5 text-[#575D56] hover:text-[#222822] hover:bg-[#F6F4EE] rounded transition-colors"
            title="Refresh Knowledge Graph"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="flex-1 h-full cursor-grab active:cursor-grabbing overflow-hidden bg-[#F6F4EE] select-none relative"
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F6F4EE]/80">
              <div className="text-center space-y-2">
                <Sparkles className="w-6 h-6 text-[#506B58] animate-spin mx-auto" />
                <p className="text-xs font-mono text-[#575D56]">Synthesizing constellation graph...</p>
              </div>
            </div>
          ) : !graphData || graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-8 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl text-center max-w-md space-y-2">
                <Info className="w-6 h-6 text-[#8A9088] mx-auto" />
                <h4 className="font-editorial text-base font-medium">Knowledge Graph Empty</h4>
                <p className="text-xs text-[#575D56]">
                  Upload documents to extract concepts and map cross-document relationships.
                </p>
              </div>
            </div>
          ) : (
            <svg
              className="w-full h-full"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              viewBox="0 0 850 550"
            >
              <defs>
                <pattern id="constellation-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="0.8" fill="#D8D4C8" opacity="0.6" />
                </pattern>
              </defs>

              <rect width="850" height="550" fill="url(#constellation-grid)" />

              {/* Connecting Edges */}
              <g className="edges">
                {graphData.edges.map(edge => {
                  const srcPos = nodePositions.get(edge.source);
                  const tgtPos = nodePositions.get(edge.target);
                  if (!srcPos || !tgtPos) return null;
                  if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return null;

                  const isConnectedToHover =
                    hoveredNode && (hoveredNode.id === edge.source || hoveredNode.id === edge.target);
                  const isConnectedToSelected =
                    selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

                  return (
                    <line
                      key={edge.id}
                      x1={srcPos.x}
                      y1={srcPos.y}
                      x2={tgtPos.x}
                      y2={tgtPos.y}
                      stroke={
                        isConnectedToSelected
                          ? '#506B58'
                          : isConnectedToHover
                          ? '#C69A57'
                          : '#D5D1C5'
                      }
                      strokeWidth={
                        isConnectedToSelected || isConnectedToHover
                          ? 2
                          : Math.max(1, edge.weight * 2)
                      }
                      strokeDasharray={edge.relationship === 'shares_concept' ? '4 3' : undefined}
                      opacity={isConnectedToSelected ? 0.9 : isConnectedToHover ? 0.7 : 0.35}
                    />
                  );
                })}
              </g>

              {/* Nodes */}
              <g className="nodes">
                {visibleNodes.map(node => {
                  const pos = nodePositions.get(node.id);
                  if (!pos) return null;
                  const color = getNodeColor(node.type);
                  const isSelected = selectedNode?.id === node.id;
                  const isHovered = hoveredNode?.id === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer transition-transform"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Outer pulse aura for documents or selected node */}
                      {(isSelected || isHovered) && (
                        <circle
                          r={pos.radius + 6}
                          fill={color.fill}
                          opacity={0.2}
                          className="animate-pulse"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={pos.radius}
                        fill={color.fill}
                        stroke={color.stroke}
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="transition-all"
                        opacity={0.92}
                      />

                      {/* Inner Emblem or Dot */}
                      {node.type === 'document' ? (
                        <circle r={pos.radius * 0.4} fill="#FFFEFA" opacity={0.8} />
                      ) : (
                        <circle r={2} fill="#FFFEFA" />
                      )}

                      {/* Node Label */}
                      <text
                        y={pos.radius + 12}
                        textAnchor="middle"
                        fontSize={node.type === 'document' ? '11' : '10'}
                        fontWeight={node.type === 'document' || isSelected ? '600' : '400'}
                        fontFamily="var(--font-sans)"
                        fill="#222822"
                        className="pointer-events-none select-none"
                      >
                        {node.label.length > 24 ? node.label.slice(0, 22) + '...' : node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 p-3 bg-[#FFFEFA]/95 backdrop-blur-xs border border-[#E5E2D9] rounded-lg shadow-2xs text-[11px] font-mono space-y-1.5 pointer-events-auto">
            <div className="text-[10px] uppercase tracking-wider text-[#8A9088] font-bold">
              Atlas Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C69A57]" />
              <span>Document Nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#506B58]" />
              <span>Extracted Concepts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#748AA0]" />
              <span>Methodologies</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="w-80 border-l border-[#E5E2D9] bg-[#FFFEFA] h-full p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A9088]">
                  Entity Inspector
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-[#8A9088] hover:text-[#222822]"
                >
                  Close
                </button>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#E8ECE9] text-[#506B58]">
                  {selectedNode.type}
                </span>
                <h3 className="font-editorial text-lg font-semibold text-[#222822] mt-2">
                  {selectedNode.label}
                </h3>
                {selectedNode.description && (
                  <p className="mt-1 text-xs text-[#575D56] leading-relaxed">
                    {selectedNode.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#EFECE4] space-y-2 text-xs">
                <div className="flex justify-between text-[#575D56]">
                  <span className="text-[#8A9088]">Occurrence Frequency:</span>
                  <span className="font-mono font-semibold text-[#222822]">
                    {selectedNode.frequency} times
                  </span>
                </div>
                <div className="flex justify-between text-[#575D56]">
                  <span className="text-[#8A9088]">Supporting Documents:</span>
                  <span className="font-mono font-semibold text-[#222822]">
                    {selectedNode.documentCount}
                  </span>
                </div>
              </div>

              {/* Associated Documents */}
              {selectedNode.documentIds.length > 0 && (
                <div className="pt-4 border-t border-[#EFECE4] space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A9088]">
                    Source Documents
                  </div>
                  <div className="space-y-1.5">
                    {selectedNode.documentIds.map(docId => (
                      <button
                        key={docId}
                        onClick={() => onOpenDocument(docId)}
                        className="w-full text-left p-2 bg-[#F9F7F1] hover:bg-[#EFECE4] rounded text-xs text-[#222822] flex items-center justify-between group transition-colors"
                      >
                        <span className="truncate pr-2 font-medium">{docId}</span>
                        <ExternalLink className="w-3 h-3 text-[#8A9088] group-hover:text-[#506B58] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedNode.type === 'document' && (
              <button
                onClick={() => onOpenDocument(selectedNode.id)}
                className="w-full py-2 bg-[#506B58] text-white text-xs font-medium rounded hover:bg-[#3F5445] transition-colors"
              >
                Read Document Folio
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
