'use client';

import React from 'react';
import { Star, Trophy, RotateCcw, ArrowRight, Layers, Coins, Clock, Skull } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  levelName: string;
  hasNextLevel: boolean;
  coinsCollected: number;
  totalCoins: number;
  timeElapsed: number;
  parTime: number;
  deaths: number;
  stars: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelect: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  levelName,
  hasNextLevel,
  coinsCollected,
  totalCoins,
  timeElapsed,
  parTime,
  deaths,
  stars,
  onNextLevel,
  onReplay,
  onOpenLevelSelect,
}) => {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
  };

  const isTimeBonus = timeElapsed <= parTime;
  const isAllCoins = coinsCollected === totalCoins;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-250">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-md w-full p-4 sm:p-7 shadow-2xl text-center text-white relative overflow-y-auto max-h-[92vh]">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Victory Icon Badge */}
        <div className="inline-flex p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 mb-3 shadow-lg shadow-amber-500/20 animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white mb-1">STAGE CLEARED!</h2>
        <p className="text-slate-300 font-medium text-sm mb-5">{levelName}</p>

        {/* Star Rating Display */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-2 rounded-2xl border transition-all duration-300 ${
                starIdx <= stars
                  ? 'bg-amber-400/20 border-amber-400 text-amber-400 scale-110 shadow-lg shadow-amber-400/30'
                  : 'bg-slate-800/60 border-slate-700 text-slate-600 scale-95'
              }`}
            >
              <Star className={`w-7 h-7 sm:w-8 sm:h-8 ${starIdx <= stars ? 'fill-amber-400' : ''}`} />
            </div>
          ))}
        </div>

        {/* Level Stats Breakdown */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 mb-6 space-y-3 text-left">
          {/* Coins */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Coins Collected</span>
            </div>
            <div className="flex items-center gap-2 font-bold font-mono">
              <span className={isAllCoins ? 'text-emerald-400' : 'text-amber-300'}>
                {coinsCollected} / {totalCoins}
              </span>
              {isAllCoins && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/40">
                  PERFECT
                </span>
              )}
            </div>
          </div>

          {/* Time Taken */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Clear Time</span>
            </div>
            <div className="flex items-center gap-2 font-bold font-mono">
              <span className={isTimeBonus ? 'text-emerald-400' : 'text-sky-300'}>
                {formatTime(timeElapsed)}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                (Par: {formatTime(parTime)})
              </span>
            </div>
          </div>

          {/* Deaths */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Skull className="w-4 h-4 text-rose-400" />
              <span>Deaths</span>
            </div>
            <span className="font-bold font-mono text-rose-300">
              {deaths} {deaths === 0 ? '🏆 Flawless!' : ''}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {hasNextLevel && (
            <button
              onClick={onNextLevel}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl font-bold text-sm text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onReplay}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold text-xs sm:text-sm text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Replay</span>
            </button>

            <button
              onClick={onOpenLevelSelect}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold text-xs sm:text-sm text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Stages</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
