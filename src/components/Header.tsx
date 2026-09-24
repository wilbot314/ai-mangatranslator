import React from 'react';
import { BookOpen, Sparkles, Upload, Download, Eye, RefreshCw, RotateCcw } from 'lucide-react';

interface HeaderProps {
  sourceLang: string;
  setSourceLang: (lang: string) => void;
  targetLang: string;
  setTargetLang: (lang: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  onUploadClick: () => void;
  onExportClick: () => void;
  onSamplesClick: () => void;
  onResetClick?: () => void;
  hasImage: boolean;
  isProcessing: boolean;
  onRetranslateAll?: () => void;
  pageCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  sourceLang,
  setSourceLang,
  targetLang,
  setTargetLang,
  tone,
  setTone,
  onUploadClick,
  onExportClick,
  onSamplesClick,
  onResetClick,
  hasImage,
  isProcessing,
  onRetranslateAll,
  pageCount = 1,
}) => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white font-['Inter']">
                Manhwa<span className="text-amber-400">Scan</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                AI Comic Inpainter
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Instant Korean to English Comic Text Replacement
            </p>
          </div>
        </div>

        {/* Translation Language & Tone Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center bg-zinc-800/90 rounded-lg p-1 border border-zinc-700/60 shadow-inner">
            <span className="text-zinc-400 px-2 font-medium">From</span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-zinc-900 text-amber-300 font-semibold rounded px-2 py-1 outline-none border border-zinc-700/50 cursor-pointer"
            >
              <option value="Korean">Korean (한국어)</option>
              <option value="Japanese">Japanese (日本語)</option>
              <option value="Chinese">Chinese (中文)</option>
            </select>

            <span className="text-zinc-400 px-2 font-medium">To</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-zinc-900 text-emerald-300 font-semibold rounded px-2 py-1 outline-none border border-zinc-700/50 cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="Indonesian">Indonesian (Bahasa)</option>
            </select>
          </div>

          {/* Tone Selector */}
          <div className="hidden lg:flex items-center bg-zinc-800/90 rounded-lg p-1 border border-zinc-700/60">
            <span className="text-zinc-400 px-2 font-medium">Tone</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="bg-zinc-900 text-zinc-200 rounded px-2 py-1 outline-none border border-zinc-700/50 cursor-pointer text-xs"
            >
              <option value="verbatim as-is comic dialogue">Verbatim / As-Is (Unrestricted)</option>
              <option value="natural comic dialogue">Comic Dialogue (Natural)</option>
              <option value="dramatic shonen action">Dramatic Action / High Stakes</option>
              <option value="casual modern webtoon">Casual Modern Webtoon</option>
              <option value="faithful literal translation">Faithful Literal</option>
            </select>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>As-Is Fiction (Unrestricted)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSamplesClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
            title="Try sample Korean comic panels"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Try</span> Samples
          </button>

          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          {hasImage && (
            <>
              {onRetranslateAll && (
                <button
                  onClick={onRetranslateAll}
                  disabled={isProcessing}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition disabled:opacity-50"
                  title="Re-run translation"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              )}

              <button
                onClick={onExportClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold border border-zinc-700 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Download</span>
              </button>

              {onResetClick && (
                <button
                  onClick={onResetClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-850 hover:bg-rose-950/60 hover:border-rose-700/60 text-zinc-300 hover:text-rose-200 text-xs font-semibold border border-zinc-700 transition active:scale-95 group"
                  title="Reset everything and return to upload start screen"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-400 group-hover:-rotate-90 transition-transform" />
                  <span className="hidden sm:inline">Start Over</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
