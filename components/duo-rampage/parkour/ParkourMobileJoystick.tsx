'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface ParkourJoystickEvent {
  moveX: number; // -1 to 1
  moveY: number; // -1 (up) to 1 (down)
  isSprinting: boolean;
  isUpPressed: boolean;
  isDownPressed: boolean;
  active: boolean;
}

interface ParkourMobileJoystickProps {
  onJoystickChange: (state: ParkourJoystickEvent) => void;
  size?: number;
  className?: string;
}

/**
 * Dedicated Custom Mobile Joystick for Dhaka Parkour
 *
 * Engineered with native Multi-Touch `touch.identifier` tracking:
 * - 100% immune to right-hand button touches (Jump, Slide, Sprint).
 * - Never disconnects when other buttons are pressed or released.
 * - Auto-Sprint threshold on hard horizontal tilt.
 * - Direct Up/Down integration for seamless climbing and sliding.
 * - Cyberpunk neon aesthetic with directional feedback.
 */
export const ParkourMobileJoystick: React.FC<ParkourMobileJoystickProps> = ({
  onJoystickChange,
  size = 136,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  // Active touch tracking
  const activeTouchId = useRef<number | null>(null);
  const centerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [directionAngle, setDirectionAngle] = useState(0);
  const [isSprinting, setIsSprinting] = useState(false);

  const onChangeRef = useRef(onJoystickChange);
  onChangeRef.current = onJoystickChange;

  const radius = size * 0.5;
  const knobRadius = size * 0.22;
  const maxDistance = radius - knobRadius;

  // Process movement from clientX, clientY
  const processMove = useCallback(
    (clientX: number, clientY: number) => {
      let dx = clientX - centerPos.current.x;
      let dy = clientY - centerPos.current.y;

      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      setDirectionAngle(angle);

      // Clamp within radius
      if (distance > maxDistance && distance > 0) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }

      // Normalized coordinates (-1 to 1)
      const normX = maxDistance > 0 ? dx / maxDistance : 0;
      const normY = maxDistance > 0 ? dy / maxDistance : 0;

      // Deadzone threshold (8%)
      const deadzone = 0.08;
      const moveX = Math.abs(normX) > deadzone ? normX : 0;
      const moveY = Math.abs(normY) > deadzone ? normY : 0;

      // Sprint triggers when tilting far horizontally (> 75%)
      const sprinting = Math.abs(moveX) > 0.75;
      setIsSprinting(sprinting);

      // Move knob DOM element
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }

      onChangeRef.current({
        moveX,
        moveY,
        isSprinting: sprinting,
        isUpPressed: normY < -0.55,
        isDownPressed: normY > 0.55,
        active: true,
      });
    },
    [maxDistance]
  );

  const handleReset = useCallback(() => {
    activeTouchId.current = null;
    setIsActive(false);
    setIsSprinting(false);

    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }

    onChangeRef.current({
      moveX: 0,
      moveY: 0,
      isSprinting: false,
      isUpPressed: false,
      isDownPressed: false,
      active: false,
    });
  }, []);

  // Dedicated Native Touch Event Listeners with strict touch.identifier
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      // If already tracking a touch, ignore other fingers touching the base
      if (activeTouchId.current !== null) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      e.preventDefault();
      e.stopPropagation();

      activeTouchId.current = touch.identifier;
      setIsActive(true);

      const rect = container.getBoundingClientRect();
      centerPos.current = {
        x: rect.left + rect.width * 0.5,
        y: rect.top + rect.height * 0.5,
      };

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(8);
        } catch {}
      }

      processMove(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (activeTouchId.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId.current) {
          e.preventDefault();
          e.stopPropagation();
          processMove(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (activeTouchId.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId.current) {
          e.preventDefault();
          e.stopPropagation();
          handleReset();
          break;
        }
      }
    };

    const onTouchCancel = (e: TouchEvent) => {
      if (activeTouchId.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId.current) {
          handleReset();
          break;
        }
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchCancel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [processMove, handleReset]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none touch-none ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Outer Glow Ring on Active */}
      <div
        className={`absolute inset-0 rounded-full transition-opacity duration-200 pointer-events-none ${
          isActive
            ? isSprinting
              ? 'opacity-90 shadow-[0_0_24px_rgba(245,158,11,0.55)] border border-amber-400'
              : 'opacity-75 shadow-[0_0_20px_rgba(56,189,248,0.45)] border border-cyan-400'
            : 'opacity-40 border border-slate-700/60'
        }`}
      />

      {/* Joystick Base */}
      <div
        className="w-full h-full rounded-full relative overflow-hidden backdrop-blur-md"
        style={{
          background: isActive
            ? 'radial-gradient(circle at center, rgba(15,23,42,0.85) 0%, rgba(3,7,18,0.95) 100%)'
            : 'radial-gradient(circle at center, rgba(15,23,42,0.7) 0%, rgba(2,6,23,0.85) 100%)',
        }}
      >
        {/* Crosshair Guides */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
          <div className="w-full h-[1px] bg-cyan-400" />
          <div className="h-full w-[1px] bg-cyan-400 absolute" />
        </div>

        {/* Directional Labels */}
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-cyan-400/50 pointer-events-none">
          ▲
        </span>
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-amber-400/50 pointer-events-none">
          ▼
        </span>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-black text-cyan-400/50 pointer-events-none">
          ◄
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-black text-cyan-400/50 pointer-events-none">
          ►
        </span>
      </div>

      {/* Thumb Knob */}
      <div
        ref={knobRef}
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          left: '50%',
          width: size * 0.44,
          height: size * 0.44,
          transform: 'translate(-50%, -50%)',
          willChange: 'transform',
        }}
      >
        <div
          className={`w-full h-full rounded-full flex items-center justify-center transition-shadow shadow-xl ${
            isActive
              ? isSprinting
                ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.8)]'
                : 'bg-gradient-to-b from-cyan-400 to-sky-600 border-2 border-cyan-200 shadow-[0_0_16px_rgba(56,189,248,0.8)]'
              : 'bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600'
          }`}
        >
          {/* Inner Core Cap */}
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${
              isActive
                ? isSprinting
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-slate-950 text-cyan-300'
                : 'bg-slate-950/60 text-slate-400'
            }`}
          >
            {isActive && (
              <span
                className="text-[10px] leading-none transition-transform"
                style={{
                  transform: `rotate(${directionAngle + Math.PI / 2}rad)`,
                }}
              >
                ▲
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
