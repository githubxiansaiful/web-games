/**
 * Zombie Haven - Main Menu
 * Features custom zombie typography, atmospheric Deadwood Village backdrop,
 * Solo Survival, Create Room, Join Room, and How to Play modal.
 */

'use client';

import React, { useState } from 'react';
import {
  Skull,
  Users,
  Play,
  HelpCircle,
  ArrowLeft,
  Volume2,
  VolumeX,
  Crosshair,
  Shield,
  Zap,
} from 'lucide-react';
import { zombieAudio } from './ZombieHavenAudio';

interface ZombieHavenMenuProps {
  onStartSolo: (playerName: string) => void;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  onReturnHome: () => void;
}

export const ZombieHavenMenu: React.FC<ZombieHavenMenuProps> = ({
  onStartSolo,
  onCreateRoom,
  onJoinRoom,
  onReturnHome,
}) => {
  const [playerName, setPlayerName] = useState('Survivor');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [isMuted, setIsMuted] = useState(zombieAudio.getIsMuted());

  const toggleMute = () => {
    const next = zombieAudio.toggleMute();
    setIsMuted(next);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a 6-digit room code');
      return;
    }
    onJoinRoom(code, playerName || 'Survivor');
  };

  return (
    <div className="absolute inset-0 z-40 bg-sky-950/20 backdrop-blur-[2px] flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* 1. TOP BAR */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <button
          onClick={onReturnHome}
          className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Xian Arcade</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 2. CENTER BRANDING & MENU ACTIONS */}
      <div className="w-full max-w-md mx-auto text-center space-y-6 my-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Zombie Logo & Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950/40 border border-red-600/40 shadow-xl shadow-red-950/60 mb-2">
            <Skull className="w-10 h-10 text-red-500 animate-pulse" />
          </div>

          <h1 className="font-zombie text-6xl sm:text-7xl text-red-600 zombie-glow-red tracking-wider leading-none">
            ZOMBIE HAVEN
          </h1>

          <p className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-widest leading-relaxed">
            TWO FRIENDS. ONE VILLAGE. ENDLESS ZOMBIES.
          </p>
        </div>

        {/* Player Callout Input */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1 text-left">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            YOUR CALLSIGN / SURVIVOR NAME:
          </label>
          <input
            type="text"
            maxLength={16}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-red-500 transition"
            placeholder="Enter survivor callsign"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Solo Play */}
          <button
            onClick={() => onStartSolo(playerName || 'Survivor')}
            className="w-full py-4 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-base rounded-2xl shadow-xl shadow-red-600/40 transition active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>SOLO SURVIVAL (PLAY NOW)</span>
          </button>

          {/* Co-op Multiplayer Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onCreateRoom(playerName || 'Survivor')}
              className="py-3.5 px-3 bg-slate-900/90 hover:bg-slate-850 border border-indigo-500/50 hover:border-indigo-400 text-indigo-300 hover:text-white font-black text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>CREATE 2P ROOM</span>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="py-3.5 px-3 bg-slate-900/90 hover:bg-slate-850 border border-pink-500/50 hover:border-pink-400 text-pink-300 hover:text-white font-black text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crosshair className="w-4 h-4 text-pink-400" />
              <span>JOIN 2P ROOM</span>
            </button>
          </div>

          {/* How to Play */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="w-full py-2.5 px-4 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            <span>HOW TO PLAY & CONTROLS</span>
          </button>
        </div>
      </div>

      {/* 3. FOOTER INFO */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between text-[11px] text-slate-500">
        <span>Map: Deadwood Village (1 km² World)</span>
        <span>Version 1.0 • 60 FPS Engine</span>
      </div>

      {/* --- JOIN ROOM MODAL --- */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              <span>Enter 6-Digit Room Code</span>
            </h3>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={10}
                  value={joinCodeInput}
                  onChange={(e) => {
                    setJoinCodeInput(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-center font-mono font-black text-2xl tracking-widest text-amber-400 focus:outline-none focus:border-pink-500 uppercase"
                  placeholder="CODE"
                  autoFocus
                />
                {joinError && <p className="text-xs font-bold text-red-400 mt-1">{joinError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 bg-pink-600 hover:bg-pink-500 text-white font-black text-xs rounded-xl shadow-lg"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- HOW TO PLAY MODAL --- */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Skull className="w-5 h-5 text-red-500" />
                <span>Zombie Haven Field Manual</span>
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div>
                <h4 className="font-bold text-amber-400 uppercase tracking-wider mb-1">Controls</h4>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-white font-bold">W A S D</span>: Move Survivor
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-white font-bold">Shift</span>: Tactical Sprint
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-white font-bold">Left Click</span>: Fire Weapon
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-white font-bold">Right Click</span>: Aim Down Sights
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-white font-bold">R</span>: Reload Magazine
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-white font-bold">1, 2, 3</span>: Switch Weapons
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-white font-bold">E</span>: Scavenge / Revive
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-white font-bold">F</span>: Toggle Flashlight
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-amber-400 uppercase tracking-wider mb-1">Arsenal</h4>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                  <li>
                    <strong>M1911 Service Pistol [1]:</strong> Accurate starter sidearm. Good for single walkers.
                  </li>
                  <li>
                    <strong>Remington 870 Shotgun [2]:</strong> Devastating 8-pellet blast for clearing swarms.
                  </li>
                  <li>
                    <strong>M4A1 Carbine [3]:</strong> Full-auto rifle for sustained firepower against tough zombies.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-amber-400 uppercase tracking-wider mb-1">Co-op Survival</h4>
                <p className="text-slate-400">
                  When a survivor's health hits 0, they become <strong>Downed</strong>. The remaining player must approach
                  within 2.5m and hold <strong>[E]</strong> for 8 seconds to revive them. If both players fall, the horde wins!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-lg transition"
            >
              UNDERSTOOD, LET'S SURVIVE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
