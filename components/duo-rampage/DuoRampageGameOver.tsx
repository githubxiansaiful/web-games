'use client';

import React from 'react';
import { Trophy, Skull, RotateCcw, Home, Sparkles, Flame } from 'lucide-react';

interface DuoRampageGameOverProps {
  isVictory: boolean;
  stats: {
    score: number;
    kills: number;
    maxCombo: number;
    wave: number;
  };
  onPlayAgain: () => void;
  onExit: () => void;
}

export const DuoRampageGameOver: React.FC<DuoRampageGameOverProps> = ({
  isVictory,
  stats,
  onPlayAgain,
  onExit,
}) => {
  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950/95 backdrop-blur-md text-white flex flex-col items-center justify-center p-6 select-none z-50">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-7 text-center shadow-2xl relative overflow-hidden space-y-5">
        {/* Glow Halo */}
        <div
          className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
            isVictory ? 'bg-amber-500/20' : 'bg-red-600/20'
          }`}
        />

        {/* Icon & Title */}
        <div className="flex flex-col items-center">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl mb-3 ${
              isVictory ? 'bg-amber-500 text-slate-950 shadow-amber-500/30' : 'bg-red-600 text-white shadow-red-600/30'
            }`}
          >
            {isVictory ? <Trophy className="w-10 h-10" /> : <Skull className="w-10 h-10" />}
          </div>

          <h2
            className={`text-3xl sm:text-4xl font-black tracking-tight leading-none ${
              isVictory ? 'text-amber-400' : 'text-red-500'
            }`}
          >
            {isVictory ? 'VICTORY ACHIEVED!' : 'TEAM DEFEATED!'}
          </h2>
          <span className="text-xs font-bold text-slate-400 mt-1">
            {isVictory ? 'ABANDONED CITY FULLY LIBERATED' : 'BOTH PLAYERS WENT DOWN'}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left">
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">SCORE</span>
            <span className="text-lg font-black text-white">{stats.score.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">KILLS</span>
            <span className="text-lg font-black text-rose-400">{stats.kills} MUTANTS</span>
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">MAX COMBO</span>
            <span className="text-lg font-black text-amber-400">×{stats.maxCombo} HITS</span>
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">SECTOR WAVE</span>
            <span className="text-lg font-black text-cyan-400">WAVE {stats.wave}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-orange-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onExit}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO ARCADE HOME</span>
          </button>
        </div>
      </div>
    </div>
  );
};
