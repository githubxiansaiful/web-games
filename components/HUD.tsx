'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  Layers,
  Flag,
  Skull,
  Coins,
  Timer,
  Maximize,
  Minimize,
  Gamepad2,
} from 'lucide-react';

interface HUDProps {
  levelName: string;
  coinsCollected: number;
  totalCoins: number;
  deaths: number;
  timeElapsed: number;
  isMuted: boolean;
  activeCheckpoint: string | null;
  showTouchControls: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onPause: () => void;
  onOpenLevelSelect: () => void;
  onToggleTouchControls: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  levelName,
  coinsCollected,
  totalCoins,
  deaths,
  timeElapsed,
  isMuted,
  activeCheckpoint,
  showTouchControls,
  onToggleMute,
  onRestart,
  onPause,
  onOpenLevelSelect,
  onToggleTouchControls,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 safe-top safe-left safe-right flex flex-wrap items-center justify-between pointer-events-none z-20 gap-1.5 sm:gap-2">
      {/* Left side: Stage Info & Checkpoint */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-lg flex items-center gap-2 text-white">
          <button
            onClick={onOpenLevelSelect}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold tracking-wide transition active:scale-95 cursor-pointer"
            title="Choose Stage"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stages</span>
          </button>
          <span className="font-bold text-xs sm:text-sm tracking-wide text-slate-100 max-w-[110px] xs:max-w-[150px] sm:max-w-none truncate">
            {levelName}
          </span>
        </div>

        {/* Checkpoint Status Indicator */}
        <div
          className={`backdrop-blur-md rounded-xl px-2 sm:px-2.5 py-1.5 border text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
            activeCheckpoint
              ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-emerald-900/30'
              : 'bg-slate-900/70 border-slate-700/50 text-slate-400'
          }`}
          title={activeCheckpoint ? 'Checkpoint Saved!' : 'No checkpoint reached'}
        >
          <Flag className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${activeCheckpoint ? 'text-emerald-400 animate-bounce' : 'text-slate-500'}`} />
          <span className="hidden xs:inline">{activeCheckpoint ? 'Checkpoint Active' : 'Start'}</span>
        </div>
      </div>

      {/* Middle side: Stats (Coins, Timer, Deaths) */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Coins Counter */}
        <div className="bg-amber-950/80 backdrop-blur-md border border-amber-500/60 rounded-xl px-2.5 sm:px-3 py-1.5 text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-950/40">
          <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
          <span>
            {coinsCollected} / {totalCoins}
          </span>
        </div>

        {/* Timer */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-2.5 sm:px-3 py-1.5 text-slate-200 font-mono text-xs sm:text-sm flex items-center gap-1.5 shadow-md">
          <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
          <span>{formatTime(timeElapsed)}</span>
        </div>

        {/* Deaths Counter */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-2 sm:px-2.5 py-1.5 text-rose-300 font-semibold text-xs sm:text-sm flex items-center gap-1 shadow-md">
          <Skull className="w-3.5 h-3.5 text-rose-400" />
          <span>{deaths}</span>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
        {/* Toggle Touch Controls */}
        <button
          onClick={onToggleTouchControls}
          className={`p-2 backdrop-blur-md border rounded-xl transition active:scale-95 shadow-md cursor-pointer ${
            showTouchControls
              ? 'bg-indigo-600/80 border-indigo-400 text-white'
              : 'bg-slate-900/85 hover:bg-slate-800 border-slate-700/60 text-slate-400'
          }`}
          title={showTouchControls ? 'Hide Touch Buttons' : 'Show Touch Buttons'}
        >
          <Gamepad2 className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-white transition active:scale-95 shadow-md cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Mute / Unmute */}
        <button
          onClick={onToggleMute}
          className="p-2 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-white transition active:scale-95 shadow-md cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Quick Restart */}
        <button
          onClick={onRestart}
          className="p-2 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-amber-300 transition active:scale-95 shadow-md cursor-pointer"
          title="Restart Stage (R key)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Pause */}
        <button
          onClick={onPause}
          className="p-2 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-sky-300 transition active:scale-95 shadow-md cursor-pointer"
          title="Pause Game (Esc / P)"
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
