import React, { useState } from 'react';
import { Search, Plus, Menu, X, Compass, Library, GitGraph, FileText, Columns2, Activity } from 'lucide-react';
import { ViewTab } from '../../types';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenCommandPalette: () => void;
  onOpenUploadModal: () => void;
  documentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenCommandPalette,
  onOpenUploadModal,
  documentCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'desk', label: 'Research Desk', icon: Compass },
    { id: 'library', label: `My Library (${documentCount})`, icon: Library },
    { id: 'constellation', label: 'Knowledge Map', icon: GitGraph },
    { id: 'briefs', label: 'Research Briefs', icon: FileText },
    { id: 'compare', label: 'Cross-Comparison', icon: Columns2 },
    { id: 'observatory', label: 'Observatory', icon: Activity },
  ];

  const handleSelectMobile = (tab: ViewTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFEFA]/95 backdrop-blur-sm border-b border-[#E5E2D9]">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('desk')}
            className="flex items-center gap-2.5 text-left group focus-visible:ring-2 focus-visible:ring-[#506B58] rounded"
          >
            <img
              src="/src/assets/images/research_atlas_emblem_1792310574911.jpg"
              alt="Knowledge OS Emblem"
              className="w-7 h-7 rounded-full object-cover border border-[#E5E2D9] shadow-2xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-editorial text-lg font-semibold tracking-tight text-[#222822] whitespace-nowrap">
                KNOWLEDGE OS
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Primary Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#575D56]">
          <button
            onClick={() => onSelectTab('desk')}
            className={`whitespace-nowrap transition-colors hover:text-[#222822] ${
              currentTab === 'desk' ? 'text-[#222822] font-semibold border-b-2 border-[#506B58] pb-0.5' : ''
            }`}
          >
            Research Desk
          </button>
          <button
            onClick={() => onSelectTab('library')}
            className={`whitespace-nowrap transition-colors hover:text-[#222822] ${
              currentTab === 'library' ? 'text-[#222822] font-semibold border-b-2 border-[#506B58] pb-0.5' : ''
            }`}
          >
            My Library {documentCount > 0 && <span className="text-xs text-[#8A9088] ml-1">({documentCount})</span>}
          </button>
          <button
            onClick={() => onSelectTab('constellation')}
            className={`whitespace-nowrap transition-colors hover:text-[#222822] ${
              currentTab === 'constellation' ? 'text-[#222822] font-semibold border-b-2 border-[#506B58] pb-0.5' : ''
            }`}
          >
            Knowledge Map
          </button>
          <button
            onClick={() => onSelectTab('briefs')}
            className={`whitespace-nowrap transition-colors hover:text-[#222822] ${
              currentTab === 'briefs' ? 'text-[#222822] font-semibold border-b-2 border-[#506B58] pb-0.5' : ''
            }`}
          >
            Research Briefs
          </button>
          <button
            onClick={() => onSelectTab('compare')}
            className={`whitespace-nowrap transition-colors hover:text-[#222822] ${
              currentTab === 'compare' ? 'text-[#222822] font-semibold border-b-2 border-[#506B58] pb-0.5' : ''
            }`}
          >
            Cross-Comparison
          </button>
          <button
            onClick={() => onSelectTab('observatory')}
            className={`whitespace-nowrap transition-colors hover:text-[#222822] ${
              currentTab === 'observatory' ? 'text-[#222822] font-semibold border-b-2 border-[#506B58] pb-0.5' : ''
            }`}
          >
            Observatory
          </button>
        </nav>

        {/* Zone 3: Actions (Search/Command palette trigger + Upload + Mobile Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs text-[#575D56] bg-[#F6F4EE] hover:bg-[#EFECE4] border border-[#E5E2D9] rounded-md transition-colors whitespace-nowrap"
            title="Open Command Palette (⌘K or Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#8A9088]" />
            <span className="hidden sm:inline">Search & Ask</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#8A9088] bg-[#FFFEFA] border border-[#E5E2D9] rounded">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#506B58] hover:bg-[#3F5445] rounded-md transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="lg:hidden p-1.5 text-[#575D56] hover:text-[#222822] hover:bg-[#F6F4EE] rounded transition-colors"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E2D9] bg-[#FFFEFA] px-4 py-3 space-y-1 animate-in fade-in slide-in-from-top-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectMobile(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[#E8ECE9] text-[#222822] font-semibold'
                    : 'text-[#575D56] hover:bg-[#F6F4EE]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#506B58]' : 'text-[#8A9088]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
