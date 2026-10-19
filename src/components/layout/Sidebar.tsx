import React from 'react';
import {
  Compass,
  Library,
  GitGraph,
  FileText,
  Columns2,
  History,
  Activity,
  FolderOpen,
  FolderPlus,
  Settings as SettingsIcon,
} from 'lucide-react';
import { ViewTab, Collection } from '../../types';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  collections: Collection[];
  selectedCollectionId: string;
  onSelectCollection: (colId: string) => void;
  onCreateCollectionClick: () => void;
  onOpenSettings: () => void;
  documentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCreateCollectionClick,
  onOpenSettings,
  documentCount,
}) => {
  const navItems: Array<{
    id: ViewTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'desk', label: 'Research Desk', icon: Compass },
    { id: 'library', label: 'My Library', icon: Library, count: documentCount },
    { id: 'constellation', label: 'Knowledge Map', icon: GitGraph },
    { id: 'briefs', label: 'Research Briefs', icon: FileText },
    { id: 'compare', label: 'Cross-Comparison', icon: Columns2 },
    { id: 'history', label: 'Activity & History', icon: History },
    { id: 'observatory', label: 'Observatory', icon: Activity },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between border-r border-[#E5E2D9] bg-[#FFFEFA] h-[calc(100vh-53px)] overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Workspace Tools */}
        <div>
          <div className="text-[11px] font-mono tracking-wider uppercase text-[#8A9088] px-2.5 mb-2">
            Workspace
          </div>
          <nav className="space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-[#E8ECE9] text-[#222822] font-semibold'
                      : 'text-[#575D56] hover:bg-[#F6F4EE] hover:text-[#222822]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#506B58]' : 'text-[#8A9088]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[11px] font-mono text-[#8A9088] tabular-nums">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Collections */}
        <div>
          <div className="flex items-center justify-between px-2.5 mb-2">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#8A9088]">
              Collections
            </span>
            <button
              onClick={onCreateCollectionClick}
              className="text-[#8A9088] hover:text-[#506B58] transition-colors p-0.5"
              title="Create Collection"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => onSelectCollection('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                selectedCollectionId === 'all'
                  ? 'bg-[#F7EFE3] text-[#222822] font-medium'
                  : 'text-[#575D56] hover:bg-[#F6F4EE]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FolderOpen className="w-3.5 h-3.5 text-[#C69A57]" />
                <span className="truncate">All Collections</span>
              </div>
              <span className="text-[10px] font-mono text-[#8A9088] tabular-nums">
                {documentCount}
              </span>
            </button>

            {collections.map(col => {
              const isSelected = selectedCollectionId === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => onSelectCollection(col.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isSelected
                      ? 'bg-[#F7EFE3] text-[#222822] font-medium'
                      : 'text-[#575D56] hover:bg-[#F6F4EE]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: col.color || '#506B58' }}
                    />
                    <span className="truncate">{col.name}</span>
                  </div>
                  {col.documentCount !== undefined && (
                    <span className="text-[10px] font-mono text-[#8A9088] tabular-nums">
                      {col.documentCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Settings & Status Ribbon */}
      <div className="p-3 border-t border-[#E5E2D9] bg-[#FDFCF7]">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#575D56] hover:text-[#222822] hover:bg-[#F6F4EE] rounded transition-colors"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-[#8A9088]" />
          <span>System Settings</span>
        </button>
        <div className="mt-2 px-2.5 text-[11px] text-[#8A9088] flex items-center justify-between font-mono">
          <span>KNOWLEDGE OS v1.0</span>
          <span>Indexed</span>
        </div>
      </div>
    </aside>
  );
};
