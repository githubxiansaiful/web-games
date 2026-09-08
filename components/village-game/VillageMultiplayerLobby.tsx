'use client';

import React, { useState, useEffect } from 'react';
import { Users, Play, Copy, Check, ShieldAlert, Sparkles, X, ArrowRight, ShieldCheck, Gamepad2 } from 'lucide-react';
import { multiplayerClient } from '@/lib/multiplayerClient';
import { RoomState } from '@/lib/multiplayerTypes';
import { useAuth } from '@/context/AuthContext';

interface VillageMultiplayerLobbyProps {
  onStartGame: (mode: 'solo' | 'multiplayer', room?: RoomState) => void;
  onClose: () => void;
}

export const VillageMultiplayerLobby: React.FC<VillageMultiplayerLobbyProps> = ({ onStartGame, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'options' | 'create' | 'join'>('options');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleRoomUpdated = (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
    };

    const handleGameStarting = () => {
      if (room) {
        onStartGame('multiplayer', room);
      }
    };

    multiplayerClient.on('room_updated', handleRoomUpdated);
    multiplayerClient.on('game_starting', handleGameStarting);

    return () => {
      multiplayerClient.off('room_updated', handleRoomUpdated);
      multiplayerClient.off('game_starting', handleGameStarting);
    };
  }, [room, onStartGame]);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const playerName = user?.name || 'Outlaw Leader';

    try {
      const res = await multiplayerClient.createRoom(
        code,
        { name: playerName, color: '#22c55e' },
        1,
        'village'
      );
      if (res.success && res.room) {
        setRoom(res.room);
        setActiveTab('create');
      } else {
        setErrorMsg(res.message || 'Failed to create co-op room.');
      }
    } catch {
      setErrorMsg('Network error while creating room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      setErrorMsg('Please enter a 6-digit room code.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    const playerName = user?.name || 'Outlaw Partner';

    try {
      const res = await multiplayerClient.joinRoom(roomCodeInput.trim(), {
        name: playerName,
        color: '#06b6d4',
      });
      if (res.success && res.room) {
        setRoom(res.room);
        onStartGame('multiplayer', res.room);
      } else {
        setErrorMsg(res.message || 'Room not found or full (max 2 players).');
      }
    } catch {
      setErrorMsg('Error connecting to room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCoOp = () => {
    if (!room) return;
    multiplayerClient.startGame();
    onStartGame('multiplayer', room);
  };

  const copyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Open-World Action Driving</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            VILLAGE OUTLAWS 2D
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Cruise open countryside roads, drive bikes & buses, raid bandit outposts, and evade 4-star police pursuits.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs text-center font-semibold">
            {errorMsg}
          </div>
        )}

        {/* TAB: OPTIONS (Solo or Co-Op) */}
        {activeTab === 'options' && (
          <div className="space-y-3.5">
            {/* Solo Mode Button */}
            <button
              onClick={() => onStartGame('solo')}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-between shadow-xl shadow-emerald-900/30 transition-all transform active:scale-95 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-xl">
                  🏍️
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-base">Play Solo (Free Roam)</div>
                  <div className="text-[11px] font-medium text-emerald-100/80">
                    Instant play • Drive vehicles • Fight bandits & cops
                  </div>
                </div>
              </div>
              <Play className="w-5 h-5 fill-white group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 2-Player Co-Op Divider */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                2-Player Realtime Co-Op
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Create Room Button */}
              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/60 text-white flex flex-col items-center gap-2 transition active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-xs">Create Room</div>
                  <div className="text-[10px] text-slate-400">Host a 2P room</div>
                </div>
              </button>

              {/* Join Room Button */}
              <button
                onClick={() => {
                  setErrorMsg('');
                  setActiveTab('join');
                }}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/60 text-white flex flex-col items-center gap-2 transition active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-xs">Join with Code</div>
                  <div className="text-[10px] text-slate-400">Enter 6-digit code</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB: CREATE ROOM (Waiting for Player 2) */}
        {activeTab === 'create' && room && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Private Room Code
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-black tracking-widest text-emerald-400 font-mono">
                  {room.code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Share this code with your friend so they can join your village room!
              </p>
            </div>

            {/* Players in Room */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400">Connected Players (Max 2):</span>
              <div className="grid grid-cols-2 gap-2.5">
                {room.players.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20"
                      style={{ backgroundColor: p.color || '#22c55e' }}
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {p.isHost ? 'Host (Player 1)' : 'Player 2'}
                      </div>
                    </div>
                  </div>
                ))}
                {room.players.length < 2 && (
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs italic">
                    Waiting for Player 2...
                  </div>
                )}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartCoOp}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/30 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{room.players.length === 2 ? 'Launch 2-Player Co-Op!' : 'Start Co-Op Now'}</span>
            </button>

            <button
              onClick={() => setActiveTab('options')}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-white py-1"
            >
              ← Back to Modes
            </button>
          </div>
        )}

        {/* TAB: JOIN ROOM */}
        {activeTab === 'join' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Enter 6-Digit Room Code</label>
              <input
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 849201"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl text-center text-2xl font-mono tracking-widest text-white outline-none"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={isLoading || roomCodeInput.length < 6}
              className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-900/30 transition active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Join Village Room</span>
            </button>

            <button
              onClick={() => setActiveTab('options')}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-white py-1"
            >
              ← Back to Modes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
