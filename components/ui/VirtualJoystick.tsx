'use client';

import React, { useRef, useEffect, useCallback } from 'react';

export interface JoystickMoveEvent {
  /** Horizontal axis: -1 (full left) to +1 (full right), 0 at center */
  x: number;
  /** Vertical axis: -1 (full up) to +1 (full down), 0 at center */
  y: number;
  /** Normalized distance from center (0 to 1) */
  distance: number;
  /** Angle in radians (-PI to PI) */
  angle: number;
  /** Whether the joystick is currently held down */
  active: boolean;
}

export interface VirtualJoystickProps {
  /** Callback fired whenever the stick moves */
  onMove?: (event: JoystickMoveEvent) => void;
  /** Callback fired when the user touches/clicks the stick */
  onStart?: () => void;
  /** Callback fired when the user releases the stick (values return to 0) */
  onEnd?: () => void;
  /** Diameter of the joystick base in px (default: 150, adapts on small screens) */
  size?: number;
  /** Additional container class name */
  className?: string;
  /** Whether to hide the 4 direction arrows */
  hideArrows?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Optional haptic feedback on touch start (ms) */
  haptic?: boolean;
}

/**
 * Global Premium Mobile Virtual Joystick
 * Universal touch & pointer joystick matching the arcade spec.
 */
