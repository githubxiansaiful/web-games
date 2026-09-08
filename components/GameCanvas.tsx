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
import { HomePage } from './HomePage';
import { RoomLobby } from './RoomLobby';
import { MultiplayerRaceHUD } from './MultiplayerRaceHUD';
import { MultiplayerPodiumModal } from './MultiplayerPodiumModal';
import { multiplayer } from '@/lib/multiplayerClient';
import { RoomState, RemotePlayerState } from '@/lib/multiplayerTypes';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // App / Game Screen Mode: 'home' | 'lobby' | 'game'
  const [appMode, setAppMode] = useState<'home' | 'lobby' | 'game'>('home');
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);

  // Player Profile
  const [playerName, setPlayerName] = useState<string>('Runner');
  const [playerColor, setPlayerColor] = useState<string>('#06b6d4');

  // Multiplayer Room State
  const [room, setRoom] = useState<RoomState | null>(null);
  const [isPodiumOpen, setIsPodiumOpen] = useState<boolean>(false);
  const [podiumRunners, setPodiumRunners] = useState<any[]>([]);
  const [leaderId, setLeaderId] = useState<string | null>(null);
  const [localEmote, setLocalEmote] = useState<{ emoji: string; timer: number } | null>(null);

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
  const [myProgressPercent, setMyProgressPercent] = useState<number>(0);
  const [myFinished, setMyFinished] = useState<boolean>(false);
  const [myFinishRank, setMyFinishRank] = useState<number | undefined>(undefined);

  // Progress records (saved in localStorage)
  const [progress, setProgress] = useState<Record<number, LevelProgress>>({});

  // Core mutable game state references (for 60FPS loop)
  const levelRef = useRef<LevelData>(JSON.parse(JSON.stringify(LEVELS[0])));
  const playerRef = useRef<PlayerState>(createInitialPlayer(LEVELS[0].spawn));
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const rendererRef = useRef<GameRenderer>(new GameRenderer());
  const remotePlayersRef = useRef<Map<string, RemotePlayerState>>(new Map());

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
    finished: false,
    finishRank: undefined as number | undefined,
  });

  const netSendTimerRef = useRef<number>(0);
  const canvasSizeRef = useRef({ width: 800, height: 600, dpr: 1 });

  // Dedicated canvas resize handler (prevents per-frame DOM layout reflow on iPhone / Safari)
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width || window.innerWidth));
    const h = Math.max(240, Math.floor(rect.height || window.innerHeight));

    // iPhone / Mobile Retina optimization:
    // Retina iPhones have window.devicePixelRatio = 3.0.
    // Rendering at 3x DPR generates 3+ million pixels every 60FPS frame,
    // which saturates the WebKit Metal compositor and drops frame rates to 10-15 FPS.
    // Capping DPR at 1.5 on mobile devices preserves Retina crispness while cutting GPU fill rate by >70%.
    const isMobileDevice =
      typeof window !== 'undefined' &&
      (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0);
    const rawDpr = window.devicePixelRatio || 1;
    const dpr = isMobileDevice ? Math.min(rawDpr, 1.5) : Math.min(rawDpr, 2.0);

    const pixelW = Math.floor(w * dpr);
    const pixelH = Math.floor(h * dpr);

    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }

    canvasSizeRef.current = { width: w, height: h, dpr };
  }, []);

  // Update canvas size on mount, appMode change, window resize & orientation change
  useEffect(() => {
    if (appMode !== 'game') return;

    updateCanvasSize();
    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    const timer = setTimeout(updateCanvasSize, 120);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [appMode, updateCanvasSize]);

  // Load saved progress and profile
  useEffect(() => {
    try {
      const saved = localStorage.getItem('platformer_progress');
      if (saved) {
        setProgress(JSON.parse(saved));
      }
      setIsMuted(sounds.getMuted());

      const savedName = localStorage.getItem('runner_player_name');
      if (savedName) setPlayerName(savedName);
    } catch {
      // ignore
    }

    // Detect touch capability & screen size
    if (typeof window !== 'undefined') {
      const checkTouch = () => {
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
        setShowTouchControls(hasTouch);
      };
      checkTouch();
      window.addEventListener('resize', checkTouch);

      const unlockAudio = () => {
        sounds.playJump();
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('touchstart', unlockAudio, { once: true });
      window.addEventListener('click', unlockAudio, { once: true });

      return () => {
        window.removeEventListener('resize', checkTouch);
      };
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
      finished: false,
      finishRank: undefined,
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
    setIsPodiumOpen(false);
    setMyFinished(false);
    setMyFinishRank(undefined);
    setMyProgressPercent(0);
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
  // MULTIPLAYER SOCKET EVENT SUBSCRIPTIONS
  // ==========================================
  useEffect(() => {
    const unsubRoom = multiplayer.on('room_updated', (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      if (updatedRoom.stageId) {
        setCurrentLevelId(updatedRoom.stageId);
      }

      // FAIL-SAFE: If room status becomes in_game, all players enter game mode immediately
      if (updatedRoom.status === 'in_game') {
        loadLevel(updatedRoom.stageId || 1);
        setAppMode('game');
        setIsMultiplayer(true);
        setIsPodiumOpen(false);
      }
    });

    const unsubGameStarting = multiplayer.on('game_starting', (data: { stageId: number }) => {
      loadLevel(data.stageId || 1);
      setAppMode('game');
      setIsMultiplayer(true);
      setIsPodiumOpen(false);
    });

    const unsubRemoteState = multiplayer.on('remote_player_state', (data: any) => {
      if (!data.id) return;
      const map = remotePlayersRef.current;
      let rp = map.get(data.id);

      if (!rp) {
        rp = {
          id: data.id,
          x: data.x,
          y: data.y,
          targetX: data.x,
          targetY: data.y,
          vx: data.vx || 0,
          vy: data.vy || 0,
          facing: data.facing || 1,
          grounded: data.grounded ?? true,
          isDead: data.isDead ?? false,
          squashX: data.squashX || 1,
          squashY: data.squashY || 1,
          runFrame: data.runFrame || 0,
          name: data.name || 'Rival',
          color: data.color || '#ec4899',
          progressPercent: data.progressPercent || 0,
          coins: data.coins || 0,
          trail: [],
        };
        map.set(data.id, rp);
      } else {
        rp.targetX = data.x;
        rp.targetY = data.y;
        rp.vx = data.vx;
        rp.vy = data.vy;
        rp.facing = data.facing;
        rp.grounded = data.grounded;
        rp.isDead = data.isDead;
        rp.squashX = data.squashX;
        rp.squashY = data.squashY;
        rp.runFrame = data.runFrame;
        rp.name = data.name || rp.name;
        rp.color = data.color || rp.color;
        rp.progressPercent = data.progressPercent || 0;
        rp.coins = data.coins || 0;
      }
    });

    const unsubEmote = multiplayer.on('remote_player_emote', (data: { id: string; emoji: string }) => {
      const rp = remotePlayersRef.current.get(data.id);
      if (rp) {
        rp.currentEmote = { emoji: data.emoji, timer: 2.0 };
      }
    });

    const unsubFinished = multiplayer.on('remote_player_finished', (data: any) => {
      const rp = remotePlayersRef.current.get(data.id);
      if (rp) {
        rp.finished = true;
        rp.finishRank = data.rank;
        rp.finishTime = data.timeElapsed;
      }

      // Check if all players finished
      const meRank = statsRef.current.finishRank;
      const allList = [
        {
          id: multiplayer.myPlayerId,
          name: playerName,
          color: playerColor,
          rank: meRank || 99,
          timeElapsed: statsRef.current.time,
          coins: statsRef.current.coins,
          isMe: true,
        },
        ...Array.from(remotePlayersRef.current.values()).map((r) => ({
          id: r.id,
          name: r.name,
          color: r.color,
          rank: r.finishRank || 99,
          timeElapsed: r.finishTime,
          coins: r.coins,
          isMe: false,
        })),
      ];

      setPodiumRunners(allList);
    });

    const unsubPlayerLeft = multiplayer.on('player_left', (data: { id: string }) => {
      remotePlayersRef.current.delete(data.id);
    });

    const unsubReturnedLobby = multiplayer.on('returned_to_lobby', (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      setAppMode('lobby');
      setIsPodiumOpen(false);
      remotePlayersRef.current.clear();
    });

    return () => {
      unsubRoom();
      unsubGameStarting();
      unsubRemoteState();
      unsubEmote();
      unsubFinished();
      unsubPlayerLeft();
      unsubReturnedLobby();
    };
  }, [playerName, playerColor, loadLevel]);

  // Send an in-game Emote
  const handleSendEmote = useCallback((emoji: string) => {
    multiplayer.sendEmote(emoji);
    setLocalEmote({ emoji, timer: 2.0 });
  }, []);

  // Home Screen actions
  const handleStartSolo = useCallback((stageId: number = 1) => {
    loadLevel(stageId);
    setIsMultiplayer(false);
    setAppMode('game');
  }, [loadLevel]);

  const handleCreateRoom = useCallback(async (code: string, name: string, color: string, stageId: number) => {
    setPlayerName(name);
    setPlayerColor(color);
    const res = await multiplayer.createRoom(code, { name, color }, stageId);
    if (res.success && res.room) {
      setRoom(res.room);
      setAppMode('lobby');
      setIsMultiplayer(true);
    }
  }, []);

  const handleJoinRoom = useCallback(async (code: string, name: string, color: string) => {
    setPlayerName(name);
    setPlayerColor(color);
    const res = await multiplayer.joinRoom(code, { name, color });
    if (res.success && res.room) {
      setRoom(res.room);
      setAppMode('lobby');
      setIsMultiplayer(true);
      return { success: true };
    } else {
      return { success: false, message: res.message || 'Could not join room' };
    }
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setAppMode('home');
    setIsMultiplayer(false);
    setRoom(null);
    remotePlayersRef.current.clear();
  }, []);

  // Keyboard Event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.right = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        if (!keysRef.current.jump) keysRef.current.jumpJustPressed = true;
        keysRef.current.jump = true;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keysRef.current.down = true;

      if (e.code === 'KeyR') {
        if (e.shiftKey) handleRestart();
        else handleQuickRespawn();
      }

      if (e.code === 'Escape' || e.code === 'KeyP') setIsPaused((prev) => !prev);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.right = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') keysRef.current.jump = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keysRef.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleRestart, handleQuickRespawn]);

  // Touch handlers
  const handleTouchDirection = useCallback((dir: 'left' | 'right', pressed: boolean) => {
    if (dir === 'left') keysRef.current.left = pressed;
    if (dir === 'right') keysRef.current.right = pressed;
  }, []);

  const handleTouchJump = useCallback((pressed: boolean) => {
    if (pressed && !keysRef.current.jump) keysRef.current.jumpJustPressed = true;
    keysRef.current.jump = pressed;
  }, []);

  // ==========================================
  // 60FPS MAIN LOOP
  // ==========================================
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animFrameId = requestAnimationFrame(loop);

      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Only run physics & rendering if in game mode
      if (appMode !== 'game') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fast cached canvas display size (eliminates per-frame DOM layout reflow on Safari / iPhone)
      const { width: displayWidth, height: displayHeight, dpr } = canvasSizeRef.current;
      if (displayWidth <= 0 || displayHeight <= 0) return;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Only update physics if not paused and not solo won
      if (!isPaused && (!statsRef.current.isCompleted || isMultiplayer)) {
        statsRef.current.time += dt;

        updateMovingPlatforms(levelRef.current.movingPlatforms, dt);
        updateHazards(levelRef.current.hazards, dt);

        updatePhysics(
          playerRef.current,
          levelRef.current,
          keysRef.current,
          dt,
          particlesRef.current,
          floatingTextsRef.current,
          () => {
            statsRef.current.deaths += 1;
            setDeaths(statsRef.current.deaths);
            rendererRef.current.triggerScreenShake(12);
          },
          () => {
            statsRef.current.coins += 1;
            setCoinsCollected(statsRef.current.coins);
          },
          () => {
            // GOAL REACHED
            statsRef.current.isCompleted = true;

            try {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            } catch {
              // ignore
            }

            if (isMultiplayer) {
              statsRef.current.finished = true;
              setMyFinished(true);
              multiplayer.sendFinished(statsRef.current.time, statsRef.current.coins);

              setTimeout(() => {
                setIsPodiumOpen(true);
              }, 800);
            } else {
              // Solo Victory
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
          }
        );

        // Update particles & texts
        updateParticles(particlesRef.current, dt);
        updateFloatingTexts(floatingTextsRef.current, dt);

        // Calculate progress percentage
        const progress = Math.min(100, Math.max(0, (playerRef.current.x / levelRef.current.width) * 100));
        setMyProgressPercent(progress);

        // Smooth remote players interpolation
        for (const rp of remotePlayersRef.current.values()) {
          rp.x += (rp.targetX - rp.x) * 20 * dt;
          rp.y += (rp.targetY - rp.y) * 20 * dt;

          if (rp.currentEmote) {
            rp.currentEmote.timer -= dt;
            if (rp.currentEmote.timer <= 0) rp.currentEmote = null;
          }
        }

        // Determine current race leader
        let maxProgress = progress;
        let leadId: string | null = 'local';
        for (const rp of remotePlayersRef.current.values()) {
          if ((rp.progressPercent || 0) > maxProgress) {
            maxProgress = rp.progressPercent;
            leadId = rp.id;
          }
        }
        setLeaderId(leadId);

        // Send local player state to multiplayer server at ~22Hz (smooth and battery-efficient on mobile)
        if (isMultiplayer) {
          netSendTimerRef.current += dt;
          if (netSendTimerRef.current >= 0.045) {
            netSendTimerRef.current = 0;
            const p = playerRef.current;
            multiplayer.sendPlayerState({
              x: Math.round(p.x),
              y: Math.round(p.y),
              vx: Math.round(p.vx),
              vy: Math.round(p.vy),
              facing: p.facing,
              grounded: p.grounded,
              isDead: p.isDead,
              squashX: p.squashX,
              squashY: p.squashY,
              runFrame: p.runFrame,
              progressPercent: Math.round(progress),
              coins: statsRef.current.coins,
              name: playerName,
              color: playerColor,
            });
          }
        }

        // Local Emote timer
        setLocalEmote((prev) => {
          if (!prev) return null;
          const nextTimer = prev.timer - dt;
          return nextTimer <= 0 ? null : { ...prev, timer: nextTimer };
        });

        // Update camera position
        rendererRef.current.updateCamera(
          playerRef.current,
          levelRef.current,
          displayWidth,
          displayHeight,
          dt
        );

        setTimeElapsed(statsRef.current.time);
        setActiveCheckpoint(playerRef.current.activeCheckpointId);
      }

      keysRef.current.jumpJustPressed = false;

      // Draw game scene with local and remote players
      rendererRef.current.render(
        ctx,
        displayWidth,
        displayHeight,
        playerRef.current,
        levelRef.current,
        particlesRef.current,
        floatingTextsRef.current,
        playerColor,
        playerName,
        multiplayer.myPlayerId,
        isMultiplayer ? remotePlayersRef.current : undefined,
        leaderId,
        localEmote
      );

      ctx.restore();
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [appMode, isPaused, isMultiplayer, playerName, playerColor, leaderId, localEmote, saveProgress]);

  const currentLevel = LEVELS.find((l) => l.id === currentLevelId) || LEVELS[0];
  const hasNextLevel = LEVELS.some((l) => l.id === currentLevelId + 1);
  const isHost = room?.hostId === multiplayer.myPlayerId;

  // Render 1: HOME PAGE
  if (appMode === 'home') {
    return (
      <HomePage
        onStartSolo={handleStartSolo}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onOpenSoloStages={() => setIsLevelSelectOpen(true)}
      />
    );
  }

  // Render 2: ROOM LOBBY
  if (appMode === 'lobby' && room) {
    return (
      <RoomLobby
        room={room}
        myPlayerId={multiplayer.myPlayerId}
        onStartGame={() => multiplayer.startGame()}
        onToggleReady={(ready) => multiplayer.toggleReady(ready)}
        onChangeStage={(stageId) => multiplayer.changeStage(stageId)}
        onLeaveRoom={handleLeaveRoom}
        onSendEmote={handleSendEmote}
      />
    );
  }

  // Render 3: GAMEPLAY CANVAS (Solo or Multiplayer)
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
        isMultiplayer={isMultiplayer}
        roomCode={room?.code}
        onToggleMute={handleToggleMute}
        onRestart={handleRestart}
        onPause={() => setIsPaused(true)}
        onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
        onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
        onGoHome={handleLeaveRoom}
      />

      {/* Multiplayer Live Standings & Emotes */}
      {isMultiplayer && (
        <MultiplayerRaceHUD
          myPlayerId={multiplayer.myPlayerId}
          myPlayerName={playerName}
          myPlayerColor={playerColor}
          myProgressPercent={myProgressPercent}
          myFinished={myFinished}
          myFinishRank={myFinishRank}
          remotePlayers={remotePlayersRef.current}
          onSendEmote={handleSendEmote}
        />
      )}

      {/* Primary HTML5 Canvas */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-default focus:outline-none touch-none select-none"
          style={{ willChange: 'transform' }}
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

      {/* Level Select Modal (Solo) */}
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
        onGoHome={handleLeaveRoom}
      />

      {/* Solo Stage Victory Modal */}
      {!isMultiplayer && (
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
      )}

      {/* Multiplayer Race Podium Modal */}
      {isMultiplayer && (
        <MultiplayerPodiumModal
          isOpen={isPodiumOpen}
          stageName={`Stage ${currentLevel.id}: ${currentLevel.name}`}
          isHost={isHost}
          runners={podiumRunners}
          onNextStage={() => {
            const nextId = currentLevelId >= 3 ? 1 : currentLevelId + 1;
            multiplayer.returnToLobby(nextId);
          }}
          onReturnToLobby={() => {
            multiplayer.returnToLobby();
          }}
        />
      )}
    </div>
  );
};
