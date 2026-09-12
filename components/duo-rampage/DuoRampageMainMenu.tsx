'use client';

import React, { useState } from 'react';
import { Play, Users, LogIn, HelpCircle, ArrowLeft, Flame, Shield, Sparkles } from 'lucide-react';
import { DuoRampageJoinModal } from './DuoRampageJoinModal';

interface DuoRampageMainMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => Promise<void>;
  onStartSolo: () => void;
  onExit: () => void;
}

export const DuoRampageMainMenu: React.FC<DuoRampageMainMenuProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartSolo,
  onExit,
}) => {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="relative w-full h-full min-h-screen bg-[#050711] text-white flex flex-col items-center justify-between p-4 sm:p-8 select-none overflow-hidden">
      {/* Dynamic Cartoon Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#ea580c_0%,transparent_60%)] opacity-20 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10">
        <button
          onClick={onExit}
          className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-md transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Arcade</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/80 text-xs font-black tracking-wider text-amber-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>CO-OP ACTION SHOOTER</span>
        </div>
      </div>

      {/* Center Hero Banner: DUO RAMPAGE */}
      <div className="flex flex-col items-center text-center my-auto z-10 space-y-3">
        {/* Animated Badge */}
        <div className="px-4 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 font-black text-[11px] tracking-widest uppercase shadow-lg flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 fill-slate-950" />
          <span>3D CARTOON MULTIPLAYER</span>
        </div>

        {/* Big Stylized Logo Title */}
        <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-orange-500 tracking-tight leading-none drop-shadow-[0_10px_25px_rgba(234,88,12,0.4)]">
          DUO RAMPAGE
        </h1>

        <p className="max-w-md text-xs sm:text-sm font-semibold text-slate-400 px-4">
          Two heroes. Infinite waves. Team up with a friend in high-energy cartoon warfare across an abandoned city!
        </p>

        {/* Main Action Buttons */}
        <div className="w-full max-w-sm flex flex-col gap-3 pt-4">
          {/* 1. CREATE ROOM */}
          <button
            onClick={onCreateRoom}
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-orange-600/30 transition active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Users className="w-5 h-5 text-slate-950" />
            <span>CREATE ROOM (#123456)</span>
          </button>

          {/* 2. JOIN ROOM */}
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full py-3.5 px-6 bg-slate-900/90 hover:bg-slate-800 border-2 border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
            <span>JOIN ROOM CODE</span>
          </button>

          {/* 3. SOLO PRACTICE */}
          <button
            onClick={onStartSolo}
            className="w-full py-3 px-6 bg-slate-900/70 hover:bg-slate-850 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 font-bold text-xs rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400" />
            <span>SOLO PRACTICE / WITH AI DUO</span>
          </button>
        </div>
      </div>

      {/* Bottom Footer & How To Play */}
      <div className="w-full max-w-xl flex items-center justify-between z-10 pt-4">
        <span className="text-[10px] font-bold text-slate-500">
          MOBILE FIRST • 60 FPS • 2 PLAYERS
        </span>

        <button
          onClick={() => setShowHowToPlay(true)}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>How to Play</span>
        </button>
      </div>

      {/* Join Room Modal */}
      <DuoRampageJoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={async (code) => {
          await onJoinRoom(code);
          setIsJoinModalOpen(false);
        }}
      />

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white">HOW TO PLAY DUO RAMPAGE</h3>
            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p>
                • <strong>Movement:</strong> Use the left virtual joystick (or WASD) to run in 2.5D depth across the street.
              </p>
              <p>
                • <strong>Combat:</strong> Tap FIRE (or Mouse Click) to shoot, DASH (Space) to dodge through enemy attacks, and MELEE (F) for close strikes.
              </p>
              <p>
                • <strong>DUO COMBO:</strong> Land rapid consecutive hits together to increase the team combo multiplier up to 10x!
              </p>
              <p>
                • <strong>RAMPAGE MODE:</strong> Reach 15+ combo to unleash RAMPAGE MODE with unlimited ammo, double damage, and hyper speed for 10 seconds!
              </p>
              <p>
                • <strong>10s REVIVE:</strong> If your partner goes down, run to them and hold REVIVE before the 10-second timer runs out!
              </p>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl transition cursor-pointer"
            >
              GOT IT, LET'S RAMPAGE!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
