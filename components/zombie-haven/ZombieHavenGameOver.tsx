/**
 * Zombie Haven - Game Over & Match Statistics
 * Displays survival time, highest wave survived, kill breakdown, revives, and Play Again button.
 */

'use client';

import React from 'react';
import { Skull, Trophy, Clock, Flame, Users, RotateCcw, Home } from 'lucide-react';
import { MatchStats } from '@/game/zombie-haven/types';

interface ZombieHavenGameOverProps {
  stats: MatchStats;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const ZombieHavenGameOver: React.FC<ZombieHavenGameOverProps> = ({
  stats,
  onPlayAgain,
  onReturnHome,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-950/95 border-2 border-red-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/60 space-y-6 text-center">
        {/* Header Title */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
            <Skull className="w-8 h-8 animate-bounce" />
          </div>
          <h1 className="font-zombie text-5xl sm:text-6xl text-red-600 zombie-glow-red tracking-wider">
            GAME OVER
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            THE DEADWOOD HORDE PREVAILED
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {/* Survival Time */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>SURVIVAL TIME</span>
            </div>
            <div className="text-xl font-mono font-black text-white">
              {formatTime(stats.survivalTimeSeconds)}
            </div>
          </div>

          {/* Highest Wave */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>HIGHEST WAVE</span>
            </div>
            <div className="text-xl font-mono font-black text-amber-400">
              WAVE {stats.highestWave}
            </div>
          </div>

          {/* Total Zombies Killed */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span>ZOMBIES KILLED</span>
            </div>
            <div className="text-xl font-mono font-black text-red-400">
              {stats.totalKills}
            </div>
          </div>

          {/* Revives Performed */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>REVIVES</span>
            </div>
            <div className="text-xl font-mono font-black text-emerald-400">
              {stats.revives}
            </div>
          </div>
        </div>

        {/* Co-op Player Breakdown if 2 players */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-300">{stats.player1Name}</span>
            <div className="font-mono text-[11px] text-cyan-400 font-bold">{stats.player1Kills} Kills</div>
          </div>
          <span className="text-slate-600 font-black">•</span>
          <div className="space-y-0.5 text-right">
            <span className="font-bold text-slate-300">{stats.player2Name}</span>
            <div className="font-mono text-[11px] text-pink-400 font-bold">{stats.player2Kills} Kills</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-600/40 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onReturnHome}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
