'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Shield,
  Zap,
  RotateCw,
  Flame,
  Heart,
  Skull,
  Crosshair,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PlayerStats, DuoComboState, WaveState, TouchControlsState } from '@/game/duo-rampage/types';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

interface DuoRampageHUDProps {
  player1: PlayerStats | null;
  player2: PlayerStats | null;
  myRole: 'assault' | 'heavy';
  combo: DuoComboState;
  wave: WaveState;
  warningStayTogether: boolean;
  onControlsChange: (controls: TouchControlsState) => void;
  onSwitchWeapon?: () => void;
  onExit: () => void;
}

export const DuoRampageHUD: React.FC<DuoRampageHUDProps> = ({
  player1,
  player2,
  myRole,
  combo,
  wave,
  warningStayTogether,
  onControlsChange,
  onSwitchWeapon,
  onExit,
}) => {
  const [isMuted, setIsMuted] = useState(false);

  // Virtual Joystick State
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickStickRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const joystickOrigin = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Internal controls state
  const controlsRef = useRef<TouchControlsState>({
    moveX: 0,
    moveZ: 0,
    isShooting: false,
    isReloading: false,
    isDashing: false,
    isMelee: false,
    isGrenade: false,
    isSpecial: false,
    isReviving: false,
  });

  const updateControls = (partial: Partial<TouchControlsState>) => {
    controlsRef.current = { ...controlsRef.current, ...partial };
    onControlsChange(controlsRef.current);
  };

  // Keyboard desktop controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      let changed = false;

      if (key === '1' || key === '2' || key === '3' || key === 'x') {
        onSwitchWeapon?.();
      } else if (key === 'a' || key === 'arrowleft') {
        controlsRef.current.moveX = -1;
        changed = true;
      } else if (key === 'd' || key === 'arrowright') {
        controlsRef.current.moveX = 1;
        changed = true;
      } else if (key === 'w' || key === 'arrowup') {
        controlsRef.current.moveZ = -1;
        changed = true;
      } else if (key === 's' || key === 'arrowdown') {
        controlsRef.current.moveZ = 1;
        changed = true;
      } else if (key === ' ') {
        controlsRef.current.moveZ = -1; // Jump
        changed = true;
      } else if (key === 'shift') {
        controlsRef.current.isDashing = true;
        changed = true;
      } else if (key === 'g') {
        controlsRef.current.isGrenade = true;
        changed = true;
      } else if (key === 'j') {
        controlsRef.current.isShooting = true;
        changed = true;
      } else if (key === 'r') {
        controlsRef.current.isReloading = true;
        changed = true;
      } else if (key === 'f' || key === 'v') {
        controlsRef.current.isMelee = true;
        changed = true;
      } else if (key === 'e') {
        controlsRef.current.isReviving = true;
        changed = true;
      } else if (key === 'q') {
        controlsRef.current.isSpecial = true;
        changed = true;
      }

      if (changed) onControlsChange(controlsRef.current);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      let changed = false;

      if (key === 'a' || key === 'arrowleft' || key === 'd' || key === 'arrowright') {
        controlsRef.current.moveX = 0;
        changed = true;
      } else if (key === 'w' || key === 'arrowup' || key === 's' || key === 'arrowdown' || key === ' ') {
        controlsRef.current.moveZ = 0;
        changed = true;
      } else if (key === 'shift') {
        controlsRef.current.isDashing = false;
        changed = true;
      } else if (key === 'g') {
        controlsRef.current.isGrenade = false;
        changed = true;
      } else if (key === 'j') {
        controlsRef.current.isShooting = false;
        changed = true;
      } else if (key === 'r') {
        controlsRef.current.isReloading = false;
        changed = true;
      } else if (key === 'f' || key === 'v') {
        controlsRef.current.isMelee = false;
        changed = true;
      } else if (key === 'e') {
        controlsRef.current.isReviving = false;
        changed = true;
      } else if (key === 'q') {
        controlsRef.current.isSpecial = false;
        changed = true;
      }

      if (changed) onControlsChange(controlsRef.current);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      controlsRef.current.isShooting = true;
      onControlsChange(controlsRef.current);
    };

    const handleMouseUp = () => {
      controlsRef.current.isShooting = false;
      onControlsChange(controlsRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onControlsChange]);

  // Virtual Joystick Touch Handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchIdRef.current = touch.identifier;
    const base = joystickBaseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    joystickOrigin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - joystickOrigin.current.x;
        const dy = touch.clientY - joystickOrigin.current.y;
        const maxDist = 48;
        const dist = Math.hypot(dx, dy);

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        const stickX = Math.cos(angle) * clampedDist;
        const stickY = Math.sin(angle) * clampedDist;

        if (joystickStickRef.current) {
          joystickStickRef.current.style.transform = `translate(${stickX}px, ${stickY}px)`;
        }

        updateControls({
          moveX: stickX / maxDist,
          moveZ: stickY / maxDist,
        });
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    touchIdRef.current = null;
    if (joystickStickRef.current) {
      joystickStickRef.current.style.transform = `translate(0px, 0px)`;
    }
    updateControls({ moveX: 0, moveZ: 0 });
  };

  const myPlayer = myRole === 'assault' ? player1 : player2;
  const partnerPlayer = myRole === 'assault' ? player2 : player1;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans z-30">
      {/* 1. RAMPAGE MODE SCREEN EDGE GLOW (Burning Orange & Purple Flame) */}
      {combo.isRampage && (
        <div className="absolute inset-0 pointer-events-none border-[8px] sm:border-[14px] border-amber-500/80 animate-pulse shadow-[inset_0_0_80px_rgba(234,88,12,0.6)] z-20" />
      )}

      {/* 2. STAY TOGETHER WARNING ALERT */}
      {warningStayTogether && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-500/90 text-slate-950 font-black text-xs sm:text-sm rounded-full tracking-wider animate-bounce shadow-xl flex items-center gap-1.5 z-40">
          <span>⚠️</span>
          <span>STAY TOGETHER! DON'T GET SEPARATED!</span>
        </div>
      )}

      {/* 3. PLAYER DOWN / REVIVE ALERT */}
      {partnerPlayer && partnerPlayer.isDown && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-red-600/95 text-white font-black text-sm rounded-2xl tracking-wider animate-pulse shadow-2xl border-2 border-amber-400 flex flex-col items-center gap-1 z-40">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-amber-300 animate-spin" />
            <span>{partnerPlayer.name} IS DOWN!</span>
          </div>
          <span className="text-xs text-amber-200">
            APPROACH AND HOLD [REVIVE] ({Math.ceil(partnerPlayer.downTimer)}s LEFT)
          </span>
          {partnerPlayer.isReviving && (
            <div className="w-full bg-slate-900 rounded-full h-2 mt-1 overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-75"
                style={{ width: `${partnerPlayer.reviveProgress * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Wave Announcement Banner */}
      {wave.waveAnnounceText && (
        <div className="absolute top-1/3 inset-x-0 flex flex-col items-center pointer-events-none z-40 animate-pulse">
          <div className="px-8 py-3 bg-slate-950/90 border-y-2 border-amber-400 text-amber-300 font-black text-xl sm:text-3xl tracking-widest uppercase shadow-[0_0_40px_rgba(245,158,11,0.6)]">
            {wave.waveAnnounceText}
          </div>
        </div>
      )}

      {/* 4. TOP BAR: HEALTH BARS & COMBO METER */}
      <div className="w-full px-3 sm:px-6 pt-3 flex items-start justify-between pointer-events-none">
        {/* Left: DUO RAMPAGE LOGO & P1 HUD */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/images/duo-rampage/duo_rampage_logo.png"
            alt="Duo Rampage"
            className="h-8 sm:h-11 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] hidden xs:block"
          />

          {/* Player 1 Card (Assault Hero) */}
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-red-500/50 shadow-2xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-red-500 bg-slate-900 shadow-md shrink-0 relative">
              <img
                src={player1?.avatar || '/images/duo-rampage/player1.png'}
                alt="P1"
                className="w-full h-full object-cover"
                style={{ objectPosition: '45% 18%', transform: 'scale(1.4)' }}
              />
              <span className="absolute top-0.5 left-0.5 px-1 bg-red-600/90 rounded text-[9px] font-black text-white leading-tight">
                P1
              </span>
            </div>
            <div className="w-24 sm:w-36">
              <div className="flex items-center justify-between text-[11px] font-black tracking-wide text-red-400">
                <span className="truncate">{player1 ? player1.name : 'HERO 1'}</span>
                <span className="text-white text-[10px]">{player1 ? `${Math.round(player1.health)}` : '100'}</span>
              </div>
              {/* HP Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-sm overflow-hidden mt-0.5 border border-red-900/60 relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-150"
                  style={{ width: `${player1 ? (player1.health / player1.maxHealth) * 100 : 100}%` }}
                />
              </div>
              {/* Ammo Bar */}
              <div className="w-full h-1.5 bg-slate-950 rounded-sm overflow-hidden mt-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                  style={{ width: `${player1 ? (player1.ammo / player1.maxAmmo) * 100 : 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Wave & DUO COMBO Meter */}
        <div className="flex flex-col items-center gap-1">
          {/* Wave Badge */}
          <div className="px-3.5 py-1 bg-slate-900/90 border border-slate-700/80 rounded-full text-[11px] font-black tracking-widest text-slate-200 shadow-md">
            WAVE {wave.currentWave} / {wave.totalWaves}
          </div>

          {/* DUO COMBO Meter */}
          {combo.count > 0 && (
            <div
              className={`px-4 py-1 rounded-2xl font-black text-xs sm:text-sm tracking-wider flex items-center gap-1.5 shadow-lg transform transition-transform duration-100 ${
                combo.isRampage
                  ? 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 scale-110 animate-bounce'
                  : 'bg-slate-900/90 border border-amber-500/50 text-amber-400'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>
                {combo.isRampage
                  ? `RAMPAGE MODE! (${Math.ceil(combo.rampageTimer)}s)`
                  : `DUO COMBO ×${combo.multiplier} (${combo.count})`}
              </span>
            </div>
          )}
        </div>

        {/* Right: Player 2 (Heavy Hero) & Controls */}
        <div className="flex items-center gap-2">
          {/* Player 2 Card */}
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-sky-500/50 shadow-2xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-sky-400 bg-slate-900 shadow-md shrink-0 relative">
              <img
                src={player2?.avatar || '/images/duo-rampage/player2_hologram.png'}
                alt="P2"
                className="w-full h-full object-cover"
                style={{ objectPosition: '50% 20%', transform: 'scale(1.4)' }}
              />
              <span className="absolute top-0.5 right-0.5 px-1 bg-sky-600/90 rounded text-[9px] font-black text-white leading-tight">
                P2
              </span>
            </div>
            <div className="w-24 sm:w-36">
              <div className="flex items-center justify-between text-[11px] font-black tracking-wide text-sky-400">
                <span className="truncate">{player2 ? player2.name : 'HERO 2'}</span>
                <span className="text-white text-[10px]">{player2 ? `${Math.round(player2.health)}` : '100'}</span>
              </div>
              {/* HP Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-sm overflow-hidden mt-0.5 border border-sky-900/60 relative">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-150"
                  style={{ width: `${player2 ? (player2.health / player2.maxHealth) * 100 : 100}%` }}
                />
              </div>
              {/* Ammo Bar */}
              <div className="w-full h-1.5 bg-slate-950 rounded-sm overflow-hidden mt-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
                  style={{ width: `${player2 ? (player2.ammo / player2.maxAmmo) * 100 : 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sound & Exit Buttons */}
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <button
              onClick={() => {
                const muted = duoAudio.toggleMute();
                setIsMuted(muted);
              }}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={onExit}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              title="Exit Game"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MOBILE TOUCH CONTROLS (BOTTOM AREA) */}
      <div className="absolute bottom-4 inset-x-0 px-4 sm:px-8 flex items-end justify-between pointer-events-none">
        {/* Left: Virtual Movement Joystick */}
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className="w-32 h-32 rounded-full bg-slate-950/50 border-2 border-slate-700/60 backdrop-blur-sm pointer-events-auto flex items-center justify-center relative touch-none shadow-2xl active:border-cyan-400/80 transition-colors"
        >
          <div
            ref={joystickStickRef}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 border-2 border-white/60 shadow-lg pointer-events-none transition-transform duration-75"
          />
        </div>

        {/* Desktop Helper Hint (Hidden on small touchscreens) */}
        <div className="hidden md:flex flex-col items-center bg-slate-950/70 border border-slate-800 px-4 py-2 rounded-2xl text-[11px] font-semibold text-slate-400 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white text-[10px]">WASD</span> Move
            <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white text-[10px]">L-CLICK</span> Shoot
            <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white text-[10px]">SPACE</span> Dash
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white text-[10px]">R</span> Reload
            <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white text-[10px]">F</span> Melee
            <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white text-[10px]">E</span> Revive
          </div>
        </div>

        {/* Right: Action Buttons (Large Shoot, Reload, Dash, Melee, Revive) */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Auxiliary Buttons Column */}
          <div className="flex flex-col gap-2.5">
            {/* Grenade Button (G) */}
            <button
              onTouchStart={() => updateControls({ isGrenade: true })}
              onTouchEnd={() => updateControls({ isGrenade: false })}
              onMouseDown={() => updateControls({ isGrenade: true })}
              onMouseUp={() => updateControls({ isGrenade: false })}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 border border-amber-300 text-white flex flex-col items-center justify-center font-black text-[9px] shadow-lg transition active:scale-95 cursor-pointer"
              title="Throw Grenade (G)"
            >
              <span className="text-base leading-none">💣</span>
              <span className="text-[7px] font-black uppercase mt-0.5">BOMB</span>
            </button>

            {/* Quick Weapon Switch Button */}
            <button
              onClick={() => onSwitchWeapon?.()}
              className="w-12 h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700 hover:border-amber-400/60 text-amber-400 flex flex-col items-center justify-center font-black text-[9px] shadow-lg transition active:scale-95 cursor-pointer"
              title="Switch Weapon (1/2/3/X)"
            >
              <span className="text-sm">🔫</span>
              <span className="text-[8px] uppercase tracking-tighter text-slate-300">
                {myPlayer?.weapon === 'pistol' ? 'PISTOL' : myPlayer?.weapon === 'rifle' ? 'RIFLE' : 'SHOTGUN'}
              </span>
            </button>

            {/* Revive Button (Highlights if partner down) */}
            <button
              onTouchStart={() => updateControls({ isReviving: true })}
              onTouchEnd={() => updateControls({ isReviving: false })}
              onMouseDown={() => updateControls({ isReviving: true })}
              onMouseUp={() => updateControls({ isReviving: false })}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-xs shadow-lg transition active:scale-95 cursor-pointer ${
                partnerPlayer?.isDown
                  ? 'bg-emerald-500 border-emerald-300 text-white animate-bounce shadow-emerald-500/40'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
            >
              <Heart className="w-5 h-5 fill-current" />
            </button>

            {/* Dash Button */}
            <button
              onTouchStart={() => updateControls({ isDashing: true })}
              onTouchEnd={() => updateControls({ isDashing: false })}
              onMouseDown={() => updateControls({ isDashing: true })}
              onMouseUp={() => updateControls({ isDashing: false })}
              className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center font-black text-xs shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-current" />
            </button>

            {/* Melee Button */}
            <button
              onTouchStart={() => updateControls({ isMelee: true })}
              onTouchEnd={() => updateControls({ isMelee: false })}
              onMouseDown={() => updateControls({ isMelee: true })}
              onMouseUp={() => updateControls({ isMelee: false })}
              className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-black text-xs shadow-lg transition active:scale-95 cursor-pointer"
            >
              🗡️
            </button>
          </div>

          {/* Primary Action Buttons: JUMP and FIRE */}
          <div className="flex items-end gap-2.5">
            {/* JUMP Button */}
            <button
              onTouchStart={() => updateControls({ moveZ: -1 })}
              onTouchEnd={() => updateControls({ moveZ: 0 })}
              onMouseDown={() => updateControls({ moveZ: -1 })}
              onMouseUp={() => updateControls({ moveZ: 0 })}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 border-2 border-sky-300 text-white flex flex-col items-center justify-center font-black text-xs sm:text-sm tracking-wider shadow-xl transition active:scale-90 cursor-pointer"
            >
              <span className="text-xl sm:text-2xl leading-none">▲</span>
              <span className="text-[10px] sm:text-xs font-black mt-0.5">JUMP</span>
            </button>

            {/* Primary Action: Large SHOOT Button */}
            <button
              onTouchStart={() => updateControls({ isShooting: true })}
              onTouchEnd={() => updateControls({ isShooting: false })}
              onMouseDown={() => updateControls({ isShooting: true })}
              onMouseUp={() => updateControls({ isShooting: false })}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex flex-col items-center justify-center font-black text-white text-xs sm:text-sm tracking-wider shadow-2xl border-2 transition-transform active:scale-90 cursor-pointer ${
                combo.isRampage
                  ? 'bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 border-white shadow-amber-500/50 animate-pulse'
                  : 'bg-gradient-to-tr from-rose-600 via-red-500 to-orange-500 border-amber-300/60 shadow-red-600/40'
              }`}
            >
              <Crosshair className="w-7 h-7 sm:w-8 sm:h-8 mb-1" />
              <span>FIRE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
