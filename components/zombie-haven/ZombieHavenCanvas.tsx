/**
 * Zombie Haven - Master React Canvas & Session Lifecycle Controller
 * Switches between Menu, Co-op Lobby, 3D Engine Gameplay, and Match Summary.
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ZombieGameEngine } from '@/game/zombie-haven/ZombieGameEngine';
import { ZombieHavenMenu } from './ZombieHavenMenu';
import { ZombieHavenLobby } from './ZombieHavenLobby';
import { ZombieHavenHUD } from './ZombieHavenHUD';
import { ZombieHavenGameOver } from './ZombieHavenGameOver';
import { zombieSocket } from '@/game/zombie-haven/network/ZombieSocketClient';
import { MatchStats, ZombieRoom } from '@/game/zombie-haven/types';

interface ZombieHavenCanvasProps {
  onExit: () => void;
}

export const ZombieHavenCanvas: React.FC<ZombieHavenCanvasProps> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ZombieGameEngine | null>(null);

  // Screen modes: 'menu' | 'lobby' | 'playing' | 'game_over'
  const [screen, setScreen] = useState<'menu' | 'lobby' | 'playing' | 'game_over'>('menu');
  const [currentRoom, setCurrentRoom] = useState<ZombieRoom | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [, setRerenderTrigger] = useState(0);

  // Establish socket connection on mount
  useEffect(() => {
    zombieSocket.connect().then(() => {
      // Connect callbacks
      zombieSocket.onRoomUpdated = (room) => {
        setCurrentRoom({ ...room });
      };

      zombieSocket.onGameStarting = () => {
        setScreen('playing');
      };
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      zombieSocket.disconnect();
    };
  }, []);

  // Initialize engine when screen transitions to 'playing'
  useEffect(() => {
    if (screen === 'playing' && canvasRef.current && containerRef.current && !engineRef.current) {
      const playerName = currentRoom?.players.find((p) => p.id === zombieSocket.myId)?.name || 'Survivor';
      const engine = new ZombieGameEngine(canvasRef.current, containerRef.current, playerName);
      engineRef.current = engine;

      engine.onStateChange = () => {
        setRerenderTrigger((prev) => prev + 1);
      };

      engine.onGameOver = (stats) => {
        setMatchStats({ ...stats });
        setScreen('game_over');
      };
    }
  }, [screen, currentRoom]);

  // Handlers
  const handleStartSolo = (name: string) => {
    zombieSocket.createRoom(name).then(() => {
      setScreen('playing');
    });
  };

  const handleCreateRoom = (name: string) => {
    zombieSocket.createRoom(name).then((res) => {
      if (res.success && zombieSocket.room) {
        setCurrentRoom({ ...zombieSocket.room });
        setScreen('lobby');
      }
    });
  };

  const handleJoinRoom = (code: string, name: string) => {
    zombieSocket.joinRoom(code, name).then((res) => {
      if (res.success && zombieSocket.room) {
        setCurrentRoom({ ...zombieSocket.room });
        setScreen('lobby');
      }
    });
  };

  const handleLobbyStartGame = () => {
    zombieSocket.startGame();
    setScreen('playing');
  };

  const handlePlayAgain = () => {
    if (engineRef.current) {
      engineRef.current.restartGame();
      setScreen('playing');
    } else {
      setScreen('playing');
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#050811] overflow-hidden select-none touch-none"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Screen 1: Main Menu */}
      {screen === 'menu' && (
        <ZombieHavenMenu
          onStartSolo={handleStartSolo}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onReturnHome={onExit}
        />
      )}

      {/* Screen 2: 2-Player Co-op Lobby */}
      {screen === 'lobby' && currentRoom && (
        <ZombieHavenLobby
          room={currentRoom}
          onStartGame={handleLobbyStartGame}
          onBackToMenu={() => setScreen('menu')}
        />
      )}

      {/* Screen 3: In-Game Active HUD */}
      {screen === 'playing' && engineRef.current && (
        <ZombieHavenHUD
          engine={engineRef.current}
          onExit={() => {
            if (engineRef.current) {
              engineRef.current.dispose();
              engineRef.current = null;
            }
            setScreen('menu');
          }}
        />
      )}

      {/* Screen 4: Game Over & Match Summary */}
      {screen === 'game_over' && matchStats && (
        <ZombieHavenGameOver
          stats={matchStats}
          onPlayAgain={handlePlayAgain}
          onReturnHome={onExit}
        />
      )}
    </div>
  );
};
