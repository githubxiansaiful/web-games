'use client';

import React from 'react';
import Image from 'next/image';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

export interface GameModeCardData {
  id: 'rampage' | 'parkour';
  name: string;
  subtitle: string;
  badge: string;
  image: string;
  accentColor: string;
}

const MODES: GameModeCardData[] = [
  {
    id: 'rampage',
    name: 'RAMPAGE CO-OP',
    subtitle: 'ARENA SHOOTER • SURVIVAL',
    badge: '💥 CO-OP ASSAULT',
    image: '/images/duo-rampage/map_abandoned_city.png',
    accentColor: 'from-red-600 to-amber-500',
  },
  {
    id: 'parkour',
    name: 'DHAKA PARKOUR',
    subtitle: '12 CAMPAIGN SECTORS • URBAN FLOW',
    badge: '🏃 SUMMER PARKOUR',
    image: '/images/duo-rampage/dhaka_uprising_bg.jpg',
    accentColor: 'from-cyan-500 to-sky-400',
  },
];

interface DuoModeSelectionSliderProps {
  selectedMode: 'rampage' | 'parkour';
  onSelectMode: (mode: 'rampage' | 'parkour') => void;
}

export const DuoModeSelectionSlider: React.FC<DuoModeSelectionSliderProps> = ({
  selectedMode,
  onSelectMode,
}) => {
  const handleSelect = (modeId: 'rampage' | 'parkour') => {
    if (modeId !== selectedMode) {
      duoAudio.playUiClick();
      onSelectMode(modeId);
    }
  };

  return (
    <div className="w-full relative bottom-[-15px] select-none z-20 overflow-hidden py-1">
      <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4">
        {MODES.map((item) => {
          const isSelected = selectedMode === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`relative shrink-0 w-40 h-20 xs:w-48 xs:h-24 sm:w-60 sm:h-20 md:w-72 md:h-25 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group select-none ${
                isSelected
                  ? item.id === 'parkour'
                    ? 'ring-2 ring-cyan-400 border border-cyan-300 shadow-[0_0_28px_rgba(6,182,212,0.85)] scale-105 opacity-100 z-10'
                    : 'ring-2 ring-amber-400 border border-amber-300 shadow-[0_0_28px_rgba(245,158,11,0.85)] scale-105 opacity-100 z-10'
                  : 'border border-slate-700/80 hover:border-slate-500 opacity-65 hover:opacity-90 shadow-lg scale-95'
              }`}
            >
              {/* Background Art */}
              <div className="absolute inset-0 w-full h-full bg-slate-950">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 240px, 320px"
                />
              </div>

              {/* Top Gloss Reflection */}
              <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

              {/* Mode Badge Tag */}
              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <span
                  className={`px-2 py-0.5 rounded-full font-knight font-black text-[8px] sm:text-[9.5px] uppercase tracking-wider shadow-md backdrop-blur-xs ${
                    isSelected
                      ? item.id === 'parkour'
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950/75 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              </div>

              {/* Bottom Gradient & Text Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col justify-end p-2 sm:p-3 pointer-events-none">
                {item.id === 'rampage' ? (
                  <img
                    src="/images/duo-rampage/duo_rampage_logo.png"
                    alt="DUO RAMPAGE"
                    className="h-6 xs:h-7 sm:h-8 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] -ml-0.5"
                  />
                ) : (
                  <span className="font-knight font-black text-sm xs:text-base sm:text-lg text-white tracking-wider uppercase leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {item.name}
                  </span>
                )}
                <span
                  className={`font-knight font-bold text-[8.5px] xs:text-[9.5px] sm:text-[11px] tracking-wider uppercase mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] ${
                    item.id === 'parkour' ? 'text-cyan-400' : 'text-amber-400'
                  }`}
                >
                  {item.subtitle}
                </span>
              </div>

              {/* Active Selection Inset Glow */}
              {isSelected && (
                <div
                  className={`absolute inset-0 border-2 rounded-xl sm:rounded-2xl pointer-events-none ${
                    item.id === 'parkour'
                      ? 'border-cyan-400 shadow-[inset_0_0_14px_rgba(6,182,212,0.4)]'
                      : 'border-amber-400 shadow-[inset_0_0_14px_rgba(245,158,11,0.4)]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
