'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Duo2DGameEngine } from '@/game/duo-rampage/2d/engine/Duo2DGameEngine';
import { duoNetwork } from '@/game/duo-rampage/network/DuoNetworkManager';
import { DuoRampageHomeScreen } from './home/DuoRampageHomeScreen';
import { DuoCreateRoomScreen } from './create-room/DuoCreateRoomScreen';
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
import { useAuth } from '@/context/AuthContext';

interface DuoRampageGameProps {
  onExit: () => void;
}

export const DuoRampageGame: React.FC<DuoRampageGameProps> = ({ onExit }) => {
  const { user, openAuthModal } = useAuth();
  const [screen, setScreen] = useState<'menu' | 'create_room' | 'lobby' | 'playing' | 'game_over'>('menu');
  const [createRoomMode, setCreateRoomMode] = useState<'create' | 'join'>('create');
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
  const engineRef = useRef<Duo2DGameEngine | null>(null);
  const isSoloRef = useRef(isSolo);
  const myRoleRef = useRef(myRole);

  useEffect(() => {
    isSoloRef.current = isSolo;
  }, [isSolo]);

  useEffect(() => {
    myRoleRef.current = myRole;
  }, [myRole]);

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
      if (!engineRef.current || isSoloRef.current) return;
      const remote = myRoleRef.current === 'assault' ? engineRef.current.player2 : engineRef.current.player1;
      if (!remote) return;
      remote.state.x = state.x;
      remote.state.y = state.z;
      remote.state.facing = state.facing;
      remote.state.health = state.health;
      remote.state.weapon = state.weapon;
      remote.state.ammo = state.ammo;
      remote.state.isDowned = state.isDown;
      remote.state.animState = state.animState;
    };

    duoNetwork.onRemoteShoot = (data) => {
      if (!engineRef.current || isSoloRef.current) return;
      const remote = myRoleRef.current === 'assault' ? engineRef.current.player2 : engineRef.current.player1;
      if (!remote) return;
      const facing = data.dir.x >= 0 ? 1 : -1;
      const aimAngle = Math.atan2(data.dir.y || 0, data.dir.x || facing);
      engineRef.current.weapons.fireWeapon(
        data.weapon || 'rifle',
        data.origin.x,
        data.origin.y,
        facing,
        aimAngle,
        true,
        remote.state.id,
        engineRef.current.isRampage,
        engineRef.current.particles
      );
      duoAudio.playGunshot(data.weapon);
    };

    duoNetwork.onRemoteRevived = () => {
      if (!engineRef.current) return;
      const me = myRoleRef.current === 'assault' ? engineRef.current.player1 : engineRef.current.player2;
      if (me && me.state.isDowned) me.reviveSuccess();
    };

    return () => {
      duoNetwork.leaveRoom();
    };
  }, []);

  // 2. Stream local player state at 20Hz in multiplayer mode
  useEffect(() => {
    if (screen !== 'playing' || isSolo) return;

    const interval = setInterval(() => {
      if (!engineRef.current) return;
      const me = myRole === 'assault' ? engineRef.current.player1 : engineRef.current.player2;
      if (!me) return;
      duoNetwork.sendPlayerState({
        x: me.state.x,
        z: me.state.y,
        facing: me.state.facing,
        health: me.state.health,
        weapon: me.state.weapon,
        ammo: me.state.ammo,
        isDown: me.state.isDowned,
        isReviving: me.state.reviveProgress > 0,
        animState: me.state.animState,
      });
    }, 50);

    return () => clearInterval(interval);
  }, [screen, isSolo, myRole]);

  // 3. Initialize 2D Canvas Engine when entering 'playing' screen
  useEffect(() => {
    if (screen !== 'playing') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    if (!canvasContainerRef.current) return;

    const engine = new Duo2DGameEngine(
      canvasContainerRef.current,
      myRole,
      isSolo,
      {
        onUpdateStats: (p1, p2, combo, wave, bossHp, warning) => {
          setPlayer1Stats({ ...p1 });
          setPlayer2Stats(p2 ? { ...p2 } : null);
          setComboState({ ...combo });
          setWaveState({ ...wave });
          setWarningStayTogether(!!warning);
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
    if (!user) {
      openAuthModal('login');
      return;
    }
    const myName = user.name || 'RAMPAGE#001';
    const myAvatar = user.avatar;

    try {
      await duoNetwork.connect();
      const code = await duoNetwork.createRoom(myName, myAvatar);
      setIsSolo(false);
      setMyRole('assault');
      if (duoNetwork.room) setRoom(duoNetwork.room);
      setCreateRoomMode('create');
      setScreen('create_room');
    } catch (err) {
      console.warn('Could not create network room, creating offline room:', err);
      setIsSolo(true);
      setMyRole('assault');
      setRoom({
        code: String(Math.floor(100000 + Math.random() * 900000)),
        hostId: user.id || 'local-host',
        status: 'lobby',
        countdownTimer: 0,
        players: [
          {
            id: user.id || 'local-host',
            name: myName,
            avatar: myAvatar,
            role: 'assault',
            isReady: true,
            isHost: true,
          },
        ],
        wave: 1,
        comboCount: 0,
      });
      setCreateRoomMode('create');
      setScreen('create_room');
    }
  };

  const handleOpenJoinRoom = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setCreateRoomMode('join');
    setScreen('create_room');
  };

  const handleJoinRoom = async (code: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    const myName = user.name || 'Hero 2';
    const myAvatar = user.avatar;

    await duoNetwork.connect();
    const joinedRoom = await duoNetwork.joinRoom(code, myName, myAvatar);
    setRoom(joinedRoom);
    setIsSolo(false);
    setMyRole('heavy');
    setCreateRoomMode('create');
    setScreen('create_room');
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
          onOpenJoinRoom={handleOpenJoinRoom}
          onStartSolo={handleStartSolo}
          onExit={onExit}
        />
      )}

      {/* 2. Full-Screen Create Room & Lobby Terminal (100% Match Reference) */}
      {screen === 'create_room' && (
        <DuoCreateRoomScreen
          roomCode={room?.code || '483921'}
          room={room}
          initialMode={createRoomMode}
          onBack={handleLeaveLobby}
          onJoinRoomSubmit={handleJoinRoom}
          onStartMission={() => {
            if (room && room.players.length > 1 && !isSolo) {
              handleStartMultiplayerGame();
            } else {
              handleStartSolo();
            }
          }}
        />
      )}

      {/* Legacy Fallback Lobby (if needed) */}
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
              const active = isSolo ? engineRef.current.player1 : (myRole === 'assault' ? engineRef.current.player1 : engineRef.current.player2);
              if (active) active.switchWeapon();
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
