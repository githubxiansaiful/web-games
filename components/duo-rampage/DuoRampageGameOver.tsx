'use client';

import React from 'react';
import { Trophy, Skull, RotateCcw, Home, Sparkles, Flame, Award } from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

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
  // Compute Arcade Rank
  let rank = 'RANK C';
  let rankColor = 'text-slate-400 border-slate-700';
  if (isVictory || stats.score >= 10000 || stats.wave >= 4) {
    rank = 'RANK S • LEGENDARY';
    rankColor = 'text-amber-300 border-amber-400/60 bg-amber-500/10 shadow-amber-500/20';
  } else if (stats.score >= 5000 || stats.wave >= 3) {
    rank = 'RANK A • MASTER';
    rankColor = 'text-cyan-300 border-cyan-400/60 bg-cyan-500/10 shadow-cyan-500/20';
  } else if (stats.score >= 2000 || stats.wave >= 2) {
    rank = 'RANK B • VETERAN';
    rankColor = 'text-emerald-300 border-emerald-400/60 bg-emerald-500/10 shadow-emerald-500/20';
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-y-auto overscroll-contain touch-auto z-50 bg-slate-950/92 backdrop-blur-xl flex flex-col items-center justify-center p-3 xs:p-4 sm:p-6 select-none animate-in fade-in duration-200">
      {/* Background Decorative Lighting Gradients */}
      <div
        className={`fixed -top-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isVictory ? 'bg-amber-500' : 'bg-red-600'
        }`}
      />
      <div
        className={`fixed -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isVictory ? 'bg-yellow-400' : 'bg-rose-700'
        }`}
      />

      {/* Main Gaming Mission Debrief Card */}
      <div
        className={`w-full max-w-sm landscape:max-w-2xl sm:max-w-2xl my-auto bg-slate-900/95 border-2 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md transition-all duration-200 ${
          isVictory
            ? 'border-amber-500/70 shadow-[0_0_50px_rgba(245,158,11,0.25)]'
            : 'border-red-600/70 shadow-[0_0_50px_rgba(220,38,38,0.25)]'
        }`}
      >
        {/* Subtle Top Glowing Strip */}
        <div
          className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
            isVictory
              ? 'from-transparent via-amber-400 to-transparent'
              : 'from-transparent via-red-500 to-transparent'
          }`}
        />

        <div className="grid grid-cols-1 landscape:grid-cols-12 sm:grid-cols-12 gap-3.5 sm:gap-6 items-center">
          {/* Left Column: Branding, Icon & Mission Status */}
          <div className="landscape:col-span-5 sm:col-span-5 flex flex-col items-center justify-center text-center space-y-2 xs:space-y-2.5 sm:space-y-3">
            {/* DUO RAMPAGE Official Logo */}
            <img
              src="/images/duo-rampage/duo_rampage_logo.png"
              alt="DUO RAMPAGE"
              className="h-7 xs:h-8 sm:h-10 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
            />

            {/* Glowing Icon Box */}
            <div
              className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border ${
                isVictory
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-amber-300 shadow-amber-500/40'
                  : 'bg-gradient-to-tr from-rose-600 to-red-600 text-white border-red-400/40 shadow-red-600/40 animate-pulse'
              }`}
            >
              {isVictory ? (
                <Trophy className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
              ) : (
                <Skull className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
              )}
            </div>

            {/* Status Headings */}
            <div className="space-y-0.5">
              <h2
                className={`text-xl xs:text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                  isVictory
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400'
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500'
                }`}
              >
                {isVictory ? 'VICTORY ACHIEVED!' : 'TEAM DEFEATED!'}
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isVictory ? 'Abandoned City Liberated' : 'Both Heroes Down • Sector Lost'}
              </p>
            </div>

            {/* Arcade Rank Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[9px] xs:text-[10px] font-black uppercase shadow-xs tracking-wider ${rankColor}`}
            >
              <Award className="w-3 h-3" />
              <span>{rank}</span>
            </div>
          </div>

          {/* Right Column: Mission Report Telemetry & Action Buttons */}
          <div className="landscape:col-span-7 sm:col-span-7 flex flex-col justify-center space-y-2.5 xs:space-y-3 sm:space-y-3.5">
            {/* Telemetry Header */}
            <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-1 px-1">
              <span>MISSION TELEMETRY</span>
              <span className="text-cyan-400 font-mono">DHAKA OUTPOST</span>
            </div>

            {/* Stats Grid 2x2 */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {/* Score */}
              <div className="bg-slate-950/80 p-2 xs:p-2.5 sm:p-3 rounded-xl border border-slate-800/80 shadow-inner">
                <div className="flex items-center justify-between text-[9px] xs:text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <span>SCORE</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <div className="text-base xs:text-lg sm:text-xl font-mono font-black text-white mt-0.5 truncate">
                  {stats.score.toLocaleString()}
                </div>
              </div>

              {/* Kills */}
              <div className="bg-slate-950/80 p-2 xs:p-2.5 sm:p-3 rounded-xl border border-slate-800/80 shadow-inner">
                <div className="flex items-center justify-between text-[9px] xs:text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <span>KILLS</span>
                  <Skull className="w-3 h-3 text-rose-400" />
                </div>
                <div className="text-base xs:text-lg sm:text-xl font-mono font-black text-rose-400 mt-0.5 truncate">
                  {stats.kills} MUTANTS
                </div>
              </div>

              {/* Max Combo */}
              <div className="bg-slate-950/80 p-2 xs:p-2.5 sm:p-3 rounded-xl border border-slate-800/80 shadow-inner">
                <div className="flex items-center justify-between text-[9px] xs:text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <span>MAX COMBO</span>
                  <Flame className="w-3 h-3 text-amber-400 fill-current" />
                </div>
                <div className="text-base xs:text-lg sm:text-xl font-mono font-black text-amber-400 mt-0.5 truncate">
                  ×{stats.maxCombo} HITS
                </div>
              </div>

              {/* Sector Wave */}
              <div className="bg-slate-950/80 p-2 xs:p-2.5 sm:p-3 rounded-xl border border-slate-800/80 shadow-inner">
                <div className="flex items-center justify-between text-[9px] xs:text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <span>SECTOR</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <div className="text-base xs:text-lg sm:text-xl font-mono font-black text-cyan-300 mt-0.5 truncate">
                  WAVE {stats.wave}
                </div>
              </div>
            </div>

            {/* Action Buttons: Responsive Side-by-Side */}
            <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 pt-1">
              {/* Play Again Button */}
              <button
                onClick={() => {
                  duoAudio.playUiClick();
                  onPlayAgain();
                }}
                className="flex-1 py-2.5 xs:py-3 sm:py-3.5 px-3 sm:px-4 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-orange-600/30 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                <span className="truncate">PLAY AGAIN</span>
              </button>

              {/* Return to Arcade Home */}
              <button
                onClick={() => {
                  duoAudio.playUiClick();
                  onExit();
                }}
                className="py-2.5 xs:py-3 sm:py-3.5 px-3 sm:px-4 bg-slate-950/85 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="truncate">MAIN MENU</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
