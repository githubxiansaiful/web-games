'use client';

import React from 'react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import { DuoCrossedRiflesIcon, DuoSquadIcon, DuoGlobeIcon } from '../ui/DuoIcons';

interface DuoPrimaryButtonsProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onQuickPlay: () => void;
}

export const DuoPrimaryButtons: React.FC<DuoPrimaryButtonsProps> = ({
  onCreateRoom,
  onJoinRoom,
  onQuickPlay,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 select-none z-20 w-full max-w-2xl px-2">
      {/* 1. JOIN ROOM (Blue / Cyan 3D Gaming Button) - Left on Landscape, Left in row 2 on Mobile */}
      <div className="order-2 sm:order-1 flex items-center justify-center gap-2 sm:gap-3 w-full max-w-[280px] sm:max-w-none sm:w-auto flex-1">
        <button
          onClick={() => {
            duoAudio.playDash();
            onJoinRoom();
          }}
          className="flex-1 max-w-[135px] sm:max-w-[170px] md:max-w-[200px] h-10 xs:h-11 sm:h-13 md:h-15 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border-t-2 border-cyan-200/90 border-b-4 sm:border-b-5 border-[#075985] shadow-[0_6px_20px_rgba(2,132,199,0.5)] flex items-center justify-center gap-1.5 sm:gap-2 text-white transition-all duration-100 hover:brightness-110 active:translate-y-1 active:border-b-2 cursor-pointer relative overflow-hidden group shrink-0"
        >
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
          <DuoSquadIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-105 transition-transform shrink-0 drop-shadow" />
          <span className="font-knight font-bold text-[11px] xs:text-xs sm:text-sm md:text-base tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
            JOIN ROOM
          </span>
        </button>

        {/* 3. QUICK PLAY (Purple 3D Gaming Button) - Right on Landscape, Right in row 2 on Mobile */}
        <button
          onClick={() => {
            duoAudio.playDash();
            onQuickPlay();
          }}
          className="sm:hidden flex-1 max-w-[135px] h-10 xs:h-11 rounded-xl bg-gradient-to-b from-[#c084fc] via-[#9333ea] to-[#6b21a8] border-t-2 border-purple-200/90 border-b-4 border-[#4c1d95] shadow-[0_6px_20px_rgba(147,51,234,0.5)] flex items-center justify-center gap-1.5 text-white transition-all duration-100 hover:brightness-110 active:translate-y-1 active:border-b-2 cursor-pointer relative overflow-hidden group shrink-0"
        >
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
          <DuoGlobeIcon className="w-4 h-4 text-white group-hover:scale-105 transition-transform shrink-0 drop-shadow" />
          <div className="flex flex-col items-start leading-none truncate">
            <span className="font-knight font-bold text-[11px] xs:text-xs tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              QUICK PLAY
            </span>
            <span className="font-knight text-[7.5px] text-purple-200 uppercase tracking-widest mt-0.5">
              (BETA)
            </span>
          </div>
        </button>
      </div>

      {/* 2. PLAY / CREATE ROOM (Center Golden Hero Button) */}
      <button
        onClick={() => {
          duoAudio.playCountdown(0);
          onCreateRoom();
        }}
        className="order-1 sm:order-2 w-full max-w-[280px] sm:max-w-[240px] md:max-w-[280px] h-13 xs:h-14 sm:h-15 md:h-18 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#ffea38] via-[#f59e0b] to-[#d97706] border-t-2 border-yellow-100 border-b-5 sm:border-b-6 border-[#78350f] shadow-[0_10px_35px_rgba(245,158,11,0.65)] flex items-center justify-center gap-2.5 sm:gap-3 text-slate-950 transition-all duration-100 hover:brightness-110 active:translate-y-1.5 active:border-b-2 cursor-pointer relative overflow-hidden group shrink-0"
      >
        {/* Top Bevel Highlight */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none" />

        {/* Crossed Rifles Icon */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-slate-950/15 border border-yellow-950/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0 p-1">
          <DuoCrossedRiflesIcon className="w-full h-full text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]" />
        </div>

        <div className="flex flex-col items-start leading-none">
          <span className="font-knight font-black text-xl sm:text-2xl md:text-3xl tracking-wide uppercase text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]">
            PLAY
          </span>
          <span className="font-knight font-extrabold text-[9px] sm:text-[10px] md:text-[11px] tracking-widest uppercase text-[#78350f] mt-0.5">
            CREATE ROOM
          </span>
        </div>
      </button>

      {/* 3. QUICK PLAY (Desktop / Tablet Landscape position: right) */}
      <button
        onClick={() => {
          duoAudio.playDash();
          onQuickPlay();
        }}
        className="hidden sm:flex order-3 flex-1 max-w-[170px] md:max-w-[200px] h-13 md:h-15 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#c084fc] via-[#9333ea] to-[#6b21a8] border-t-2 border-purple-200/90 border-b-4 sm:border-b-5 border-[#4c1d95] shadow-[0_6px_20px_rgba(147,51,234,0.5)] items-center justify-center gap-1.5 sm:gap-2 text-white transition-all duration-100 hover:brightness-110 active:translate-y-1 active:border-b-2 cursor-pointer relative overflow-hidden group shrink-0"
      >
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
        <DuoGlobeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-105 transition-transform shrink-0 drop-shadow" />
        <div className="flex flex-col items-start leading-none truncate">
          <span className="font-knight font-bold text-xs sm:text-sm md:text-base tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            QUICK PLAY
          </span>
          <span className="font-knight text-[8px] sm:text-[9px] text-purple-200 uppercase tracking-widest mt-0.5">
            (BETA)
          </span>
        </div>
      </button>
    </div>
  );
};
