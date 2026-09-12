'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { Lock, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: false,
    loop: false,
    skipSnaps: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const activeIndex = MAPS.findIndex((m) => m.id === selectedMapId);
    if (activeIndex !== -1) {
      emblaApi.scrollTo(activeIndex);
    }
  }, [emblaApi, selectedMapId]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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

  const showNav = canScrollPrev || canScrollNext;

  return (
    <div className="relative w-full select-none z-20 flex items-center justify-center max-w-6xl mx-auto px-1 sm:px-2">
      {/* Previous Arrow Button */}
      {showNav && (
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Previous map"
          className="shrink-0 p-1.5 sm:p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer shadow-lg z-10 mr-1 sm:mr-2 active:scale-90"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      )}

      {/* Embla Carousel Viewport */}
      <div className="overflow-hidden w-full py-1.5" ref={emblaRef}>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 touch-pan-y">
          {MAPS.map((map, index) => {
            const isSelected = selectedMapId === map.id;

            return (
              <div
                key={map.id}
                onClick={() => handleMapClick(map, index)}
                className={`relative shrink-0 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group select-none ${
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

                {/* Locked Overlay Badge */}
                {!map.unlocked && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                    <div className="px-1.5 py-0.5 rounded-lg bg-slate-950/85 border border-slate-700 flex items-center gap-1 shadow-md">
                      <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                      <span className="text-[7.5px] sm:text-[9px] font-knight font-bold text-slate-300 uppercase tracking-tight">
                        LOCKED
                      </span>
                    </div>
                  </div>
                )}

                {/* Cyan Active Outline Glow */}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-cyan-400 rounded-xl sm:rounded-2xl pointer-events-none shadow-[inset_0_0_12px_rgba(6,182,212,0.4)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Arrow Button */}
      {showNav && (
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Next map"
          className="shrink-0 p-1.5 sm:p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer shadow-lg z-10 ml-1 sm:ml-2 active:scale-90"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
  );
};
