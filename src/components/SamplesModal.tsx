import React from 'react';
import { Sparkles, X, ArrowRight, Zap, Layers } from 'lucide-react';
import { samplePanels, SamplePanelInfo } from '../utils/samplePanels';

interface SamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SamplePanelInfo) => void;
  onSelectAllSamples?: () => void;
}

export const SamplesModal: React.FC<SamplesModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
  onSelectAllSamples,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Select Korean Comic Samples</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-zinc-400">
              Choose a preset Korean manhwa panel, or load all three to test batch multi-page translation:
            </p>

            {onSelectAllSamples && (
              <button
                onClick={() => {
                  onSelectAllSamples();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow transition active:scale-95 shrink-0 ml-2"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Load All 3 as Chapter</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {samplePanels.map((sample) => (
              <div
                key={sample.id}
                onClick={() => {
                  onSelectSample(sample);
                  onClose();
                }}
                className="p-4 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 hover:border-amber-500/60 cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${sample.previewColor}`} />
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                      {sample.genre}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition">
                    {sample.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {sample.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400 group-hover:text-amber-400 shrink-0 pl-3">
                  <span>Load Panel</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
