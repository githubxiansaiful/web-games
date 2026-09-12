'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DuoRampageEngine } from '@/game/duo-rampage/DuoRampageEngine';
import { duoNetwork } from '@/game/duo-rampage/network/DuoNetworkManager';
import { DuoRampageHomeScreen } from './home/DuoRampageHomeScreen';
import { DuoRampageLobby } from './DuoRampageLobby';
import { DuoRampageHUD } from './DuoRampageHUD';
import { DuoRampageGameOver } from './DuoRampageGameOver';
import {
  PlayerRole,
  PlayerStats,
  DuoComboState,
  WaveState,
  DamageNumber,
  TouchControlsState,
  DuoRoomData,
} from '@/game/duo-rampage/types';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

interface DuoRampageGameProps {
  onExit: () => void;
}

export const DuoRampageGame: React.FC<DuoRampageGameProps> = ({ onExit }) => {
  const [screen, setScreen] = useState<'menu' | 'lobby' | 'playing' | 'game_over'>('menu');
  const [room, setRoom] = useState<DuoRoomData | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<PlayerRole>('assault');
  const [isSolo, setIsSolo] = useState(true);

  // Live HUD States
  const [player1Stats, setPlayer1Stats] = useState<PlayerStats | null>(null);
  const [player2Stats, setPlayer2Stats] = useState<PlayerStats | null>(null);
  const [comboState, setComboState] = useState<DuoComboState>({
    count: 0,
    multiplier: 1,
    timer: 0,
    maxTimer: 4.0,
    isRampage: false,
    rampageTimer: 0,
    rampageMaxTimer: 10.0,
  });
  const [waveState, setWaveState] = useState<WaveState>({
    currentWave: 1,
    totalWaves: 5,
    enemiesRemaining: 10,
    status: 'preparing',
    countdown: 3.0,
    waveAnnounceText: 'WAVE 1: URBAN INVASION',
  });
  const [warningStayTogether, setWarningStayTogether] = useState(false);

  // End Game Stats
  const [gameOverResult, setGameOverResult] = useState<{
    victory: boolean;
    stats: { score: number; kills: number; maxCombo: number; wave: number };
  }>({
    victory: false,
    stats: { score: 0, kills: 0, maxCombo: 0, wave: 1 },
  });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DuoRampageEngine | null>(null);

  // 1. Connect to Network Manager
  useEffect(() => {
    duoNetwork.connect().catch((err) => {
      console.warn('[DuoRampage] Network connect fallback:', err);
    });

    duoNetwork.onRoomUpdated = (updatedRoom) => {
      setRoom(updatedRoom);
    };

    duoNetwork.onGameStartCountdown = (num) => {
      setCountdown(num);
      duoAudio.playCountdown(num);
    };

    duoNetwork.onGameStarted = () => {
      setCountdown(null);
      setScreen('playing');
    };

    duoNetwork.onRemotePlayerState = (state) => {
      if (!engineRef.current || isSolo) return;
      const remote = myRole === 'assault' ? engineRef.current.player2 : engineRef.current.player1;
      remote.stats.x = state.x;
      remote.stats.z = state.z;
      remote.stats.facing = state.facing;
      remote.stats.health = state.health;
      remote.stats.weapon = state.weapon;
      remote.stats.ammo = state.ammo;
      remote.stats.isDown = state.isDown;
      remote.stats.isReviving = state.isReviving;
      remote.stats.animState = state.animState;
      remote.group.position.set(state.x, 0, state.z);
    };

    duoNetwork.onRemoteShoot = (data) => {
      if (!engineRef.current || isSolo) return;
      const remote = myRole === 'assault' ? engineRef.current.player2 : engineRef.current.player1;
      engineRef.current.combatSystem.firePlayerWeapon(
        remote.stats.id,
        new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z),
        new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z),
        data.weapon,
        engineRef.current.comboSystem.state.isRampage
      );
      duoAudio.playGunshot(data.weapon);
    };

    duoNetwork.onRemoteRevived = () => {
      if (!engineRef.current) return;
      const me = myRole === 'assault' ? engineRef.current.player1 : engineRef.current.player2;
      if (me.stats.isDown) me.reviveSuccess();
    };

    return () => {
      duoNetwork.leaveRoom();
    };
  }, [isSolo, myRole]);

  // 2. Stream local player state at 20Hz in multiplayer mode
  useEffect(() => {
    if (screen !== 'playing' || isSolo) return;

    const interval = setInterval(() => {
      if (!engineRef.current) return;
      const me = myRole === 'assault' ? engineRef.current.player1 : engineRef.current.player2;
      duoNetwork.sendPlayerState({
        x: me.stats.x,
        z: me.stats.z,
        facing: me.stats.facing,
        health: me.stats.health,
        weapon: me.stats.weapon,
        ammo: me.stats.ammo,
        isDown: me.stats.isDown,
        isReviving: me.stats.isReviving,
        animState: me.stats.animState,
      });
    }, 50);

    return () => clearInterval(interval);
  }, [screen, isSolo, myRole]);

  // 3. Initialize Three.js Engine when entering 'playing' screen
  useEffect(() => {
    if (screen !== 'playing') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    if (!canvasContainerRef.current) return;

    const engine = new DuoRampageEngine(
      canvasContainerRef.current,
      myRole,
      isSolo,
      {
        onUpdateStats: (p1, p2, combo, wave, dmgNumbers, warning) => {
          setPlayer1Stats({ ...p1 });
          setPlayer2Stats({ ...p2 });
          setComboState({ ...combo });
          setWaveState({ ...wave });
          setWarningStayTogether(warning);
        },
        onGameOver: (victory, stats) => {
          setGameOverResult({ victory, stats });
          setScreen('game_over');
        },
        onShootBroadcast: (origin, dir, weapon) => {
          duoNetwork.sendShoot(origin, dir, weapon);
        },
        onReviveSuccessBroadcast: () => {
          duoNetwork.sendReviveSuccess();
        },
      }
    );

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [screen, myRole, isSolo]);

  // Handlers
  const handleCreateRoom = async () => {
    try {
      await duoNetwork.connect();
      const code = await duoNetwork.createRoom('Host Hero');
      setIsSolo(false);
      setMyRole('assault');
      setScreen('lobby');
    } catch (err) {
      console.warn('Could not create room, starting solo:', err);
      handleStartSolo();
    }
  };

  const handleJoinRoom = async (code: string) => {
    await duoNetwork.connect();
    const joinedRoom = await duoNetwork.joinRoom(code, 'Partner Hero');
    setRoom(joinedRoom);
    setIsSolo(false);
    setMyRole('heavy');
    setScreen('lobby');
  };

  const handleStartSolo = () => {
    setIsSolo(true);
    setMyRole('assault');
    setScreen('playing');
  };

  const handleStartMultiplayerGame = () => {
    duoNetwork.startGame();
  };

  const handleControlsChange = (controls: TouchControlsState) => {
    if (engineRef.current) {
      engineRef.current.localControls = controls;
    }
  };

  const handleLeaveLobby = () => {
    duoNetwork.leaveRoom();
    setRoom(null);
    setScreen('menu');
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Three.js Canvas Container (Active when playing) */}
      <div
        ref={canvasContainerRef}
        className={`absolute inset-0 w-full h-full z-10 ${screen === 'playing' ? 'block' : 'hidden'}`}
      />

      {/* 1. Main Menu (Production Quality 3D Cartoon Home Screen) */}
      {screen === 'menu' && (
        <DuoRampageHomeScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onStartSolo={handleStartSolo}
          onExit={onExit}
        />
      )}

      {/* 2. Multiplayer Waiting Room Lobby */}
      {screen === 'lobby' && room && (
        <DuoRampageLobby
          room={room}
          isHost={duoNetwork.isHost}
          myId={duoNetwork.myId}
          countdown={countdown}
          onToggleReady={(ready) => duoNetwork.toggleReady(ready)}
          onStartGame={handleStartMultiplayerGame}
          onLeave={handleLeaveLobby}
        />
      )}

      {/* 3. In-Game HUD */}
      {screen === 'playing' && (
        <DuoRampageHUD
          player1={player1Stats}
          player2={player2Stats}
          myRole={myRole}
          combo={comboState}
          wave={waveState}
          warningStayTogether={warningStayTogether}
          onControlsChange={handleControlsChange}
          onSwitchWeapon={() => {
            if (engineRef.current) {
              const active = myRole === 'assault' ? engineRef.current.player1 : engineRef.current.player2;
              active.switchWeapon();
            }
          }}
          onExit={() => setScreen('menu')}
        />
      )}

      {/* 4. Game Over Screen */}
      {screen === 'game_over' && (
        <DuoRampageGameOver
          isVictory={gameOverResult.victory}
          stats={gameOverResult.stats}
          onPlayAgain={() => {
            if (isSolo) {
              handleStartSolo();
            } else {
              setScreen('lobby');
            }
          }}
          onExit={() => setScreen('menu')}
        />
      )}
    </div>
  );
};
