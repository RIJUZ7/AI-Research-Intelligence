import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Collection, DocumentMetadata } from '../../types';
import { api } from '../../lib/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onUploadSuccess: (doc: DocumentMetadata) => void;
}

type Stage = 'idle' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'ready' | 'failed' | 'duplicate_warning';

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  collections,
  onUploadSuccess,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [collectionId, setCollectionId] = useState<string>(collections[0]?.id || 'col_general');
  const [tagsInput, setTagsInput] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateDoc, setDuplicateDoc] = useState<DocumentMetadata | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    // Validate format
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'txt', 'md', 'markdown', 'csv', 'json', 'docx'];
    if (!ext || !validExts.includes(ext)) {
      setErrorMessage(`Unsupported format .${ext}. Please upload PDF, DOCX, TXT, Markdown, CSV, or JSON.`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 20MB limit.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  };

  const startUpload = async (forceDuplicate = false) => {
    if (!selectedFile) return;

    setStage('extracting');
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Content = (reader.result as string).split(',')[1];

        // Simulate stages for clear progress transparency
        setTimeout(() => setStage('chunking'), 400);
        setTimeout(() => setStage('embedding'), 800);
        setTimeout(() => setStage('indexing'), 1400);

        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        const response = await api.uploadDocument({
          filename: selectedFile.name,
          base64Content,
          collectionId,
          tags,
          force: forceDuplicate,
        });

        setStage('ready');
        setTimeout(() => {
          onUploadSuccess(response.document);
          handleClose();
        }, 800);
      } catch (err: any) {
        if (err.isDuplicate) {
          setStage('duplicate_warning');
          setDuplicateDoc(err.existingDocument);
        } else {
          setStage('failed');
          setErrorMessage(err.message || 'Processing failed');
        }
      }
    };

    reader.onerror = () => {
      setStage('failed');
      setErrorMessage('Failed to read file from disk.');
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setStage('idle');
    setErrorMessage(null);
    setDuplicateDoc(null);
    setTagsInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#222822]/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2D9]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#506B58]" />
            <h3 className="font-editorial text-lg font-medium text-[#222822]">
              Ingest Document into Library
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-[#8A9088] hover:text-[#222822] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Duplicate Document Warning State */}
          {stage === 'duplicate_warning' && duplicateDoc && (
            <div className="p-4 bg-[#F7EFE3] border border-[#C69A57]/30 rounded-lg space-y-3 text-xs text-[#78350F]">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#C69A57] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Duplicate Document Detected</h4>
                  <p className="mt-1">
                    An identical document is already indexed: <strong>"{duplicateDoc.title}"</strong> ({duplicateDoc.chunkCount} chunks).
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#C69A57]/20">
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 bg-[#FFFEFA] border border-[#E5E2D9] rounded text-[#222822] hover:bg-[#F6F4EE]"
                >
                  Skip Duplicate
                </button>
                <button
                  onClick={() => startUpload(true)}
                  className="px-3 py-1.5 bg-[#C69A57] text-white rounded hover:bg-[#A87E3E]"
                >
                  Import Another Copy
                </button>
              </div>
            </div>
          )}

          {/* Staged Processing Progress */}
          {['extracting', 'chunking', 'embedding', 'indexing', 'ready'].includes(stage) && (
            <div className="p-5 bg-[#F9F7F1] border border-[#E5E2D9] rounded-lg space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#575D56] uppercase tracking-wider">
                  Ingestion Pipeline
                </span>
                <span className="text-[#506B58] font-semibold capitalize">{stage}...</span>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                <div className={`p-2 rounded border ${stage === 'extracting' ? 'bg-[#E8ECE9] border-[#506B58] text-[#506B58] font-bold' : 'border-[#E5E2D9] text-[#8A9088]'}`}>
                  1. Extract Text
                </div>
                <div className={`p-2 rounded border ${stage === 'chunking' ? 'bg-[#E8ECE9] border-[#506B58] text-[#506B58] font-bold' : 'border-[#E5E2D9] text-[#8A9088]'}`}>
                  2. Chunk Text
                </div>
                <div className={`p-2 rounded border ${stage === 'embedding' ? 'bg-[#E8ECE9] border-[#506B58] text-[#506B58] font-bold' : 'border-[#E5E2D9] text-[#8A9088]'}`}>
                  3. Embeddings
                </div>
                <div className={`p-2 rounded border ${['indexing', 'ready'].includes(stage) ? 'bg-[#E8ECE9] border-[#506B58] text-[#506B58] font-bold' : 'border-[#E5E2D9] text-[#8A9088]'}`}>
                  4. Index
                </div>
              </div>

              {stage === 'ready' && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#506B58] font-medium pt-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Document successfully indexed into retrieval store!</span>
                </div>
              )}
            </div>
          )}

          {/* Upload Drop Area */}
          {stage === 'idle' && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-[#506B58] bg-[#E8ECE9]' : 'border-[#D8D4C8] hover:border-[#506B58] bg-[#FDFCF7]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.markdown,.csv,.json,.docx"
                  onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#E8ECE9] flex items-center justify-center text-[#506B58]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-[#222822]">
                    {selectedFile ? selectedFile.name : 'Choose a file or drag & drop here'}
                  </div>
                  <p className="text-xs text-[#8A9088]">
                    Supports PDF, DOCX, TXT, Markdown, CSV, or JSON (up to 20MB)
                  </p>
                </div>
              </div>

              {/* Ingestion Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#575D56] font-medium mb-1 font-mono uppercase text-[10px]">
                    Target Collection
                  </label>
                  <select
                    value={collectionId}
                    onChange={e => setCollectionId(e.target.value)}
                    className="w-full bg-[#F6F4EE] border border-[#E5E2D9] rounded px-3 py-2 text-[#222822] focus:outline-none focus:border-[#506B58]"
                  >
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#575D56] font-medium mb-1 font-mono uppercase text-[10px]">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="rag, embeddings, benchmarks"
                    className="w-full bg-[#F6F4EE] border border-[#E5E2D9] rounded px-3 py-2 text-[#222822] focus:outline-none focus:border-[#506B58]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FDFCF7] border-t border-[#E5E2D9] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-[#575D56] hover:text-[#222822] rounded transition-colors"
          >
            Cancel
          </button>
          {stage === 'idle' && (
            <button
              onClick={() => startUpload(false)}
              disabled={!selectedFile}
              className="px-4 py-2 text-xs font-medium text-white bg-[#506B58] hover:bg-[#3F5445] rounded-md transition-colors disabled:opacity-40 shadow-2xs"
            >
              Start Ingestion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
