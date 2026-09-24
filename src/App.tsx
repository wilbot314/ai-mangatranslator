/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ComicCanvasViewer } from './components/ComicCanvasViewer';
import { BubbleEditor } from './components/BubbleEditor';
import { ExportModal } from './components/ExportModal';
import { SamplesModal } from './components/SamplesModal';
import { PageThumbnailStrip } from './components/PageThumbnailStrip';
import { TextBlock, ComicFontFamily, ComicPageItem } from './types/comic';
import { SamplePanelInfo, samplePanels } from './utils/samplePanels';
import { optimizeImageForAnalysis } from './utils/imageOptimizer';
import { downloadPagesAsZip } from './utils/zipExporter';
import { AlertCircle, X, Sparkles, RefreshCw, RotateCcw } from 'lucide-react';

export default function App() {
  // Multi-page state
  const [pages, setPages] = useState<ComicPageItem[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [currentImageElement, setCurrentImageElement] = useState<HTMLImageElement | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);

  // Translation configuration - default to verbatim as-is as requested
  const [sourceLang, setSourceLang] = useState<string>('Korean');
  const [targetLang, setTargetLang] = useState<string>('English');
  const [tone, setTone] = useState<string>('verbatim as-is comic dialogue');

  // Styling
  const [globalFontFamily, setGlobalFontFamily] = useState<ComicFontFamily>('Comic Neue');
  const [globalUppercase, setGlobalUppercase] = useState<boolean>(true);

  // Status & Progress
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSamplesModalOpen, setIsSamplesModalOpen] = useState<boolean>(false);

  // Active page shortcut
  const currentPage = pages[currentPageIndex] || null;

  // Load image element whenever active page changes
  useEffect(() => {
    if (!currentPage) {
      setCurrentImageElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setCurrentImageElement(img);
    };
    img.src = currentPage.originalDataUrl;
  }, [currentPage?.id, currentPage?.originalDataUrl]);

  // Translate a single comic page by ID
  const translatePage = useCallback(
    async (pageId: string, srcLang = sourceLang, tgtLang = targetLang, requestedTone = tone) => {
      // Find page in current state
      const targetPage = pages.find((p) => p.id === pageId);
      if (!targetPage) return;

      // Mark page as translating
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, status: 'translating', errorMessage: undefined } : p
        )
      );

      try {
        // Optimize payload for fast transfer and high OCR accuracy
        const analysisPayload = await optimizeImageForAnalysis(targetPage.originalDataUrl, 1800);

        const response = await fetch('/api/translate-comic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: analysisPayload,
            sourceLang: srcLang,
            targetLang: tgtLang,
            tone: requestedTone,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to translate comic page.');
        }

        const detectedBlocks: TextBlock[] = data.blocks || [];

        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  blocks: detectedBlocks,
                  pageSummary: data.page_summary || '',
                  status: 'completed',
                  errorMessage: undefined,
                }
              : p
          )
        );

        if (detectedBlocks.length > 0) {
          setSelectedBlockId(detectedBlocks[0].id);
        }
      } catch (err: any) {
        console.error('Translation error for page', pageId, err);
        const errStr = err.message || 'Error communicating with translation server.';
        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  status: 'error',
                  errorMessage: errStr,
                }
              : p
          )
        );
        setErrorMessage(errStr);
      }
    },
    [pages, sourceLang, targetLang, tone]
  );

  // Sequential batch translation for all pending pages
  const isBatchRunning = useRef(false);

  const translateAllPending = useCallback(async () => {
    if (isBatchRunning.current) return;
    isBatchRunning.current = true;
    setIsProcessing(true);
    setErrorMessage(null);

    const pendingPages = pages.filter((p) => p.status === 'pending' || p.status === 'error');
    const total = pendingPages.length;

    for (let i = 0; i < total; i++) {
      const page = pendingPages[i];
      setBatchProgress({ current: i + 1, total });

      try {
        // Update status to translating
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id ? { ...p, status: 'translating', errorMessage: undefined } : p
          )
        );

        const analysisPayload = await optimizeImageForAnalysis(page.originalDataUrl, 1800);

        const response = await fetch('/api/translate-comic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: analysisPayload,
            sourceLang,
            targetLang,
            tone,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Translation failed');
        }

        const detectedBlocks: TextBlock[] = data.blocks || [];

        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  blocks: detectedBlocks,
                  pageSummary: data.page_summary || '',
                  status: 'completed',
                  errorMessage: undefined,
                }
              : p
          )
        );
      } catch (err: any) {
        console.error('Batch translation failed for', page.name, err);
        const errStr = err.message || 'Translation error';
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id ? { ...p, status: 'error', errorMessage: errStr } : p
          )
        );
        setErrorMessage(errStr);
      }

      // Brief delay between batch requests to keep requests smooth
      if (i < total - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    isBatchRunning.current = false;
    setIsProcessing(false);
    setBatchProgress(null);
  }, [pages, sourceLang, targetLang, tone]);

  // Handle newly selected/uploaded images
  const handleImagesSelected = (newImages: Array<{ dataUrl: string; name: string }>) => {
    if (newImages.length === 0) return;

    const newPageItems: ComicPageItem[] = newImages.map((img, idx) => ({
      id: `page_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      name: img.name || `Page ${pages.length + idx + 1}`,
      originalDataUrl: img.dataUrl,
      blocks: [],
      pageSummary: '',
      status: 'pending',
    }));

    const startIndex = pages.length;
    setPages((prev) => [...prev, ...newPageItems]);
    setCurrentPageIndex(startIndex);
    setSelectedBlockId(null);
    setErrorMessage(null);

    // Automatically begin batch translation
    setTimeout(() => {
      // Trigger translation of first newly added page immediately
      if (newPageItems.length > 0) {
        translatePage(newPageItems[0].id);
      }
    }, 100);
  };

  // 1-Click Sample Handler
  const handleSelectSample = (sample: SamplePanelInfo) => {
    const dataUrl = sample.generateDataUrl();
    handleImagesSelected([{ dataUrl, name: `${sample.title}.png` }]);
  };

  // Load All 3 Samples Handler
  const handleLoadAllSamples = () => {
    const all = samplePanels.map((sample) => ({
      dataUrl: sample.generateDataUrl(),
      name: `${sample.title}.png`,
    }));
    handleImagesSelected(all);
  };

  // Reset entire application back to start upload state
  const handleReset = () => {
    if (pages.length > 0 && !window.confirm('Are you sure you want to start over? Current translations will be cleared.')) {
      return;
    }
    setPages([]);
    setCurrentPageIndex(0);
    setCurrentImageElement(null);
    setSelectedBlockId(null);
    setErrorMessage(null);
    setIsProcessing(false);
    setBatchProgress(null);
  };

  // Clipboard Paste Support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) pastedFiles.push(blob);
        }
      }

      if (pastedFiles.length > 0) {
        const readPromises = pastedFiles.map((file, i) => {
          return new Promise<{ dataUrl: string; name: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve({
                dataUrl: event.target?.result as string,
                name: `pasted_comic_${Date.now()}_${i + 1}.png`,
              });
            };
            reader.readAsDataURL(file);
          });
        });

        Promise.all(readPromises).then((results) => {
          handleImagesSelected(results);
        });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [pages.length]);

  // Block management on active page
  const handleUpdateBlock = (updated: TextBlock) => {
    if (!currentPage) return;
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === currentPageIndex
          ? {
              ...p,
              blocks: p.blocks.map((b) => (b.id === updated.id ? updated : b)),
            }
          : p
      )
    );
  };

  const handleDeleteBlock = (id: number) => {
    if (!currentPage) return;
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === currentPageIndex
          ? {
              ...p,
              blocks: p.blocks.filter((b) => b.id !== id),
            }
          : p
      )
    );
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const handleAddBlock = () => {
    if (!currentPage) return;
    const nextId =
      currentPage.blocks.length > 0
        ? Math.max(...currentPage.blocks.map((b) => b.id)) + 1
        : 1;
    const newBlock: TextBlock = {
      id: nextId,
      box_2d: [400, 350, 520, 650], // Center default
      original_text: '',
      translated_text: 'NEW DIALOGUE',
      bubble_type: 'speech',
      shape: 'oval',
      bg_color: '#ffffff',
      text_color: '#000000',
      reading_order: currentPage.blocks.length + 1,
    };
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === currentPageIndex
          ? {
              ...p,
              blocks: [...p.blocks, newBlock],
            }
          : p
      )
    );
    setSelectedBlockId(nextId);
  };

  // Delete page from chapter
  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      handleReset();
      return;
    }
    setPages((prev) => prev.filter((_, idx) => idx !== index));
    if (currentPageIndex >= index && currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased">
      {/* Hidden File Input for Add More / Upload */}
      <input
        id="comic-file-input"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
            const readPromises = files.map((file) => {
              return new Promise<{ dataUrl: string; name: string }>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  resolve({
                    dataUrl: event.target?.result as string,
                    name: file.name,
                  });
                };
                reader.readAsDataURL(file);
              });
            });
            Promise.all(readPromises).then(handleImagesSelected);
            e.target.value = '';
          }
        }}
      />

      {/* Header */}
      <Header
        sourceLang={sourceLang}
        setSourceLang={(l) => {
          setSourceLang(l);
          if (currentPage) translatePage(currentPage.id, l, targetLang, tone);
        }}
        targetLang={targetLang}
        setTargetLang={(l) => {
          setTargetLang(l);
          if (currentPage) translatePage(currentPage.id, sourceLang, l, tone);
        }}
        tone={tone}
        setTone={(t) => {
          setTone(t);
          if (currentPage) translatePage(currentPage.id, sourceLang, targetLang, t);
        }}
        onUploadClick={() => document.getElementById('comic-file-input')?.click()}
        onExportClick={() => setIsExportModalOpen(true)}
        onSamplesClick={() => setIsSamplesModalOpen(true)}
        onResetClick={pages.length > 0 ? handleReset : undefined}
        hasImage={pages.length > 0}
        isProcessing={isProcessing || currentPage?.status === 'translating'}
        onRetranslateAll={() => {
          if (currentPage) translatePage(currentPage.id);
        }}
        pageCount={pages.length}
      />

      {/* Error Message Toast with Retry */}
      {errorMessage && (
        <div className="bg-rose-950/90 border-b border-rose-800 text-rose-200 px-4 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentPage && (
              <button
                onClick={() => translatePage(currentPage.id)}
                className="px-2 py-0.5 rounded bg-rose-800 hover:bg-rose-750 text-white font-semibold flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Page</span>
              </button>
            )}
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {pages.length === 0 ? (
          /* When no image is loaded: DropZone + Sample Panels */
          <DropZone onImagesSelected={handleImagesSelected} isProcessing={isProcessing} />
        ) : (
          /* Active Comic Workspace: Canvas on Left + Typesetter Editor on Right + Page Thumbnail Strip */
          <div className="flex-1 flex flex-col h-[calc(100vh-53px)] overflow-hidden">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Canvas Viewer Area */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <ComicCanvasViewer
                  originalImage={currentImageElement}
                  blocks={currentPage?.blocks || []}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onUpdateBlock={handleUpdateBlock}
                  globalFontFamily={globalFontFamily}
                  globalUppercase={globalUppercase}
                  isProcessing={isProcessing || currentPage?.status === 'translating'}
                  pageSummary={currentPage?.pageSummary}
                  currentPageIndex={currentPageIndex}
                  totalPages={pages.length}
                  onPrevPage={() => setCurrentPageIndex((idx) => Math.max(0, idx - 1))}
                  onNextPage={() => setCurrentPageIndex((idx) => Math.min(pages.length - 1, idx + 1))}
                  onReset={handleReset}
                  customPatches={currentPage?.customPatches}
                  onUpdatePatches={(patches) => {
                    setPages((prev) =>
                      prev.map((p, idx) =>
                        idx === currentPageIndex ? { ...p, customPatches: patches } : p
                      )
                    );
                  }}
                />
              </div>

              {/* Bubble Typesetter & Editor Drawer */}
              <BubbleEditor
                blocks={currentPage?.blocks || []}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={handleDeleteBlock}
                onAddBlock={handleAddBlock}
                globalFontFamily={globalFontFamily}
                setGlobalFontFamily={setGlobalFontFamily}
                globalUppercase={globalUppercase}
                setGlobalUppercase={setGlobalUppercase}
                targetLang={targetLang}
              />
            </div>

            {/* Bottom Multi-Page Thumbnail Navigation & Batch Strip */}
            <PageThumbnailStrip
              pages={pages}
              currentPageIndex={currentPageIndex}
              onSelectPage={setCurrentPageIndex}
              onDeletePage={handleDeletePage}
              onAddMoreClick={() => document.getElementById('comic-file-input')?.click()}
              onTranslateAll={translateAllPending}
              onDownloadAllZip={() => setIsExportModalOpen(true)}
              isBatchTranslating={isProcessing}
              batchProgress={batchProgress}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        originalImage={currentImageElement}
        blocks={currentPage?.blocks || []}
        pageSummary={currentPage?.pageSummary}
        sourceLang={sourceLang}
        targetLang={targetLang}
        pages={pages}
        currentPageIndex={currentPageIndex}
        globalFontFamily={globalFontFamily}
        globalUppercase={globalUppercase}
      />

      <SamplesModal
        isOpen={isSamplesModalOpen}
        onClose={() => setIsSamplesModalOpen(false)}
        onSelectSample={handleSelectSample}
        onSelectAllSamples={handleLoadAllSamples}
      />
    </div>
  );
}
