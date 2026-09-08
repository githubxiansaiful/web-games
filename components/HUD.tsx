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
  Home,
  Menu,
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
  isMultiplayer?: boolean;
  roomCode?: string;
  onToggleMute: () => void;
  onRestart: () => void;
  onPause: () => void;
  onOpenLevelSelect: () => void;
  onToggleTouchControls: () => void;
  onGoHome?: () => void;
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
  isMultiplayer,
  roomCode,
  onToggleMute,
  onRestart,
  onPause,
  onOpenLevelSelect,
  onToggleTouchControls,
  onGoHome,
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
    <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 safe-top safe-left safe-right flex items-center justify-between pointer-events-none z-20 gap-2 select-none">
      {/* ========================================================= */}
      {/* LEFT SIDE: Stage Title / Room Code & Checkpoint           */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Desktop Home Button */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="hidden md:flex p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-white transition active:scale-95 shadow-md cursor-pointer"
            title="Main Menu"
          >
            <Home className="w-4 h-4" />
          </button>
        )}

        {/* Room Code Badge (Multiplayer) */}
        {roomCode ? (
          <div className="bg-indigo-950/85 backdrop-blur-md border border-indigo-500/60 rounded-xl px-2.5 py-1 text-indigo-300 font-mono text-xs font-black shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>#{roomCode}</span>
          </div>
        ) : (
          /* Solo Stage Badge */
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-2.5 py-1 shadow-md flex items-center gap-2 text-white">
            <span className="font-bold text-xs tracking-wide text-slate-100 max-w-[100px] xs:max-w-[140px] sm:max-w-none truncate">
              {levelName}
            </span>
          </div>
        )}

        {/* Checkpoint Status Indicator (Desktop only to keep mobile clean) */}
        {activeCheckpoint && (
          <div
            className="hidden sm:flex bg-emerald-950/80 backdrop-blur-md border border-emerald-500/70 text-emerald-300 rounded-xl px-2 py-1 text-[11px] font-semibold items-center gap-1 shadow-md"
            title="Checkpoint Active"
          >
            <Flag className="w-3 h-3 text-emerald-400 animate-bounce" />
            <span>Checkpoint</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CENTER: Clean Micro-Stats (Coins & Timer)                 */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Coins Counter (Minimal & Clear) */}
        <div className="bg-amber-950/80 backdrop-blur-md border border-amber-500/60 rounded-xl px-2.5 py-1 text-amber-300 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-950/30">
          <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>
            {coinsCollected}/{totalCoins}
          </span>
        </div>

        {/* Timer (Visible on tablet/desktop, subtle on mobile) */}
        <div className="hidden xs:flex bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-2 py-1 text-slate-300 font-mono text-xs items-center gap-1 shadow-md">
          <Timer className="w-3.5 h-3.5 text-sky-400" />
          <span>{formatTime(timeElapsed)}</span>
        </div>

        {/* Deaths Counter (Desktop only to prevent clutter) */}
        <div className="hidden sm:flex bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-2 py-1 text-rose-300 font-semibold text-xs items-center gap-1 shadow-md">
          <Skull className="w-3.5 h-3.5 text-rose-400" />
          <span>{deaths}</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SIDE: Action Buttons                                */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
        {/* Mute Button (Fast 1-tap audio toggle on all devices) */}
        <button
          onClick={onToggleMute}
          className="p-1.5 sm:p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 transition active:scale-95 shadow-md cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Desktop-Only Quick Buttons */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* Touch Controls Toggle */}
          <button
            onClick={onToggleTouchControls}
            className={`p-2 backdrop-blur-md border rounded-xl transition active:scale-95 shadow-md cursor-pointer ${
              showTouchControls
                ? 'bg-indigo-600/80 border-indigo-400 text-white'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-400'
            }`}
            title="Toggle Touch Controls"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-white transition active:scale-95 shadow-md cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Quick Restart (Solo) */}
          {!isMultiplayer && (
            <button
              onClick={onRestart}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-amber-300 transition active:scale-95 shadow-md cursor-pointer"
              title="Restart Stage"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Solo Stages List */}
          {!isMultiplayer && (
            <button
              onClick={onOpenLevelSelect}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold tracking-wide transition active:scale-95 cursor-pointer shadow-md text-white"
              title="Select Stage"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stages</span>
            </button>
          )}
        </div>

        {/* Primary Menu / Pause Button (Mobile & Desktop) */}
        <button
          onClick={onPause}
          className="p-1.5 sm:p-2 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md border border-indigo-400/80 rounded-xl text-white transition active:scale-95 shadow-md cursor-pointer flex items-center gap-1"
          title="Game Menu & Settings"
          aria-label="Game Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
