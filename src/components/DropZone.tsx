import React, { useState } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Clipboard, Zap, ArrowRight, ShieldCheck, Layers } from 'lucide-react';
import { samplePanels, SamplePanelInfo } from '../utils/samplePanels';

interface DropZoneProps {
  onImagesSelected: (images: Array<{ dataUrl: string; name: string }>) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onImagesSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      // Reset input value so re-selecting same files works
      e.target.value = '';
    }
  };

  const processFiles = (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      alert('Please select valid image files (PNG, JPG, WEBP).');
      return;
    }

    const readPromises = imageFiles.map((file) => {
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

    Promise.all(readPromises).then((results) => {
      onImagesSelected(results);
    });
  };

  const handleSampleClick = (sample: SamplePanelInfo) => {
    const dataUrl = sample.generateDataUrl();
    onImagesSelected([{ dataUrl, name: `${sample.title}.png` }]);
  };

  const handleLoadAllSamples = () => {
    const all = samplePanels.map((sample) => ({
      dataUrl: sample.generateDataUrl(),
      name: `${sample.title}.png`,
    }));
    onImagesSelected(all);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Welcome Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Korean Manhwa & Manga OCR + In-Place Typesetting</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
          Translate Comics to English <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
            With Text Replaced In-Place
          </span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
          Upload one or multiple comic pages, manhwa strips, or chapters. The AI detects all speech
          bubbles, clears the original Korean text, typesets authentic English dialogue, and lets you download individual pages or a full ZIP archive.
        </p>

        {/* Unrestricted Policy Note */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span><strong>As-Is Translation:</strong> Action, horror, combat, and mature comic themes translated faithfully without censorship.</span>
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : 'border-zinc-700/80 bg-zinc-900/60 hover:border-zinc-500 hover:bg-zinc-900/90'
        }`}
        onClick={() => document.getElementById('comic-file-input')?.click()}
      >
        <input
          id="comic-file-input"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileInput}
        />

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
          <Upload className="w-8 h-8 text-amber-400" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Drop one or multiple comic images here, or <span className="text-amber-400 underline">browse files</span>
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Select multiple pages at once! Supports PNG, JPG, WEBP (Manhwa, Manga, Webtoons, Comic Strips)
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-medium">
          <Clipboard className="w-3.5 h-3.5 text-zinc-400" />
          <span>Tip: You can also paste directly with <kbd className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-200 font-mono text-[10px]">Ctrl+V</kbd></span>
        </div>
      </div>

      {/* 1-Click Sample Previews */}
      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Try Instant Korean Manhwa Samples
            </h2>
          </div>
          <button
            onClick={handleLoadAllSamples}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition active:scale-95"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Load All 3 Samples (Batch Mode)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {samplePanels.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSampleClick(sample)}
              disabled={isProcessing}
              className="text-left p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850 transition duration-150 group shadow-md flex flex-col justify-between"
            >
              <div>
                <div className={`h-2 rounded-full w-12 bg-gradient-to-r ${sample.previewColor} mb-3`} />
                <div className="text-[11px] font-bold text-amber-400/90 tracking-wide uppercase mb-1">
                  {sample.genre}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                  {sample.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {sample.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-300 group-hover:text-amber-400">
                <span>Translate This Panel</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-800/80 pt-8 text-xs text-zinc-400">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400 shrink-0 font-bold">
            1
          </div>
          <div>
            <h5 className="font-bold text-zinc-200 mb-0.5">Multi-Page Batch Translation</h5>
            <p>Upload entire comic chapters at once and translate them in sequence.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-orange-400 shrink-0 font-bold">
            2
          </div>
          <div>
            <h5 className="font-bold text-zinc-200 mb-0.5">In-Place Typesetting</h5>
            <p>Smoothly inpaint Korean text and typeset authentic English dialogue.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
            3
          </div>
          <div>
            <h5 className="font-bold text-zinc-200 mb-0.5">Batch ZIP Download</h5>
            <p>Download all translated chapter pages packaged into a single ZIP file.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
