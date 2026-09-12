'use client';

import React from 'react';
import { Settings, Gamepad2, Users, Crown, ArrowLeft } from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

interface DuoTopRightMenuProps {
  onlineCount?: number;
  onOpenModal: (modal: 'settings' | 'how_to_play' | 'friends' | 'leaderboard') => void;
  onExit?: () => void;
}

export const DuoTopRightMenu: React.FC<DuoTopRightMenuProps> = ({
  onlineCount = 1248,
  onOpenModal,
  onExit,
}) => {
  const handleClick = (modal: 'settings' | 'how_to_play' | 'friends' | 'leaderboard') => {
    duoAudio.playDash();
    onOpenModal(modal);
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 select-none shrink-0">
      {/* Exit Button back to Arcade Home */}
      {onExit && (
        <button
          onClick={onExit}
          className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/75 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-xl text-xs font-knight text-slate-300 hover:text-white flex items-center gap-1 shadow-xl transition active:scale-95 cursor-pointer"
          title="Return to Xian's Game World"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      )}

      {/* Settings */}
      <button
        onClick={() => handleClick('settings')}
        className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/75 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-200 hover:text-white text-xs font-knight tracking-wider transition active:scale-95 shadow-md cursor-pointer"
        title="Settings"
      >
        <Settings className="w-3.5 h-3.5 text-slate-300" />
        <span className="hidden lg:inline">SETTINGS</span>
      </button>

      {/* How To Play */}
      <button
        onClick={() => handleClick('how_to_play')}
        className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/75 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-200 hover:text-white text-xs font-knight tracking-wider transition active:scale-95 shadow-md cursor-pointer"
        title="How to Play"
      >
        <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden lg:inline">GUIDE</span>
      </button>

      {/* Friends */}
      <button
        onClick={() => handleClick('friends')}
        className="hidden xs:flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/75 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-200 hover:text-white text-xs font-knight tracking-wider transition active:scale-95 shadow-md cursor-pointer"
        title="Friends & Squad"
      >
        <Users className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden lg:inline">FRIENDS</span>
      </button>

      {/* Leaderboard */}
      <button
        onClick={() => handleClick('leaderboard')}
        className="hidden xs:flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/75 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-200 hover:text-white text-xs font-knight tracking-wider transition active:scale-95 shadow-md cursor-pointer"
        title="Global Leaderboard"
      >
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden lg:inline">RANKS</span>
      </button>

      {/* Online Count Indicator */}
      <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-slate-950/80 border border-emerald-500/30 rounded-full shadow-inner font-knight text-[10px] sm:text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-300">
          <span className="hidden md:inline text-slate-400 mr-1">Online:</span>
          <span className="text-emerald-400">{onlineCount.toLocaleString()}</span>
        </span>
      </div>
    </div>
  );
};
