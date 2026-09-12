'use client';

import React from 'react';
import Image from 'next/image';

interface DuoPlayerProfileProps {
  name?: string;
  avatar?: string;
  level?: number;
  xpPercent?: number;
}

export const DuoPlayerProfile: React.FC<DuoPlayerProfileProps> = ({
  name = 'RAMPAGE#001',
  avatar,
  level = 1,
  xpPercent = 65,
}) => {
  return (
    <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1 pr-2.5 sm:p-1.5 sm:pr-3.5 rounded-xl sm:rounded-2xl border border-slate-700/80 shadow-2xl select-none group hover:border-amber-500/50 transition shrink-0">
      {/* Avatar Portrait with Golden Rim Frame */}
      <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden border-2 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)] relative bg-slate-900 shrink-0">
        <Image
          src={avatar || "/images/duo-rampage/avatar_hero.png"}
          alt="Player Avatar"
          fill
          className="object-cover"
          sizes="44px"
          priority
        />
      </div>

      {/* Name, Level, XP Bar */}
      <div className="flex flex-col min-w-[70px] xs:min-w-[85px] sm:min-w-[110px]">
        <span className="font-knight font-black text-[11px] xs:text-xs sm:text-sm text-white tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">
          {name}
        </span>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-knight font-bold text-[8px] xs:text-[8.5px] sm:text-[10px] text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40">
            LV.{level}
          </span>

          {/* Glowing XP Progress Tube */}
          <div className="flex-1 h-1.5 sm:h-2 bg-slate-900 rounded-full border border-slate-700/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
