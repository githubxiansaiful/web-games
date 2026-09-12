'use client';

import React from 'react';
import Image from 'next/image';

interface DuoPlayerProfileProps {
  name?: string;
  level?: number;
  xpPercent?: number;
}

export const DuoPlayerProfile: React.FC<DuoPlayerProfileProps> = ({
  name = 'RAMPAGE#001',
  level = 1,
  xpPercent = 65,
}) => {
  return (
    <div className="flex items-center gap-2 bg-slate-950/75 backdrop-blur-md p-1 pr-2.5 sm:p-1.5 sm:pr-4 rounded-xl sm:rounded-2xl border border-slate-800/80 shadow-2xl select-none group hover:border-amber-500/50 transition shrink-0">
      {/* Avatar Portrait with Golden Border */}
      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden border-2 border-amber-400 shadow-md relative bg-slate-900 shrink-0">
        <Image
          src="/images/duo-rampage/avatar_hero.png"
          alt="Player Avatar"
          fill
          className="object-cover"
          sizes="48px"
          priority
        />
      </div>

      {/* Name, Level, XP Bar */}
      <div className="flex flex-col min-w-[75px] sm:min-w-[110px]">
        <div className="flex items-center justify-between">
          <span className="font-knight text-xs sm:text-sm text-white tracking-wider uppercase drop-shadow">
            {name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-knight text-[9px] sm:text-[10px] text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40">
            LV.{level}
          </span>

          {/* XP Progress Bar */}
          <div className="flex-1 h-1.5 sm:h-2 bg-slate-900 rounded-full border border-slate-700/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
