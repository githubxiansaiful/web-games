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
  Smartphone,
  Monitor,
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
  // Controls mode: true = touch controls (mobile buttons visible, desktop hints hidden), false = desktop (mobile buttons hidden, desktop hints visible)
  const [isTouchMode, setIsTouchMode] = useState(false);

  // Auto-detect touch vs desktop and seamlessly adapt on input
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectDeviceMode = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      const isNarrowScreen = window.innerWidth <= 1024;
      const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
      return (hasTouch && isNarrowScreen) || isMobileUserAgent;
    };

    setIsTouchMode(detectDeviceMode());

    // Switch to desktop mode on keyboard input
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift', 'r', 'f', 'v', 'e', 'g', 'q', '1', '2', '3', 'x'].includes(key)
      ) {
        setIsTouchMode(false);
      }
    };

    // Switch to touch mode on screen touch
    const handleTouchStartGlobal = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button[data-no-touch-switch="true"]')) return;
      setIsTouchMode(true);
    };

    window.addEventListener('keydown', handleKeyDownGlobal);
    window.addEventListener('touchstart', handleTouchStartGlobal, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDownGlobal);
      window.removeEventListener('touchstart', handleTouchStartGlobal);
    };
  }, []);
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

    const handleWheel = () => {
      onSwitchWeapon?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [onControlsChange, onSwitchWeapon]);

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
        const maxDist = 38;
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

  const myPlayer = player2 ? (myRole === 'assault' ? player1 : player2) : player1;
  const partnerPlayer = player2 ? (myRole === 'assault' ? player2 : player1) : null;

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
            {isTouchMode
              ? `APPROACH AND HOLD [REVIVE] (${Math.ceil(partnerPlayer.downTimer)}s LEFT)`
              : `APPROACH AND HOLD [E] (${Math.ceil(partnerPlayer.downTimer)}s LEFT)`}
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
      <div className="w-full px-2 xs:px-4 sm:px-6 pt-2 xs:pt-3 flex items-start justify-between pointer-events-none">
        {/* Left: DUO RAMPAGE LOGO & P1 HUD */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/images/duo-rampage/duo_rampage_logo.png"
            alt="Duo Rampage"
            className="h-8 sm:h-11 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] hidden md:block"
          />

          {/* Player 1 Card (Solo or Co-op P1) */}
          <div className="flex items-center gap-1.5 xs:gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 xs:p-2 rounded-2xl border border-red-500/50 shadow-2xl">
            <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-red-500 bg-slate-900 shadow-md shrink-0 relative">
              <img
                src={player1?.avatar || (player1?.role === 'heavy' ? '/images/duo-rampage/player2_hologram.png' : '/images/duo-rampage/player1.png')}
                alt={player2 ? 'P1' : 'HERO'}
                className="w-full h-full object-cover"
                style={{ objectPosition: '45% 18%', transform: 'scale(1.4)' }}
              />
              <span className="absolute top-0.5 left-0.5 px-1 bg-red-600/90 rounded text-[8px] xs:text-[9px] font-black text-white leading-tight">
                {player2 ? 'P1' : 'HERO'}
              </span>
            </div>
            <div className="w-20 xs:w-26 sm:w-36">
              <div className="flex items-center justify-between text-[10px] xs:text-[11px] font-black tracking-wide text-red-400">
                <span className="truncate">{player1 ? player1.name : 'HERO'}</span>
                <span className="text-white text-[9px] xs:text-[10px]">{player1 ? `${Math.round(player1.health)}` : '100'}</span>
              </div>
              {/* HP Bar */}
              <div className="w-full h-2.5 xs:h-3 bg-slate-900 rounded-sm overflow-hidden mt-0.5 border border-red-900/60 relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-150"
                  style={{ width: `${player1 ? (player1.health / player1.maxHealth) * 100 : 100}%` }}
                />
              </div>
              {/* Ammo Bar */}
              <div className="w-full h-1 xs:h-1.5 bg-slate-950 rounded-sm overflow-hidden mt-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                  style={{ width: `${player1 ? (player1.ammo / player1.maxAmmo) * 100 : 100}%` }}
                />
              </div>
              {/* Weapon Indicator Badge (Essential on Desktop when touch buttons are hidden) */}
              <div className="flex items-center justify-between text-[8px] xs:text-[9px] font-black text-amber-300 mt-0.5 uppercase tracking-tight">
                <span className="truncate">🔫 {myPlayer ? myPlayer.weapon : 'RIFLE'}</span>
                <span className="text-slate-400 font-mono text-[7px] xs:text-[8px] shrink-0 ml-1">
                  {myPlayer ? `${myPlayer.ammo}/${myPlayer.maxAmmo}` : '30/30'}
                  {!isTouchMode && <span className="hidden sm:inline ml-1 text-slate-500 font-normal">[1/2/3/X]</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Wave & DUO COMBO Meter */}
        <div className="flex flex-col items-center gap-1">
          {/* Wave Badge */}
          <div className="px-3 py-0.5 xs:px-3.5 xs:py-1 bg-slate-900/90 border border-slate-700/80 rounded-full text-[10px] xs:text-[11px] font-black tracking-widest text-slate-200 shadow-md">
            WAVE {wave.currentWave} / {wave.totalWaves}
          </div>

          {/* DUO COMBO Meter */}
          {combo.count > 0 && (
            <div
              className={`px-3 py-0.5 xs:px-4 xs:py-1 rounded-2xl font-black text-[11px] xs:text-xs sm:text-sm tracking-wider flex items-center gap-1.5 shadow-lg transform transition-transform duration-100 ${
                combo.isRampage
                  ? 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 scale-105 sm:scale-110 animate-bounce'
                  : 'bg-slate-900/90 border border-amber-500/50 text-amber-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span>
                {combo.isRampage
                  ? `RAMPAGE! (${Math.ceil(combo.rampageTimer)}s)`
                  : `COMBO ×${combo.multiplier} (${combo.count})`}
              </span>
            </div>
          )}
        </div>

        {/* Right: Player 2 (Heavy Hero) & Controls */}
        <div className="flex items-center gap-1.5 xs:gap-2">
          {/* Player 2 Card (Co-op only) */}
          {player2 && (
            <div className="flex items-center gap-1.5 xs:gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 xs:p-2 rounded-2xl border border-sky-500/50 shadow-2xl">
              <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-sky-400 bg-slate-900 shadow-md shrink-0 relative">
                <img
                  src={player2.avatar || '/images/duo-rampage/player2_hologram.png'}
                  alt="P2"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: '50% 20%', transform: 'scale(1.4)' }}
                />
                <span className="absolute top-0.5 right-0.5 px-1 bg-sky-600/90 rounded text-[8px] xs:text-[9px] font-black text-white leading-tight">
                  P2
                </span>
              </div>
              <div className="w-20 xs:w-26 sm:w-36">
                <div className="flex items-center justify-between text-[10px] xs:text-[11px] font-black tracking-wide text-sky-400">
                  <span className="truncate">{player2.name}</span>
                  <span className="text-white text-[9px] xs:text-[10px]">{Math.round(player2.health)}</span>
                </div>
                {/* HP Bar */}
                <div className="w-full h-2.5 xs:h-3 bg-slate-900 rounded-sm overflow-hidden mt-0.5 border border-sky-900/60 relative">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-150"
                    style={{ width: `${(player2.health / player2.maxHealth) * 100}%` }}
                  />
                </div>
                {/* Ammo Bar */}
                <div className="w-full h-1 xs:h-1.5 bg-slate-950 rounded-sm overflow-hidden mt-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
                    style={{ width: `${(player2.ammo / player2.maxAmmo) * 100}%` }}
                  />
                </div>
                {/* Weapon Indicator Badge */}
                <div className="flex items-center justify-between text-[8px] xs:text-[9px] font-black text-amber-300 mt-0.5 uppercase tracking-tight">
                  <span className="truncate">🔫 {player2.weapon}</span>
                  <span className="text-slate-400 font-mono text-[7px] xs:text-[8px] shrink-0 ml-1">
                    {player2.ammo}/{player2.maxAmmo}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Controls Mode Toggle, Audio Mute, and Exit Buttons */}
          <div className="flex flex-col gap-1 xs:gap-1.5 pointer-events-auto">
            {/* Toggle Controls Mode Button (Touch vs Desktop) */}
            <button
              onClick={() => setIsTouchMode((prev) => !prev)}
              data-no-touch-switch="true"
              className={`p-1.5 bg-slate-900/80 hover:bg-slate-800 border rounded-xl transition cursor-pointer ${
                isTouchMode
                  ? 'border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isTouchMode ? 'Switch to Desktop Mode (Hide Touch Buttons)' : 'Switch to Touch Mode (Show Touch Buttons)'}
            >
              {isTouchMode ? <Smartphone className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> : <Monitor className="w-3.5 h-3.5 xs:w-4 xs:h-4" />}
            </button>
            <button
              onClick={() => {
                const muted = duoAudio.toggleMute();
                setIsMuted(muted);
              }}
              data-no-touch-switch="true"
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-cyan-400" />}
            </button>
            <button
              onClick={onExit}
              data-no-touch-switch="true"
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              title="Exit Game"
            >
              <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. CONTROLS AREA (DESKTOP DETAILS VS MOBILE BUTTONS) */}
      {isTouchMode ? (
        /* MOBILE TOUCH CONTROLS (Only visible on touch / mobile devices) */
        <div className="absolute bottom-2.5 xs:bottom-3 sm:bottom-4 inset-x-0 px-2 xs:px-4 sm:px-6 flex items-end justify-between pointer-events-none safe-bottom animate-in fade-in duration-150">
          {/* Left: Compact Translucent Movement Joystick */}
          <div
            ref={joystickBaseRef}
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
            onTouchCancel={handleJoystickTouchEnd}
            className="w-20 h-20 xs:w-22 xs:h-22 sm:w-24 sm:h-24 rounded-full bg-slate-950/35 border border-white/20 backdrop-blur-xs pointer-events-auto flex items-center justify-center relative touch-none shadow-xl active:border-cyan-400/70 transition-colors"
          >
            <div
              ref={joystickStickRef}
              className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-cyan-500/80 to-sky-400/80 border border-white/70 shadow-md pointer-events-none transition-transform duration-75"
            />
          </div>

          {/* Right: Low-Profile 2-Row Thumb Action Cluster (Max height ~95px, does not block catwalks) */}
          <div className="flex flex-col items-end gap-1.5 xs:gap-2 pointer-events-auto select-none">
            {/* Row 1: Utility Skills (Weapon Switch, Bomb, Dash, Melee, Revive) */}
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
              {/* Revive Button (Highlights if partner down, co-op only) */}
              {partnerPlayer && (
                <button
                  onTouchStart={() => updateControls({ isReviving: true })}
                  onTouchEnd={() => updateControls({ isReviving: false })}
                  className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center font-black text-xs shadow-md backdrop-blur-xs transition active:scale-90 cursor-pointer touch-none ${
                    partnerPlayer?.isDown
                      ? 'bg-emerald-500/90 border-emerald-300 text-white animate-bounce shadow-emerald-500/40'
                      : 'bg-slate-950/40 border-white/20 text-slate-300'
                  }`}
                  title="Revive Teammate"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              )}

              {/* Quick Weapon Switch Button */}
              <button
                onClick={() => onSwitchWeapon?.()}
                className="h-8 xs:h-9 px-2 xs:px-2.5 rounded-xl bg-slate-950/45 hover:bg-slate-900/60 border border-white/20 text-amber-400 backdrop-blur-xs flex items-center gap-1 font-black text-[9px] xs:text-[10px] shadow-md transition active:scale-90 cursor-pointer touch-none"
                title="Switch Weapon"
              >
                <span className="text-xs">🔫</span>
                <span className="text-[7.5px] xs:text-[8.5px] uppercase tracking-tight text-amber-300 font-mono">
                  {myPlayer?.weapon === 'pistol' ? 'PSTL' : myPlayer?.weapon === 'rifle' ? 'RFL' : 'SHTG'}
                </span>
              </button>

              {/* Grenade / Bomb Button */}
              <button
                onTouchStart={() => updateControls({ isGrenade: true })}
                onTouchEnd={() => updateControls({ isGrenade: false })}
                className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-600/50 hover:bg-orange-600/70 border border-orange-400/40 text-white backdrop-blur-xs flex items-center justify-center text-xs shadow-md transition active:scale-90 cursor-pointer touch-none"
                title="Throw Bomb"
              >
                <span className="text-sm leading-none">💣</span>
              </button>

              {/* Dash Button */}
              <button
                onTouchStart={() => updateControls({ isDashing: true })}
                onTouchEnd={() => updateControls({ isDashing: false })}
                className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950/45 hover:bg-slate-900/60 border border-cyan-400/40 text-cyan-400 backdrop-blur-xs flex items-center justify-center shadow-md transition active:scale-90 cursor-pointer touch-none"
                title="Dash"
              >
                <Zap className="w-4 h-4 fill-current" />
              </button>

              {/* Melee Knife Button */}
              <button
                onTouchStart={() => updateControls({ isMelee: true })}
                onTouchEnd={() => updateControls({ isMelee: false })}
                className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-950/45 hover:bg-slate-900/60 border border-amber-400/40 text-amber-300 backdrop-blur-xs flex items-center justify-center text-xs shadow-md transition active:scale-90 cursor-pointer touch-none"
                title="Melee"
              >
                🗡️
              </button>
            </div>

            {/* Row 2: Primary Action Buttons (JUMP and FIRE) */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5">
              {/* JUMP Button */}
              <button
                onTouchStart={() => updateControls({ moveZ: -1 })}
                onTouchEnd={() => updateControls({ moveZ: 0 })}
                className="w-12 h-11 xs:w-14 xs:h-12 sm:w-16 sm:h-14 rounded-2xl bg-sky-600/65 hover:bg-sky-500/80 active:bg-sky-500/90 border border-sky-300/50 backdrop-blur-xs text-white flex flex-col items-center justify-center font-black shadow-lg transition active:scale-90 cursor-pointer touch-none"
              >
                <span className="text-base xs:text-lg leading-none">▲</span>
                <span className="text-[8px] xs:text-[9px] font-black tracking-wider mt-0.5">JUMP</span>
              </button>

              {/* Primary Action: SHOOT / FIRE Button */}
              <button
                onTouchStart={() => updateControls({ isShooting: true })}
                onTouchEnd={() => updateControls({ isShooting: false })}
                className={`w-14 h-12 xs:w-16 xs:h-14 sm:w-18 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-xl border backdrop-blur-xs transition active:scale-90 cursor-pointer touch-none ${
                  combo.isRampage
                    ? 'bg-gradient-to-tr from-red-600/90 via-amber-500/90 to-yellow-400/90 border-white shadow-amber-500/40 animate-pulse'
                    : 'bg-gradient-to-tr from-rose-600/80 via-red-600/80 to-orange-500/80 border-rose-300/60 shadow-red-600/30'
                }`}
              >
                <Crosshair className="w-5 h-5 xs:w-6 xs:h-6 mb-0.5" />
                <span className="text-[9px] xs:text-[10px] font-black tracking-wider">FIRE</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* DESKTOP DETAILS (Only visible on desktop mode, NO mobile buttons) */
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none select-none animate-in fade-in duration-200">
          <div className="flex flex-col items-center bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-4 py-2.5 rounded-2xl text-[11px] font-semibold text-slate-300 space-y-1.5 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-cyan-300 text-[10px] font-bold border border-slate-700 shadow-xs">WASD</kbd> Move
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-cyan-300 text-[10px] font-bold border border-slate-700 shadow-xs">L-CLICK</kbd> Shoot
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-cyan-300 text-[10px] font-bold border border-slate-700 shadow-xs">SPACE</kbd> Jump
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-cyan-300 text-[10px] font-bold border border-slate-700 shadow-xs">SHIFT</kbd> Dash
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-slate-800/90 rounded font-mono text-amber-300 text-[9px] font-bold border border-slate-700">1/2/3/X or Wheel</kbd> Weapon
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-slate-800/90 rounded font-mono text-amber-300 text-[9px] font-bold border border-slate-700">G</kbd> Bomb
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-slate-800/90 rounded font-mono text-amber-300 text-[9px] font-bold border border-slate-700">F</kbd> Melee
              </span>
              {partnerPlayer && (
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 bg-slate-800/90 rounded font-mono text-emerald-300 text-[9px] font-bold border border-slate-700">E</kbd> Revive
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
