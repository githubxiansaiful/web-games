'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Clock,
  Coins,
  Flag,
} from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import { ParkourInput } from '@/game/duo-rampage/parkour/character/ParkourRunner2D';

interface ParkourHUDProps {
  telemetry: {
    speedKmh: number;
    state: string;
    coyoteRemaining: number;
    jumpBufferRemaining: number;
    canDoubleJump: boolean;
    x: number;
    y: number;
    coins: number;
    totalCoins: number;
    timer: number;
    targetSeconds: number;
    checkpointIndex: number;
    totalCheckpoints: number;
    secretEmblem: boolean;
    bannerNotification: string | null;
  };
  onInputChange: (partial: Partial<ParkourInput>) => void;
  onReset: () => void;
  onExit: () => void;
}

export const ParkourHUD: React.FC<ParkourHUDProps> = ({
  telemetry,
  onInputChange,
  onReset,
  onExit,
}) => {
  // Auto-detect: mobile screen width (<= 1024px) defaults to touch mode, desktop defaults to desktop mode
  const [isTouchMode, setIsTouchMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 1024;
    }
    return false;
  });

  // Dynamically adapt mode: if key is pressed on a large screen, hide mobile buttons; if screen is touched, show mobile buttons
  useEffect(() => {
    const handleTouch = () => {
      setIsTouchMode(true);
    };
    const handleKey = () => {
      if (typeof window !== 'undefined' && window.innerWidth > 1024) {
        setIsTouchMode(false);
      }
    };

    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const [isMuted, setIsMuted] = useState(false);

  // Active pointer state tracking for multi-touch mobile buttons
  const leftPressed = useRef(false);
  const rightPressed = useRef(false);
  const sprintPressed = useRef(false);
  const jumpPressed = useRef(false);

  // Format time mm:ss.s
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    const tenths = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${tenths}`;
  };

  // ===========================================================================
  // DESKTOP KEYBOARD LISTENERS (Section 29)
  // ===========================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (key === 'a' || key === 'arrowleft') {
        leftPressed.current = true;
        onInputChange({ moveX: rightPressed.current ? 0 : -1 });
      } else if (key === 'd' || key === 'arrowright') {
        rightPressed.current = true;
        onInputChange({ moveX: leftPressed.current ? 0 : 1 });
      } else if (key === 'w' || key === 'arrowup') {
        onInputChange({ moveY: -1, jumpPressed: true, jumpHeld: true });
        duoAudio.playUiClick();
      } else if (key === ' ') {
        onInputChange({ jumpPressed: true, jumpHeld: true });
        duoAudio.playUiClick();
      } else if (key === 'shift') {
        sprintPressed.current = true;
        onInputChange({ sprintHeld: true });
      } else if (key === 's' || key === 'arrowdown') {
        onInputChange({ moveY: 1, slidePressed: true });
      } else if (key === 'r') {
        onReset();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'a' || key === 'arrowleft') {
        leftPressed.current = false;
        onInputChange({ moveX: rightPressed.current ? 1 : 0 });
      } else if (key === 'd' || key === 'arrowright') {
        rightPressed.current = false;
        onInputChange({ moveX: leftPressed.current ? -1 : 0 });
      } else if (key === ' ' || key === 'w' || key === 'arrowup') {
        onInputChange({ jumpHeld: false, moveY: 0 });
      } else if (key === 's' || key === 'arrowdown') {
        onInputChange({ moveY: 0 });
      } else if (key === 'shift') {
        sprintPressed.current = false;
        onInputChange({ sprintHeld: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onInputChange, onReset]);

  // ===========================================================================
  // MOBILE POINTER BUTTON HANDLERS (Multi-Touch Friendly)
  // ===========================================================================
  const handleLeftDown = (e: React.PointerEvent) => {
    e.preventDefault();
    leftPressed.current = true;
    onInputChange({ moveX: rightPressed.current ? 0 : -1 });
  };
  const handleLeftUp = (e: React.PointerEvent) => {
    e.preventDefault();
    leftPressed.current = false;
    onInputChange({ moveX: rightPressed.current ? 1 : 0 });
  };

  const handleRightDown = (e: React.PointerEvent) => {
    e.preventDefault();
    rightPressed.current = true;
    onInputChange({ moveX: leftPressed.current ? 0 : 1 });
  };
  const handleRightUp = (e: React.PointerEvent) => {
    e.preventDefault();
    rightPressed.current = false;
    onInputChange({ moveX: leftPressed.current ? -1 : 0 });
  };

  const handleJumpDown = (e: React.PointerEvent) => {
    e.preventDefault();
    jumpPressed.current = true;
    onInputChange({ jumpPressed: true, jumpHeld: true, moveY: -1 });
    duoAudio.playUiClick();
  };
  const handleJumpUp = (e: React.PointerEvent) => {
    e.preventDefault();
    jumpPressed.current = false;
    onInputChange({ jumpHeld: false, moveY: 0 });
  };

  const handleSlideDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onInputChange({ slidePressed: true, moveY: 1 });
  };
  const handleSlideUp = (e: React.PointerEvent) => {
    e.preventDefault();
    onInputChange({ moveY: 0 });
  };

  const handleSprintDown = (e: React.PointerEvent) => {
    e.preventDefault();
    sprintPressed.current = !sprintPressed.current;
    onInputChange({ sprintHeld: sprintPressed.current });
  };

  // State Action Prompts
  const renderActionHint = () => {
    switch (telemetry.state) {
      case 'WALL SLIDE':
        return (
          <div className="animate-bounce bg-sky-500/90 text-white font-black text-xs px-3.5 py-1 rounded-full shadow-lg">
            ▲ JUMP TO WALL-JUMP
          </div>
        );
      case 'LEDGE GRAB':
        return (
          <div className="bg-emerald-500/90 text-white font-black text-xs px-3.5 py-1 rounded-full shadow-lg flex items-center gap-2">
            <span>▲ PULL UP</span>
            <span>•</span>
            <span>▼ DROP</span>
            <span>•</span>
            <span>◄► JUMP</span>
          </div>
        );
      case 'CLIMBING':
        return (
          <div className="bg-amber-500/90 text-slate-950 font-black text-xs px-3.5 py-1 rounded-full shadow-lg">
            ▲ UP / ▼ DOWN • JUMP TO LEAP
          </div>
        );
      case 'VAULTING':
        return (
          <div className="bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1 rounded-full shadow-lg">
            ↷ VAULTING BARRIER
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-2.5 xs:p-3 sm:p-5 font-knight safe-top safe-bottom safe-left safe-right">
      {/* 1. TOP HEADER: Telemetry, Timer, Coins, Checkpoint, and Controls */}
      <header className="w-full flex items-start justify-between gap-2">
        {/* Left: Level Status & Live Telemetry */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-2xl flex items-center gap-2.5 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-cyan-400 font-black tracking-wider uppercase">
                  LEVEL 01 • SUMMER DAY
                </span>
                <span className="text-xs font-black text-white font-mono mt-0.5">
                  {telemetry.speedKmh} KM/H • {telemetry.state}
                </span>
              </div>
            </div>

            {/* Jump Timing Badges (Desktop view) */}
            <div className="hidden md:flex items-center gap-1.5 text-[9px] font-mono">
              <span
                className={`px-2 py-1 rounded-xl border ${
                  telemetry.coyoteRemaining > 0
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                COYOTE: {telemetry.coyoteRemaining}ms
              </span>
              <span
                className={`px-2 py-1 rounded-xl border ${
                  telemetry.canDoubleJump
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                2× JUMP: {telemetry.canDoubleJump ? 'READY' : 'SPENT'}
              </span>
            </div>
          </div>

          {/* Collectibles, Time, and Checkpoint Badges */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {/* Timer */}
            <div className="flex items-center gap-1 bg-slate-950/85 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-lg text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-black">{formatTime(telemetry.timer)}</span>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-1 bg-slate-950/85 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-lg text-amber-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-black">{telemetry.coins} / {telemetry.totalCoins}</span>
            </div>

            {/* Checkpoint */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-950/85 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-lg text-emerald-300">
              <Flag className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-black">CP {telemetry.checkpointIndex}/{telemetry.totalCheckpoints}</span>
            </div>

            {/* Secret Emblem found indicator */}
            {telemetry.secretEmblem && (
              <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400 text-amber-300 px-2 py-1 rounded-xl shadow-lg font-black text-[10px] animate-pulse">
                <span>💎</span>
                <span className="hidden sm:inline">EMBLEM FOUND</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Notification Banner / Action Hint */}
        <div className="flex flex-col items-center gap-1">
          {telemetry.bannerNotification && (
            <div className="bg-cyan-500/90 text-slate-950 font-black text-xs px-4 py-1.5 rounded-full shadow-2xl animate-in zoom-in-95 duration-150 border border-cyan-300">
              {telemetry.bannerNotification}
            </div>
          )}
          <div className="hidden sm:flex">{renderActionHint()}</div>
        </div>

        {/* Right: Controls Toggle, Respawn, Audio, Exit */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Manual mode switcher for hybrid screens */}
          <button
            onClick={() => setIsTouchMode((prev) => !prev)}
            className={`p-1.5 bg-slate-900/85 hover:bg-slate-800 border rounded-xl transition cursor-pointer shadow-md ${
              isTouchMode ? 'border-cyan-400 text-cyan-400' : 'border-slate-700 text-slate-400'
            }`}
            title="Toggle Mobile Buttons / Desktop Mode"
          >
            {isTouchMode ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              duoAudio.playUiClick();
              onReset();
            }}
            className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-amber-400 rounded-xl transition cursor-pointer shadow-md"
            title="Respawn at Checkpoint (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const muted = duoAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer shadow-md"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onExit}
            className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer shadow-md"
            title="Exit Level"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* Mobile Center Hint */}
      <div className="flex sm:hidden justify-center">{renderActionHint()}</div>

      {/* 2. BOTTOM CONTROLS: Strict Mobile Buttons vs Desktop Details */}
      {isTouchMode ? (
        /* ===================================================================
           MOBILE CONTROLS: Prominent Directional D-Pad + Big Action Buttons
           (NO desktop keyboard details shown)
           =================================================================== */
        <div className="w-full flex items-end justify-between pointer-events-none pb-1.5 px-1">
          {/* Left Side: Crystal-Clear Directional Buttons (LEFT & RIGHT) */}
          <div className="flex items-center gap-2.5 pointer-events-auto select-none touch-none">
            {/* Move Left Button */}
            <button
              onPointerDown={handleLeftDown}
              onPointerUp={handleLeftUp}
              onPointerCancel={handleLeftUp}
              onPointerLeave={handleLeftUp}
              className="w-14 h-14 xs:w-16 xs:h-16 rounded-2xl bg-slate-950/70 active:bg-cyan-600/80 border-2 border-white/30 active:border-cyan-300 backdrop-blur-md text-white font-black flex items-center justify-center shadow-xl transition active:scale-95 touch-none cursor-pointer"
            >
              <span className="text-2xl leading-none">◀</span>
            </button>

            {/* Move Right Button */}
            <button
              onPointerDown={handleRightDown}
              onPointerUp={handleRightUp}
              onPointerCancel={handleRightUp}
              onPointerLeave={handleRightUp}
              className="w-14 h-14 xs:w-16 xs:h-16 rounded-2xl bg-slate-950/70 active:bg-cyan-600/80 border-2 border-white/30 active:border-cyan-300 backdrop-blur-md text-white font-black flex items-center justify-center shadow-xl transition active:scale-95 touch-none cursor-pointer"
            >
              <span className="text-2xl leading-none">▶</span>
            </button>
          </div>

          {/* Right Side: Action Cluster (SPRINT, SLIDE, JUMP) */}
          <div className="flex items-center gap-2.5 pointer-events-auto select-none touch-none">
            {/* Sprint Button */}
            <button
              onPointerDown={handleSprintDown}
              className="w-12 h-12 xs:w-13 xs:h-13 rounded-2xl bg-amber-500/80 active:bg-amber-400 border border-amber-300/60 backdrop-blur-md text-slate-950 font-black flex flex-col items-center justify-center shadow-lg transition active:scale-95 touch-none cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span className="text-[8px] font-black tracking-tight mt-0.5">SPRINT</span>
            </button>

            {/* Slide / Drop Button */}
            <button
              onPointerDown={handleSlideDown}
              onPointerUp={handleSlideUp}
              onPointerCancel={handleSlideUp}
              onPointerLeave={handleSlideUp}
              className="w-12 h-12 xs:w-13 xs:h-13 rounded-2xl bg-slate-950/70 active:bg-slate-900 border-2 border-cyan-400/50 backdrop-blur-md text-cyan-300 font-black flex flex-col items-center justify-center shadow-lg transition active:scale-95 touch-none cursor-pointer"
            >
              <span className="text-lg leading-none">▼</span>
              <span className="text-[8px] font-black tracking-tight mt-0.5">SLIDE</span>
            </button>

            {/* Primary JUMP Button */}
            <button
              onPointerDown={handleJumpDown}
              onPointerUp={handleJumpUp}
              onPointerCancel={handleJumpUp}
              onPointerLeave={handleJumpUp}
              className="w-16 h-15 xs:w-18 xs:h-16 rounded-3xl bg-gradient-to-tr from-sky-600 via-blue-500 to-cyan-400 border-2 border-sky-200 text-white font-black flex flex-col items-center justify-center shadow-2xl transition active:scale-95 touch-none cursor-pointer"
            >
              <span className="text-2xl leading-none">▲</span>
              <span className="text-[10px] font-black tracking-wider mt-0.5">JUMP</span>
            </button>
          </div>
        </div>
      ) : (
        /* ===================================================================
           DESKTOP CONTROLS: Clean Keyboard Guide at bottom
           (NO mobile buttons shown on desktop!)
           =================================================================== */
        <div className="w-full flex justify-center pb-2 pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-2xl flex items-center gap-3.5 text-xs text-slate-300 font-mono shadow-2xl">
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-300 font-bold border border-slate-700">A / D</kbd> Move
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-300 font-bold border border-slate-700">W / Space</kbd> Jump / 2× Jump
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300 font-bold border border-slate-700">Shift</kbd> Sprint
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300 font-bold border border-slate-700">S</kbd> Slide
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700">R</kbd> Respawn
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
