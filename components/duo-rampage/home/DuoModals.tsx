'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sliders,
  Maximize2,
  Gamepad2,
  Copy,
  Check,
  Share2,
  Flame,
  Shield,
  Zap,
  Crosshair,
  Package,
  Trophy,
  Calendar,
  Users,
  Award,
  Sparkles,
  Lock,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { DuoCoin, DuoStarRating } from '../ui/DuoIcons';

export type DuoModalType =
  | 'settings'
  | 'how_to_play'
  | 'join_room'
  | 'create_room'
  | 'store'
  | 'loadout'
  | 'characters'
  | 'missions'
  | 'daily_rewards'
  | 'friends'
  | 'leaderboard'
  | null;

interface DuoModalsProps {
  activeModal: DuoModalType;
  onClose: () => void;
  onJoinRoom?: (code: string) => Promise<void> | void;
  createdRoomCode?: string;
  onStartRoomGame?: () => void;
}

export const DuoModals: React.FC<DuoModalsProps> = ({
  activeModal,
  onClose,
  onJoinRoom,
  createdRoomCode = '742918',
  onStartRoomGame,
}) => {
  // Settings State
  const [musicVol, setMusicVol] = useState(80);
  const [sfxVol, setSfxVol] = useState(90);
  const [graphics, setGraphics] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [sensitivity, setSensitivity] = useState(70);
  const [copied, setCopied] = useState(false);

  // Join Room State
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');

  // Daily Rewards Claimed State
  const [claimedDays, setClaimedDays] = useState<number[]>([1]);

  useEffect(() => {
    if (activeModal) {
      duoAudio.playUiOpen();
    }
  }, [activeModal]);

  const handleClose = () => {
    duoAudio.playUiClose();
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(createdRoomCode);
    setCopied(true);
    duoAudio.playUiClick();
    toast({
      title: 'ROOM PIN COPIED',
      description: `#${createdRoomCode} copied to clipboard! Share with your partner to jump into the fight.`,
      variant: 'amber',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCodeInput.replace('#', '').trim();
    if (clean.length < 4) {
      setJoinError('Please enter a valid 6-digit Room Code');
      duoAudio.playUiClose();
      toast({
        title: 'INVALID ROOM PIN',
        description: 'Please enter a valid 6-digit Room PIN code.',
        variant: 'destructive',
      });
      return;
    }
    duoAudio.playUiClick();
    setJoinError('');
    toast({
      title: 'CONNECTING TO ROOM',
      description: `Infiltrating Room #${clean}...`,
      variant: 'default',
    });
    onJoinRoom?.(clean);
  };

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-gradient-to-b from-slate-900/95 via-slate-920/95 to-slate-950/95 border-2 border-slate-700/80 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-knight">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="font-black text-sm sm:text-base text-white tracking-wider uppercase">
              {activeModal === 'settings' && 'GAME SETTINGS'}
              {activeModal === 'how_to_play' && 'HOW TO PLAY DUO RAMPAGE'}
              {activeModal === 'join_room' && 'JOIN MULTIPLAYER ROOM'}
              {activeModal === 'create_room' && 'CO-OP ROOM LOBBY'}
              {activeModal === 'store' && 'ARMORY STORE'}
              {activeModal === 'loadout' && 'WEAPONS & LOADOUT'}
              {activeModal === 'characters' && 'HERO ROSTER'}
              {activeModal === 'missions' && 'DAILY MISSIONS & BOUNTIES'}
              {activeModal === 'daily_rewards' && '7-DAY LOGIN REWARDS'}
              {activeModal === 'friends' && 'FRIENDS & SQUAD'}
              {activeModal === 'leaderboard' && 'GLOBAL DUO LEADERBOARD'}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 flex-1">
          {/* 1. SETTINGS */}
          {activeModal === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-400" /> Sound Effects (SFX)
                  </span>
                  <span>{sfxVol}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sfxVol}
                  onChange={(e) => setSfxVol(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-cyan-400" /> Music Volume
                  </span>
                  <span>{musicVol}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={musicVol}
                  onChange={(e) => setMusicVol(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" /> Control Sensitivity
                  </span>
                  <span>{sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <span className="block font-bold text-slate-200 mb-2">Graphics Quality</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        duoAudio.playUiClick();
                        setGraphics(q);
                      }}
                      className={`py-2 rounded-xl font-black uppercase text-[10px] sm:text-xs transition ${
                        graphics === q
                          ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-purple-400" /> Fullscreen Display
                </span>
                <button
                  onClick={() => {
                    duoAudio.playUiClick();
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(() => {});
                    } else {
                      document.exitFullscreen().catch(() => {});
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white transition"
                >
                  Toggle
                </button>
              </div>
            </div>
          )}

          {/* 2. HOW TO PLAY */}
          {activeModal === 'how_to_play' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 font-black text-amber-400 mb-1">
                    <Gamepad2 className="w-4 h-4" /> MOVEMENT
                  </div>
                  <p className="text-xs text-slate-400">
                    Use <strong>WASD / Arrow Keys</strong> or the left on-screen joystick to navigate 2.5D urban depth.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 font-black text-red-400 mb-1">
                    <Crosshair className="w-4 h-4" /> AIM & SHOOT
                  </div>
                  <p className="text-xs text-slate-400">
                    Aim with Mouse or right joystick. Tap <strong>FIRE / Left Click</strong> to unleash automatic rounds.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 font-black text-cyan-400 mb-1">
                    <Zap className="w-4 h-4" /> DASH & DODGE
                  </div>
                  <p className="text-xs text-slate-400">
                    Press <strong>SPACE / DASH</strong> for invulnerable forward roll through mutant swarms.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 font-black text-yellow-400 mb-1">
                    <Flame className="w-4 h-4" /> DUO COMBO & RAMPAGE
                  </div>
                  <p className="text-xs text-slate-400">
                    Combine attacks with your partner! 15+ combo activates <strong>RAMPAGE MODE</strong>: 2x damage & infinite ammo!
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-red-950/40 to-slate-950 border border-red-500/30 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xs text-red-300 uppercase">10-SECOND REVIVE RULE</span>
                  <span className="text-[11px] text-slate-400">
                    If your partner falls, rush to their side and stay close. Revive them before the 10-second timer expires!
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. JOIN ROOM */}
          {activeModal === 'join_room' && (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <p className="text-slate-400 text-xs">
                Enter the 6-digit Room PIN provided by your teammate to enter their co-op session:
              </p>

              <div className="relative">
                <input
                  type="text"
                  maxLength={7}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="#123456"
                  className="w-full text-center py-4 text-2xl sm:text-3xl font-mono font-black tracking-widest bg-slate-950 border-2 border-cyan-500/50 rounded-2xl text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 shadow-inner"
                  autoFocus
                />
              </div>

              {joinError && (
                <p className="text-xs text-red-400 font-bold text-center">{joinError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-2xl shadow-lg transition"
                >
                  JOIN ROOM
                </button>
              </div>
            </form>
          )}

          {/* 4. CREATE ROOM */}
          {activeModal === 'create_room' && (
            <div className="space-y-4 text-center">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                ROOM CREATED SUCCESSFULLY
              </span>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center gap-3">
                <span className="font-mono text-3xl sm:text-4xl font-black text-amber-400 tracking-widest">
                  #{createdRoomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition"
                  title="Copy Room ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs font-bold text-slate-300">
                    WAITING FOR PLAYER 2 TO JOIN...
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.share?.({
                      title: 'Join my DUO RAMPAGE squad!',
                      text: `Join my co-op room #${createdRoomCode}!`,
                      url: window.location.href,
                    }).catch(() => handleCopyCode());
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition"
                >
                  BACK TO MENU
                </button>
                <button
                  onClick={() => {
                    duoAudio.playUiClick();
                    onStartRoomGame?.();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition"
                >
                  START MATCH
                </button>
              </div>
            </div>
          )}

          {/* 5. STORE */}
          {activeModal === 'store' && (
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="font-black text-xs text-white block">CRATES & BUNDLES</span>
                    <span className="text-[10px] text-amber-300">New Supply Drop arrives daily!</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px]">
                  NEW
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between h-32">
                  <div>
                    <span className="text-[10px] font-black text-cyan-400 block uppercase">Cyberpunk Assault Skin</span>
                    <span className="text-[9px] text-slate-400">Legendary Outfit</span>
                  </div>
                  <button
                    onClick={() => {
                      duoAudio.playUiClick();
                      toast({
                        title: 'ARMORY UPGRADE',
                        description: 'Cyberpunk Assault Skin unlocked and equipped!',
                        variant: 'amber',
                      });
                    }}
                    className="py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-xl cursor-pointer transition active:scale-95"
                  >
                    1,200 CREDITS
                  </button>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between h-32">
                  <div>
                    <span className="text-[10px] font-black text-orange-400 block uppercase">Titan Juggernaut Heavy</span>
                    <span className="text-[9px] text-slate-400">Heavy Armor Skin</span>
                  </div>
                  <button
                    onClick={() => {
                      duoAudio.playUiClick();
                      toast({
                        title: 'ARMORY UPGRADE',
                        description: 'Titan Juggernaut Heavy skin unlocked and equipped!',
                        variant: 'amber',
                      });
                    }}
                    className="py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-xl cursor-pointer transition active:scale-95"
                  >
                    1,200 CREDITS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. LOADOUT */}
          {activeModal === 'loadout' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-950/90 border border-cyan-500/40 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-xs text-white">ASSAULT RIFLE MK-II</span>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded">
                      EQUIPPED
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span>Damage:</span>
                      <DuoStarRating rating={4} />
                      <span className="text-slate-500">(28 DMG)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Fire Rate:</span>
                      <DuoStarRating rating={5} />
                      <span className="text-slate-500">(650 RPM)</span>
                    </div>
                    <p>Clip Size: 30 Rounds</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-xs text-white">COMBAT SHOTGUN</span>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded">
                      EQUIPPED
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span>Damage:</span>
                      <DuoStarRating rating={5} />
                      <span className="text-slate-500">(72 DMG)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Fire Rate:</span>
                      <DuoStarRating rating={2} />
                      <span className="text-slate-500">(120 RPM)</span>
                    </div>
                    <p>Clip Size: 8 Shells</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-xs text-white">ROTARY MINIGUN</span>
                    <span className="text-[9px] font-black text-amber-400 bg-amber-950/70 px-1.5 py-0.5 rounded">
                      SPECIAL
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span>Damage:</span>
                      <DuoStarRating rating={4} />
                      <span className="text-slate-500">(34 DMG)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Fire Rate:</span>
                      <DuoStarRating rating={5} />
                      <span className="text-slate-500">(950 RPM)</span>
                    </div>
                    <p>Clip Size: 100 Rounds</p>
                  </div>
                </div>

                <div
                  onClick={() => {
                    toast({
                      title: 'WEAPON LOCKED',
                      description: 'Plasma Cannon unlocks when your profile reaches Level 10!',
                      variant: 'default',
                    });
                  }}
                  className="p-3 bg-slate-950/90 border border-slate-800/80 rounded-2xl opacity-60 flex flex-col justify-center items-center cursor-pointer"
                >
                  <Lock className="w-5 h-5 text-slate-500 mb-1" />
                  <span className="font-black text-xs text-slate-400">PLASMA CANNON</span>
                  <span className="text-[9px] text-slate-500">Unlocks at Level 10</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. CHARACTERS */}
          {activeModal === 'characters' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* ASSAULT */}
              <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center font-black text-cyan-300 text-sm">
                    P1
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">ASSAULT HERO</h3>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">AGILITY & PRECISION</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Swift tactical vanguard equipped with assault carbines, quick dodge roll, and tactical cluster strike.
                </p>
                <div className="pt-1 text-[10px] space-y-1 font-bold">
                  <div className="flex justify-between text-slate-300">
                    <span>Speed</span>
                    <span className="text-cyan-400">9.5 / 10</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Armor</span>
                    <span className="text-amber-400">7.0 / 10</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Special</span>
                    <span className="text-rose-400">Airstrike Cluster</span>
                  </div>
                </div>
              </div>

              {/* HEAVY */}
              <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center font-black text-amber-300 text-sm">
                    P2
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">HEAVY HERO</h3>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">FIREPOWER & ARMOR</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Battle-hardened juggernaut wielding rotary miniguns, fortified shield plating, and seismic shockwave slam.
                </p>
                <div className="pt-1 text-[10px] space-y-1 font-bold">
                  <div className="flex justify-between text-slate-300">
                    <span>Speed</span>
                    <span className="text-cyan-400">7.0 / 10</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Armor</span>
                    <span className="text-amber-400">10 / 10</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Special</span>
                    <span className="text-rose-400">Titan Ground Slam</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. MISSIONS */}
          {activeModal === 'missions' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-white block">Urban Sweeper</span>
                  <span className="text-[10px] text-slate-400">Eliminate 30 mutants in Abandoned City</span>
                  <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="w-[60%] h-full bg-amber-400" />
                  </div>
                </div>
                <span className="text-xs font-black text-amber-400">+150 XP</span>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-white block">Duo Synergy</span>
                  <span className="text-[10px] text-slate-400">Reach a 10x Combo multiplier together</span>
                  <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="w-full h-full bg-emerald-400" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    duoAudio.playComboUp(2);
                    toast({
                      title: 'BOUNTY CLAIMED',
                      description: '+50 Hero Coins credited to your vault!',
                      variant: 'success',
                    });
                  }}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-xl cursor-pointer transition active:scale-95 flex items-center gap-1"
                >
                  CLAIM 50 <DuoCoin className="w-3 h-3" />
                </button>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-white block">Leave No Man Behind</span>
                  <span className="text-[10px] text-slate-400">Revive a fallen partner during a wave</span>
                  <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="w-[0%] h-full bg-slate-700" />
                  </div>
                </div>
                <span className="text-xs font-black text-cyan-400">+250 XP</span>
              </div>
            </div>
          )}

          {/* 9. DAILY REWARDS */}
          {activeModal === 'daily_rewards' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400">
                Log in every day to claim exclusive weapon crates, hero coins, and badges:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const isClaimed = claimedDays.includes(day);
                  const isCurrent = day === 2;

                  return (
                    <div
                      key={day}
                      onClick={() => {
                        if (isCurrent && !isClaimed) {
                          setClaimedDays([...claimedDays, 2]);
                          duoAudio.playComboUp(3);
                          toast({
                            title: 'DAILY REWARD CLAIMED',
                            description: 'Day 2 reward unlocked: +200 Hero Coins added to your vault!',
                            variant: 'success',
                          });
                        } else if (isClaimed) {
                          toast({
                            title: 'ALREADY CLAIMED',
                            description: `You have already collected Day ${day} reward!`,
                            variant: 'default',
                          });
                        } else {
                          toast({
                            title: 'DAY LOCKED',
                            description: `Log in on consecutive days to unlock Day ${day} reward!`,
                            variant: 'default',
                          });
                        }
                      }}
                      className={`p-2 rounded-2xl border flex flex-col items-center justify-between h-24 text-center cursor-pointer transition ${
                        isClaimed
                          ? 'bg-slate-950/60 border-slate-800 opacity-60'
                          : isCurrent
                          ? 'bg-amber-500/20 border-amber-400 shadow-md scale-105'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <span className="font-black text-[9px] text-slate-400 uppercase">DAY {day}</span>
                      <Sparkles className={`w-5 h-5 ${isCurrent ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} />
                      <span className={`font-black text-[9px] ${isClaimed ? 'text-slate-500' : 'text-amber-300'}`}>
                        {isClaimed ? (
                          'CLAIMED'
                        ) : isCurrent ? (
                          'CLAIM!'
                        ) : day === 7 ? (
                          'SKIN'
                        ) : (
                          <span className="inline-flex items-center gap-0.5 justify-center">
                            <DuoCoin className="w-2.5 h-2.5" />
                            {day * 100}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 10. FRIENDS */}
          {activeModal === 'friends' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-black text-xs text-white">GhostRider#402</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">ONLINE (In Menu)</span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-black text-xs text-white">ViperSniper#911</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold">IN MATCH (Wave 3)</span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <span className="font-black text-xs text-slate-400">IronClad#007</span>
                </div>
                <span className="text-[10px] text-slate-500">Offline (2h ago)</span>
              </div>
            </div>
          )}

          {/* 11. LEADERBOARD */}
          {activeModal === 'leaderboard' && (
            <div className="space-y-2">
              {[
                { rank: '1', duo: 'ApexDuo (Assault + Heavy)', score: '184,200', wave: 'Wave 15' },
                { rank: '2', duo: 'ShadowStrike & Titan', score: '162,950', wave: 'Wave 14' },
                { rank: '3', duo: 'NeonWarriors', score: '145,000', wave: 'Wave 12' },
                { rank: '4', duo: 'RampageKings', score: '121,400', wave: 'Wave 10' },
                { rank: '5', duo: 'RAMPAGE#001 (You)', score: '98,500', wave: 'Wave 8' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border ${
                    item.rank === '1'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xs sm:text-sm w-4 text-center">{item.rank}</span>
                    <span className="font-bold text-xs sm:text-sm text-white">{item.duo}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] sm:text-xs text-cyan-400 font-mono">{item.wave}</span>
                    <span className="font-mono font-black text-xs sm:text-sm text-amber-400">{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
