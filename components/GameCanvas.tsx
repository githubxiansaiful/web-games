'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ControlKeys,
  FloatingText,
  LevelData,
  LevelProgress,
  Particle,
  PlayerState,
} from '@/lib/types';
import { LEVELS } from '@/lib/levels';
import { sounds } from '@/lib/audio';
import {
  createInitialPlayer,
  respawnPlayer,
  updateHazards,
  updateMovingPlatforms,
  updateParticles,
  updateFloatingTexts,
  updatePhysics,
} from '@/lib/physics';
import { GameRenderer } from '@/lib/renderer';
import { HUD } from './HUD';
import { LevelSelectModal } from './LevelSelectModal';
import { VictoryModal } from './VictoryModal';
import { PauseModal } from './PauseModal';
import { TouchControls } from './TouchControls';
import { OrientationNotice } from './OrientationNotice';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active level state
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);

  // HUD stats in React state
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [totalCoins, setTotalCoins] = useState<number>(0);
  const [deaths, setDeaths] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [activeCheckpoint, setActiveCheckpoint] = useState<string | null>(null);
  const [earnedStars, setEarnedStars] = useState<number>(1);

  // Progress records (saved in localStorage)
  const [progress, setProgress] = useState<Record<number, LevelProgress>>({});

  // Core mutable game state references (for 60FPS loop)
  const levelRef = useRef<LevelData>(JSON.parse(JSON.stringify(LEVELS[0])));
  const playerRef = useRef<PlayerState>(createInitialPlayer(LEVELS[0].spawn));
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const rendererRef = useRef<GameRenderer>(new GameRenderer());

  const keysRef = useRef<ControlKeys>({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpJustPressed: false,
  });

  const statsRef = useRef({
    coins: 0,
    deaths: 0,
    time: 0,
    isCompleted: false,
  });

  // Load saved progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('platformer_progress');
      if (saved) {
        setProgress(JSON.parse(saved));
      }
      setIsMuted(sounds.getMuted());
    } catch {
      // ignore
    }

    // Detect touch capability or mobile screen
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
      setShowTouchControls(hasTouch);

      // Web Audio API unlock on mobile browsers
      const unlockAudio = () => {
        sounds.playJump();
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('touchstart', unlockAudio, { once: true });
      window.addEventListener('click', unlockAudio, { once: true });
    }
  }, []);

  // Save progress helper
  const saveProgress = useCallback((lvlId: number, stars: number, time: number, coins: number, total: number) => {
    setProgress((prev) => {
      const existing = prev[lvlId] || { stars: 0, bestTime: Infinity, coinsFound: 0, totalCoins: total, completed: false };
      const updated: LevelProgress = {
        stars: Math.max(existing.stars, stars),
        bestTime: existing.bestTime ? Math.min(existing.bestTime, time) : time,
        coinsFound: Math.max(existing.coinsFound, coins),
        totalCoins: total,
        completed: true,
      };

      const newProgress = { ...prev, [lvlId]: updated };
      try {
        localStorage.setItem('platformer_progress', JSON.stringify(newProgress));
      } catch {
        // ignore
      }
      return newProgress;
    });
  }, []);

  // Initialize or change level
  const loadLevel = useCallback((lvlId: number) => {
    const rawLevel = LEVELS.find((l) => l.id === lvlId) || LEVELS[0];
    const clonedLevel: LevelData = JSON.parse(JSON.stringify(rawLevel));

    levelRef.current = clonedLevel;
    playerRef.current = createInitialPlayer(clonedLevel.spawn);
    particlesRef.current = [];
    floatingTextsRef.current = [];
    rendererRef.current = new GameRenderer();

    statsRef.current = {
      coins: 0,
      deaths: 0,
      time: 0,
      isCompleted: false,
    };

    setCurrentLevelId(clonedLevel.id);
    setCoinsCollected(0);
    setTotalCoins(clonedLevel.coins.length);
    setDeaths(0);
    setTimeElapsed(0);
    setActiveCheckpoint(null);
    setIsVictory(false);
    setIsPaused(false);
    setIsLevelSelectOpen(false);
  }, []);

  // Restart current level
  const handleRestart = useCallback(() => {
    loadLevel(currentLevelId);
  }, [currentLevelId, loadLevel]);

  // Quick respawn at active checkpoint
  const handleQuickRespawn = useCallback(() => {
    respawnPlayer(playerRef.current, levelRef.current);
    statsRef.current.deaths += 1;
    setDeaths(statsRef.current.deaths);
  }, []);

  // Next level navigation
  const handleNextLevel = useCallback(() => {
    const nextId = currentLevelId + 1;
    const exists = LEVELS.some((l) => l.id === nextId);
    if (exists) {
      loadLevel(nextId);
    } else {
      // Loop back or show select
      setIsLevelSelectOpen(true);
      setIsVictory(false);
    }
  }, [currentLevelId, loadLevel]);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  }, []);

  // ==========================================
  // INPUT LISTENERS (WASD / Arrows / Space / R)
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling with Space / Arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        keysRef.current.left = true;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        keysRef.current.right = true;
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        if (!keysRef.current.jump) {
          keysRef.current.jumpJustPressed = true;
        }
        keysRef.current.jump = true;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        keysRef.current.down = true;
      }

      // Quick Respawn / Restart
      if (e.code === 'KeyR') {
        if (e.shiftKey) {
          handleRestart();
        } else {
          // Respawn at checkpoint
          respawnPlayer(playerRef.current, levelRef.current);
          statsRef.current.deaths += 1;
          setDeaths(statsRef.current.deaths);
        }
      }

      // Pause toggle
      if (e.code === 'Escape' || e.code === 'KeyP') {
        setIsPaused((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        keysRef.current.left = false;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        keysRef.current.right = false;
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        keysRef.current.jump = false;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        keysRef.current.down = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleRestart]);

  // Touch handlers
  const handleTouchDirection = useCallback((dir: 'left' | 'right', pressed: boolean) => {
    if (dir === 'left') keysRef.current.left = pressed;
    if (dir === 'right') keysRef.current.right = pressed;
  }, []);

  const handleTouchJump = useCallback((pressed: boolean) => {
    if (pressed && !keysRef.current.jump) {
      keysRef.current.jumpJustPressed = true;
    }
    keysRef.current.jump = pressed;
  }, []);

  // Initialize first level
  useEffect(() => {
    loadLevel(1);
  }, [loadLevel]);

  // ==========================================
  // MAIN 60FPS GAME LOOP
  // ==========================================
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animFrameId = requestAnimationFrame(loop);

      const dt = Math.min((time - lastTime) / 1000, 0.05); // clamp dt to max 50ms
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle window / canvas resize & High DPI scaling
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Only update physics if not paused and not won
      if (!isPaused && !statsRef.current.isCompleted) {
        statsRef.current.time += dt;

        // Update moving entities
        updateMovingPlatforms(levelRef.current.movingPlatforms, dt);
        updateHazards(levelRef.current.hazards, dt);

        // Update player physics
        updatePhysics(
          playerRef.current,
          levelRef.current,
          keysRef.current,
          dt,
          particlesRef.current,
          floatingTextsRef.current,
          () => {
            // On death
            statsRef.current.deaths += 1;
            setDeaths(statsRef.current.deaths);
            rendererRef.current.triggerScreenShake(12);
          },
          () => {
            // On coin collected
            statsRef.current.coins += 1;
            setCoinsCollected(statsRef.current.coins);
          },
          () => {
            // On goal reached
            statsRef.current.isCompleted = true;

            // Trigger confetti
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {
              // ignore
            }

            // Calculate stars
            const currentLevel = levelRef.current;
            const collected = statsRef.current.coins;
            const total = currentLevel.coins.length;
            const elapsed = statsRef.current.time;

            let stars = 1;
            if (collected >= Math.floor(total * 0.75)) stars = 2;
            if (collected === total || elapsed <= currentLevel.parTime) stars = 3;

            setEarnedStars(stars);
            saveProgress(currentLevel.id, stars, elapsed, collected, total);

            setTimeout(() => {
              setIsVictory(true);
            }, 600);
          }
        );

        // Update particles & texts
        updateParticles(particlesRef.current, dt);
        updateFloatingTexts(floatingTextsRef.current, dt);

        // Update camera position
        rendererRef.current.updateCamera(
          playerRef.current,
          levelRef.current,
          displayWidth,
          displayHeight,
          dt
        );

        // Keep React HUD in sync
        setTimeElapsed(statsRef.current.time);
        setActiveCheckpoint(playerRef.current.activeCheckpointId);
      }

      // Reset one-frame triggers
      keysRef.current.jumpJustPressed = false;

      // Draw game scene
      rendererRef.current.render(
        ctx,
        displayWidth,
        displayHeight,
        playerRef.current,
        levelRef.current,
        particlesRef.current,
        floatingTextsRef.current
      );

      ctx.restore();
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isPaused, saveProgress]);

  const currentLevel = LEVELS.find((l) => l.id === currentLevelId) || LEVELS[0];
  const hasNextLevel = LEVELS.some((l) => l.id === currentLevelId + 1);

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Mobile Orientation Suggestion */}
      <OrientationNotice />

      {/* HUD Layer */}
      <HUD
        levelName={`Stage ${currentLevel.id}: ${currentLevel.name}`}
        coinsCollected={coinsCollected}
        totalCoins={totalCoins}
        deaths={deaths}
        timeElapsed={timeElapsed}
        isMuted={isMuted}
        activeCheckpoint={activeCheckpoint}
        showTouchControls={showTouchControls}
        onToggleMute={handleToggleMute}
        onRestart={handleRestart}
        onPause={() => setIsPaused(true)}
        onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
        onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
      />

      {/* Primary HTML5 Canvas */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-default focus:outline-none"
          tabIndex={0}
        />
      </div>

      {/* Mobile / Touch Controls Overlay */}
      {showTouchControls && (
        <TouchControls
          onDirectionPress={handleTouchDirection}
          onJumpPress={handleTouchJump}
          onQuickRespawn={handleQuickRespawn}
        />
      )}

      {/* Level Select Modal */}
      <LevelSelectModal
        levels={LEVELS}
        currentLevelId={currentLevelId}
        progress={progress}
        isOpen={isLevelSelectOpen}
        onSelectLevel={loadLevel}
        onClose={() => setIsLevelSelectOpen(false)}
      />

      {/* Pause Menu Modal */}
      <PauseModal
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        onRestart={handleRestart}
        onOpenLevelSelect={() => {
          setIsPaused(false);
          setIsLevelSelectOpen(true);
        }}
      />

      {/* Stage Victory Modal */}
      <VictoryModal
        isOpen={isVictory}
        levelName={`Stage ${currentLevel.id}: ${currentLevel.name}`}
        hasNextLevel={hasNextLevel}
        coinsCollected={coinsCollected}
        totalCoins={totalCoins}
        timeElapsed={timeElapsed}
        parTime={currentLevel.parTime}
        deaths={deaths}
        stars={earnedStars}
        onNextLevel={handleNextLevel}
        onReplay={handleRestart}
        onOpenLevelSelect={() => {
          setIsVictory(false);
          setIsLevelSelectOpen(true);
        }}
      />
    </div>
  );
};
