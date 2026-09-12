'use client';

import React from 'react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import {
  DuoChestIcon,
  DuoWeaponIcon,
  DuoHelmetIcon,
  DuoTrophyIcon,
  DuoCalendarIcon,
} from '../ui/DuoIcons';

interface DuoSideMenuProps {
  onOpenModal: (modal: 'store' | 'loadout' | 'characters' | 'missions' | 'daily_rewards') => void;
  orientation?: 'vertical' | 'horizontal';
}

export const DuoSideMenu: React.FC<DuoSideMenuProps> = ({
  onOpenModal,
  orientation = 'vertical',
}) => {
  const handleClick = (modal: 'store' | 'loadout' | 'characters' | 'missions' | 'daily_rewards') => {
    duoAudio.playDash();
    onOpenModal(modal);
  };

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`flex ${
        isVertical ? 'flex-col' : 'flex-row'
      } gap-1 xs:gap-1.5 sm:gap-2 select-none z-20 shrink-0 max-h-full`}
    >
      {/* 1. STORE */}
      <button
        type="button"
        onClick={() => handleClick('store')}
        className="group relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-amber-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
        title="Store & Crates"
      >
        {/* Red Notification Badge */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-600 text-white font-knight font-bold text-[8px] sm:text-[9px] flex items-center justify-center shadow-md animate-pulse">
          1
        </span>
        <DuoChestIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="text-[6.5px] xs:text-[7px] sm:text-[8px] md:text-[9px] font-knight font-bold text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5 leading-none">
          STORE
        </span>
      </button>

      {/* 2. LOADOUT */}
      <button
        type="button"
        onClick={() => handleClick('loadout')}
        className="group relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-cyan-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
        title="Weapons & Loadout"
      >
        <DuoWeaponIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200 group-hover:text-cyan-300 group-hover:scale-110 transition-transform" />
        <span className="text-[6.5px] xs:text-[7px] sm:text-[8px] md:text-[9px] font-knight font-bold text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5 leading-none">
          LOADOUT
        </span>
      </button>

      {/* 3. CHARACTERS */}
      <button
        type="button"
        onClick={() => handleClick('characters')}
        className="group relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-rose-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
        title="Hero Roster"
      >
        {/* Question Mark Badge */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-rose-600 text-white font-knight font-bold text-[8px] sm:text-[9px] flex items-center justify-center shadow-md">
          ?
        </span>
        <DuoHelmetIcon className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 group-hover:scale-110 transition-transform" />
        <span className="text-[6.5px] xs:text-[7px] sm:text-[8px] md:text-[9px] font-knight font-bold text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5 leading-none">
          HEROES
        </span>
      </button>

      {/* 4. MISSIONS */}
      <button
        type="button"
        onClick={() => handleClick('missions')}
        className="group relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-yellow-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
        title="Missions & Bounties"
      >
        <DuoTrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
        <span className="text-[6.5px] xs:text-[7px] sm:text-[8px] md:text-[9px] font-knight font-bold text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5 leading-none">
          MISSIONS
        </span>
      </button>

      {/* 5. DAILY REWARDS */}
      <button
        type="button"
        onClick={() => handleClick('daily_rewards')}
        className="group relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 hover:from-slate-850 hover:to-slate-900 border border-slate-700/80 hover:border-emerald-400/60 shadow-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
        title="Daily Login Calendar"
      >
        <DuoCalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className="text-[6.5px] xs:text-[7px] sm:text-[8px] md:text-[9px] font-knight font-bold text-slate-300 group-hover:text-white uppercase tracking-tighter mt-0.5 leading-none text-center">
          DAILY
        </span>
      </button>
    </div>
  );
};
