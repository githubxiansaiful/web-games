'use client';

import React from 'react';
import { Settings, Gamepad2, Users, Crown, ArrowLeft } from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

interface DuoTopRightMenuProps {
  onOpenModal: (modal: 'settings' | 'how_to_play' | 'friends' | 'leaderboard') => void;
  onExit?: () => void;
}

export const DuoTopRightMenu: React.FC<DuoTopRightMenuProps> = ({
  onOpenModal,
  onExit,
}) => {
  const handleClick = (modal: 'settings' | 'how_to_play' | 'friends' | 'leaderboard') => {
    duoAudio.playDash();
    onOpenModal(modal);
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 select-none shrink-0">
      {/* Exit Button back to Arcade Home */}
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-400/50 rounded-xl text-xs font-knight font-bold text-slate-300 hover:text-white flex items-center gap-1 shadow-xl transition active:scale-95 cursor-pointer"
          title="Return to Xian's Game World"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">EXIT</span>
        </button>
      )}

      {/* Settings */}
      <button
        type="button"
        onClick={() => handleClick('settings')}
        className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-200 hover:text-white text-xs font-knight font-bold tracking-wider transition active:scale-95 shadow-md cursor-pointer"
        title="Settings"
      >
        <Settings className="w-3.5 h-3.5 text-slate-300" />
        <span className="hidden lg:inline">SETTINGS</span>
      </button>

      {/* How To Play */}
      <button
        type="button"
        onClick={() => handleClick('how_to_play')}
        className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-200 hover:text-white text-xs font-knight font-bold tracking-wider transition active:scale-95 shadow-md cursor-pointer"
        title="How to Play"
      >
        <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden lg:inline">HOW TO PLAY</span>
      </button>

      {/* Friends */}
      <button
        type="button"
        onClick={() => handleClick('friends')}
        className="hidden xs:flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-200 hover:text-white text-xs font-knight font-bold tracking-wider transition active:scale-95 shadow-md cursor-pointer"
        title="Friends & Squad"
      >
        <Users className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden lg:inline">FRIENDS</span>
      </button>

      {/* Leaderboard */}
      <button
        type="button"
        onClick={() => handleClick('leaderboard')}
        className="hidden xs:flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-200 hover:text-white text-xs font-knight font-bold tracking-wider transition active:scale-95 shadow-md cursor-pointer"
        title="Global Leaderboard"
      >
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden lg:inline">LEADERBOARD</span>
      </button>
    </div>
  );
};
