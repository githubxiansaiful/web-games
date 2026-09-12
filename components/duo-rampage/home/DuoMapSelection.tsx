'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { Lock } from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import { toast } from '@/hooks/use-toast';

export interface MapCardData {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  unlocked: boolean;
}

const MAPS: MapCardData[] = [
  {
    id: 'abandoned_city',
    name: 'ABANDONED CITY',
    subtitle: 'FIRST BATTLE',
    image: '/images/duo-rampage/map_abandoned_city.png',
    unlocked: true,
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: true,
    loop: false,
  });

  useEffect(() => {
    if (!emblaApi) return;
    const activeIndex = MAPS.findIndex((m) => m.id === selectedMapId);
    if (activeIndex !== -1) {
      emblaApi.scrollTo(activeIndex);
    }
  }, [emblaApi, selectedMapId]);

  const handleMapClick = (map: MapCardData, index: number) => {
    emblaApi?.scrollTo(index);
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
    <div className="w-full select-none z-20 overflow-hidden py-1">
      {/* Embla Carousel Viewport - Clean edge-to-edge touch & mouse drag without arrow buttons */}
      <div className="overflow-hidden w-full cursor-grab active:cursor-grabbing px-2 sm:px-4" ref={emblaRef}>
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 md:gap-4 touch-pan-y">
          {MAPS.map((map, index) => {
            const isSelected = selectedMapId === map.id;

            return (
              <div
                key={map.id}
                onClick={() => handleMapClick(map, index)}
                className={`relative shrink-0 w-32 h-16 xs:w-38 xs:h-19 sm:w-46 sm:h-23 md:w-56 md:h-28 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group select-none ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 border border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.75)] opacity-100 z-10'
                    : 'border border-slate-700/80 hover:border-slate-500 opacity-75 hover:opacity-95 shadow-lg'
                }`}
              >
                {/* Background Map Graphic Artwork */}
                <div className="absolute inset-0 w-full h-full bg-slate-950">
                  <Image
                    src={map.image}
                    alt={map.name}
                    fill
                    className={`object-cover transition-transform duration-300 ${
                      map.unlocked ? 'group-hover:scale-105' : 'group-hover:scale-102'
                    }`}
                    sizes="(max-width: 768px) 180px, 260px"
                  />
                </div>

                {/* Subtle Top Gloss Reflection */}
                <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                {/* Content Overlay: Active Unlocked Card vs Locked Cards (Matches reference image) */}
                {map.unlocked ? (
                  /* Active Unlocked Map Card Content */
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-2 sm:p-2.5 pointer-events-none">
                    <span className="font-knight font-black text-xs xs:text-sm sm:text-base text-white tracking-wider uppercase leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                      {map.name}
                    </span>
                    <span className="font-knight font-bold text-[8px] xs:text-[9px] sm:text-[10px] text-cyan-400 tracking-wider uppercase mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                      {map.subtitle}
                    </span>
                  </div>
                ) : (
                  /* Locked Map Card Content (Centered Padlock + COMING SOON + Title) */
                  <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-1.5 text-center pointer-events-none">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200 drop-shadow mb-1" />
                    <span className="font-knight font-bold text-[8.5px] xs:text-[9.5px] sm:text-xs text-white tracking-wider uppercase leading-none drop-shadow">
                      COMING SOON
                    </span>
                    <span className="font-knight font-medium text-[7px] xs:text-[8px] sm:text-[9px] text-slate-300 tracking-wider uppercase mt-0.5 drop-shadow">
                      {map.name}
                    </span>
                  </div>
                )}

                {/* Cyan Neon Inset Glow on Selection */}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-cyan-400 rounded-xl sm:rounded-2xl pointer-events-none shadow-[inset_0_0_12px_rgba(6,182,212,0.4)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
