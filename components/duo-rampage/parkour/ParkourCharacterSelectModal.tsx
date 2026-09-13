'use client';

import React, { useState } from 'react';
import {
  PARKOUR_CHARACTERS,
  ParkourCharacterDef,
  getCharacterDef,
} from '@/game/duo-rampage/parkour/character/ParkourCharacters';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

interface ParkourCharacterSelectModalProps {
  selectedCharacterId: string;
  onSelectCharacter: (id: string) => void;
  onClose: () => void;
}

export const ParkourCharacterSelectModal: React.FC<ParkourCharacterSelectModalProps> = ({
  selectedCharacterId,
  onSelectCharacter,
  onClose,
}) => {
  const [activePreviewId, setActivePreviewId] = useState<string>(selectedCharacterId);
  const activeChar = getCharacterDef(activePreviewId);

  const handleSelect = (char: ParkourCharacterDef) => {
    duoAudio.playUiClick();
    setActivePreviewId(char.id);
  };

  const handleConfirm = () => {
    duoAudio.playUiClick();
    onSelectCharacter(activePreviewId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkour_selected_character', activePreviewId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-6 bg-cyan-400 rounded-full shadow-[0_0_12px_#38bdf8]" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black italic tracking-wider text-white font-knight uppercase">
                SELECT OPERATIVE RUNNER
              </h2>
              <p className="text-xs text-cyan-400/80 font-mono tracking-widest uppercase">
                HIGH-TECH 2D PARKOUR ATHLETES
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              duoAudio.playUiClose();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-mono text-lg transition-colors border border-slate-700"
            aria-label="Close character selection"
          >
            ✕
          </button>
        </div>

        {/* Content Body: Left character list, Right preview card */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Character Grid (7 cols on md) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PARKOUR_CHARACTERS.map((char) => {
              const isSelected = char.id === activePreviewId;
              const isEquipped = char.id === selectedCharacterId;

              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => handleSelect(char)}
                  className={`group relative flex flex-col items-center p-3 rounded-xl border transition-all duration-200 text-left overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-[1.02]'
                      : 'bg-slate-900/50 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Equipped Tag */}
                  {isEquipped && (
                    <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-mono text-[9px] font-black uppercase tracking-wider">
                      EQUIPPED
                    </div>
                  )}

                  {/* Character Thumbnail */}
                  <div className="relative w-24 h-28 sm:w-28 sm:h-32 flex items-center justify-center my-1">
                    <img
                      src={char.thumbnailUrl}
                      alt={char.name}
                      className="w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* Character Label */}
                  <div className="w-full text-center mt-1">
                    <div
                      className="text-sm font-black tracking-wider uppercase font-knight"
                      style={{ color: isSelected ? char.accentColor : '#ffffff' }}
                    >
                      {char.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      {char.codename}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Character Details / Preview Card (5 cols on md) */}
          <div className="md:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div>
              {/* Full Standee Hero Showcase */}
              <div className="relative w-full h-44 sm:h-52 flex items-center justify-center mb-3">
                <div
                  className="absolute inset-0 rounded-2xl opacity-20 blur-2xl"
                  style={{ backgroundColor: activeChar.accentColor }}
                />
                <img
                  src={activeChar.thumbnailUrl}
                  alt={activeChar.name}
                  className="relative h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] animate-pulse"
                />
              </div>

              {/* Title & Role */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeChar.accentColor }}
                />
                <h3 className="text-2xl font-black font-knight uppercase tracking-wider text-white">
                  {activeChar.name}
                </h3>
              </div>
              <div
                className="text-xs font-mono font-bold uppercase tracking-widest mb-3"
                style={{ color: activeChar.accentColor }}
              >
                {activeChar.codename}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {activeChar.roleDescription}
              </p>

              {/* Stats Bars */}
              <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                    <span>SPRINT VELOCITY</span>
                    <span className="font-bold text-cyan-400">{activeChar.stats.speed}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${activeChar.stats.speed}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                    <span>JUMP & VAULT HEIGHT</span>
                    <span className="font-bold text-amber-400">{activeChar.stats.jump}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${activeChar.stats.jump}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                    <span>ACROBATIC AGILITY</span>
                    <span className="font-bold text-emerald-400">{activeChar.stats.agility}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${activeChar.stats.agility}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-3.5 rounded-xl font-knight font-bold uppercase tracking-wider text-base text-slate-950 transition-all shadow-[0_0_24px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(180deg, #38bdf8, ${activeChar.accentColor})`,
                }}
              >
                DEPLOY AS {activeChar.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
