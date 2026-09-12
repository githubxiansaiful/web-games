'use client';

import React, { useState } from 'react';
import { Copy, Share2, Check, ArrowLeft, Play, Users, Shield, Zap } from 'lucide-react';
import { DuoRoomData } from '@/game/duo-rampage/types';

interface DuoRampageLobbyProps {
  room: DuoRoomData;
  isHost: boolean;
  myId: string;
  countdown: number | null;
  onToggleReady: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeave: () => void;
}

export const DuoRampageLobby: React.FC<DuoRampageLobbyProps> = ({
  room,
  isHost,
  myId,
  countdown,
  onToggleReady,
  onStartGame,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);

  const player1 = room.players.find((p) => p.role === 'assault') || room.players[0];
  const player2 = room.players.find((p) => p.role === 'heavy') || (room.players.length > 1 ? room.players[1] : null);

  const handleCopy = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?game=duo-rampage&room=${room.code.replace('#', '')}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me in DUO RAMPAGE!',
          text: `Join my 2-player co-op room #${room.code}!`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 sm:p-8 select-none overflow-y-auto">
      {/* 1. Countdown Overlay (3, 2, 1, RAMPAGE!) */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <span className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 animate-pulse scale-125">
            {countdown === 0 ? 'RAMPAGE!' : countdown}
          </span>
          <span className="text-sm font-bold text-cyan-300 tracking-widest uppercase mt-4">
            ENTERING ABANDONED CITY...
          </span>
        </div>
      )}

      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <button
          onClick={onLeave}
          className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-md transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Lobby</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">ROOM ACTIVE</span>
        </div>
      </div>

      {/* Center: Room Code Display */}
      <div className="w-full max-w-xl flex flex-col items-center my-4 space-y-3">
        <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">ROOM CODE</span>
        <div className="px-8 py-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center gap-4">
          <span className="font-mono text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-yellow-400 tracking-wider">
            {room.code}
          </span>
        </div>

        {/* Action Buttons: Copy & Share */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 rounded-xl text-xs font-bold text-amber-400 flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'COPIED!' : 'COPY ROOM ID'}</span>
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400/60 rounded-xl text-xs font-bold text-cyan-400 flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>SHARE</span>
          </button>
        </div>
      </div>

      {/* Characters Ready Slots */}
      <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
        {/* Player 1 Slot (Assault Hero) */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-sky-500/40 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-wider">
            HOST • ASSAULT
          </div>
          <div className="w-20 h-20 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-4xl shadow-inner mt-6 mb-3">
            ⚡
          </div>
          <span className="font-black text-base text-white">{player1 ? player1.name : 'Waiting for Host...'}</span>
          <span className="text-[11px] font-semibold text-slate-400 mt-0.5">Assault Rifle & Pistol</span>
          <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-xs">
            READY
          </div>
        </div>

        {/* Player 2 Slot (Heavy Hero) */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-orange-500/40 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider">
            PARTNER • HEAVY
          </div>
          <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-400/30 flex items-center justify-center text-4xl shadow-inner mt-6 mb-3">
            💥
          </div>
          <span className="font-black text-base text-white">
            {player2 ? player2.name : 'Waiting for Player 2...'}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 mt-0.5">Heavy Shotgun & Hammer</span>

          {player2 ? (
            <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-xs">
              READY
            </div>
          ) : (
            <div className="mt-3 px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-bold text-xs animate-pulse">
              WAITING FOR PARTNER...
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls: Start Game */}
      <div className="w-full max-w-xl flex flex-col gap-2 mt-4">
        {isHost ? (
          <button
            onClick={onStartGame}
            className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/30 transition active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>START GAME NOW</span>
          </button>
        ) : (
          <div className="w-full py-4 px-6 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-center text-slate-300 font-bold text-sm animate-pulse">
            WAITING FOR HOST TO START GAME...
          </div>
        )}
      </div>
    </div>
  );
};
