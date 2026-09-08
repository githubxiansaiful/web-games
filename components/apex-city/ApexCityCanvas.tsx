'use client';

import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '@/game/GameEngine';
import { ApexCityHUD } from './ApexCityHUD';
import { Play, Sparkles } from 'lucide-react';

interface ApexCityCanvasProps {
  onExit: () => void;
}

export const ApexCityCanvas: React.FC<ApexCityCanvasProps> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Instantiate Game Engine
    const engine = new GameEngine(canvas, container);
    engineRef.current = engine;

    // Simulate quick asset bootstrap
    const timer = setTimeout(() => {
      setIsLoading(false);
      engine.start();
      setHasStarted(true);
    }, 400);

    return () => {
      clearTimeout(timer);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  const handlePointerLockClick = () => {
    if (engineRef.current) {
      engineRef.current.input.requestPointerLock();
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handlePointerLockClick}
      className="relative w-full h-full bg-slate-950 select-none overflow-hidden touch-none"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-cyan-500/30 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-white tracking-wider">
              APEX CITY 3D
            </h2>
            <p className="text-xs font-semibold text-cyan-400">
              Streaming Metro World & Assets...
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-cyan-400 to-indigo-500 animate-[shimmer_1s_infinite]" />
          </div>
        </div>
      )}

      {/* In-Game React HUD */}
      {!isLoading && <ApexCityHUD onExit={onExit} />}
    </div>
  );
};
