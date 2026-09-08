'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from 'lucide-react';

interface TouchControlsProps {
  onDirectionPress: (dir: 'left' | 'right', pressed: boolean) => void;
  onJumpPress: (pressed: boolean) => void;
  onQuickRespawn?: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirectionPress,
  onJumpPress,
  onQuickRespawn,
}) => {
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);
  const [jumpActive, setJumpActive] = useState(false);

  // Keep track of active touches for robust multi-touch
  const leftTouchId = useRef<number | null>(null);
  const rightTouchId = useRef<number | null>(null);
  const jumpTouchId = useRef<number | null>(null);

  const triggerHaptic = useCallback((pattern: number | number[] = 12) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  }, []);

  // Left button touch handlers
  const handleLeftTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      leftTouchId.current = e.changedTouches[0].identifier;
      setLeftActive(true);
      onDirectionPress('left', true);
      triggerHaptic(10);
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === leftTouchId.current) {
        leftTouchId.current = null;
        setLeftActive(false);
        onDirectionPress('left', false);
        break;
      }
    }
  };

  // Right button touch handlers
  const handleRightTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      rightTouchId.current = e.changedTouches[0].identifier;
      setRightActive(true);
      onDirectionPress('right', true);
      triggerHaptic(10);
    }
  };

  const handleRightTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === rightTouchId.current) {
        rightTouchId.current = null;
        setRightActive(false);
        onDirectionPress('right', false);
        break;
      }
    }
  };

  // Jump button touch handlers
  const handleJumpTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      jumpTouchId.current = e.changedTouches[0].identifier;
      setJumpActive(true);
      onJumpPress(true);
      triggerHaptic([15, 10]);
    }
  };

  const handleJumpTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === jumpTouchId.current) {
        jumpTouchId.current = null;
        setJumpActive(false);
        onJumpPress(false);
        break;
      }
    }
  };

  // Clean up if touches cancel
  useEffect(() => {
    const handleGlobalTouchCancel = () => {
      leftTouchId.current = null;
      rightTouchId.current = null;
      jumpTouchId.current = null;
      setLeftActive(false);
      setRightActive(false);
      setJumpActive(false);
      onDirectionPress('left', false);
      onDirectionPress('right', false);
      onJumpPress(false);
    };

    window.addEventListener('touchcancel', handleGlobalTouchCancel);
    return () => {
      window.removeEventListener('touchcancel', handleGlobalTouchCancel);
    };
  }, [onDirectionPress, onJumpPress]);

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none z-30 select-none pb-4 sm:pb-6 px-3 sm:px-8 safe-bottom safe-left safe-right flex justify-between items-end touch-none">
      {/* Left side: D-PAD Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
        {/* Left Arrow Button */}
        <button
          onTouchStart={handleLeftTouchStart}
          onTouchEnd={handleLeftTouchEnd}
          onMouseDown={() => {
            setLeftActive(true);
            onDirectionPress('left', true);
            triggerHaptic(10);
          }}
          onMouseUp={() => {
            setLeftActive(false);
            onDirectionPress('left', false);
          }}
          onMouseLeave={() => {
            if (leftActive) {
              setLeftActive(false);
              onDirectionPress('left', false);
            }
          }}
          className={`w-15 h-15 sm:w-18 sm:h-18 rounded-2xl backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 shadow-lg select-none touch-none ${
            leftActive
              ? 'bg-indigo-600/90 border-indigo-300 text-white shadow-indigo-500/40 scale-95'
              : 'bg-slate-950/35 hover:bg-slate-900/50 border-white/20 text-white/80'
          }`}
          aria-label="Run Left"
        >
          <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>

        {/* Right Arrow Button */}
        <button
          onTouchStart={handleRightTouchStart}
          onTouchEnd={handleRightTouchEnd}
          onMouseDown={() => {
            setRightActive(true);
            onDirectionPress('right', true);
            triggerHaptic(10);
          }}
          onMouseUp={() => {
            setRightActive(false);
            onDirectionPress('right', false);
          }}
          onMouseLeave={() => {
            if (rightActive) {
              setRightActive(false);
              onDirectionPress('right', false);
            }
          }}
          className={`w-15 h-15 sm:w-18 sm:h-18 rounded-2xl backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 shadow-lg select-none touch-none ${
            rightActive
              ? 'bg-indigo-600/90 border-indigo-300 text-white shadow-indigo-500/40 scale-95'
              : 'bg-slate-950/35 hover:bg-slate-900/50 border-white/20 text-white/80'
          }`}
          aria-label="Run Right"
        >
          <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Right side: Action Buttons (Quick Respawn + Big Jump) */}
      <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
        {/* Quick Respawn Mini Button */}
        {onQuickRespawn && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic(20);
              onQuickRespawn();
            }}
            onClick={() => {
              triggerHaptic(20);
              onQuickRespawn();
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/35 hover:bg-slate-900/50 backdrop-blur-md border border-white/20 text-amber-300/85 flex items-center justify-center shadow-md active:scale-90 transition-transform mb-1.5 touch-none select-none"
            title="Quick Respawn at Checkpoint"
            aria-label="Respawn at checkpoint"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Jump Button */}
        <button
          onTouchStart={handleJumpTouchStart}
          onTouchEnd={handleJumpTouchEnd}
          onMouseDown={() => {
            setJumpActive(true);
            onJumpPress(true);
            triggerHaptic([15, 10]);
          }}
          onMouseUp={() => {
            setJumpActive(false);
            onJumpPress(false);
          }}
          onMouseLeave={() => {
            if (jumpActive) {
              setJumpActive(false);
              onJumpPress(false);
            }
          }}
          className={`w-18 h-18 sm:w-22 sm:h-22 rounded-3xl backdrop-blur-md border flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl select-none touch-none ${
            jumpActive
              ? 'bg-indigo-600/90 border-indigo-300 text-white shadow-indigo-500/50 scale-95 ring-4 ring-indigo-400/40'
              : 'bg-indigo-600/45 border-indigo-400/60 text-white/90 shadow-indigo-950/30'
          }`}
          aria-label="Jump / Double Jump"
        >
          <ArrowUp className="w-7 h-7 sm:w-9 sm:h-9" />
          <span className="text-[9px] sm:text-xs font-black tracking-widest uppercase mt-0.5">
            JUMP
          </span>
        </button>
      </div>
    </div>
  );
};