export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onStart,
  onEnd,
  size = 140,
  className = '',
  hideArrows = false,
  disabled = false,
  haptic = true,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const activeRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      const joystick = joystickRef.current;
      if (!joystick) return;

      activeRef.current = true;
      pointerIdRef.current = e.pointerId;

      joystick.classList.add('active');
      try {
        joystick.setPointerCapture(e.pointerId);
      } catch {
        // Fallback for older browsers
      }

      if (haptic && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // ignore
        }
      }

      const rect = joystick.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      onStartRef.current?.();

      // Process initial move
      let dx = e.clientX - centerRef.current.x;
      let dy = e.clientY - centerRef.current.y;

      const joystickRadius = rect.width / 2;
      const thumbRadius = thumbRef.current ? thumbRef.current.offsetWidth / 2 : joystickRadius * 0.44;
      const maxDistance = joystickRadius - thumbRadius;

      const distance = Math.hypot(dx, dy);
      const clampedDist = Math.min(distance, maxDistance);
      const angle = Math.atan2(dy, dx);

      if (distance > maxDistance && distance > 0) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }

      const nx = maxDistance > 0 ? dx / maxDistance : 0;
      const ny = maxDistance > 0 ? dy / maxDistance : 0;

      if (thumbRef.current) {
        thumbRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }

      onMoveRef.current?.({
        x: nx,
        y: ny,
        distance: maxDistance > 0 ? clampedDist / maxDistance : 0,
        angle,
        active: true,
      });
    },
    [disabled, haptic]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!activeRef.current || e.pointerId !== pointerIdRef.current) return;
      e.preventDefault();

      const joystick = joystickRef.current;
      if (!joystick) return;

      const rect = joystick.getBoundingClientRect();
      const joystickRadius = rect.width / 2;
      const thumbRadius = thumbRef.current ? thumbRef.current.offsetWidth / 2 : joystickRadius * 0.44;
      const maxDistance = joystickRadius - thumbRadius;

      let dx = e.clientX - centerRef.current.x;
      let dy = e.clientY - centerRef.current.y;

      const distance = Math.hypot(dx, dy);
      const clampedDist = Math.min(distance, maxDistance);
      const angle = Math.atan2(dy, dx);

      if (distance > maxDistance && distance > 0) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }

      const nx = maxDistance > 0 ? dx / maxDistance : 0;
      const ny = maxDistance > 0 ? dy / maxDistance : 0;

      if (thumbRef.current) {
        thumbRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }

      onMoveRef.current?.({
        x: nx,
        y: ny,
        distance: maxDistance > 0 ? clampedDist / maxDistance : 0,
        angle,
        active: true,
      });
    },
    []
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeRef.current || e.pointerId !== pointerIdRef.current) return;
    e.preventDefault();

    activeRef.current = false;
    pointerIdRef.current = null;

    const joystick = joystickRef.current;
    if (joystick) {
      joystick.classList.remove('active');
      try {
        if (joystick.hasPointerCapture(e.pointerId)) {
          joystick.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
    }

    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translate(-50%, -50%)';
    }

    onMoveRef.current?.({
      x: 0,
      y: 0,
      distance: 0,
      angle: 0,
      active: false,
    });

    onEndRef.current?.();
  }, []);

  // Global safety release if pointerup happened outside captured element
  useEffect(() => {
    const handleGlobalEnd = () => {
      if (activeRef.current) {
        activeRef.current = false;
        pointerIdRef.current = null;
        if (joystickRef.current) {
          joystickRef.current.classList.remove('active');
        }
        if (thumbRef.current) {
          thumbRef.current.style.transform = 'translate(-50%, -50%)';
        }
        onMoveRef.current?.({
          x: 0,
          y: 0,
          distance: 0,
          angle: 0,
          active: false,
        });
        onEndRef.current?.();
      }
    };

    window.addEventListener('pointerup', handleGlobalEnd);
    window.addEventListener('pointercancel', handleGlobalEnd);
    return () => {
      window.removeEventListener('pointerup', handleGlobalEnd);
      window.removeEventListener('pointercancel', handleGlobalEnd);
    };
  }, []);

  return (
    <div
      ref={joystickRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={
        {
          '--joystick-size': `${size}px`,
        } as React.CSSProperties
      }
      className={`v-joystick-base ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
      aria-label="Virtual Joystick"
      role="slider"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={0}
    >
      <style>{`
        .v-joystick-base {
          width: var(--joystick-size, 150px);
          height: var(--joystick-size, 150px);
          position: relative;
          border-radius: 50%;
          background: radial-gradient(
            circle at center,
            rgba(20, 29, 40, 0.78) 0%,
            rgba(15, 23, 34, 0.58) 48%,
            rgba(10, 17, 27, 0.42) 100%
          );
          border: 2px solid rgba(160, 177, 195, 0.35);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 0 25px rgba(0, 0, 0, 0.4),
            0 8px 20px rgba(0, 0, 0, 0.25);
          touch-action: none;
          user-select: none;
          pointer-events: auto;
          box-sizing: border-box;
          flex-shrink: 0;
        }

        /* Subtle inner circular line */
        .v-joystick-base::before {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          border: 1px solid rgba(180, 195, 210, 0.09);
          pointer-events: none;
        }

        /* Direction arrows */
        .v-arrow {
          position: absolute;
          width: 0;
          height: 0;
          opacity: 0.65;
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
          pointer-events: none;
        }

        .v-arrow.up {
          top: calc(var(--joystick-size, 150px) * 0.087);
          left: 50%;
          transform: translateX(-50%);
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 9px solid #aab4bf;
        }

        .v-arrow.down {
          bottom: calc(var(--joystick-size, 150px) * 0.087);
          left: 50%;
          transform: translateX(-50%);
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 9px solid #aab4bf;
        }

        .v-arrow.left {
          left: calc(var(--joystick-size, 150px) * 0.087);
          top: 50%;
          transform: translateY(-50%);
          border-top: 7px solid transparent;
          border-bottom: 7px solid transparent;
          border-right: 9px solid #aab4bf;
        }

        .v-arrow.right {
          right: calc(var(--joystick-size, 150px) * 0.087);
          top: 50%;
          transform: translateY(-50%);
          border-top: 7px solid transparent;
          border-bottom: 7px solid transparent;
          border-left: 9px solid #aab4bf;
        }

        /* Joystick Thumb */
        .v-joystick-thumb {
          position: absolute;
          width: calc(var(--joystick-size, 150px) * 0.44);
          height: calc(var(--joystick-size, 150px) * 0.44);
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle at 38% 34%,
            #e1e3e5 0%,
            #d4d7da 38%,
            #b9bdc2 72%,
            #9da3a9 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow:
            inset 0 2px 3px rgba(255, 255, 255, 0.4),
            inset 0 -4px 8px rgba(0, 0, 0, 0.18),
            0 3px 7px rgba(0, 0, 0, 0.5);
          cursor: grab;
          touch-action: none;
          user-select: none;
          transition:
            box-shadow 0.12s ease,
            transform 0.05s linear;
          box-sizing: border-box;
          pointer-events: none;
        }

        /* Specular gloss highlight */
        .v-joystick-thumb::after {
          content: "";
          position: absolute;
          left: 15%;
          top: 12%;
          width: 36%;
          height: 20%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          filter: blur(2px);
          pointer-events: none;
        }

        .v-joystick-base.active .v-joystick-thumb {
          cursor: grabbing;
          box-shadow:
            inset 0 2px 4px rgba(255, 255, 255, 0.35),
            inset 0 -4px 8px rgba(0, 0, 0, 0.25),
            0 4px 10px rgba(0, 0, 0, 0.55);
        }
      `}</style>

      {/* Direction Arrows */}
      {!hideArrows && (
        <>
          <div className="v-arrow up" />
          <div className="v-arrow down" />
          <div className="v-arrow left" />
          <div className="v-arrow right" />
        </>
      )}

      {/* Joystick Thumb */}
      <div ref={thumbRef} className="v-joystick-thumb" />
    </div>
  );
};
