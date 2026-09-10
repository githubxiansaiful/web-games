/**
 * Zombie Haven - 2-Player Co-op Waiting Room Lobby
 * Displays room code, 1-click copy, player 1 & 2 cards, ready status, and Launch Game trigger.
 */

'use client';

import React, { useState } from 'react';
import { Users, Copy, Check, Play, ArrowLeft, Shield, Radio } from 'lucide-react';
import { ZombieRoom } from '@/game/zombie-haven/types';
import { zombieSocket } from '@/game/zombie-haven/network/ZombieSocketClient';

interface ZombieHavenLobbyProps {
  room: ZombieRoom;
  onStartGame: () => void;
  onBackToMenu: () => void;
}

export const ZombieHavenLobby: React.FC<ZombieHavenLobbyProps> = ({
  room,
  onStartGame,
  onBackToMenu,
}) => {
  const [copied, setCopied] = useState(false);
  const me = room.players.find((p) => p.id === zombieSocket.myId) || room.players[0];
  const isHost = me?.isHost || false;
  const isReady = me?.isReady || false;

  const player1 = room.players[0];
  const player2 = room.players[1];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    zombieSocket.toggleReady(!isReady);
  };

  const canLaunch = isHost && (room.players.length === 1 || room.players.every((p) => p.isReady));

  return (
    <div className="absolute inset-0 z-40 bg-[#060913]/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-950 border-2 border-red-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/70 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={onBackToMenu}
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <h2 className="font-zombie text-3xl sm:text-4xl text-red-500 zombie-glow-red tracking-wider leading-none">
              ZOMBIE HAVEN
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              COOPERATIVE LOBBY (2 PLAYERS)
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Room Code Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            INVITE CODE (SHARE WITH FRIEND)
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono font-black text-3xl tracking-widest text-amber-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
              {room.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </div>

        {/* 2 Player Slot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Slot 1: Host */}
          <div className="bg-slate-900/80 border border-indigo-500/40 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-indigo-400">PLAYER 1 (HOST)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                READY
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-lg">
                🤠
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{player1 ? player1.name : 'Host'}</h4>
                <span className="text-[11px] text-slate-400">Deadwood Vanguard</span>
              </div>
            </div>
          </div>

          {/* Slot 2: Guest */}
          <div
            className={`border rounded-2xl p-4 space-y-2 ${
              player2
                ? 'bg-slate-900/80 border-pink-500/40'
                : 'bg-slate-900/30 border-dashed border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-pink-400">PLAYER 2</span>
              {player2 ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    player2.isReady
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {player2.isReady ? 'READY' : 'PREPARING'}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 uppercase font-bold animate-pulse">
                  WAITING...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-lg">
                {player2 ? '🥷' : '⏳'}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {player2 ? player2.name : 'Waiting for Friend...'}
                </h4>
                <span className="text-[11px] text-slate-500">
                  {player2 ? 'Secondary Defender' : 'Give friend room code to join'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {!isHost && (
            <button
              onClick={handleToggleReady}
              className={`w-full py-3.5 px-4 font-black text-sm rounded-2xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                isReady
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isReady ? 'CANCEL READY' : 'SET READY'}</span>
            </button>
          )}

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canLaunch}
              className={`w-full py-4 px-4 font-black text-sm rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 ${
                canLaunch
                  ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white cursor-pointer shadow-red-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>ENTER DEADWOOD VILLAGE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
