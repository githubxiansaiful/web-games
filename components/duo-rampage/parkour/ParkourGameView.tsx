'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Parkour2DGameEngine } from '@/game/duo-rampage/parkour/engine/Parkour2DGameEngine';
import { ParkourHUD } from './ParkourHUD';
import { ParkourVictoryModal } from './ParkourVictoryModal';
import { ParkourInput } from '@/game/duo-rampage/parkour/character/ParkourRunner2D';

import { PlayerRole } from '@/game/duo-rampage/types';

interface ParkourGameViewProps {
  onExit: () => void;
  isMultiplayer?: boolean;
  myRole?: PlayerRole;
  localPlayerName?: string;
  partnerPlayerName?: string;
  characterId?: string;
  onEngineReady?: (engine: Parkour2DGameEngine) => void;
}

export const ParkourGameView: React.FC<ParkourGameViewProps> = ({
  onExit,
  isMultiplayer = false,
  myRole = 'assault',
  localPlayerName = 'Hero 1',
  partnerPlayerName = 'Hero 2',
  characterId = 'char_1',
  onEngineReady,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Parkour2DGameEngine | null>(null);

  const [telemetry, setTelemetry] = useState({
    speedKmh: 0,
    state: 'IDLE',
    coyoteRemaining: 0,
    jumpBufferRemaining: 0,
    canDoubleJump: true,
    x: 0,
    y: 0,
    coins: 0,
    totalCoins: 28,
    timer: 0,
    targetSeconds: 75,
    checkpointIndex: 0,
    totalCheckpoints: 3,
    secretEmblem: false,
    bannerNotification: null as string | null,
  });

  const [victoryStats, setVictoryStats] = useState<{
    timeSeconds: number;
    coins: number;
    totalCoins: number;
    stars: number;
    secretEmblem: boolean;
    targetSeconds: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new Parkour2DGameEngine(
      containerRef.current,
      {
        onUpdateTelemetry: (data) => {
          setTelemetry({ ...data });
        },
        onLevelComplete: (stats) => {
          setVictoryStats({ ...stats });
        },
        onExit,
      },
      {
        isMultiplayer,
        myRole,
        localPlayerName,
        partnerPlayerName,
        localCharacterId: characterId,
      }
    );

    engineRef.current = engine;
    if (onEngineReady) {
      onEngineReady(engine);
    }
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [onExit, isMultiplayer, myRole, localPlayerName, partnerPlayerName, characterId, onEngineReady]);

  useEffect(() => {
    if (engineRef.current) {
      if (localPlayerName) engineRef.current.localPlayerName = localPlayerName;
      if (partnerPlayerName) engineRef.current.partnerPlayerName = partnerPlayerName;
      if (myRole) engineRef.current.myRole = myRole;
      if (isMultiplayer !== undefined) engineRef.current.isMultiplayer = isMultiplayer;
      if (characterId) engineRef.current.localCharacterId = characterId;
    }
  }, [localPlayerName, partnerPlayerName, myRole, isMultiplayer, characterId]);

  const handleInputChange = (partial: Partial<ParkourInput>) => {
    if (!engineRef.current) return;
    engineRef.current.localInput = {
      ...engineRef.current.localInput,
      ...partial,
    };
  };

  const handleReset = () => {
    if (engineRef.current) {
      if (engineRef.current.activeCheckpoint) {
        engineRef.current.runner.x = engineRef.current.activeCheckpoint.x;
        engineRef.current.runner.y = engineRef.current.activeCheckpoint.y - engineRef.current.runner.standingHeight;
        engineRef.current.runner.vx = 0;
        engineRef.current.runner.vy = 0;
        engineRef.current.runner.onGround = true;
      } else {
        engineRef.current.runner.reset();
      }
    }
  };

  const handlePlayAgain = () => {
    setVictoryStats(null);
    if (engineRef.current) {
      engineRef.current.restartLevel();
    }
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-black overflow-hidden select-none touch-none">
      {/* 2D Parkour Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-10" />

      {/* Live Level HUD (Timer, Coins, Checkpoints, Telemetry & Controls) */}
      <ParkourHUD
        telemetry={telemetry}
        onInputChange={handleInputChange}
        onReset={handleReset}
        onExit={onExit}
      />

      {/* Level Complete Victory Screen */}
      {victoryStats && (
        <ParkourVictoryModal
          stats={victoryStats}
          onPlayAgain={handlePlayAgain}
          onExit={onExit}
        />
      )}
    </div>
  );
};
