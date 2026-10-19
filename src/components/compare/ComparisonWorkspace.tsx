import React, { useState } from 'react';
import {
  Columns2,
  CheckCircle2,
  GitCompare,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { DocumentMetadata, ComparisonResult, Citation } from '../../types';
import { api } from '../../lib/api';

interface ComparisonWorkspaceProps {
  documents: DocumentMetadata[];
  onSelectCitation: (citation: Citation) => void;
}

export const ComparisonWorkspace: React.FC<ComparisonWorkspaceProps> = ({
  documents,
  onSelectCitation,
}) => {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(
    documents.slice(0, 2).map(d => d.id)
  );
  const [focusArea, setFocusArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRunComparison = async () => {
    if (selectedDocIds.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.compareDocuments(selectedDocIds, focusArea);
      setComparison(result);
    } catch (err: any) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-[#F6F4EE] overflow-y-auto">
      {/* Top Header */}
      <div className="p-6 bg-[#FFFEFA] border-b border-[#E5E2D9]">
        <div className="max-w-4xl mx-auto space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#506B58] mb-1">
              <Columns2 className="w-3.5 h-3.5" />
              <span>Comparative Epistemology</span>
            </div>
            <h2 className="font-editorial text-2xl font-semibold text-[#222822]">
              Cross-Document Comparison Workspace
            </h2>
            <p className="text-xs text-[#575D56] mt-1 leading-relaxed">
              Synthesize concordances, empirical divergences, methodological assumptions, and evidentiary gaps across two or more research documents.
            </p>
          </div>

          {/* Document Selectors Strip */}
          <div className="pt-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A9088] mb-2">
              Select 2+ Documents to Contrast:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {documents.map(doc => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleDocSelection(doc.id)}
                    className={`p-3 text-left rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-[#E8ECE9] border-[#506B58] text-[#222822] shadow-2xs'
                        : 'bg-[#FFFEFA] border-[#E5E2D9] text-[#575D56] hover:bg-[#F9F7F1]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${isSelected ? 'border-[#506B58] bg-[#506B58] text-white' : 'border-[#D8D4C8]'}`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{doc.title}</div>
                        <div className="text-[10px] text-[#8A9088] font-mono mt-0.5">
                          {doc.chunkCount} chunks · {doc.fileType.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <input
              type="text"
              value={focusArea}
              onChange={e => setFocusArea(e.target.value)}
              placeholder="Optional focus: e.g., 'Compare empirical benchmarks and retrieval latency'"
              className="flex-1 min-w-[280px] bg-[#F6F4EE] border border-[#E5E2D9] rounded px-3 py-1.5 text-xs text-[#222822] placeholder-[#8A9088] focus:outline-none focus:border-[#506B58]"
            />
            <button
              onClick={handleRunComparison}
              disabled={selectedDocIds.length < 2 || loading}
              className="px-4 py-2 text-xs font-medium text-white bg-[#506B58] hover:bg-[#3F5445] rounded-md transition-colors disabled:opacity-40 shadow-2xs whitespace-nowrap"
            >
              {loading ? 'Synthesizing...' : 'Run Comparative Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Results Canvas */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl space-y-3">
              <Sparkles className="w-7 h-7 text-[#506B58] animate-spin mx-auto" />
              <h3 className="font-editorial text-base font-medium">Extracting Claims and Contrasting Grounding...</h3>
              <p className="text-xs text-[#575D56] font-mono">
                Cross-referencing passages across {selectedDocIds.length} source folios...
              </p>
            </div>
          ) : comparison ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Synthesis Summary */}
              <div className="p-6 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl shadow-2xs space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#506B58] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Executive Comparative Synthesis</span>
                </div>
                <h3 className="font-editorial text-xl font-medium text-[#222822]">
                  {comparison.title}
                </h3>
                <p className="text-sm font-serif leading-relaxed text-[#222822]">
                  {comparison.synthesis}
                </p>
              </div>

              {/* Concordances / Agreements */}
              <div className="p-6 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#506B58] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Areas of Concordance & Consensus</span>
                </div>
                <div className="divide-y divide-[#EFECE4] space-y-3">
                  {comparison.agreements.map((item, idx) => (
                    <div key={idx} className="pt-3 first:pt-0">
                      <p className="text-sm font-serif leading-relaxed text-[#222822]">
                        {item.claim}
                      </p>
                      {item.citations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.citations.map(c => (
                            <button
                              key={c.index}
                              onClick={() => onSelectCitation(c)}
                              className="px-2 py-0.5 bg-[#F9F7F1] hover:bg-[#EFECE4] border border-[#E5E2D9] rounded text-[11px] font-mono text-[#506B58]"
                            >
                              [{c.index}] {c.documentTitle}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Divergences / Disagreements */}
              <div className="p-6 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C69A57] font-bold">
                  <GitCompare className="w-4 h-4" />
                  <span>Divergences & Contrasting Findings</span>
                </div>
                <div className="divide-y divide-[#EFECE4] space-y-3">
                  {comparison.divergences.map((item, idx) => (
                    <div key={idx} className="pt-3 first:pt-0 space-y-1">
                      <div className="font-semibold text-xs text-[#222822]">
                        Topic: {item.topic}
                      </div>
                      <p className="text-sm font-serif leading-relaxed text-[#575D56]">
                        {item.contrast}
                      </p>
                      {item.citations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.citations.map(c => (
                            <button
                              key={c.index}
                              onClick={() => onSelectCitation(c)}
                              className="px-2 py-0.5 bg-[#F9F7F1] hover:bg-[#EFECE4] border border-[#E5E2D9] rounded text-[11px] font-mono text-[#506B58]"
                            >
                              [{c.index}] {c.documentTitle}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Gaps */}
              <div className="p-5 bg-[#FDFCF7] border border-[#E5E2D9] rounded-xl space-y-2 text-xs">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A9088] font-bold">
                  Unanswered Questions & Evidentiary Gaps
                </div>
                <ul className="list-disc list-inside space-y-1 text-[#575D56] font-serif">
                  {comparison.evidenceGaps.map((gap, gIdx) => (
                    <li key={gIdx}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl space-y-3">
              <Columns2 className="w-8 h-8 text-[#8A9088] opacity-50 mx-auto" />
              <h3 className="font-editorial text-base font-medium text-[#222822]">
                Select Documents to Begin Comparison
              </h3>
              <p className="text-xs text-[#575D56] max-w-md mx-auto leading-relaxed">
                Choose at least two research papers or folios from the selectors above and click "Run Comparative Analysis" to uncover structural convergences and methodological divides.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
