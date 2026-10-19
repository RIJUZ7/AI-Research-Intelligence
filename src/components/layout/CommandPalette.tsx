import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Compass,
  Library,
  GitGraph,
  FileText,
  Columns2,
  History,
  Activity,
  Plus,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { ViewTab, DocumentMetadata } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ViewTab) => void;
  onOpenUploadModal: () => void;
  onSeedSampleData: () => void;
  documents: DocumentMetadata[];
  onOpenDocumentReader: (docId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenUploadModal,
  onSeedSampleData,
  documents,
  onOpenDocumentReader,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Go to Research Desk', tab: 'desk' as ViewTab, icon: Compass },
    { label: 'Browse My Library', tab: 'library' as ViewTab, icon: Library },
    { label: 'Explore Knowledge Map', tab: 'constellation' as ViewTab, icon: GitGraph },
    { label: 'Draft Research Briefs', tab: 'briefs' as ViewTab, icon: FileText },
    { label: 'Compare Documents', tab: 'compare' as ViewTab, icon: Columns2 },
    { label: 'Activity & Session History', tab: 'history' as ViewTab, icon: History },
    { label: 'Model Observatory & Diagnostics', tab: 'observatory' as ViewTab, icon: Activity },
  ];

  const matchedDocs = documents.filter(d =>
    query ? d.title.toLowerCase().includes(query.toLowerCase()) || d.filename.toLowerCase().includes(query.toLowerCase()) : false
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-[#222822]/40 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-xl bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E5E2D9] gap-3">
          <Search className="w-4 h-4 text-[#8A9088]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search research folios..."
            className="flex-1 bg-transparent text-sm text-[#222822] placeholder-[#8A9088] focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#8A9088] bg-[#F6F4EE] border border-[#E5E2D9] rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A9088] px-3 py-1">
              Quick Actions
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => { onOpenUploadModal(); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#222822] hover:bg-[#F6F4EE] rounded-md transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-3.5 h-3.5 text-[#506B58]" />
                  <span>Upload & Ingest Document</span>
                </div>
                <span className="text-[10px] font-mono text-[#8A9088]">Action</span>
              </button>

              <button
                onClick={() => { onSeedSampleData(); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#222822] hover:bg-[#F6F4EE] rounded-md transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C69A57]" />
                  <span>Load Sample Research Library</span>
                </div>
                <span className="text-[10px] font-mono text-[#8A9088]">Demo</span>
              </button>
            </div>
          </div>

          {/* Matched Documents if query is present */}
          {matchedDocs.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A9088] px-3 py-1">
                Library Documents
              </div>
              <div className="space-y-0.5">
                {matchedDocs.slice(0, 4).map(d => (
                  <button
                    key={d.id}
                    onClick={() => { onOpenDocumentReader(d.id); onClose(); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#222822] hover:bg-[#F6F4EE] rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <BookOpen className="w-3.5 h-3.5 text-[#506B58] shrink-0" />
                      <span className="truncate">{d.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8A9088] uppercase shrink-0">
                      {d.fileType}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workspace Navigation */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A9088] px-3 py-1">
              Navigation
            </div>
            <div className="space-y-0.5">
              {quickNav.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    onClick={() => { onSelectTab(item.tab); onClose(); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#222822] hover:bg-[#F6F4EE] rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-[#8A9088]" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#8A9088]" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
