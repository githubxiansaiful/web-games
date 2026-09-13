'use client';

import React from 'react';
import { Star, Trophy, Clock, Coins, RotateCcw, ArrowRight, Menu } from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

interface ParkourVictoryModalProps {
  stats: {
    timeSeconds: number;
    coins: number;
    totalCoins: number;
    stars: number;
    secretEmblem: boolean;
    targetSeconds: number;
  };
  onPlayAgain: () => void;
  onExit: () => void;
}

export const ParkourVictoryModal: React.FC<ParkourVictoryModalProps> = ({
  stats,
  onPlayAgain,
  onExit,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  const isSpeedrunStar = stats.timeSeconds <= stats.targetSeconds;
  const isCoinStar = stats.coins >= 20;

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-slate-900/95 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden space-y-5">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none bg-amber-500/20" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none bg-cyan-500/20" />

        {/* Level Title & Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-widest uppercase mb-2">
            <Trophy className="w-3.5 h-3.5" />
            LEVEL 01 COMPLETED
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
            ROOFTOP INTRODUCTION
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Puran Dhaka Urban Traverse
          </p>
        </div>

        {/* Stars Earned Rating (1 to 3 Stars) */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[1, 2, 3].map((starIdx) => {
            const earned = starIdx <= stats.stars;
            return (
              <div
                key={starIdx}
                className={`flex flex-col items-center transition-all transform ${
                  earned ? 'scale-105' : 'opacity-35 scale-90'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-lg ${
                    earned
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 border-yellow-200 text-slate-950 shadow-amber-500/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-500'
                  }`}
                >
                  <Star className={`w-8 h-8 ${earned ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-300 mt-1.5">
                  {starIdx === 1 ? 'FINISH' : starIdx === 2 ? 'COINS ≥ 20' : `TIME ≤ ${stats.targetSeconds}s`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Performance Statistics Grid */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-left font-mono text-xs">
          {/* Time Taken */}
          <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="p-2 rounded-lg bg-sky-500/20 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">TIME</div>
              <div className="text-sm font-black text-white">
                {formatTime(stats.timeSeconds)}
              </div>
            </div>
          </div>

          {/* Coins Collected */}
          <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">COINS</div>
              <div className="text-sm font-black text-amber-300">
                {stats.coins} / {stats.totalCoins}
              </div>
            </div>
          </div>

          {/* Secret Emblem */}
          <div className="col-span-2 flex items-center justify-between p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="text-base">💎</span>
              Secret Emblem: <strong className="text-white">Rooftop Pioneer</strong>
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                stats.secretEmblem
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {stats.secretEmblem ? 'UNLOCKED' : 'NOT FOUND'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              duoAudio.playUiClick();
              onPlayAgain();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            REPLAY
          </button>

          <button
            onClick={() => {
              duoAudio.playUiClick();
              onExit();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            MENU
          </button>
        </div>
      </div>
    </div>
  );
};
