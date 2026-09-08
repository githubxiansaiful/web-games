'use client';

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Layers, HelpCircle, X, Home, Maximize, Minimize } from 'lucide-react';
import { toggleFullscreen, isFullscreenActive } from '@/lib/fullscreen';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onGoHome?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenLevelSelect,
  onGoHome,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsFullscreen(isFullscreenActive());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleFullscreen = async () => {
    const res = await toggleFullscreen();
    if (res.isIPhoneDevice && !res.success) {
      setShowIosTip(true);
    } else {
      setIsFullscreen(res.active);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center text-white relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onResume}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black tracking-tight mb-2">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mb-5">Take a breather, hero!</p>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 mb-6">
          <button
            onClick={onResume}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Game<span className="hidden sm:inline"> (Esc / P)</span></span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-sm text-slate-200 hover:text-white flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Restart Stage<span className="hidden sm:inline"> (R)</span></span>
          </button>

          <button
            onClick={onOpenLevelSelect}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-sm text-slate-200 hover:text-white flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Select Stage</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-sm text-slate-200 hover:text-white flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-emerald-400" /> : <Maximize className="w-4 h-4 text-indigo-400" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}</span>
          </button>

          {/* iPhone Safari Home Screen Instructions */}
          {showIosTip && (
            <div className="bg-indigo-950/80 border border-indigo-500/60 rounded-xl p-3 text-left text-xs text-indigo-200 animate-in fade-in duration-200">
              <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                <span>📱</span>
                <span>Fullscreen on iPhone:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                iOS Safari blocks web fullscreen. Tap Safari&apos;s <strong className="text-white">Share (⎋)</strong> icon, then tap <strong className="text-emerald-400">&apos;Add to Home Screen&apos;</strong> to play borderless without browser bars!
              </p>
            </div>
          )}

          {onGoHome && (
            <button
              onClick={() => {
                onResume();
                onGoHome();
              }}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-700/50 rounded-xl font-bold text-sm text-slate-300 hover:text-rose-300 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4 text-rose-400" />
              <span>Main Menu</span>
            </button>
          )}
        </div>

        {/* Controls Quick Reference */}
        <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/60 text-left">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Controls Guide</span>
          </div>

          {/* Mobile Touch Controls Guide */}
          <div className="space-y-1.5 text-xs text-slate-300 sm:hidden">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Run:</span>
              <span className="font-semibold bg-slate-700/70 px-2 py-0.5 rounded text-[11px] text-slate-200">
                Left / Right Arrows
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Jump:</span>
              <span className="font-semibold bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded text-[11px]">
                Big JUMP Button
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Double Jump:</span>
              <span className="font-semibold bg-slate-700/70 px-2 py-0.5 rounded text-[11px] text-slate-200">
                Tap Jump Twice
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Checkpoint Respawn:</span>
              <span className="font-semibold bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded text-[11px]">
                Quick Reset Button
              </span>
            </div>
          </div>

          {/* Desktop Keyboard Controls Guide */}
          <div className="hidden sm:block space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Run Left / Right:</span>
              <span className="font-mono bg-slate-700/70 px-1.5 py-0.5 rounded text-[11px]">A / D or ← / →</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Jump:</span>
              <span className="font-mono bg-slate-700/70 px-1.5 py-0.5 rounded text-[11px]">W / ↑ or Space</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Double Jump:</span>
              <span className="font-mono bg-slate-700/70 px-1.5 py-0.5 rounded text-[11px]">Jump again in mid-air</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Quick Respawn:</span>
              <span className="font-mono bg-slate-700/70 px-1.5 py-0.5 rounded text-[11px]">R</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
