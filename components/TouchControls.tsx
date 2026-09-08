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
    <div className="absolute inset-x-0 bottom-0 pointer-events-none z-30 select-none pb-5 px-4 sm:px-8 safe-bottom safe-left safe-right flex justify-between items-end">
      {/* Left side: D-PAD Controls */}
      <div className="flex items-center gap-3 pointer-events-auto">
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
          className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl backdrop-blur-lg border-2 flex items-center justify-center transition-all active:scale-95 shadow-xl ${
            leftActive
              ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-indigo-500/40 scale-95'
              : 'bg-slate-900/75 border-slate-700/80 text-slate-200'
          }`}
          aria-label="Run Left"
        >
          <ArrowLeft className="w-8 h-8" />
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
          className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl backdrop-blur-lg border-2 flex items-center justify-center transition-all active:scale-95 shadow-xl ${
            rightActive
              ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-indigo-500/40 scale-95'
              : 'bg-slate-900/75 border-slate-700/80 text-slate-200'
          }`}
          aria-label="Run Right"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>

      {/* Right side: Action Buttons (Quick Respawn + Big Jump) */}
      <div className="flex items-center gap-3 pointer-events-auto">
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
            className="w-11 h-11 rounded-xl bg-slate-900/70 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-amber-300 flex items-center justify-center shadow-lg active:scale-90 transition-transform mb-2"
            title="Quick Respawn at Checkpoint"
            aria-label="Respawn at checkpoint"
          >
            <RotateCcw className="w-5 h-5" />
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
          className={`w-20 h-20 sm:w-22 sm:h-22 rounded-3xl backdrop-blur-xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xl ${
            jumpActive
              ? 'bg-indigo-500 border-indigo-300 text-white shadow-indigo-500/50 scale-95 ring-4 ring-indigo-400/40'
              : 'bg-indigo-600/85 border-indigo-400/80 text-white shadow-indigo-600/40'
          }`}
          aria-label="Jump / Double Jump"
        >
          <ArrowUp className="w-8 h-8 sm:w-9 sm:h-9" />
          <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase mt-0.5">
            JUMP
          </span>
        </button>
      </div>
    </div>
  );
};
