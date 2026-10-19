import React, { useState, useEffect } from 'react';
import { ViewTab, Collection, DocumentMetadata, Citation, ResearchAnswer } from './types';
import { api } from './lib/api';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { SourceInspector } from './components/research/SourceInspector';

import { ResearchDesk } from './components/research/ResearchDesk';
import { LibraryView } from './components/library/LibraryView';
import { DocumentReader } from './components/reader/DocumentReader';
import { KnowledgeConstellation } from './components/graph/KnowledgeConstellation';
import { ComparisonWorkspace } from './components/compare/ComparisonWorkspace';
import { ResearchBriefsView } from './components/briefs/ResearchBriefsView';
import { ActivityHistoryView } from './components/history/ActivityHistoryView';
import { ObservatoryView } from './components/observatory/ObservatoryView';
import { UploadModal } from './components/library/UploadModal';
import { SettingsModal } from './components/settings/SettingsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('desk');
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all');
  
  // Contextual Right Panel: Active Citation
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Document Reader Target
  const [readingDocId, setReadingDocId] = useState<string | null>(null);
  const [readingInitialChunkId, setReadingInitialChunkId] = useState<string | undefined>(undefined);

  // Active Session in Desk
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      const [docs, cols] = await Promise.all([
        api.getDocuments(),
        api.getCollections(),
      ]);
      setDocuments(docs);
      setCollections(cols);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReader = (docId: string, chunkId?: string) => {
    setReadingDocId(docId);
    setReadingInitialChunkId(chunkId);
    setCurrentTab('reader');
  };

  const handleAskAboutDocument = (docId: string, docTitle: string) => {
    setCurrentTab('desk');
    // Clear active citation panel
    setActiveCitation(null);
  };

  const handleResumeSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setCurrentTab('desk');
  };

  const handleSeedSample = async () => {
    try {
      showToast('Seeding sample research papers...');
      await api.seedSampleData();
      await loadData();
      showToast('Sample papers indexed successfully.');
    } catch (e: any) {
      showToast(e.message || 'Failed to seed sample papers');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F4EE] text-[#222822]">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab !== 'reader') setReadingDocId(null);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        documentCount={documents.length}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => {
            setCurrentTab(tab);
            if (tab !== 'reader') setReadingDocId(null);
          }}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={setSelectedCollectionId}
          onCreateCollectionClick={() => setIsSettingsModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          documentCount={documents.length}
        />

        {/* Central Workspace Switcher */}
        <main className="flex-1 flex overflow-hidden relative">
          {currentTab === 'desk' && (
            <ResearchDesk
              collections={collections}
              documents={documents}
              selectedCollectionId={selectedCollectionId}
              onSelectCollection={setSelectedCollectionId}
              onSelectCitation={cit => setActiveCitation(cit)}
              onSaveAnswerToBrief={() => setCurrentTab('briefs')}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              onSeedSampleData={handleSeedSample}
              activeSessionId={activeSessionId}
              onOpenDocumentReader={handleOpenReader}
            />
          )}

          {currentTab === 'library' && (
            <LibraryView
              documents={documents}
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              onSelectCollection={setSelectedCollectionId}
              onOpenDocumentReader={handleOpenReader}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              onRefreshLibrary={loadData}
            />
          )}

          {currentTab === 'reader' && (
            <DocumentReader
              documentId={readingDocId || documents[0]?.id || ''}
              initialChunkId={readingInitialChunkId}
              onBack={() => {
                setReadingDocId(null);
                setCurrentTab('library');
              }}
              onAskAboutDocument={handleAskAboutDocument}
            />
          )}

          {currentTab === 'constellation' && (
            <KnowledgeConstellation
              collections={collections}
              onOpenDocument={handleOpenReader}
            />
          )}

          {currentTab === 'briefs' && (
            <ResearchBriefsView
              collections={collections}
              documents={documents}
              onSelectCitation={cit => setActiveCitation(cit)}
            />
          )}

          {currentTab === 'compare' && (
            <ComparisonWorkspace
              documents={documents}
              onSelectCitation={cit => setActiveCitation(cit)}
            />
          )}

          {currentTab === 'history' && (
            <ActivityHistoryView onResumeSession={handleResumeSession} />
          )}

          {currentTab === 'observatory' && <ObservatoryView />}

          {/* Contextual Right Panel: Source Inspector */}
          {activeCitation && (
            <SourceInspector
              citation={activeCitation}
              onClose={() => setActiveCitation(null)}
              onOpenDocumentReader={(docId, chunkId) => {
                handleOpenReader(docId, chunkId);
                setActiveCitation(null);
              }}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab !== 'reader') setReadingDocId(null);
        }}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onSeedSampleData={handleSeedSample}
        documents={documents}
        onOpenDocumentReader={handleOpenReader}
      />

      {/* Upload Document Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        collections={collections}
        onUploadSuccess={doc => {
          loadData();
          showToast(`"${doc.title}" indexed successfully.`);
        }}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        collections={collections}
        onRefreshData={loadData}
        onSeedSampleData={handleSeedSample}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 bg-[#222822] text-[#FFFEFA] text-xs font-mono rounded-lg shadow-lg border border-[#3E453E] animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
