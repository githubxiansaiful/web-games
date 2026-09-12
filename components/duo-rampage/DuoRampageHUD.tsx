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

      if (key === 'a' || key === 'arrowleft') {
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
      } else if (key === ' ' || key === 'shift') {
        controlsRef.current.isDashing = true;
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
      } else if (key === 'w' || key === 'arrowup' || key === 's' || key === 'arrowdown') {
        controlsRef.current.moveZ = 0;
        changed = true;
      } else if (key === ' ' || key === 'shift') {
        controlsRef.current.isDashing = false;
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

      {/* 4. TOP BAR: HEALTH BARS & COMBO METER */}
      <div className="w-full px-3 sm:px-6 pt-3 flex items-start justify-between">
        {/* Left: Player 1 (Assault Hero) */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-sky-500/40 shadow-xl max-w-[170px] sm:max-w-xs">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center font-black text-white text-lg shadow-md shrink-0">
            ⚡
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-black text-sky-300 truncate">
              <span>{player1 ? player1.name : 'Assault'}</span>
              <span className="text-white">{player1 ? `${Math.round(player1.health)} HP` : '100 HP'}</span>
            </div>
            {/* HP Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-150"
                style={{ width: `${player1 ? (player1.health / player1.maxHealth) * 100 : 100}%` }}
              />
            </div>
            {/* Ammo Badge */}
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mt-0.5">
              <span className="uppercase text-sky-400">{player1?.weapon || 'Rifle'}</span>
              <span className="text-amber-400">
                {player1?.isReloading ? 'RELOADING...' : `${player1?.ammo}/${player1?.maxAmmo}`}
              </span>
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

          {/* Player 2 Card */}
          <div className="flex items-center gap-2.5 bg-slate-950/80 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-orange-500/40 shadow-xl max-w-[170px] sm:max-w-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-md shrink-0">
              💥
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] font-black text-orange-300 truncate">
                <span>{player2 ? player2.name : 'Heavy'}</span>
                <span className="text-white">{player2 ? `${Math.round(player2.health)} HP` : '100 HP'}</span>
              </div>
              {/* HP Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-150"
                  style={{ width: `${player2 ? (player2.health / player2.maxHealth) * 100 : 100}%` }}
                />
              </div>
              {/* Ammo Badge */}
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mt-0.5">
                <span className="uppercase text-orange-400">{player2?.weapon || 'Shotgun'}</span>
                <span className="text-amber-400">
                  {player2?.isReloading ? 'RELOADING...' : `${player2?.ammo}/${player2?.maxAmmo}`}
                </span>
              </div>
            </div>
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
            {/* Revive Button (Highlights if partner down) */}
            <button
              onTouchStart={() => updateControls({ isReviving: true })}
              onTouchEnd={() => updateControls({ isReviving: false })}
              onMouseDown={() => updateControls({ isReviving: true })}
              onMouseUp={() => updateControls({ isReviving: false })}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-xs shadow-lg transition active:scale-95 cursor-pointer ${
                partnerPlayer?.isDown
                  ? 'bg-emerald-500 border-emerald-300 text-white animate-bounce'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300'
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

            {/* Reload Button */}
            <button
              onTouchStart={() => updateControls({ isReloading: true })}
              onTouchEnd={() => updateControls({ isReloading: false })}
              onMouseDown={() => updateControls({ isReloading: true })}
              onMouseUp={() => updateControls({ isReloading: false })}
              className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-black text-xs shadow-lg transition active:scale-95 cursor-pointer"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

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
  );
};
