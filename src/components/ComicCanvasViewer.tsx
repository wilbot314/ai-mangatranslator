import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sliders,
  Columns,
  Eye,
  Layers,
  Paintbrush,
  RotateCcw,
  Check,
  MousePointer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TextBlock, ViewMode, ComicFontFamily } from '../types/comic';
import { renderComicPage, RenderOptions } from '../utils/typesetter';

interface ComicCanvasViewerProps {
  originalImage: HTMLImageElement | null;
  blocks: TextBlock[];
  selectedBlockId: number | null;
  onSelectBlock: (id: number | null) => void;
  onUpdateBlock: (updated: TextBlock) => void;
  globalFontFamily: ComicFontFamily;
  globalUppercase: boolean;
  isProcessing: boolean;
  pageSummary?: string;
  currentPageIndex?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onReset?: () => void;
  customPatches?: Array<{ x: number; y: number; radius: number; color: string }>;
  onUpdatePatches?: (patches: Array<{ x: number; y: number; radius: number; color: string }>) => void;
}

export const ComicCanvasViewer: React.FC<ComicCanvasViewerProps> = ({
  originalImage,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  globalFontFamily,
  globalUppercase,
  isProcessing,
  pageSummary,
  currentPageIndex = 0,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  onReset,
  customPatches: externalPatches,
  onUpdatePatches,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('translated');
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [hoveredBlockId, setHoveredBlockId] = useState<number | null>(null);
  const [isPeekingOriginal, setIsPeekingOriginal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Brush / Patch tool state
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(18);
  const [customPatches, setCustomPatches] = useState<Array<{ x: number; y: number; radius: number; color: string }>>([]);

  // Canvas references
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const splitOriginalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Render main translated canvas
  const redraw = useCallback(() => {
    if (!originalImage || !mainCanvasRef.current) return;

    const renderOpts: RenderOptions = {
      showOriginal: isPeekingOriginal || viewMode === 'original',
      showBoundingBoxes: viewMode === 'boxes',
      selectedBlockId,
      hoveredBlockId,
      globalFontFamily,
      globalUppercase,
      customPatches,
    };

    renderComicPage(mainCanvasRef.current, originalImage, blocks, renderOpts);

    // Also update split canvas if in split mode
    if (splitOriginalCanvasRef.current) {
      const origCtx = splitOriginalCanvasRef.current.getContext('2d');
      if (origCtx) {
        splitOriginalCanvasRef.current.width = originalImage.naturalWidth || originalImage.width;
        splitOriginalCanvasRef.current.height = originalImage.naturalHeight || originalImage.height;
        origCtx.drawImage(originalImage, 0, 0);
      }
    }
  }, [
    originalImage,
    blocks,
    isPeekingOriginal,
    viewMode,
    selectedBlockId,
    hoveredBlockId,
    globalFontFamily,
    globalUppercase,
    customPatches,
  ]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Spacebar hold to peek original
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsPeekingOriginal(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPeekingOriginal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle canvas click to select bubble or apply patch brush
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mainCanvasRef.current || !originalImage) return;

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const scaleX = mainCanvasRef.current.width / rect.width;
    const scaleY = mainCanvasRef.current.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (isBrushMode) {
      // Add patch at position
      setCustomPatches((prev) => [
        ...prev,
        { x: clickX, y: clickY, radius: brushSize, color: brushColor },
      ]);
      return;
    }

    // Check if clicked inside any text block
    const clickedBlock = blocks.find((block) => {
      const [ymin, xmin, ymax, xmax] = block.box_2d;
      const bX = (xmin / 1000) * mainCanvasRef.current!.width;
      const bY = (ymin / 1000) * mainCanvasRef.current!.height;
      const bW = ((xmax - xmin) / 1000) * mainCanvasRef.current!.width;
      const bH = ((ymax - ymin) / 1000) * mainCanvasRef.current!.height;
      return clickX >= bX && clickX <= bX + bW && clickY >= bY && clickY <= bY + bH;
    });

    if (clickedBlock) {
      onSelectBlock(clickedBlock.id);
    } else {
      onSelectBlock(null);
    }
  };

  // Hover detection for bubble highlighting
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mainCanvasRef.current || isBrushMode) return;

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const scaleX = mainCanvasRef.current.width / rect.width;
    const scaleY = mainCanvasRef.current.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const found = blocks.find((block) => {
      const [ymin, xmin, ymax, xmax] = block.box_2d;
      const bX = (xmin / 1000) * mainCanvasRef.current!.width;
      const bY = (ymin / 1000) * mainCanvasRef.current!.height;
      const bW = ((xmax - xmin) / 1000) * mainCanvasRef.current!.width;
      const bH = ((ymax - ymin) / 1000) * mainCanvasRef.current!.height;
      return mouseX >= bX && mouseX <= bX + bW && mouseY >= bY && mouseY <= bY + bH;
    });

    setHoveredBlockId(found ? found.id : null);
  };

  // Pan controls
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }

    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(5, Math.min(95, pos)));
    }
  };

  const handleContainerMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(3.0, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none">
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 text-xs text-zinc-300 z-10">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/60">
          <button
            onClick={() => setViewMode('translated')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition ${
              viewMode === 'translated'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Clean page with English replacing Korean"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Translated</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition ${
              viewMode === 'split'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Draggable split slider comparing Original vs Translated"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            onClick={() => setViewMode('boxes')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition ${
              viewMode === 'boxes'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Show detected bounding boxes for each bubble"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Inspector Boxes</span>
          </button>
        </div>

        {/* Page Switcher for Multi-Page Manga / Chapters */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 bg-zinc-800/90 px-2 py-1 rounded-lg border border-zinc-700/70 text-xs font-semibold text-zinc-200">
            <button
              onClick={onPrevPage}
              disabled={currentPageIndex <= 0}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-25 transition"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-1 text-zinc-300">
              Page <strong className="text-amber-400 font-bold">{currentPageIndex + 1}</strong> of {totalPages}
            </span>
            <button
              onClick={onNextPage}
              disabled={currentPageIndex >= totalPages - 1}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-25 transition"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Spacebar / Hold to Peek Original */}
        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => setIsPeekingOriginal(true)}
            onMouseUp={() => setIsPeekingOriginal(false)}
            onMouseLeave={() => setIsPeekingOriginal(false)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
              isPeekingOriginal
                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
            }`}
            title="Click and hold (or hold Spacebar) to temporarily reveal original Korean text"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hold to Peek Original</span>
          </button>

          {/* Eraser / Patch Brush Tool */}
          <button
            onClick={() => setIsBrushMode(!isBrushMode)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
              isBrushMode
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
            }`}
            title="Touch up or erase any background artifacts manually"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Patch Brush {customPatches.length > 0 && `(${customPatches.length})`}</span>
          </button>

          {customPatches.length > 0 && (
            <button
              onClick={() => setCustomPatches([])}
              className="p-1 text-zinc-400 hover:text-rose-400 transition"
              title="Clear custom manual patches"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/60">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded text-zinc-400 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-mono text-[11px] text-zinc-300 min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded text-zinc-400 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 rounded text-zinc-400 hover:text-white transition ml-1"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Brush Tool Options Bar (when active) */}
      {isBrushMode && (
        <div className="px-4 py-1.5 bg-purple-950/50 border-b border-purple-800/40 flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-3">
            <span className="font-semibold flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5 text-purple-400" />
              Click anywhere on the comic to paint/erase background
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Color:</span>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border border-zinc-700 bg-transparent"
              />
              <button
                onClick={() => setBrushColor('#ffffff')}
                className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]"
              >
                White
              </button>
              <button
                onClick={() => setBrushColor('#000000')}
                className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]"
              >
                Black
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Size:</span>
              <input
                type="range"
                min="6"
                max="48"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 accent-purple-400"
              />
              <span className="font-mono text-[11px]">{brushSize}px</span>
            </div>
          </div>
          <button
            onClick={() => setIsBrushMode(false)}
            className="px-2 py-0.5 rounded bg-purple-800 hover:bg-purple-700 text-white text-[11px] font-medium"
          >
            Done
          </button>
        </div>
      )}

      {/* Main Canvas Display Area */}
      <div
        ref={containerRef}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        className="relative flex-1 overflow-auto flex items-center justify-center p-4 min-h-[500px] cursor-default bg-zinc-950"
      >
        {isProcessing && (
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-30">
            <div className="w-12 h-12 rounded-full border-3 border-amber-400/20 border-t-amber-400 animate-spin mb-3" />
            <p className="font-bold text-white text-base">Localizing Comic Page...</p>
            <p className="text-xs text-zinc-400 mt-1">
              Detecting speech bubbles, inpainting Korean text, and typesetting English dialogue.
            </p>
          </div>
        )}

        <div
          className="relative shadow-2xl rounded-lg overflow-hidden border border-zinc-800"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Main Canvas (Translated or Inpainted) */}
          <canvas
            ref={mainCanvasRef}
            onClick={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            className={`block max-w-full max-h-[85vh] h-auto object-contain ${
              isBrushMode ? 'cursor-crosshair' : 'cursor-pointer'
            }`}
          />

          {/* Split Mode Slider Overlay */}
          {viewMode === 'split' && (
            <>
              {/* Original Canvas clipped to left of split */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${splitPos}%` }}
              >
                <canvas
                  ref={splitOriginalCanvasRef}
                  className="block max-w-none h-full object-contain"
                  style={{
                    width: mainCanvasRef.current ? `${mainCanvasRef.current.clientWidth}px` : '100%',
                    height: mainCanvasRef.current ? `${mainCanvasRef.current.clientHeight}px` : '100%',
                  }}
                />
              </div>

              {/* Split Line & Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] cursor-ew-resize z-20 flex items-center justify-center pointer-events-auto"
                style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSplit(true);
                }}
              >
                <div className="w-7 h-7 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg cursor-ew-resize font-black text-xs">
                  ⇔
                </div>
              </div>

              {/* Badges on split sides */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/75 text-amber-300 font-bold text-[11px] backdrop-blur-xs pointer-events-none z-10 border border-amber-500/30">
                Original (Korean)
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/75 text-emerald-300 font-bold text-[11px] backdrop-blur-xs pointer-events-none z-10 border border-emerald-500/30">
                Translated (English)
              </div>
            </>
          )}

          {/* Floating Hover Card for Bounding Box Inspector */}
          {hoveredBlockId && !isBrushMode && viewMode === 'boxes' && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm p-2.5 rounded-lg bg-zinc-900/95 border border-amber-500/40 shadow-xl backdrop-blur-md text-xs text-white z-20 pointer-events-none animate-in fade-in duration-100">
              {(() => {
                const block = blocks.find((b) => b.id === hoveredBlockId);
                if (!block) return null;
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider">
                        Bubble #{block.reading_order} • {block.bubble_type}
                      </span>
                      <span className="text-[10px] text-zinc-400">Click to edit</span>
                    </div>
                    <p className="text-zinc-300 font-korean mb-1 line-clamp-2">
                      <span className="text-zinc-500 text-[10px]">KR: </span>
                      {block.original_text}
                    </p>
                    <p className="text-emerald-300 font-semibold font-comic line-clamp-2">
                      <span className="text-zinc-500 text-[10px]">EN: </span>
                      {block.translated_text}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status & Hints Bar */}
      <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-zinc-300">
            {blocks.length} {blocks.length === 1 ? 'Speech Bubble' : 'Speech Bubbles'} Translated
          </span>
          {pageSummary && (
            <span className="hidden md:inline text-zinc-500 border-l border-zinc-700 pl-3 italic">
              "{pageSummary}"
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Space</kbd>{' '}
            Peek Original
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Click</kbd>{' '}
            Bubble to Edit
          </span>
        </div>
      </div>
    </div>
  );
};
