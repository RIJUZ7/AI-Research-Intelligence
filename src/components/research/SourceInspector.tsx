import React from 'react';
import { X, ExternalLink, Copy, Check, FileText } from 'lucide-react';
import { Citation } from '../../types';

interface SourceInspectorProps {
  citation: Citation | null;
  onClose: () => void;
  onOpenDocumentReader: (documentId: string, chunkId?: string) => void;
}

export const SourceInspector: React.FC<SourceInspectorProps> = ({
  citation,
  onClose,
  onOpenDocumentReader,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.excerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-80 lg:w-96 shrink-0 border-l border-[#E5E2D9] bg-[#FFFEFA] h-full flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right-4 duration-200">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E2D9]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-semibold bg-[#E8ECE9] text-[#506B58] border border-[#506B58]/20">
              [{citation.index}]
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#575D56]">
              Source Provenance
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A9088] hover:text-[#222822] hover:bg-[#F6F4EE] rounded transition-colors"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Document Metadata */}
        <div className="mt-4 p-3 bg-[#F9F7F1] border border-[#E5E2D9] rounded-lg">
          <div className="flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-[#506B58] mt-0.5 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-[#222822] leading-snug line-clamp-2">
                {citation.documentTitle}
              </h4>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-[#8A9088] font-mono">
                {citation.page ? <span>Page {citation.page}</span> : <span>Passage Index</span>}
                <span>·</span>
                <span>Score: {Math.round(citation.score * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Evidence Passage */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8A9088]">
              Supporting Passage
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-[#575D56] hover:text-[#222822] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#506B58]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 bg-[#FFFEFA] border border-[#E5E2D9] rounded-lg text-xs leading-relaxed text-[#222822] font-serif shadow-2xs">
            <p className="italic text-[#575D56] mb-1 text-[11px] font-sans">
              Extracted from indexed document chunk:
            </p>
            "{citation.excerpt}"
          </div>

          <div className="mt-4 space-y-2 text-[11px] text-[#575D56]">
            <div className="flex items-center justify-between py-1 border-b border-[#EFECE4]">
              <span className="text-[#8A9088]">Validation Status</span>
              <span className="font-medium text-[#506B58]">
                {citation.isValidated ? 'Verified Grounded Passage' : 'Synthesized Attribution'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#EFECE4]">
              <span className="text-[#8A9088]">Chunk Identifier</span>
              <span className="font-mono text-[#222822] text-[10px] truncate max-w-[160px]">
                {citation.chunkId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-[#E5E2D9] bg-[#FDFCF7]">
        <button
          onClick={() => onOpenDocumentReader(citation.documentId, citation.chunkId)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#222822] bg-[#EFECE4] hover:bg-[#E5E2D9] border border-[#D8D4C8] rounded-md transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Full Context in Reader</span>
        </button>
      </div>
    </div>
  );
};
