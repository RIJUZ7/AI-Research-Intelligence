import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  AlertCircle,
  FileQuestion,
  Layers,
  ArrowRight,
  Clock,
  BookOpen,
} from 'lucide-react';
import {
  ResearchAnswer,
  Citation,
  Collection,
  DocumentMetadata,
  ResearchSession,
} from '../../types';
import { api } from '../../lib/api';

interface ResearchDeskProps {
  collections: Collection[];
  documents: DocumentMetadata[];
  selectedCollectionId: string;
  onSelectCollection: (colId: string) => void;
  onSelectCitation: (citation: Citation) => void;
  onSaveAnswerToBrief: (answer: ResearchAnswer) => void;
  onOpenUploadModal: () => void;
  onSeedSampleData: () => void;
  activeSessionId?: string;
  onOpenDocumentReader: (docId: string) => void;
}

export const ResearchDesk: React.FC<ResearchDeskProps> = ({
  collections,
  documents,
  selectedCollectionId,
  onSelectCollection,
  onSelectCitation,
  onSaveAnswerToBrief,
  onOpenUploadModal,
  onSeedSampleData,
  activeSessionId,
  onOpenDocumentReader,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedBriefId, setSavedBriefId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'What are the core arguments regarding dense vector embeddings versus BM25?',
    'How does boundary-aware semantic chunking optimize context windows?',
    'Why is citation verification necessary in high-stakes information retrieval?',
    'What limitations and empirical trade-offs do the authors acknowledge?',
  ];

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, loading]);

  // Load active session if specified
  useEffect(() => {
    if (activeSessionId) {
      api.getSession(activeSessionId).then(sess => {
        setActiveSession(sess);
      }).catch(console.error);
    }
  }, [activeSessionId]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || loading) return;

    setError(null);
    setLoading(true);
    setQuestion('');

    const sessId = activeSession?.id || `sess_${Date.now()}`;

    // Optimistically show user message
    const tempUserMsg = {
      id: `u_${Date.now()}`,
      role: 'user' as const,
      content: q,
      timestamp: new Date().toISOString(),
    };

    setActiveSession(prev => ({
      id: sessId,
      title: prev?.title || q.slice(0, 45) + (q.length > 45 ? '...' : ''),
      collectionId: selectedCollectionId,
      messages: prev ? [...prev.messages, tempUserMsg] : [tempUserMsg],
      createdAt: prev?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    try {
      const answer = await api.askQuestion({
        question: q,
        collectionId: selectedCollectionId === 'all' ? undefined : selectedCollectionId,
        sessionId: sessId,
      });

      const assistantMsg = {
        id: `a_${Date.now()}`,
        role: 'assistant' as const,
        content: answer.answer,
        timestamp: new Date().toISOString(),
        answerDetails: answer,
      };

      setActiveSession(prev => ({
        id: sessId,
        title: prev?.title || q.slice(0, 45),
        collectionId: selectedCollectionId,
        messages: prev ? [...prev.messages.slice(0, -1), tempUserMsg, assistantMsg] : [tempUserMsg, assistantMsg],
        createdAt: prev?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    } catch (err: any) {
      setError(err.message || 'An error occurred while answering your research question.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleCopyAnswer = (answerText: string, id: string) => {
    navigator.clipboard.writeText(answerText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToBrief = async (ans: ResearchAnswer) => {
    try {
      await api.saveBrief({
        title: `Research Note: ${ans.question.slice(0, 50)}`,
        format: 'research_notes',
        summary: ans.answer.slice(0, 180) + '...',
        content: ans.answer,
        keyFindings: ans.citations.map(c => `${c.documentTitle}: ${c.excerpt}`),
        citations: ans.citations,
        sourceDocumentIds: Array.from(new Set(ans.citations.map(c => c.documentId))),
        limitations: ans.hasInsufficientEvidence ? ['Retrieved passages contained partial evidence gaps.'] : [],
      });
      setSavedBriefId(ans.id);
      setTimeout(() => setSavedBriefId(null), 2500);
    } catch (e) {
      console.error('Failed to save to brief:', e);
    }
  };

  // Helper to render text with interactive inline citations [1], [2] or unverified tags
  const renderTextWithCitations = (text: string, citations: Citation[]) => {
    const parts = text.split(/(\[\d+\]|\[Unverified Source:\s*\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const index = parseInt(match[1], 10);
        const citation = citations.find(c => c.index === index);
        return (
          <button
            key={i}
            onClick={() => citation && onSelectCitation(citation)}
            className={`inline-flex items-center justify-center font-mono text-[11px] font-semibold px-1 py-0.2 mx-0.5 rounded transition-colors align-baseline ${
              citation?.isValidated === false
                ? 'text-[#C69A57] bg-[#F7EFE3] hover:bg-[#EFE5D3] border border-[#C69A57]/40'
                : 'text-[#506B58] hover:text-[#222822] bg-[#E8ECE9] hover:bg-[#D5DDD7]'
            }`}
            title={
              citation
                ? `Source: ${citation.documentTitle} (Click to inspect provenance)${citation.isValidated === false ? ' [Partial Lexical Overlap]' : ''}`
                : `Citation [${index}]`
            }
            aria-label={`Citation ${index}: ${citation?.documentTitle || 'Source document'}`}
          >
            [{index}]
          </button>
        );
      }
      const unverifiedMatch = part.match(/^\[Unverified Source:\s*(\d+)\]$/);
      if (unverifiedMatch) {
        return (
          <span
            key={i}
            className="inline-flex items-center justify-center font-mono text-[10px] font-semibold text-[#B91C1C] bg-[#FEE2E2] px-1.5 py-0.5 mx-0.5 rounded align-baseline"
            title="Referenced passage index is outside the retrieved document evidence"
          >
            [Unverified Source: {unverifiedMatch[1]}]
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-[#F6F4EE] overflow-hidden">
      {/* Scope Ribbon */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#FFFEFA] border-b border-[#E5E2D9] text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#8A9088] uppercase tracking-wider text-[11px]">
            Scope:
          </span>
          <select
            value={selectedCollectionId}
            onChange={e => onSelectCollection(e.target.value)}
            className="bg-[#F6F4EE] border border-[#E5E2D9] rounded px-2.5 py-1 text-xs text-[#222822] focus:outline-none focus:border-[#506B58]"
          >
            <option value="all">Entire Library ({documents.length} docs)</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.documentCount || 0} docs)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#575D56] font-mono">
          <span>Grounded Retrieval</span>
          <span>·</span>
          <span>Citation Verified</span>
        </div>
      </div>

      {/* Main Conversation Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Welcome State when no questions yet */}
          {(!activeSession || activeSession.messages.length === 0) && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Editorial Intro Card */}
              <div className="p-8 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#506B58] mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Digital Reading Room</span>
                </div>
                <h1 className="font-editorial text-3xl font-medium text-[#222822] tracking-tight">
                  Turn documents into understanding.
                </h1>
                <p className="mt-3 text-sm text-[#575D56] leading-relaxed max-w-2xl">
                  KNOWLEDGE OS transforms your research folios, papers, and specifications into an
                  explainable, queryable knowledge space. Every answer is grounded in retrieved
                  passages with verifiable numbered citations.
                </p>

                {/* Quick Actions if library is empty */}
                {documents.length === 0 ? (
                  <div className="mt-6 pt-6 border-t border-[#EFECE4] flex flex-wrap items-center gap-4">
                    <button
                      onClick={onOpenUploadModal}
                      className="px-4 py-2 text-xs font-medium text-white bg-[#506B58] hover:bg-[#3F5445] rounded-md transition-colors shadow-2xs"
                    >
                      Upload Documents
                    </button>
                    <button
                      onClick={onSeedSampleData}
                      className="px-4 py-2 text-xs font-medium text-[#222822] bg-[#EFECE4] hover:bg-[#E5E2D9] border border-[#D8D4C8] rounded-md transition-colors"
                    >
                      Load Sample Research Papers
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-[#EFECE4] flex items-center justify-between text-xs text-[#575D56]">
                    <span>
                      Currently searching across <strong className="text-[#222822]">{documents.length}</strong> indexed document(s).
                    </span>
                    <button
                      onClick={() => onOpenDocumentReader(documents[0].id)}
                      className="hover:text-[#222822] text-[#506B58] font-medium flex items-center gap-1"
                    >
                      Browse Library Documents <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sample Questions Prompt Strip */}
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-[#8A9088] px-1">
                  Suggested Explorations
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {sampleQuestions.map((qText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(qText)}
                      className="text-left p-3.5 bg-[#FFFEFA] hover:bg-[#F9F7F1] border border-[#E5E2D9] rounded-lg text-xs text-[#222822] transition-colors leading-relaxed group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span>"{qText}"</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8A9088] group-hover:text-[#506B58] shrink-0 mt-0.5 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          {activeSession &&
            activeSession.messages.map(msg => (
              <div key={msg.id} className="space-y-3">
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-2xl px-5 py-3.5 bg-[#222822] text-[#FFFEFA] rounded-xl text-sm leading-relaxed shadow-2xs font-sans">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl shadow-2xs space-y-4">
                    {/* Editorial Answer Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4] text-xs">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-[#506B58]" />
                        <span className="font-mono text-[#575D56] uppercase tracking-wider text-[11px]">
                          Grounded Synthesis
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#8A9088] font-mono">
                        {msg.answerDetails && (
                          <>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {msg.answerDetails.retrievalLatencyMs + msg.answerDetails.generationLatencyMs}ms
                            </span>
                            <span>·</span>
                            <span>{msg.answerDetails.retrievedChunksCount} passages cited</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Insufficient Evidence Warning Banner */}
                    {msg.answerDetails?.hasInsufficientEvidence && (
                      <div className="p-3 bg-[#F7EFE3] border border-[#C69A57]/30 rounded-lg flex items-start gap-2.5 text-xs text-[#78350F]">
                        <AlertCircle className="w-4 h-4 text-[#C69A57] mt-0.5 shrink-0" />
                        <div>
                          <strong className="font-semibold">Informational Gap:</strong> The retrieved document passages do not contain exhaustive empirical evidence for this inquiry. In accordance with citation rules, inferences beyond the source text are identified.
                        </div>
                      </div>
                    )}

                    {/* Answer Prose with Clickable Citations */}
                    <div className="text-sm text-[#222822] leading-relaxed font-serif whitespace-pre-wrap">
                      {msg.answerDetails
                        ? renderTextWithCitations(msg.content, msg.answerDetails.citations)
                        : msg.content}
                    </div>

                    {/* Cited Source Strip */}
                    {msg.answerDetails && msg.answerDetails.citations.length > 0 && (
                      <div className="pt-4 border-t border-[#EFECE4] space-y-2">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A9088]">
                          Referenced Passages (Click to Inspect)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.answerDetails.citations.map(cit => (
                            <button
                              key={cit.index}
                              onClick={() => onSelectCitation(cit)}
                              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#F9F7F1] hover:bg-[#EFECE4] border border-[#E5E2D9] rounded transition-colors text-left"
                            >
                              <span className="font-mono font-semibold text-[#506B58] text-[10px]">
                                [{cit.index}]
                              </span>
                              <span className="text-[#222822] truncate max-w-[200px]">
                                {cit.documentTitle}
                              </span>
                              {cit.page && (
                                <span className="text-[10px] text-[#8A9088] font-mono">
                                  p.{cit.page}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="pt-3 flex items-center justify-between border-t border-[#EFECE4] text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyAnswer(msg.content, msg.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#575D56] hover:text-[#222822] hover:bg-[#F6F4EE] rounded transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#506B58]" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Answer</span>
                            </>
                          )}
                        </button>

                        {msg.answerDetails && (
                          <button
                            onClick={() => handleSaveToBrief(msg.answerDetails!)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#575D56] hover:text-[#222822] hover:bg-[#F6F4EE] rounded transition-colors"
                          >
                            {savedBriefId === msg.answerDetails.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#506B58]" />
                                <span>Saved to Briefs</span>
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="w-3.5 h-3.5" />
                                <span>Save as Brief Note</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-[#8A9088]">
                        Model: {msg.answerDetails?.modelUsed || 'Gemini'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-6 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl shadow-2xs space-y-3 animate-pulse">
              <div className="flex items-center gap-2 text-xs font-mono text-[#506B58]">
                <Layers className="w-4 h-4 animate-spin" />
                <span>Searching vector indices & verifying citations...</span>
              </div>
              <div className="h-4 bg-[#E8ECE9] rounded w-3/4" />
              <div className="h-4 bg-[#E8ECE9] rounded w-5/6" />
              <div className="h-4 bg-[#E8ECE9] rounded w-1/2" />
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <strong>Inquiry Error:</strong> {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Persistent Research Input Dock */}
      <div className="p-4 bg-[#FFFEFA] border-t border-[#E5E2D9]">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              documents.length === 0
                ? 'Upload documents or seed sample papers above to begin asking questions...'
                : 'Pose an inquiry across your research library (e.g., "Compare the chunking methods used...")...'
            }
            rows={2}
            className="w-full pl-4 pr-24 py-3 bg-[#F6F4EE] border border-[#E5E2D9] rounded-lg text-sm text-[#222822] placeholder-[#8A9088] resize-none focus:outline-none focus:border-[#506B58] focus:bg-[#FFFEFA] transition-colors leading-relaxed"
          />

          <div className="absolute right-2.5 bottom-3.5 flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-mono text-[#8A9088]">
              ↵ to submit
            </span>
            <button
              onClick={() => handleAsk()}
              disabled={!question.trim() || loading}
              className="p-2 rounded-md bg-[#506B58] text-white hover:bg-[#3F5445] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Submit Inquiry"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
