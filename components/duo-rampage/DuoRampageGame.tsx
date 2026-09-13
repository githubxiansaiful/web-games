'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Duo2DGameEngine } from '@/game/duo-rampage/2d/engine/Duo2DGameEngine';
import { Parkour2DGameEngine } from '@/game/duo-rampage/parkour/engine/Parkour2DGameEngine';
import { duoNetwork } from '@/game/duo-rampage/network/DuoNetworkManager';
import { DuoRampageHomeScreen } from './home/DuoRampageHomeScreen';
import { DuoCreateRoomScreen } from './create-room/DuoCreateRoomScreen';
import { DuoRampageLobby } from './DuoRampageLobby';
import { DuoRampageHUD } from './DuoRampageHUD';
import { DuoRampageGameOver } from './DuoRampageGameOver';
import { DuoParkourLevelSelect } from './parkour/DuoParkourLevelSelect';
import { ParkourGameView } from './parkour/ParkourGameView';
import {
  PlayerRole,
  PlayerStats,
  DuoComboState,
  WaveState,
  DamageNumber,
  TouchControlsState,
  DuoRoomData,
  DuoGameMode,
} from '@/game/duo-rampage/types';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';

interface DuoRampageGameProps {
  onExit: () => void;
}

export const DuoRampageGame: React.FC<DuoRampageGameProps> = ({ onExit }) => {
  const { user, openAuthModal } = useAuth();
  const [screen, setScreen] = useState<'menu' | 'parkour_levels' | 'create_room' | 'lobby' | 'playing' | 'game_over'>('menu');
  const [createRoomMode, setCreateRoomMode] = useState<'create' | 'join'>('create');
  const [room, setRoom] = useState<DuoRoomData | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<PlayerRole>('assault');
  const [isSolo, setIsSolo] = useState(true);
  const [gameMode, setGameMode] = useState<DuoGameMode>('rampage');
  const [selectedParkourLevel, setSelectedParkourLevel] = useState<number>(1);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parkour_selected_character') || 'char_1';
    }
    return 'char_1';
  });

  const handleSelectCharacter = (id: string) => {
    setSelectedCharacterId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkour_selected_character', id);
    }
  };

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
  const parkourEngineRef = useRef<Parkour2DGameEngine | null>(null);
  const isSoloRef = useRef(isSolo);
  const myRoleRef = useRef(myRole);
  const gameModeRef = useRef(gameMode);

  useEffect(() => {
    isSoloRef.current = isSolo;
  }, [isSolo]);

  useEffect(() => {
    myRoleRef.current = myRole;
  }, [myRole]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  const localPlayerName =
    user?.name ||
    (typeof window !== 'undefined' ? localStorage.getItem('runner_player_name') : null) ||
    'RAMPAGE#001';

  const partnerPlayer =
    room?.players.find((p) => p.id !== duoNetwork.myId) ||
    (room?.players && room.players.length > 1 ? room.players[1] : null);
  const partnerPlayerName =
    partnerPlayer?.name || (myRole === 'assault' ? 'Hero 2' : 'Squad Leader');

  // 1. Connect to Network Manager
  useEffect(() => {
    duoNetwork.connect().catch((err) => {
      console.warn('[DuoRampage] Network connect fallback:', err);
    });

    duoNetwork.onRoomUpdated = (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.gameMode) {
        setGameMode(updatedRoom.gameMode);
      }
      if (updatedRoom.selectedLevel) {
        setSelectedParkourLevel(updatedRoom.selectedLevel);
      }
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
      if (gameModeRef.current === 'parkour') {
        if (parkourEngineRef.current) {
          parkourEngineRef.current.updateRemotePlayer(state);
        }
        return;
      }

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

  // 2. Stream local player state at 30Hz in multiplayer mode (both parkour & rampage)
  useEffect(() => {
    if (screen !== 'playing' || isSolo) return;

    const interval = setInterval(() => {
      if (gameMode === 'parkour') {
        if (!parkourEngineRef.current) return;
        const r = parkourEngineRef.current.runner;
        duoNetwork.sendPlayerState({
          x: Math.round(r.x),
          y: Math.round(r.y),
          vx: Math.round(r.vx),
          vy: Math.round(r.vy),
          facing: r.facing,
          isSliding: r.isSliding,
          isClimbing: r.isClimbing,
          isLedgeGrabbing: r.isLedgeGrabbing,
          isWallSliding: r.isWallSliding,
          isVaulting: r.isVaulting,
          hasDoubleJumped: r.hasDoubleJumped,
          currentHeight: r.currentHeight,
          name: localPlayerName,
          role: myRole,
          characterId: selectedCharacterId,
        });
      } else if (gameMode === 'rampage') {
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
          name: localPlayerName,
          role: myRole,
        });
      }
    }, 33);

    return () => clearInterval(interval);
  }, [screen, isSolo, myRole, gameMode, localPlayerName, selectedCharacterId]);

  // 3. Initialize 2D Canvas Engine when entering 'playing' screen for RAMPAGE mode
  useEffect(() => {
    if (screen !== 'playing' || gameMode !== 'rampage') {
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
  }, [screen, myRole, isSolo, gameMode]);

  // Handlers
  const handleCreateRoom = async (chosenMode?: DuoGameMode, level?: number) => {
    const myName = user?.name || (typeof window !== 'undefined' ? localStorage.getItem('runner_player_name') : null) || 'RAMPAGE#001';
    const myAvatar = user?.avatar || undefined;
    const effectiveMode = chosenMode || gameMode;
    const effectiveLevel = level || selectedParkourLevel;
    setGameMode(effectiveMode);
    if (level) setSelectedParkourLevel(level);

    try {
      await duoNetwork.connect();
      const code = await duoNetwork.createRoom(myName, myAvatar, effectiveMode, effectiveLevel);
      setIsSolo(false);
      setMyRole('assault');
      if (duoNetwork.room) {
        duoNetwork.room.gameMode = effectiveMode;
        duoNetwork.room.selectedLevel = effectiveLevel;
        setRoom(duoNetwork.room);
      }
      setCreateRoomMode('create');
      setScreen('create_room');
    } catch (err) {
      console.warn('Could not create network room, creating offline room:', err);
      setIsSolo(true);
      setMyRole('assault');
      setRoom({
        code: String(Math.floor(100000 + Math.random() * 900000)),
        hostId: user?.id || 'local-host',
        status: 'lobby',
        countdownTimer: 0,
        players: [
          {
            id: user?.id || 'local-host',
            name: myName,
            avatar: myAvatar || undefined,
            role: 'assault',
            isReady: true,
            isHost: true,
          },
        ],
        wave: 1,
        comboCount: 0,
        gameMode: effectiveMode,
        selectedLevel: effectiveLevel,
      });
      setCreateRoomMode('create');
      setScreen('create_room');
    }
  };

  const handleOpenJoinRoom = () => {
    setCreateRoomMode('join');
    setScreen('create_room');
  };

  const handleJoinRoom = async (code: string) => {
    const myName = user?.name || (typeof window !== 'undefined' ? localStorage.getItem('runner_player_name') : null) || 'Hero 2';
    const myAvatar = user?.avatar || undefined;

    await duoNetwork.connect();
    const joinedRoom = await duoNetwork.joinRoom(code, myName, myAvatar);
    setRoom(joinedRoom);
    if (joinedRoom.gameMode) {
      setGameMode(joinedRoom.gameMode);
    }
    if (joinedRoom.selectedLevel) {
      setSelectedParkourLevel(joinedRoom.selectedLevel);
    }
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

  const handleStartSoloWithCountdown = () => {
    setIsSolo(true);
    setMyRole('assault');
    setCountdown(3);
    duoAudio.playCountdown(3);

    let count = 2;
    const timer = setInterval(() => {
      if (count > 0) {
        setCountdown(count);
        duoAudio.playCountdown(count);
        count--;
      } else if (count === 0) {
        setCountdown(0);
        duoAudio.playCountdown(0);
        count--;
      } else {
        clearInterval(timer);
        setCountdown(null);
        setScreen('playing');
      }
    }, 900);
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
    <div className={`relative w-full h-[100dvh] max-h-[100dvh] bg-black overflow-hidden select-none ${screen === 'playing' ? 'touch-none' : 'touch-auto'}`}>
      {/* Canvas Container (Active when playing Rampage) */}
      <div
        ref={canvasContainerRef}
        className={`absolute inset-0 w-full h-full z-10 ${screen === 'playing' && gameMode === 'rampage' ? 'block' : 'hidden'}`}
      />

      {/* 1. Main Menu (Production Quality 3D Cartoon Home Screen) */}
      {screen === 'menu' && (
        <DuoRampageHomeScreen
          onCreateRoom={(m) => handleCreateRoom(m)}
          onJoinRoom={handleJoinRoom}
          onOpenJoinRoom={handleOpenJoinRoom}
          onStartSolo={(m) => {
            if (m === 'parkour') {
              setGameMode('parkour');
              setScreen('parkour_levels');
            } else {
              setGameMode('rampage');
              handleStartSoloWithCountdown();
            }
          }}
          onOpenParkourLevels={() => {
            setGameMode('parkour');
            setScreen('parkour_levels');
          }}
          activeGameMode={gameMode}
          onToggleGameMode={(m) => setGameMode(m)}
          onExit={onExit}
        />
      )}

      {/* 1.5 Parkour Campaign Level Selection Screen */}
      {screen === 'parkour_levels' && (
        <DuoParkourLevelSelect
          onBack={() => setScreen('menu')}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={handleSelectCharacter}
          onSelectLevelSolo={(lvl) => {
            setSelectedParkourLevel(lvl.levelNumber);
            setGameMode('parkour');
            handleStartSoloWithCountdown();
          }}
          onSelectLevelDuo={(lvl) => {
            setSelectedParkourLevel(lvl.levelNumber);
            setGameMode('parkour');
            handleCreateRoom('parkour', lvl.levelNumber);
          }}
        />
      )}

      {/* 2. Full-Screen Create Room & Lobby Terminal (100% Match Reference) */}
      {screen === 'create_room' && (
        <DuoCreateRoomScreen
          roomCode={room?.code || '483921'}
          room={room}
          initialMode={createRoomMode}
          gameMode={gameMode}
          selectedLevel={selectedParkourLevel}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={handleSelectCharacter}
          onBack={handleLeaveLobby}
          onJoinRoomSubmit={handleJoinRoom}
          onStartMission={() => {
            if (room && room.players.length > 1 && !isSolo) {
              handleStartMultiplayerGame();
            } else {
              handleStartSoloWithCountdown();
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

      {/* 3. In-Game View & HUD */}
      {screen === 'playing' && gameMode === 'parkour' && (
        <ParkourGameView
          onExit={() => {
            if (!isSolo) duoNetwork.leaveRoom();
            setScreen('menu');
          }}
          isMultiplayer={!isSolo}
          myRole={myRole}
          localPlayerName={localPlayerName}
          partnerPlayerName={partnerPlayerName}
          characterId={selectedCharacterId}
          onEngineReady={(eng) => {
            parkourEngineRef.current = eng;
          }}
        />
      )}

      {screen === 'playing' && gameMode === 'rampage' && (
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
              handleStartSoloWithCountdown();
            } else {
              setScreen('lobby');
            }
          }}
          onExit={() => setScreen('menu')}
        />
      )}

      {/* GLOBAL 3-2-1 MISSION LAUNCH COUNTDOWN OVERLAY */}
      {countdown !== null && (
        <div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto"
        >
          <div className="relative flex flex-col items-center px-6 text-center max-w-lg">
            {/* Animated Pulse Halo */}
            <div className="absolute -inset-16 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Launch Status Pill */}
            <div className="relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              SQUAD LAUNCH SEQUENCE ENGAGED
            </div>

            {/* Giant 3 - 2 - 1 - GO! */}
            <div
              key={countdown}
              className="relative text-8xl sm:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_40px_rgba(6,182,212,0.85)] transform transition-transform duration-200"
            >
              {countdown > 0 ? countdown : 'GO!'}
            </div>

            {/* Tactical Subtitle */}
            <p className="relative mt-6 text-sm sm:text-base font-mono uppercase tracking-[0.25em] text-slate-200 font-bold">
              {countdown > 0 ? 'SYNCHRONIZING RUNNERS • GET READY' : 'MISSION STARTED!'}
            </p>

            {/* Mission Mode Badge */}
            <div className="relative mt-3 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-xs font-mono text-cyan-400 uppercase">
              {gameMode === 'parkour'
                ? `🏃 DHAKA PARKOUR • SECTOR #${selectedParkourLevel.toString().padStart(2, '0')}`
                : '⚔ DUO RAMPAGE • URBAN COMBAT DROP'}
            </div>
          </div>
        </div>
      )}

      {/* 5. Auth Modal (If user clicks Login in profile/menus) */}
      <AuthModal />
    </div>
  );
};
