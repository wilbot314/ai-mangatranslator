import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FolderDown,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { ComicPageItem } from '../types/comic';

interface PageThumbnailStripProps {
  pages: ComicPageItem[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onAddMoreClick: () => void;
  onTranslateAll: () => void;
  onDownloadAllZip: () => void;
  isBatchTranslating: boolean;
  batchProgress?: { current: number; total: number } | null;
}

export const PageThumbnailStrip: React.FC<PageThumbnailStripProps> = ({
  pages,
  currentPageIndex,
  onSelectPage,
  onDeletePage,
  onAddMoreClick,
  onTranslateAll,
  onDownloadAllZip,
  isBatchTranslating,
  batchProgress,
}) => {
  const pendingCount = pages.filter((p) => p.status === 'pending' || p.status === 'error').length;
  const completedCount = pages.filter((p) => p.status === 'completed').length;

  return (
    <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-2 flex flex-col gap-2 select-none">
      {/* Top Strip Bar: Batch Controls and Navigation */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-zinc-200">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Chapter Pages</span>
            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono text-[11px]">
              {pages.length}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 border-l border-zinc-750 pl-3">
            <span className="text-emerald-400 font-medium">
              {completedCount} Translated
            </span>
            {pendingCount > 0 && (
              <span className="text-amber-400/90 font-medium">
                • {pendingCount} Pending
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={onTranslateAll}
              disabled={isBatchTranslating}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow transition active:scale-95 disabled:opacity-50"
              title="Translate all queued and pending pages"
            >
              {isBatchTranslating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>
                {isBatchTranslating && batchProgress
                  ? `Translating (${batchProgress.current}/${batchProgress.total})...`
                  : `Translate All (${pendingCount} Pending)`}
              </span>
            </button>
          )}

          <button
            onClick={onDownloadAllZip}
            disabled={completedCount === 0}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-emerald-400 font-semibold text-xs border border-zinc-700 transition active:scale-95 disabled:opacity-40"
            title="Download all translated pages as a ZIP file"
          >
            <FolderDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download All (ZIP)</span>
            <span className="sm:hidden">ZIP</span>
          </button>

          <button
            onClick={onAddMoreClick}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-medium text-xs border border-zinc-700 transition"
            title="Add more comic images to the queue"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Pages</span>
          </button>
        </div>
      </div>

      {/* Horizontal Thumbnail Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-zinc-700">
        {pages.map((page, index) => {
          const isSelected = index === currentPageIndex;

          return (
            <div
              key={page.id}
              onClick={() => onSelectPage(index)}
              className={`group relative flex-shrink-0 w-24 sm:w-28 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-amber-400 ring-2 ring-amber-400/30 bg-zinc-800'
                  : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/60'
              }`}
            >
              {/* Thumbnail Image */}
              <div className="h-16 w-full overflow-hidden bg-zinc-950 flex items-center justify-center relative">
                <img
                  src={page.originalDataUrl}
                  alt={page.name}
                  className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition"
                />

                {/* Status Indicator Pill */}
                <div className="absolute top-1 right-1">
                  {page.status === 'completed' && (
                    <div className="bg-emerald-500/90 text-zinc-950 rounded-full p-0.5 shadow">
                      <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
                    </div>
                  )}
                  {page.status === 'translating' && (
                    <div className="bg-amber-500/90 text-zinc-950 rounded-full p-0.5 shadow animate-spin">
                      <RefreshCw className="w-3.5 h-3.5 text-black" />
                    </div>
                  )}
                  {page.status === 'error' && (
                    <div className="bg-rose-500/90 text-white rounded-full p-0.5 shadow" title={page.errorMessage || 'Error'}>
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {page.status === 'pending' && (
                    <div className="bg-zinc-800/90 text-zinc-400 rounded-full p-0.5 shadow border border-zinc-700">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Delete Page Button (hover) */}
                {pages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(index);
                    }}
                    className="absolute top-1 left-1 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                    title="Remove this page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Page Number & Info */}
              <div className="p-1 px-1.5 flex items-center justify-between text-[10px] bg-zinc-900/90">
                <span className={`font-bold ${isSelected ? 'text-amber-400' : 'text-zinc-300'}`}>
                  Page {index + 1}
                </span>
                <span className="text-zinc-500 truncate max-w-[46px]">
                  {page.status === 'completed' ? `${page.blocks.length} bbl` : page.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
