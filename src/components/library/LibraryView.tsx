import React, { useState } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink,
  Download,
  FolderOpen,
  Plus,
  Tag,
  Check,
  Edit2,
  Calendar,
} from 'lucide-react';
import { DocumentMetadata, Collection } from '../../types';
import { api } from '../../lib/api';

interface LibraryViewProps {
  documents: DocumentMetadata[];
  collections: Collection[];
  selectedCollectionId: string;
  onSelectCollection: (colId: string) => void;
  onOpenDocumentReader: (docId: string) => void;
  onOpenUploadModal: () => void;
  onRefreshLibrary: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  documents,
  collections,
  selectedCollectionId,
  onSelectCollection,
  onOpenDocumentReader,
  onOpenUploadModal,
  onRefreshLibrary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    // Collection filter
    if (selectedCollectionId !== 'all' && doc.collectionId !== selectedCollectionId) {
      return false;
    }
    // File type filter
    if (selectedFileType !== 'all' && doc.fileType !== selectedFileType) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchFilename = doc.filename.toLowerCase().includes(q);
      const matchTags = doc.tags?.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchFilename || matchTags;
    }
    return true;
  });

  const handleDelete = async (docId: string) => {
    try {
      await api.deleteDocument(docId);
      setDeleteConfirmId(null);
      onRefreshLibrary();
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  };

  const handleReindex = async (docId: string) => {
    try {
      await api.reindexDocument(docId);
      onRefreshLibrary();
    } catch (e) {
      console.error('Failed to reindex document:', e);
    }
  };

  const handleSaveTitle = async (docId: string) => {
    if (!editTitle.trim()) return;
    try {
      await api.updateDocument(docId, { title: editTitle.trim() });
      setEditingDocId(null);
      onRefreshLibrary();
    } catch (e) {
      console.error('Failed to update title:', e);
    }
  };

  const handleMoveCollection = async (docId: string, newColId: string) => {
    try {
      await api.updateDocument(docId, { collectionId: newColId });
      onRefreshLibrary();
    } catch (e) {
      console.error('Failed to move collection:', e);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    window.location.href = `/api/export?format=${format}`;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-[#F6F4EE] overflow-y-auto">
      {/* Top Toolbar */}
      <div className="p-6 pb-4 bg-[#FFFEFA] border-b border-[#E5E2D9]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-2xl font-semibold text-[#222822]">
              Research Library
            </h2>
            <p className="text-xs text-[#575D56] mt-0.5">
              {filteredDocs.length} document(s) indexed for semantic retrieval and grounded inquiry
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#575D56] hover:text-[#222822] bg-[#F6F4EE] border border-[#E5E2D9] rounded transition-colors"
              title="Export Library Metadata as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#575D56] hover:text-[#222822] bg-[#F6F4EE] border border-[#E5E2D9] rounded transition-colors"
              title="Export Library Metadata as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#506B58] hover:bg-[#3F5445] rounded-md transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#EFECE4]">
          <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#8A9088] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, filename, or tag..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F6F4EE] border border-[#E5E2D9] rounded-md text-[#222822] placeholder-[#8A9088] focus:outline-none focus:border-[#506B58]"
              />
            </div>

            {/* Collection Filter */}
            <select
              value={selectedCollectionId}
              onChange={e => onSelectCollection(e.target.value)}
              className="text-xs bg-[#F6F4EE] border border-[#E5E2D9] rounded-md px-2.5 py-1.5 text-[#222822] focus:outline-none focus:border-[#506B58]"
            >
              <option value="all">All Collections</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* File Type Filter */}
            <select
              value={selectedFileType}
              onChange={e => setSelectedFileType(e.target.value)}
              className="text-xs bg-[#F6F4EE] border border-[#E5E2D9] rounded-md px-2.5 py-1.5 text-[#222822] focus:outline-none focus:border-[#506B58]"
            >
              <option value="all">All File Types</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word (.docx)</option>
              <option value="txt">Text (.txt)</option>
              <option value="md">Markdown (.md)</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#F6F4EE] border border-[#E5E2D9] rounded-md">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-[#FFFEFA] text-[#222822] shadow-2xs' : 'text-[#8A9088] hover:text-[#222822]'}`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[#FFFEFA] text-[#222822] shadow-2xs' : 'text-[#8A9088] hover:text-[#222822]'}`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl max-w-lg mx-auto space-y-3">
            <FileText className="w-10 h-10 text-[#8A9088] mx-auto opacity-40" />
            <h3 className="font-editorial text-lg font-medium text-[#222822]">
              No Documents Found
            </h3>
            <p className="text-xs text-[#575D56] leading-relaxed">
              {searchQuery
                ? 'No documents match your active search terms or filters.'
                : 'Your library has no indexed documents. Upload a document or load sample research papers to begin.'}
            </p>
            <button
              onClick={onOpenUploadModal}
              className="mt-2 px-4 py-2 text-xs font-medium text-white bg-[#506B58] hover:bg-[#3F5445] rounded-md transition-colors"
            >
              Upload Document
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl divide-y divide-[#EFECE4] shadow-2xs overflow-hidden">
            {filteredDocs.map(doc => {
              const col = collections.find(c => c.id === doc.collectionId);
              return (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-[#FDFCF7] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded bg-[#E8ECE9] text-[#506B58] flex items-center justify-center shrink-0 mt-0.5 border border-[#506B58]/15 font-mono font-bold text-[11px] uppercase">
                      {doc.fileType}
                    </div>

                    <div className="min-w-0 flex-1">
                      {editingDocId === doc.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="text-sm font-medium px-2 py-1 border border-[#506B58] rounded bg-[#FFFEFA] text-[#222822] focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveTitle(doc.id)}
                            className="p-1 text-[#506B58] hover:bg-[#E8ECE9] rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4
                            onClick={() => onOpenDocumentReader(doc.id)}
                            className="text-sm font-semibold text-[#222822] hover:text-[#506B58] cursor-pointer transition-colors truncate"
                          >
                            {doc.title}
                          </h4>
                          <button
                            onClick={() => { setEditingDocId(doc.id); setEditTitle(doc.title); }}
                            className="text-[#8A9088] hover:text-[#222822] transition-colors p-0.5"
                            title="Rename Title"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Clean Unboxed Metadata */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#575D56] font-mono">
                        <span className="text-[#8A9088]">{doc.filename}</span>
                        <span>·</span>
                        <span>{doc.chunkCount} chunks</span>
                        <span>·</span>
                        <span>{Math.round(doc.charCount / 1000)}k chars</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[#506B58]">
                          <FolderOpen className="w-3 h-3 shrink-0" />
                          <select
                            value={doc.collectionId}
                            onChange={e => handleMoveCollection(doc.id, e.target.value)}
                            className="bg-transparent hover:bg-[#EFECE4] border border-transparent hover:border-[#D8D4C8] rounded px-1 text-[11px] font-mono text-[#506B58] cursor-pointer focus:outline-none"
                            title="Move to another collection"
                          >
                            {collections.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </span>
                      </div>

                      {/* Tags */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-[#8A9088]">
                          {doc.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="bg-[#F6F4EE] px-1.5 py-0.5 rounded border border-[#E5E2D9]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenDocumentReader(doc.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#222822] bg-[#EFECE4] hover:bg-[#E5E2D9] border border-[#D8D4C8] rounded transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Read Context</span>
                    </button>

                    <button
                      onClick={() => handleReindex(doc.id)}
                      className="p-1.5 text-[#575D56] hover:text-[#222822] hover:bg-[#F6F4EE] rounded transition-colors"
                      title="Re-segment and re-embed chunks"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmId === doc.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 border border-red-200 rounded text-xs">
                        <span className="text-red-700 text-[10px] px-1">Confirm?</span>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 text-[10px]"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded text-[10px]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(doc.id)}
                        className="p-1.5 text-[#8A9088] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Document & Chunks"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className="p-5 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono text-[10px] font-bold uppercase bg-[#E8ECE9] text-[#506B58] px-1.5 py-0.5 rounded border border-[#506B58]/20">
                      {doc.fileType}
                    </span>
                    <span className="text-[#8A9088] font-mono text-[10px]">
                      {doc.chunkCount} chunks
                    </span>
                  </div>

                  <h4
                    onClick={() => onOpenDocumentReader(doc.id)}
                    className="font-editorial text-base font-semibold text-[#222822] hover:text-[#506B58] cursor-pointer transition-colors line-clamp-2 leading-snug"
                  >
                    {doc.title}
                  </h4>
                  <p className="mt-1 text-xs text-[#8A9088] truncate font-mono">
                    {doc.filename}
                  </p>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {doc.tags.map((t, i) => (
                        <span key={i} className="text-[10px] text-[#575D56] bg-[#F6F4EE] px-1.5 py-0.5 rounded border border-[#E5E2D9]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-[#EFECE4] flex items-center justify-between">
                  <span className="text-[11px] text-[#8A9088] font-mono">
                    {Math.round(doc.charCount / 1000)}k chars
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenDocumentReader(doc.id)}
                      className="px-2.5 py-1 text-xs font-medium text-[#222822] bg-[#EFECE4] hover:bg-[#E5E2D9] rounded transition-colors"
                    >
                      Read
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1 text-[#8A9088] hover:text-red-600 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
