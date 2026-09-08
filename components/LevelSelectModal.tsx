'use client';

import React from 'react';
import { LevelData, LevelProgress } from '@/lib/types';
import { Star, Play, Trophy, Clock, Coins, X } from 'lucide-react';

interface LevelSelectModalProps {
  levels: LevelData[];
  currentLevelId: number;
  progress: Record<number, LevelProgress>;
  isOpen: boolean;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  levels,
  currentLevelId,
  progress,
  isOpen,
  onSelectLevel,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === Infinity) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative text-white max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>ADVENTURE SELECT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Choose Your Stage</h2>
          <p className="text-slate-400 text-sm mt-1">Select a world to jump, dodge hazards, and collect coins!</p>
        </div>

        {/* Level Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {levels.map((lvl) => {
            const prog = progress[lvl.id] || { stars: 0, bestTime: 0, coinsFound: 0, completed: false };
            const isCurrent = lvl.id === currentLevelId;

            return (
              <div
                key={lvl.id}
                className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all group hover:scale-[1.02] cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/50'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                }`}
                onClick={() => onSelectLevel(lvl.id)}
              >
                {/* Visual Theme Header */}
                <div
                  className="w-full h-16 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${lvl.theme.skyGradient[0]}, ${lvl.theme.groundTopColor})`,
                  }}
                >
                  <span className="text-xl font-black text-white/90 drop-shadow">STAGE {lvl.id}</span>
                  {isCurrent && (
                    <div className="absolute top-1 right-1 bg-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow">
                      Current
                    </div>
                  )}
                </div>

                {/* Level Title & Subtitle */}
                <div>
                  <h3 className="font-bold text-base text-slate-100 group-hover:text-sky-300 transition">
                    {lvl.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3">{lvl.subtitle}</p>
                </div>

                {/* Level Progress Stats */}
                <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-700/60 pt-2.5">
                  {/* Stars */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Stars:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            starIdx <= prog.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Best Time */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-sky-400" />
                      Best:
                    </span>
                    <span className="font-mono text-slate-200">
                      {prog.bestTime ? formatTime(prog.bestTime) : '--:--'}
                    </span>
                  </div>

                  {/* Coins */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Coins className="w-3 h-3 text-amber-400" />
                      Coins:
                    </span>
                    <span className="font-mono text-slate-200">
                      {prog.coinsFound} / {lvl.coins.length}
                    </span>
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLevel(lvl.id);
                  }}
                  className={`mt-4 w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                    isCurrent
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isCurrent ? 'Continue Stage' : 'Play Stage'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Tips */}
        <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 text-center text-xs text-slate-400 flex flex-wrap justify-center gap-4">
          <span>💡 Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono">W / Space</kbd> twice to Double Jump</span>
          <span>💡 Stand on Moving Platforms to cross spike chasms safely</span>
        </div>
      </div>
    </div>
  );
};
