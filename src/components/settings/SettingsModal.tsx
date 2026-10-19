import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Trash2,
  Sparkles,
  Database,
  Shield,
  Layers,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { Collection } from '../../types';
import { api } from '../../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onRefreshData: () => void;
  onSeedSampleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  collections,
  onRefreshData,
  onSeedSampleData,
}) => {
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColColor, setNewColColor] = useState('#506B58');
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (!isOpen) return null;

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      await api.createCollection(newColName.trim(), newColDesc.trim(), newColColor);
      setNewColName('');
      setNewColDesc('');
      onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await api.deleteCollection(id);
      onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await api.clearAllData();
      setConfirmClear(false);
      onRefreshData();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#222822]/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2D9]">
          <h3 className="font-editorial text-lg font-medium text-[#222822]">
            System & Storage Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[#8A9088] hover:text-[#222822] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Collections Management */}
          <div className="space-y-3">
            <h4 className="font-mono uppercase font-bold text-[#8A9088] text-[11px]">
              Collection Taxonomy
            </h4>

            {/* List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {collections.map(col => (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-2.5 bg-[#F9F7F1] border border-[#E5E2D9] rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color || '#506B58' }}
                    />
                    <span className="font-medium text-[#222822]">{col.name}</span>
                    <span className="text-[10px] text-[#8A9088] font-mono">
                      ({col.documentCount || 0} docs)
                    </span>
                  </div>
                  {col.id !== 'col_general' && (
                    <button
                      onClick={() => handleDeleteCollection(col.id)}
                      className="text-[#8A9088] hover:text-red-600 p-1"
                      title="Delete collection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Create Collection Form */}
            <form onSubmit={handleCreateCollection} className="p-3 bg-[#FDFCF7] border border-[#E5E2D9] rounded-lg space-y-2">
              <div className="text-[10px] font-mono uppercase text-[#575D56] font-semibold">
                Add New Collection
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                  placeholder="Collection Name..."
                  className="flex-1 px-2.5 py-1 text-xs bg-[#FFFEFA] border border-[#E5E2D9] rounded focus:outline-none focus:border-[#506B58]"
                />
                <input
                  type="color"
                  value={newColColor}
                  onChange={e => setNewColColor(e.target.value)}
                  className="w-8 h-7 p-0.5 rounded border border-[#E5E2D9] cursor-pointer"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#506B58] text-white rounded text-xs font-medium hover:bg-[#3F5445]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>

          {/* Demonstration Mode & Reset */}
          <div className="pt-4 border-t border-[#EFECE4] space-y-3">
            <h4 className="font-mono uppercase font-bold text-[#8A9088] text-[11px]">
              Library Management & Seed Data
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => { onSeedSampleData(); onClose(); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#EFECE4] hover:bg-[#E5E2D9] border border-[#D8D4C8] rounded text-xs text-[#222822] font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C69A57]" />
                <span>Re-seed Sample Research Papers</span>
              </button>

              {confirmClear ? (
                <div className="flex items-center gap-2 p-1 bg-red-50 border border-red-200 rounded">
                  <span className="text-red-700 text-[10px] px-1 font-semibold">
                    Delete entire index?
                  </span>
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    className="px-2 py-1 bg-red-600 text-white rounded text-[10px]"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1 bg-white border border-gray-300 text-gray-700 rounded text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Library Data</span>
                </button>
              )}
            </div>
          </div>

          {/* Privacy & Trust Safeguards */}
          <div className="p-4 bg-[#F9F7F1] border border-[#E5E2D9] rounded-lg space-y-2 text-[#575D56]">
            <div className="flex items-center gap-2 font-mono uppercase text-[#506B58] text-[10px] font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Grounded Privacy & Security Protocol</span>
            </div>
            <p className="text-[11px] font-serif leading-relaxed">
              Uploaded folios are parsed entirely through server-side boundaries. No documents are executed as code or exposed to external third-party scrapers. System prompts explicitly treat document text as untrusted reference data, preventing prompt-injection attacks.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FDFCF7] border-t border-[#E5E2D9] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#506B58] text-white rounded text-xs font-medium hover:bg-[#3F5445]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
