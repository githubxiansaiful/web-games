'use client';

import React from 'react';
import Image from 'next/image';
import { Lock, Sparkles } from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import { toast } from '@/hooks/use-toast';

export interface MapCardData {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  unlocked: boolean;
  tag?: string;
}

const MAPS: MapCardData[] = [
  {
    id: 'abandoned_city',
    name: 'ABANDONED CITY',
    subtitle: 'FIRST BATTLE',
    image: '/images/duo-rampage/map_abandoned_city.png',
    unlocked: true,
    tag: 'ACTIVE ZONE',
  },
  {
    id: 'jungle_base',
    name: 'JUNGLE BASE',
    subtitle: 'COMING SOON',
    image: '/images/duo-rampage/map_jungle_base.png',
    unlocked: false,
  },
  {
    id: 'frozen_outpost',
    name: 'FROZEN OUTPOST',
    subtitle: 'COMING SOON',
    image: '/images/duo-rampage/map_frozen_outpost.png',
    unlocked: false,
  },
  {
    id: 'desert_stronghold',
    name: 'DESERT STRONGHOLD',
    subtitle: 'COMING SOON',
    image: '/images/duo-rampage/map_desert_stronghold.png',
    unlocked: false,
  },
  {
    id: 'more_worlds',
    name: 'MORE WORLDS',
    subtitle: 'COMING SOON',
    image: '/images/duo-rampage/map_more_worlds.png',
    unlocked: false,
  },
];

interface DuoMapSelectionProps {
  selectedMapId?: string;
  onSelectMap?: (id: string) => void;
}

export const DuoMapSelection: React.FC<DuoMapSelectionProps> = ({
  selectedMapId = 'abandoned_city',
  onSelectMap,
}) => {
  const handleMapClick = (map: MapCardData) => {
    if (map.unlocked) {
      duoAudio.playUiClick();
      onSelectMap?.(map.id);
      toast({
        title: 'DEPLOYMENT ZONE',
        description: `Zone selected: ${map.name}`,
        variant: 'amber',
      });
    } else {
      duoAudio.playUiClose();
      toast({
        title: 'ZONE LOCKED',
        description: `${map.name} unlocks in the next story chapter!`,
        variant: 'default',
      });
    }
  };

  return (
    <div className="w-full select-none z-20 overflow-hidden">
      {/* Cards Horizontal Carousel */}
      <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 md:gap-3.5 overflow-x-auto no-scrollbar py-1 px-3 max-w-full snap-x touch-pan-x">
        {MAPS.map((map) => {
          const isSelected = selectedMapId === map.id;

          return (
            <div
              key={map.id}
              onClick={() => handleMapClick(map)}
              className={`relative shrink-0 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 snap-center group ${
                isSelected
                  ? 'w-28 h-14 xs:w-34 xs:h-17 sm:w-44 sm:h-22 md:w-54 md:h-27 ring-2 ring-cyan-400 border border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.7)] scale-105 z-10'
                  : 'w-24 h-12 xs:w-28 xs:h-14 sm:w-36 sm:h-18 md:w-44 md:h-22 opacity-75 hover:opacity-100 border border-slate-700/80 hover:border-slate-500 shadow-md hover:scale-102'
              }`}
            >
              {/* Map Card Graphic Asset */}
              <div className="absolute inset-0 w-full h-full bg-slate-900">
                <Image
                  src={map.image}
                  alt={map.name}
                  fill
                  className={`object-cover transition-transform duration-300 ${
                    map.unlocked ? 'group-hover:scale-105' : 'group-hover:scale-102'
                  }`}
                  sizes="(max-width: 768px) 160px, 240px"
                />
              </div>

              {/* Gloss subtle top highlight */}
              <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

              {/* Cyan Active Outline Glow */}
              {isSelected && (
                <div className="absolute inset-0 border-2 border-cyan-400 rounded-2xl pointer-events-none shadow-[inset_0_0_12px_rgba(6,182,212,0.4)]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
