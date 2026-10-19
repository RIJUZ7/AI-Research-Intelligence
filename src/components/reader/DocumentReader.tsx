import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2,
} from 'lucide-react';
import { DocumentWithChunks } from '../../types';
import { api } from '../../lib/api';

interface DocumentReaderProps {
  documentId: string;
  initialChunkId?: string;
  onBack: () => void;
  onAskAboutDocument: (docId: string, docTitle: string) => void;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  documentId,
  initialChunkId,
  onBack,
  onAskAboutDocument,
}) => {
  const [doc, setDoc] = useState<DocumentWithChunks | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInDoc, setSearchInDoc] = useState('');
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);
  const [viewFormat, setViewFormat] = useState<'continuous' | 'chunked'>('continuous');

  const chunkRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    setLoading(true);
    api.getDocument(documentId)
      .then(data => {
        setDoc(data);
        if (initialChunkId && data.chunks) {
          const idx = data.chunks.findIndex(c => c.id === initialChunkId);
          if (idx !== -1) {
            setActiveChunkIndex(idx);
            setTimeout(() => {
              const el = chunkRefs.current.get(initialChunkId);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [documentId, initialChunkId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F6F4EE] h-[calc(100vh-53px)]">
        <div className="text-center space-y-2">
          <FileText className="w-8 h-8 text-[#506B58] animate-pulse mx-auto" />
          <p className="text-xs font-mono text-[#575D56]">Loading document folios...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 p-8 text-center bg-[#F6F4EE]">
        <p className="text-sm text-[#575D56]">Document could not be located.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 text-xs bg-[#EFECE4] rounded">
          Return to Library
        </button>
      </div>
    );
  }

  // Highlight matches helper
  const renderHighlightedContent = (text: string) => {
    if (!searchInDoc.trim()) return text;
    const parts = text.split(new RegExp(`(${searchInDoc})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchInDoc.toLowerCase() ? (
        <mark key={i} className="bg-[#C69A57]/30 text-[#222822] px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-[#F6F4EE] overflow-hidden">
      {/* Reader Navigation Header */}
      <div className="px-6 py-3 bg-[#FFFEFA] border-b border-[#E5E2D9] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 text-[#575D56] hover:text-[#222822] hover:bg-[#F6F4EE] rounded transition-colors"
            title="Return to Library"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#222822] truncate">
              {doc.title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-[#8A9088] font-mono">
              <span className="uppercase">{doc.fileType}</span>
              <span>·</span>
              <span>{doc.chunkCount} indexed passages</span>
              <span>·</span>
              <span>{Math.round(doc.charCount / 1000)}k characters</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* In-document Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8A9088] absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchInDoc}
              onChange={e => setSearchInDoc(e.target.value)}
              placeholder="Find in document..."
              className="pl-8 pr-3 py-1 text-xs bg-[#F6F4EE] border border-[#E5E2D9] rounded-md text-[#222822] placeholder-[#8A9088] focus:outline-none focus:border-[#506B58] w-48"
            />
          </div>

          {/* View Format Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-[#F6F4EE] border border-[#E5E2D9] rounded text-[11px] font-mono">
            <button
              onClick={() => setViewFormat('continuous')}
              className={`px-2 py-0.5 rounded ${viewFormat === 'continuous' ? 'bg-[#FFFEFA] font-bold text-[#222822] shadow-2xs' : 'text-[#8A9088]'}`}
            >
              Continuous
            </button>
            <button
              onClick={() => setViewFormat('chunked')}
              className={`px-2 py-0.5 rounded ${viewFormat === 'chunked' ? 'bg-[#FFFEFA] font-bold text-[#222822] shadow-2xs' : 'text-[#8A9088]'}`}
            >
              Passages
            </button>
          </div>

          <button
            onClick={() => onAskAboutDocument(doc.id, doc.title)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#506B58] hover:bg-[#3F5445] rounded-md transition-colors shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask In Desk</span>
          </button>
        </div>
      </div>

      {/* Reader Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl p-8 lg:p-12 shadow-2xs space-y-6">
          {/* Editorial Title Banner */}
          <div className="pb-6 border-b border-[#EFECE4]">
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#8A9088] mb-2">
              Archival Reading Folio
            </div>
            <h1 className="font-editorial text-2xl lg:text-3xl font-medium text-[#222822] leading-tight">
              {doc.title}
            </h1>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#575D56] font-mono">
              <span>Source File: {doc.filename}</span>
              <span>·</span>
              <span>Ingested: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Document Content */}
          {viewFormat === 'continuous' ? (
            <div className="space-y-6 text-[#222822] font-serif text-sm lg:text-base leading-relaxed">
              {doc.chunks.map((chunk, idx) => {
                const isInitialCited = chunk.id === initialChunkId;
                return (
                  <div
                    key={chunk.id}
                    ref={el => { if (el) chunkRefs.current.set(chunk.id, el); }}
                    className={`relative p-3 rounded-lg transition-colors ${
                      isInitialCited
                        ? 'bg-[#E8ECE9] border border-[#506B58]/30 shadow-2xs'
                        : 'hover:bg-[#FDFCF7]'
                    }`}
                  >
                    {isInitialCited && (
                      <div className="text-[10px] font-mono font-semibold text-[#506B58] uppercase mb-1">
                        Highlighted Source Passage
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">
                      {renderHighlightedContent(chunk.content)}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-[#8A9088] flex items-center justify-between">
                      <span>Passage #{idx + 1} {chunk.page ? `· Page ${chunk.page}` : ''}</span>
                      <span>~{chunk.tokenEstimate} tokens</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Chunked Passage View */
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 text-xs font-mono text-[#8A9088] border-b border-[#EFECE4]">
                <span>
                  Viewing passage {activeChunkIndex + 1} of {doc.chunks.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveChunkIndex(prev => Math.max(0, prev - 1))}
                    disabled={activeChunkIndex === 0}
                    className="p-1 rounded hover:bg-[#F6F4EE] disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveChunkIndex(prev => Math.min(doc.chunks.length - 1, prev + 1))}
                    disabled={activeChunkIndex === doc.chunks.length - 1}
                    className="p-1 rounded hover:bg-[#F6F4EE] disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {doc.chunks[activeChunkIndex] && (
                <div className="p-6 bg-[#F9F7F1] border border-[#E5E2D9] rounded-lg space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[#506B58]">
                    <span>Chunk ID: {doc.chunks[activeChunkIndex].id}</span>
                    <span>Tokens: ~{doc.chunks[activeChunkIndex].tokenEstimate}</span>
                  </div>
                  <p className="font-serif text-sm leading-relaxed text-[#222822] whitespace-pre-wrap">
                    {renderHighlightedContent(doc.chunks[activeChunkIndex].content)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
