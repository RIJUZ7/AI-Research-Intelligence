import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Download,
  Copy,
  Check,
  Trash2,
  Edit3,
  Bookmark,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { ResearchBrief, Collection, DocumentMetadata, Citation } from '../../types';
import { api } from '../../lib/api';

interface ResearchBriefsViewProps {
  collections: Collection[];
  documents: DocumentMetadata[];
  onSelectCitation: (citation: Citation) => void;
}

export const ResearchBriefsView: React.FC<ResearchBriefsViewProps> = ({
  collections,
  documents,
  onSelectCitation,
}) => {
  const [briefs, setBriefs] = useState<ResearchBrief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<ResearchBrief | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Brief Generation Form
  const [newFormat, setNewFormat] = useState<ResearchBrief['format']>('literature_review');
  const [newTitle, setNewTitle] = useState('');
  const [newFocus, setNewFocus] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('all');

  // Edit Buffer
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');

  const fetchBriefs = () => {
    api.getBriefs().then(data => {
      setBriefs(data);
      if (data.length > 0 && !selectedBrief) {
        setSelectedBrief(data[0]);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchBriefs();
  }, []);

  useEffect(() => {
    if (selectedBrief) {
      setEditTitle(selectedBrief.title);
      setEditContent(selectedBrief.content);
      setEditSummary(selectedBrief.summary);
      setIsEditing(false);
    }
  }, [selectedBrief]);

  const handleGenerateBrief = async () => {
    setIsGenerating(true);
    try {
      const generated = await api.generateBrief({
        title: newTitle.trim() || undefined,
        format: newFormat,
        collectionId: selectedCollectionId === 'all' ? undefined : selectedCollectionId,
        researchFocus: newFocus.trim() || undefined,
      });
      setBriefs(prev => [generated, ...prev]);
      setSelectedBrief(generated);
      setNewTitle('');
      setNewFocus('');
    } catch (e) {
      console.error('Failed to generate brief:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedBrief) return;
    try {
      const updated = await api.saveBrief({
        ...selectedBrief,
        title: editTitle,
        content: editContent,
        summary: editSummary,
      });
      setSelectedBrief(updated);
      setBriefs(prev => prev.map(b => (b.id === updated.id ? updated : b)));
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save brief:', e);
    }
  };

  const handleDeleteBrief = async (id: string) => {
    try {
      await api.deleteBrief(id);
      setBriefs(prev => prev.filter(b => b.id !== id));
      if (selectedBrief?.id === id) {
        setSelectedBrief(briefs.find(b => b.id !== id) || null);
      }
    } catch (e) {
      console.error('Failed to delete brief:', e);
    }
  };

  const handleCopyMarkdown = () => {
    if (!selectedBrief) return;
    const md = `# ${selectedBrief.title}\n\n**Format:** ${selectedBrief.format}\n**Date:** ${new Date(selectedBrief.createdAt).toLocaleDateString()}\n\n## Executive Summary\n${selectedBrief.summary}\n\n## Key Findings\n${selectedBrief.keyFindings.map(f => `- ${f}`).join('\n')}\n\n## Synthesized Brief\n${selectedBrief.content}\n\n## Limitations & Evidence Gaps\n${selectedBrief.limitations.map(l => `- ${l}`).join('\n')}\n`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    if (!selectedBrief) return;
    const blob = new Blob([JSON.stringify(selectedBrief, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBrief.title.toLowerCase().replace(/\W+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-53px)] bg-[#F6F4EE] overflow-hidden">
      {/* Left List of Briefs */}
      <div className="w-80 border-r border-[#E5E2D9] bg-[#FFFEFA] flex flex-col justify-between overflow-y-auto shrink-0">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#506B58]" />
              <h3 className="font-editorial text-base font-semibold text-[#222822]">
                Research Briefs
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#8A9088]">
              {briefs.length} saved
            </span>
          </div>

          {/* New Brief Generator Trigger Accordion */}
          <div className="p-3.5 bg-[#F9F7F1] border border-[#E5E2D9] rounded-lg space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-[#506B58] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate New Brief</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[#8A9088] font-mono text-[10px] mb-1">
                  Format
                </label>
                <select
                  value={newFormat}
                  onChange={e => setNewFormat(e.target.value as any)}
                  className="w-full bg-[#FFFEFA] border border-[#E5E2D9] rounded px-2 py-1 text-xs"
                >
                  <option value="literature_review">Literature Review</option>
                  <option value="executive_summary">Executive Summary</option>
                  <option value="comparative_analysis">Comparative Analysis</option>
                  <option value="research_notes">Research Field Notes</option>
                  <option value="evidence_table">Evidence Matrix</option>
                  <option value="qa_report">Q&A Findings Report</option>
                  <option value="study_guide">Study Curriculum</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8A9088] font-mono text-[10px] mb-1">
                  Research Focus (Optional)
                </label>
                <input
                  type="text"
                  value={newFocus}
                  onChange={e => setNewFocus(e.target.value)}
                  placeholder="e.g. Vector embeddings and BM25"
                  className="w-full bg-[#FFFEFA] border border-[#E5E2D9] rounded px-2 py-1 text-xs"
                />
              </div>

              <button
                onClick={handleGenerateBrief}
                disabled={isGenerating}
                className="w-full mt-2 py-1.5 bg-[#506B58] text-white rounded text-xs font-medium hover:bg-[#3F5445] transition-colors disabled:opacity-40"
              >
                {isGenerating ? 'Synthesizing Brief...' : 'Generate Grounded Brief'}
              </button>
            </div>
          </div>

          {/* Saved Briefs List */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A9088]">
              Saved Documents
            </div>
            {briefs.map(b => {
              const isSelected = selectedBrief?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBrief(b)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-colors relative group ${
                    isSelected
                      ? 'bg-[#E8ECE9] border-[#506B58] shadow-2xs'
                      : 'bg-[#FFFEFA] border-[#E5E2D9] hover:bg-[#FDFCF7]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8A9088] mb-1">
                    <span>{b.format.replace('_', ' ')}</span>
                    <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#222822] line-clamp-2">
                    {b.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-[#575D56] line-clamp-2 font-serif">
                    {b.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Canvas: Brief Display & In-App Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedBrief ? (
          <div className="max-w-3xl mx-auto bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl p-8 lg:p-12 shadow-2xs space-y-6">
            {/* Brief Action Header */}
            <div className="flex flex-wrap items-center justify-between pb-6 border-b border-[#EFECE4] gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#506B58]">
                  {selectedBrief.format.replace('_', ' ')}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="text-xl font-editorial font-medium w-full border-b border-[#506B58] pb-1 mt-1 focus:outline-none"
                  />
                ) : (
                  <h1 className="font-editorial text-2xl lg:text-3xl font-medium text-[#222822] mt-1">
                    {selectedBrief.title}
                  </h1>
                )}
                <div className="mt-2 text-xs font-mono text-[#8A9088]">
                  Created {new Date(selectedBrief.createdAt).toLocaleString()} · {selectedBrief.citations.length} cited sources
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <button
                    onClick={handleSaveEdits}
                    className="px-3 py-1.5 bg-[#506B58] text-white text-xs font-medium rounded hover:bg-[#3F5445]"
                  >
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#EFECE4] hover:bg-[#E5E2D9] rounded text-[#222822]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}

                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#EFECE4] hover:bg-[#E5E2D9] rounded text-[#222822]"
                  title="Copy as Markdown"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#506B58]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Markdown'}</span>
                </button>

                <button
                  onClick={handleExportJSON}
                  className="p-1.5 text-[#575D56] hover:text-[#222822] rounded hover:bg-[#F6F4EE]"
                  title="Export JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteBrief(selectedBrief.id)}
                  className="p-1.5 text-[#8A9088] hover:text-red-600 rounded hover:bg-red-50"
                  title="Delete Brief"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-4 bg-[#F9F7F1] border border-[#E5E2D9] rounded-lg">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A9088] mb-1 font-bold">
                Synopsis
              </h3>
              {isEditing ? (
                <textarea
                  value={editSummary}
                  onChange={e => setEditSummary(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-serif text-[#222822] bg-[#FFFEFA] border border-[#E5E2D9] p-2 rounded focus:outline-none"
                />
              ) : (
                <p className="text-sm font-serif leading-relaxed text-[#222822]">
                  {selectedBrief.summary}
                </p>
              )}
            </div>

            {/* Key Findings */}
            {selectedBrief.keyFindings && selectedBrief.keyFindings.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#506B58] font-bold">
                  Core Assertions & Key Findings
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm font-serif text-[#222822]">
                  {selectedBrief.keyFindings.map((finding, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Body Content */}
            <div className="pt-4 border-t border-[#EFECE4] space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A9088] font-bold">
                Analytical Folio
              </h3>
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={12}
                  className="w-full text-sm font-serif text-[#222822] bg-[#FFFEFA] border border-[#E5E2D9] p-4 rounded-lg focus:outline-none"
                />
              ) : (
                <div className="text-sm font-serif leading-relaxed text-[#222822] whitespace-pre-wrap">
                  {selectedBrief.content}
                </div>
              )}
            </div>

            {/* Citations List */}
            {selectedBrief.citations && selectedBrief.citations.length > 0 && (
              <div className="pt-6 border-t border-[#EFECE4] space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A9088] font-bold">
                  Document Provenance
                </h3>
                <div className="space-y-2">
                  {selectedBrief.citations.map(cit => (
                    <div
                      key={cit.index}
                      onClick={() => onSelectCitation(cit)}
                      className="p-3 bg-[#FDFCF7] border border-[#E5E2D9] rounded-lg text-xs hover:bg-[#F9F7F1] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#506B58] mb-1">
                        <span className="font-bold">[{cit.index}] {cit.documentTitle}</span>
                        {cit.page && <span>p. {cit.page}</span>}
                      </div>
                      <p className="font-serif italic text-[#575D56] line-clamp-2">
                        "{cit.excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Gaps & Limitations */}
            {selectedBrief.limitations && selectedBrief.limitations.length > 0 && (
              <div className="p-4 bg-[#FDFCF7] border border-[#E5E2D9] rounded-lg space-y-1.5 text-xs text-[#78350F]">
                <h4 className="font-mono uppercase font-bold text-[10px] tracking-wider text-[#8A9088]">
                  Known Limitations & Gaps
                </h4>
                <ul className="list-disc list-inside space-y-1 font-serif">
                  {selectedBrief.limitations.map((lim, lIdx) => (
                    <li key={lIdx}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center p-12 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl space-y-3">
            <FileText className="w-8 h-8 text-[#8A9088] mx-auto opacity-40" />
            <h3 className="font-editorial text-lg font-medium text-[#222822]">
              No Research Brief Selected
            </h3>
            <p className="text-xs text-[#575D56]">
              Generate a literature review or executive summary using the form on the left, or select a previously saved brief.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
