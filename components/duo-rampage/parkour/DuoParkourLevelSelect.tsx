'use client';

import React, { useState } from 'react';
import { ArrowLeft, Play, Users, Clock, Star, Coins, Lock, CheckCircle, Sparkles, Shield, Flame } from 'lucide-react';
import { PARKOUR_CAMPAIGN_LEVELS, ParkourLevelMeta } from '@/game/duo-rampage/parkour/ParkourLevelData';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import { useAuth } from '@/context/AuthContext';

interface DuoParkourLevelSelectProps {
  onBack: () => void;
  onSelectLevelSolo: (level: ParkourLevelMeta) => void;
  onSelectLevelDuo: (level: ParkourLevelMeta) => void;
}

export const DuoParkourLevelSelect: React.FC<DuoParkourLevelSelectProps> = ({
  onBack,
  onSelectLevelSolo,
  onSelectLevelDuo,
}) => {
  const { user } = useAuth();
  const [selectedLevelId, setSelectedLevelId] = useState<string>('parkour_01');

  // Load unlocked progress from localStorage if available (Level 1 unlocked by default)
  const [unlockedLevels, setUnlockedLevels] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('duo_parkour_unlocked');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { parkour_01: true };
  });

  const selectedLevel = PARKOUR_CAMPAIGN_LEVELS.find((l) => l.id === selectedLevelId) || PARKOUR_CAMPAIGN_LEVELS[0];
  const isSelectedUnlocked = !!unlockedLevels[selectedLevel.id] || selectedLevel.unlockedByDefault;

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-[#070a14] text-white select-none overflow-y-auto p-3 xs:p-4 sm:p-6 flex flex-col justify-between font-knight z-40 safe-top safe-bottom">
      {/* Ambient Cyber Backing */}
      <div className="fixed -top-32 -left-32 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative w-full flex items-center justify-between z-10 shrink-0 mb-3">
        <button
          onClick={() => {
            duoAudio.playUiClick();
            onBack();
          }}
          className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO MODES</span>
        </button>

        {/* Center Title */}
        <div className="flex items-center gap-2">
          <img
            src="/images/duo-rampage/duo_rampage_logo.png"
            alt="DUO RAMPAGE"
            className="h-7 sm:h-8 w-auto object-contain hidden xs:block"
          />
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[11px] font-black tracking-widest uppercase">
            PARKOUR CAMPAIGN
          </span>
        </div>

        {/* Player Tag */}
        <div className="text-[11px] font-bold text-amber-400 font-mono hidden sm:block">
          {user?.name || 'RUNNER#001'}
        </div>
      </header>

      {/* Main Content: Level Grid (Left/Top) + Level Detail Briefing (Right/Bottom) */}
      <main className="relative flex-1 grid grid-cols-1 landscape:grid-cols-12 sm:grid-cols-12 gap-3 sm:gap-6 items-start z-10 min-h-0">
        {/* Left: 12 Levels Grid */}
        <div className="landscape:col-span-7 sm:col-span-7 bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-slate-800 flex flex-col h-full max-h-[58dvh] landscape:max-h-[76dvh] sm:max-h-[76dvh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] font-black tracking-widest text-slate-400 uppercase">
            <span>SELECT SECTOR (12 CAMPAIGN LEVELS)</span>
            <span className="text-cyan-400 font-mono">1–12 PROGRESSION</span>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 xs:gap-2.5 overflow-y-auto pr-1">
            {PARKOUR_CAMPAIGN_LEVELS.map((level) => {
              const isUnlocked = !!unlockedLevels[level.id] || level.unlockedByDefault;
              const isSelected = selectedLevelId === level.id;

              return (
                <button
                  key={level.id}
                  onClick={() => {
                    duoAudio.playUiClick();
                    setSelectedLevelId(level.id);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-tr from-cyan-950/90 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-[1.02]'
                      : isUnlocked
                      ? 'bg-slate-900/80 hover:bg-slate-850 border-slate-700/80 text-slate-300'
                      : 'bg-slate-950/50 border-slate-850 opacity-60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono font-black text-amber-400">
                      #{level.levelNumber.toString().padStart(2, '0')}
                    </span>
                    {isUnlocked ? (
                      <div className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        <span className="text-[9px] font-mono">0/3</span>
                      </div>
                    ) : (
                      <Lock className="w-3 h-3 text-slate-500" />
                    )}
                  </div>

                  <div className="mt-2 mb-1">
                    <div className="text-[11px] font-black leading-tight truncate text-white">
                      {level.name}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                      ⏱ {level.targetTime}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Level Briefing & Play Options */}
        <div className="landscape:col-span-5 sm:col-span-5 bg-slate-950/90 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-cyan-500/30 flex flex-col justify-between h-full shadow-2xl space-y-3">
          <div className="space-y-2">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-black uppercase">
                SECTOR #{selectedLevel.levelNumber.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">
                {selectedLevel.environmentName}
              </span>
            </div>

            {/* Level Title */}
            <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-amber-300 tracking-tight leading-none">
              {selectedLevel.name}
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {selectedLevel.description}
            </p>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[9px]">TARGET TIME</span>
                  <span className="text-white font-bold">{selectedLevel.targetTime} MIN</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[9px]">CHECKPOINTS</span>
                  <span className="text-white font-bold">{selectedLevel.totalCheckpoints} BEACONS</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[9px]">COLLECTIBLES</span>
                  <span className="text-white font-bold">{selectedLevel.totalCoins} COINS</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[9px]">SECRET EMBLEM</span>
                  <span className="text-amber-300 font-bold truncate block">{selectedLevel.secretEmblemName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Solo Run or Duo Co-op */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {/* Solo Runner Button */}
            <button
              onClick={() => {
                duoAudio.playCountdown(0);
                onSelectLevelSolo(selectedLevel);
              }}
              disabled={!isSelectedUnlocked}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg ${
                isSelectedUnlocked
                  ? 'bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 text-slate-950 shadow-orange-600/30 hover:brightness-110'
                  : 'bg-slate-850 border border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START SOLO RUN</span>
            </button>

            {/* Duo Co-op Button */}
            <button
              onClick={() => {
                duoAudio.playDash();
                onSelectLevelDuo(selectedLevel);
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white rounded-2xl font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition active:scale-95 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>HOST 2-PLAYER DUO SQUAD</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Slogan */}
      <footer className="relative w-full flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 z-10 shrink-0 border-t border-slate-900">
        <span>DHAKA PARKOUR CAMPAIGN • SOLO & ONLINE COOPERATIVE</span>
        <span>REUSING DUO RAMPAGE CORE ENGINE</span>
      </footer>
    </div>
  );
};
