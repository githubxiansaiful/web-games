'use client';

import React from 'react';
import { Package, Crosshair, UserCheck, Trophy, Calendar } from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

interface DuoSideMenuProps {
  onOpenModal: (modal: 'store' | 'loadout' | 'characters' | 'missions' | 'daily_rewards') => void;
}

export const DuoSideMenu: React.FC<DuoSideMenuProps> = ({ onOpenModal }) => {
  const handleClick = (modal: 'store' | 'loadout' | 'characters' | 'missions' | 'daily_rewards') => {
    duoAudio.playDash();
    onOpenModal(modal);
  };

  return (
    <div className="flex flex-col gap-1 xs:gap-1.5 sm:gap-2 select-none z-20 shrink-0">
      {/* 1. STORE */}
      <button
        onClick={() => handleClick('store')}
        className="group relative w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-amber-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
        title="Store & Crates"
      >
        {/* Red Notification Badge */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-600 text-white font-knight text-[8px] sm:text-[9px] flex items-center justify-center shadow-md animate-pulse">
          1
        </span>
        <Package className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-knight text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5">
          STORE
        </span>
      </button>

      {/* 2. LOADOUT */}
      <button
        onClick={() => handleClick('loadout')}
        className="group relative w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-cyan-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
        title="Weapons & Gear"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 fill-slate-200 group-hover:fill-cyan-300 group-hover:scale-110 transition-all">
          <path d="M3 7H17V10H21V12H17V13H15V19H12V13H7L5 15L3 14V7Z" />
        </svg>
        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-knight text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5">
          LOADOUT
        </span>
      </button>

      {/* 3. CHARACTERS */}
      <button
        onClick={() => handleClick('characters')}
        className="group relative w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-rose-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
        title="Hero Roster"
      >
        {/* Question Mark Badge */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-rose-600 text-white font-knight text-[8px] sm:text-[9px] flex items-center justify-center shadow-md">
          ?
        </span>
        <UserCheck className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-rose-400 group-hover:scale-110 transition-transform" />
        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-knight text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5">
          HEROES
        </span>
      </button>

      {/* 4. MISSIONS */}
      <button
        onClick={() => handleClick('missions')}
        className="group relative w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-yellow-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
        title="Missions & Bounties"
      >
        <Trophy className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-yellow-400 group-hover:scale-110 transition-transform" />
        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-knight text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5">
          MISSIONS
        </span>
      </button>

      {/* 5. DAILY REWARDS */}
      <button
        onClick={() => handleClick('daily_rewards')}
        className="group relative w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-emerald-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
        title="Daily Login Calendar"
      >
        <Calendar className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className="text-[6.5px] sm:text-[7.5px] md:text-[8px] font-knight text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5 text-center leading-none">
          DAILY
        </span>
      </button>
    </div>
  );
};
