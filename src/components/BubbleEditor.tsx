import React, { useState } from 'react';
import {
  Type,
  Sparkles,
  Trash2,
  Plus,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Palette,
  EyeOff,
  Eye,
  MessageSquare,
  Wand2,
} from 'lucide-react';
import { TextBlock, ComicFontFamily, BubbleType } from '../types/comic';

interface BubbleEditorProps {
  blocks: TextBlock[];
  selectedBlockId: number | null;
  onSelectBlock: (id: number | null) => void;
  onUpdateBlock: (updated: TextBlock) => void;
  onDeleteBlock: (id: number) => void;
  onAddBlock: () => void;
  globalFontFamily: ComicFontFamily;
  setGlobalFontFamily: (font: ComicFontFamily) => void;
  globalUppercase: boolean;
  setGlobalUppercase: (val: boolean) => void;
  targetLang: string;
}

export const BubbleEditor: React.FC<BubbleEditorProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlock,
  globalFontFamily,
  setGlobalFontFamily,
  globalUppercase,
  setGlobalUppercase,
  targetLang,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isGeneratingAlternates, setIsGeneratingAlternates] = useState(false);
  const [alternateOptions, setAlternateOptions] = useState<{
    standard?: string;
    dramatic?: string;
    casual?: string;
  } | null>(null);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleRequestAlternates = async () => {
    if (!selectedBlock) return;
    setIsGeneratingAlternates(true);
    setAlternateOptions(null);

    try {
      const res = await fetch('/api/retranslate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_text: selectedBlock.original_text,
          current_translation: selectedBlock.translated_text,
          context: selectedBlock.notes || '',
          targetLang: targetLang,
        }),
      });
      const data = await res.json();
      if (data.success && data.options) {
        setAlternateOptions(data.options);
      }
    } catch (err) {
      console.error('Failed to get alternate translations:', err);
    } finally {
      setIsGeneratingAlternates(false);
    }
  };

  const selectNext = () => {
    if (blocks.length === 0) return;
    const currentIndex = blocks.findIndex((b) => b.id === selectedBlockId);
    if (currentIndex === -1 || currentIndex === blocks.length - 1) {
      onSelectBlock(blocks[0].id);
    } else {
      onSelectBlock(blocks[currentIndex + 1].id);
    }
  };

  const selectPrev = () => {
    if (blocks.length === 0) return;
    const currentIndex = blocks.findIndex((b) => b.id === selectedBlockId);
    if (currentIndex <= 0) {
      onSelectBlock(blocks[blocks.length - 1].id);
    } else {
      onSelectBlock(blocks[currentIndex - 1].id);
    }
  };

  return (
    <div className="w-80 lg:w-96 border-l border-zinc-800 bg-zinc-900/95 flex flex-col h-full overflow-hidden text-xs text-zinc-300">
      {/* Editor Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-white text-sm">Dialogue & Typesetter</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono">
            {blocks.length}
          </span>
        </div>

        <button
          onClick={onAddBlock}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
          title="Add a new custom dialogue bubble"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Bubble</span>
        </button>
      </div>

      {/* Global Typography Settings */}
      <div className="p-3 border-b border-zinc-800/80 bg-zinc-950/40 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-zinc-400">Default Font</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={globalUppercase}
                onChange={(e) => setGlobalUppercase(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0"
              />
              <span className="text-[10px] text-zinc-300">ALL CAPS</span>
            </label>
          </div>
        </div>

        <select
          value={globalFontFamily}
          onChange={(e) => setGlobalFontFamily(e.target.value as ComicFontFamily)}
          className="w-full bg-zinc-850 text-white rounded-md p-1.5 border border-zinc-700/80 text-xs outline-none"
        >
          <option value="Comic Neue">Comic Neue (Classic Manhwa / Manga)</option>
          <option value="Bangers">Bangers (Action / Shonen Shouts)</option>
          <option value="Balsamiq Sans">Balsamiq Sans (Webtoon Modern)</option>
          <option value="Inter">Inter (Clean Modern Sans)</option>
        </select>
      </div>

      {/* Main Body: Selected Bubble Detail OR List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {selectedBlock ? (
          /* Focused Single Bubble Editor */
          <div className="space-y-3">
            {/* Bubble Navigation & Actions */}
            <div className="flex items-center justify-between bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-700/60">
              <div className="flex items-center gap-1">
                <button
                  onClick={selectPrev}
                  className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                  title="Previous bubble"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-white px-1">
                  Bubble #{selectedBlock.reading_order || selectedBlock.id}
                </span>
                <button
                  onClick={selectNext}
                  className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                  title="Next bubble"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    onUpdateBlock({
                      ...selectedBlock,
                      hidden: !selectedBlock.hidden,
                    })
                  }
                  className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                  title={selectedBlock.hidden ? 'Show bubble' : 'Hide bubble'}
                >
                  {selectedBlock.hidden ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => onDeleteBlock(selectedBlock.id)}
                  className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition"
                  title="Delete this bubble"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Original Korean Text Box */}
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/90">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Original Korean OCR
                </span>
                <button
                  onClick={() => handleCopy(selectedBlock.original_text, selectedBlock.id)}
                  className="p-1 text-zinc-400 hover:text-white transition flex items-center gap-1 text-[10px]"
                >
                  {copiedId === selectedBlock.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy</span>
                </button>
              </div>
              <p className="font-korean text-zinc-200 text-xs leading-relaxed break-words select-text">
                {selectedBlock.original_text || '(No original text)'}
              </p>
            </div>

            {/* Translated English Text Input (Live in-place editing!) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span>English Translation</span>
                  <span className="text-[9px] text-zinc-500 lowercase">(live preview)</span>
                </label>

                <button
                  onClick={handleRequestAlternates}
                  disabled={isGeneratingAlternates}
                  className="text-[10px] font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition"
                >
                  <Wand2 className={`w-3 h-3 ${isGeneratingAlternates ? 'animate-spin' : ''}`} />
                  <span>AI Alternatives</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={selectedBlock.translated_text}
                onChange={(e) =>
                  onUpdateBlock({
                    ...selectedBlock,
                    translated_text: e.target.value,
                  })
                }
                className="w-full bg-zinc-950 border border-emerald-500/40 rounded-lg p-2.5 text-zinc-100 font-comic text-sm leading-relaxed outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
                placeholder="Type English dialogue..."
              />
            </div>

            {/* AI Alternate Phrasing Options */}
            {alternateOptions && (
              <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-amber-500/30 space-y-2 animate-in fade-in">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Select Alternate Tone:
                </div>
                {alternateOptions.standard && (
                  <button
                    onClick={() => {
                      onUpdateBlock({
                        ...selectedBlock,
                        translated_text: alternateOptions.standard!,
                      });
                      setAlternateOptions(null);
                    }}
                    className="w-full text-left p-2 rounded bg-zinc-900 hover:bg-zinc-750 text-xs border border-zinc-700/60 text-zinc-200"
                  >
                    <span className="text-[10px] text-zinc-400 block font-semibold">Standard:</span>
                    {alternateOptions.standard}
                  </button>
                )}
                {alternateOptions.dramatic && (
                  <button
                    onClick={() => {
                      onUpdateBlock({
                        ...selectedBlock,
                        translated_text: alternateOptions.dramatic!,
                      });
                      setAlternateOptions(null);
                    }}
                    className="w-full text-left p-2 rounded bg-zinc-900 hover:bg-zinc-750 text-xs border border-zinc-700/60 text-amber-200"
                  >
                    <span className="text-[10px] text-amber-400 block font-semibold">Dramatic / Punchy:</span>
                    {alternateOptions.dramatic}
                  </button>
                )}
                {alternateOptions.casual && (
                  <button
                    onClick={() => {
                      onUpdateBlock({
                        ...selectedBlock,
                        translated_text: alternateOptions.casual!,
                      });
                      setAlternateOptions(null);
                    }}
                    className="w-full text-left p-2 rounded bg-zinc-900 hover:bg-zinc-750 text-xs border border-zinc-700/60 text-emerald-200"
                  >
                    <span className="text-[10px] text-emerald-400 block font-semibold">Casual / Slang:</span>
                    {alternateOptions.casual}
                  </button>
                )}
              </div>
            )}

            {/* Typography & Style Tweaks */}
            <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-zinc-400 font-semibold text-[10px] uppercase tracking-wider">
                <span>Bubble Styling</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 capitalize text-[10px]">
                  {selectedBlock.bubble_type}
                </span>
              </div>

              {/* Font Size Multiplier Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Font Size Scale</span>
                  <span className="font-mono text-zinc-200">
                    {Math.round((selectedBlock.customFontSize || 1.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.05"
                  value={selectedBlock.customFontSize || 1.0}
                  onChange={(e) =>
                    onUpdateBlock({
                      ...selectedBlock,
                      customFontSize: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Font Family Override */}
              <div className="space-y-1">
                <div className="text-[11px] text-zinc-400">Font Override</div>
                <select
                  value={selectedBlock.customFontFamily || globalFontFamily}
                  onChange={(e) =>
                    onUpdateBlock({
                      ...selectedBlock,
                      customFontFamily: e.target.value as ComicFontFamily,
                    })
                  }
                  className="w-full bg-zinc-900 rounded p-1.5 border border-zinc-700 text-xs text-white"
                >
                  <option value="Comic Neue">Comic Neue</option>
                  <option value="Bangers">Bangers (Bold/Shout)</option>
                  <option value="Balsamiq Sans">Balsamiq Sans</option>
                  <option value="Inter">Inter (Sans)</option>
                </select>
              </div>

              {/* Toggles: Bold, Uppercase, Outline */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() =>
                    onUpdateBlock({
                      ...selectedBlock,
                      customBold: !selectedBlock.customBold,
                    })
                  }
                  className={`p-1.5 rounded border text-[11px] font-bold transition ${
                    selectedBlock.customBold
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Bold
                </button>

                <button
                  onClick={() =>
                    onUpdateBlock({
                      ...selectedBlock,
                      customUppercase:
                        selectedBlock.customUppercase !== undefined
                          ? !selectedBlock.customUppercase
                          : !globalUppercase,
                    })
                  }
                  className={`p-1.5 rounded border text-[11px] font-bold transition ${
                    selectedBlock.customUppercase ?? globalUppercase
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  CAPS
                </button>

                <button
                  onClick={() =>
                    onUpdateBlock({
                      ...selectedBlock,
                      customOutline: !selectedBlock.customOutline,
                    })
                  }
                  className={`p-1.5 rounded border text-[11px] font-bold transition ${
                    selectedBlock.customOutline
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Outline
                </button>
              </div>

              {/* Colors: Bubble background inpaint color & Text color */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1">Bubble Bg</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedBlock.customBgColor || selectedBlock.bg_color || '#ffffff'}
                      onChange={(e) =>
                        onUpdateBlock({
                          ...selectedBlock,
                          customBgColor: e.target.value,
                        })
                      }
                      className="w-6 h-6 rounded cursor-pointer border border-zinc-700 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-zinc-300">
                      {selectedBlock.customBgColor || selectedBlock.bg_color || '#ffffff'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block mb-1">Text Color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedBlock.customTextColor || selectedBlock.text_color || '#000000'}
                      onChange={(e) =>
                        onUpdateBlock({
                          ...selectedBlock,
                          customTextColor: e.target.value,
                        })
                      }
                      className="w-6 h-6 rounded cursor-pointer border border-zinc-700 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-zinc-300">
                      {selectedBlock.customTextColor || selectedBlock.text_color || '#000000'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to All List Button */}
            <button
              onClick={() => onSelectBlock(null)}
              className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-semibold transition"
            >
              View All Dialogue Bubbles
            </button>
          </div>
        ) : (
          /* List of All Speech Bubbles */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1">
              <span>All Detected Bubbles (Reading Order)</span>
              <span>Click to Edit</span>
            </div>

            {blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => onSelectBlock(block.id)}
                className="p-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-750 hover:border-amber-500/50 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-zinc-900 text-amber-400 font-bold text-[10px] flex items-center justify-center border border-zinc-700">
                      #{block.reading_order || block.id}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">
                      {block.bubble_type}
                    </span>
                  </div>
                  {block.hidden && (
                    <span className="text-[10px] text-rose-400 flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Hidden
                    </span>
                  )}
                </div>

                <p className="text-zinc-400 font-korean text-[11px] truncate mb-0.5">
                  {block.original_text}
                </p>
                <p className="text-emerald-300 font-comic font-medium text-xs line-clamp-2 group-hover:text-amber-300 transition">
                  {block.translated_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
