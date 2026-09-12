'use client';

import React from 'react';
import { Users, Globe } from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

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
      {/* 1. PLAY / CREATE ROOM (Hero Button - First on mobile portrait, Center on landscape) */}
      <button
        onClick={() => {
          duoAudio.playCountdown(0);
          onCreateRoom();
        }}
        className="order-1 sm:order-2 w-full max-w-[260px] sm:max-w-[240px] md:max-w-[270px] h-12 xs:h-13 sm:h-15 md:h-18 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#b45309] border-t-2 border-yellow-200 border-b-4 sm:border-b-6 border-[#78350f] shadow-[0_8px_24px_rgba(217,119,6,0.5)] flex items-center justify-center gap-2.5 sm:gap-3 text-slate-950 transition-all duration-100 hover:brightness-110 active:translate-y-1.5 active:border-b-2 cursor-pointer relative overflow-hidden group shrink-0"
      >
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

        {/* Crossed Rifles Icon */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-xl bg-slate-950/90 border border-yellow-400/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0 p-1">
          <svg viewBox="0 0 24 24" className="w-full h-full fill-amber-400 drop-shadow">
            <path d="M4 20L8 16L9 17L6 20L4 20ZM9 15L17 7L19 7L20 4L18 4L16 6L14 8L10 12L9 15ZM15 11L18 14L17 15L14 12L15 11Z" />
            <path d="M20 20L16 16L15 17L18 20L20 20ZM15 15L7 7L5 7L4 4L6 4L8 6L10 8L14 12L15 15ZM9 11L6 14L7 15L10 12L9 11Z" />
          </svg>
        </div>

        <div className="flex flex-col items-start leading-none">
          <span className="font-knight text-lg sm:text-xl md:text-2xl tracking-wide uppercase text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]">
            PLAY
          </span>
          <span className="font-knight text-[8px] sm:text-[9px] md:text-[10px] tracking-widest uppercase text-amber-950 mt-0.5">
            CREATE ROOM
          </span>
        </div>
      </button>

      {/* Row wrapper on mobile for Join & Quick Play, direct children on sm: */}
      <div className="order-2 sm:order-1 flex items-center justify-center gap-2 sm:gap-3 w-full max-w-[260px] sm:max-w-none sm:w-auto flex-1">
        {/* 2. JOIN ROOM (Cyan / Blue 3D Button) */}
        <button
          onClick={() => {
            duoAudio.playDash();
            onJoinRoom();
          }}
          className="flex-1 max-w-[130px] sm:max-w-[170px] md:max-w-[190px] h-10 xs:h-11 sm:h-13 md:h-15 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#075985] border-t-2 border-cyan-300/80 border-b-3 sm:border-b-4 border-[#0c4a6e] shadow-[0_6px_16px_rgba(2,132,199,0.35)] flex items-center justify-center gap-1.5 sm:gap-2 text-white transition-all duration-100 hover:brightness-110 active:translate-y-1 active:border-b-2 cursor-pointer relative overflow-hidden group shrink-0"
        >
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-cyan-200 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-knight text-[10px] xs:text-[11px] sm:text-xs md:text-sm tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] truncate">
            JOIN ROOM
          </span>
        </button>

        {/* 3. QUICK PLAY (Purple / Violet 3D Button) */}
        <button
          onClick={() => {
            duoAudio.playDash();
            onQuickPlay();
          }}
          className="flex-1 max-w-[130px] sm:max-w-[170px] md:max-w-[190px] h-10 xs:h-11 sm:h-13 md:h-15 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-b from-[#9333ea] via-[#7e22ce] to-[#6b21a8] border-t-2 border-purple-300/80 border-b-3 sm:border-b-4 border-[#581c87] shadow-[0_6px_16px_rgba(147,51,234,0.35)] flex items-center justify-center gap-1.5 sm:gap-2 text-white transition-all duration-100 hover:brightness-110 active:translate-y-1 active:border-b-2 cursor-pointer relative overflow-hidden group shrink-0"
        >
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-200 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col items-start leading-none truncate">
            <span className="font-knight text-[10px] xs:text-[11px] sm:text-xs md:text-sm tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              QUICK PLAY
            </span>
            <span className="font-knight text-[7px] sm:text-[8px] text-purple-300 uppercase tracking-widest mt-0.5">
              (BETA)
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
