import React, { useState } from 'react';
import {
  Download,
  X,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  SplitSquareVertical,
  FolderDown,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { TextBlock, ComicPageItem, ComicFontFamily } from '../types/comic';
import { downloadPagesAsZip } from '../utils/zipExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: HTMLImageElement | null;
  blocks: TextBlock[];
  pageSummary?: string;
  sourceLang: string;
  targetLang: string;
  pages?: ComicPageItem[];
  currentPageIndex?: number;
  globalFontFamily?: ComicFontFamily;
  globalUppercase?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  originalImage,
  blocks,
  pageSummary,
  sourceLang,
  targetLang,
  pages = [],
  currentPageIndex = 0,
  globalFontFamily = 'Comic Neue',
  globalUppercase = true,
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [scriptMode, setScriptMode] = useState<'current' | 'all'>('current');

  if (!isOpen) return null;

  const completedPages = pages.filter((p) => p.status === 'completed');

  // Generate dialogue script text
  const generateScriptText = () => {
    if (scriptMode === 'all' && pages.length > 0) {
      let script = `# ManhwaScan Translation Script - All Pages (${pages.length} Pages)\n`;
      script += `Languages: ${sourceLang} -> ${targetLang}\n\n`;

      pages.forEach((p, idx) => {
        script += `=======================================================\n`;
        script += `PAGE ${idx + 1}: ${p.name || `Page ${idx + 1}`}\n`;
        if (p.pageSummary) script += `Summary: ${p.pageSummary}\n`;
        script += `=======================================================\n`;

        const sorted = [...p.blocks].sort((a, b) => a.reading_order - b.reading_order);
        if (sorted.length === 0) {
          script += `(No dialogue blocks detected on this page)\n\n`;
        } else {
          sorted.forEach((b) => {
            script += `[#${b.reading_order || b.id}] (${b.bubble_type.toUpperCase()})\n`;
            script += `  ${sourceLang}: ${b.original_text || '(SFX/No OCR)'}\n`;
            script += `  ${targetLang}: ${b.translated_text}\n\n`;
          });
        }
      });
      return script;
    }

    // Current page script
    let script = `# ManhwaScan Translation Script\n`;
    script += `Page: ${pages[currentPageIndex]?.name || `Page ${currentPageIndex + 1}`}\n`;
    script += `Scene: ${pageSummary || 'Comic Page'}\n`;
    script += `Languages: ${sourceLang} -> ${targetLang}\n\n`;

    const sorted = [...blocks].sort((a, b) => a.reading_order - b.reading_order);
    sorted.forEach((b) => {
      script += `[#${b.reading_order || b.id}] (${b.bubble_type.toUpperCase()})\n`;
      script += `${sourceLang}: ${b.original_text}\n`;
      script += `${targetLang}: ${b.translated_text}\n\n`;
    });
    return script;
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generateScriptText());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Download translated image directly from canvas
  const handleDownloadTranslated = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const pageName = pages[currentPageIndex]?.name
      ? pages[currentPageIndex].name.replace(/\.[^/.]+$/, '')
      : `page_${currentPageIndex + 1}`;

    const link = document.createElement('a');
    link.download = `translated_${pageName}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Download side-by-side comparison image
  const handleDownloadSideBySide = () => {
    if (!originalImage) return;
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const w = originalImage.naturalWidth || originalImage.width;
    const h = originalImage.naturalHeight || originalImage.height;

    const compCanvas = document.createElement('canvas');
    compCanvas.width = w * 2 + 20;
    compCanvas.height = h + 60;
    const ctx = compCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(`Original (${sourceLang})`, 20, 40);

    ctx.fillStyle = '#10b981';
    ctx.fillText(`Translated (${targetLang})`, w + 40, 40);

    ctx.drawImage(originalImage, 20, 60, w, h);
    ctx.drawImage(canvas, w + 40, 60, w, h);

    const link = document.createElement('a');
    link.download = `comparison_comic_${Date.now()}.png`;
    link.href = compCanvas.toDataURL('image/png');
    link.click();
  };

  // Download All Pages as ZIP
  const handleDownloadAllZip = async () => {
    if (pages.length === 0) return;
    setIsExportingZip(true);
    setZipProgress({ current: 0, total: pages.length, message: 'Starting export...' });

    try {
      await downloadPagesAsZip({
        pages,
        sourceLang,
        targetLang,
        globalFontFamily,
        globalUppercase,
        includeScript: true,
        zipName: `manhwa_translated_chapter_${Date.now()}.zip`,
        onProgress: (current, total, message) => {
          setZipProgress({ current, total, message });
        },
      });
    } catch (err) {
      console.error('Failed to export ZIP:', err);
      alert('Failed to generate ZIP export. Please try again.');
    } finally {
      setIsExportingZip(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Export & Download Options</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 text-xs text-zinc-300 overflow-y-auto flex-1">
          {/* Option A: Download ALL Pages as ZIP Archive (Primary when multiple pages) */}
          {pages.length > 1 && (
            <div
              onClick={!isExportingZip ? handleDownloadAllZip : undefined}
              className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-zinc-900 border-2 border-amber-500/40 hover:border-amber-400 cursor-pointer transition flex items-center justify-between group shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow">
                  {isExportingZip ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <FolderDown className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition">
                      Download All Pages (ZIP Archive)
                    </h4>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      {pages.length} Pages
                    </span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {isExportingZip && zipProgress
                      ? zipProgress.message
                      : 'Includes all high-res translated PNGs and formatted dialogue script.'}
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
            </div>
          )}

          {/* Option B: Download Current Single Page */}
          <div
            onClick={handleDownloadTranslated}
            className="p-3.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 hover:border-emerald-500/50 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition">
                  Download Current Page #{currentPageIndex + 1} (PNG)
                </h4>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Full original resolution with English in-place typesetting.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-emerald-300 transition" />
          </div>

          {/* Option C: Download Side-by-Side Comparison */}
          <div
            onClick={handleDownloadSideBySide}
            className="p-3.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <SplitSquareVertical className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition">
                  Download Side-by-Side Comparison (PNG)
                </h4>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Original Korean side-by-side with English translation.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-amber-300 transition" />
          </div>

          {/* Option D: Script Exporter */}
          <div className="p-3.5 rounded-xl bg-zinc-850 border border-zinc-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span className="font-bold text-white">Translated Dialogue Script</span>
              </div>

              <div className="flex items-center gap-2">
                {pages.length > 1 && (
                  <div className="flex items-center bg-zinc-800 rounded p-0.5 border border-zinc-700 text-[10px]">
                    <button
                      onClick={() => setScriptMode('current')}
                      className={`px-1.5 py-0.5 rounded ${
                        scriptMode === 'current' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Current
                    </button>
                    <button
                      onClick={() => setScriptMode('all')}
                      className={`px-1.5 py-0.5 rounded ${
                        scriptMode === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'
                      }`}
                    >
                      All ({pages.length})
                    </button>
                  </div>
                )}

                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-semibold transition"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto rounded bg-zinc-950 p-2 font-mono text-[11px] text-zinc-300 select-text border border-zinc-800">
              <pre className="whitespace-pre-wrap">{generateScriptText()}</pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
