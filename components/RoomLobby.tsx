'use client';

import React, { useState } from 'react';
import { RoomState, RoomPlayer } from '@/lib/multiplayerTypes';
import { LEVELS } from '@/lib/levels';
import { multiplayer } from '@/lib/multiplayerClient';
import {
  Users,
  Copy,
  Check,
  Play,
  ArrowLeft,
  Crown,
  Sparkles,
  Smile,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface RoomLobbyProps {
  room: RoomState;
  myPlayerId: string;
  onStartGame: () => void;
  onToggleReady: (ready: boolean) => void;
  onChangeStage: (stageId: number) => void;
  onLeaveRoom: () => void;
  onSendEmote: (emoji: string) => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  room,
  myPlayerId,
  onStartGame,
  onToggleReady,
  onChangeStage,
  onLeaveRoom,
  onSendEmote,
}) => {
  const [copied, setCopied] = useState(false);
  const me = room.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost ?? false;
  const isReady = me?.isReady ?? false;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedLevel = LEVELS.find((l) => l.id === room.stageId) || LEVELS[0];
  const allReady = room.players.every((p) => p.isHost || p.isReady);

  // Auto-launch if room status becomes in_game
  React.useEffect(() => {
    if (room.status === 'in_game') {
      onStartGame();
    }
  }, [room.status, onStartGame]);

  const LOBBY_EMOTES = ['👋', '🔥', '🚀', '👑', '⚡', '🎉', '💀'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl text-white relative max-h-[95vh] overflow-y-auto my-auto">
        {/* Top Header: Room Code & Leave Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Multiplayer Lobby
              </span>
              {multiplayer.isFallback() ? (
                <span
                  className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30 flex items-center gap-1"
                  title="Running in local tab sync. Connect NEXT_PUBLIC_SOCKET_URL for internet multiplayer."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Local Tab Sync
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-white">
                #{room.code}
              </h2>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 rounded-xl text-xs font-bold text-slate-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Leave Lobby</span>
          </button>
        </div>

        {/* Fallback Notice Banner (When running on serverless Vercel without socket server) */}
        {multiplayer.isFallback() && (
          <div className="mb-6 p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-xs text-amber-200 flex items-start gap-2.5">
            <span className="text-base flex-shrink-0">⚠️</span>
            <div className="leading-relaxed">
              <span className="font-bold text-amber-300">Single-Device Tab Sync: </span>
              This room is synced only across browser tabs on this device because Vercel is a serverless platform. To let friends on other phones or computers join over the internet, connect a free WebSocket server URL (<code className="bg-amber-900/60 px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-100">NEXT_PUBLIC_SOCKET_URL</code>).
            </div>
          </div>
        )}

        {/* Stage Selection Preview */}
        <div className="mb-6 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Selected Stage
            </span>
            {isHost && (
              <span className="text-[11px] text-indigo-400 font-semibold">
                Host can change stage
              </span>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${selectedLevel.theme.skyGradient[0]}, ${selectedLevel.theme.groundTopColor})`,
                }}
              >
                {selectedLevel.id}
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-white">
                  Stage {selectedLevel.id}: {selectedLevel.name}
                </h4>
                <p className="text-xs text-slate-400">{selectedLevel.subtitle}</p>
              </div>
            </div>

            {isHost && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => onChangeStage(lvl.id)}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      lvl.id === room.stageId
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    Stage {lvl.id}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Players Roster Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Runners ({room.players.length} / 8)
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Share room code <span className="font-mono font-bold text-indigo-400">{room.code}</span> with friends!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.players.map((p) => {
              const isCurrent = p.id === myPlayerId;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                      : 'bg-slate-800/40 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow relative"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                      {p.isHost && (
                        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
                          <Crown className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">
                          {p.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {p.isHost ? 'Room Host' : 'Challenger'}
                      </span>
                    </div>
                  </div>

                  {/* Ready Badge */}
                  <div>
                    {p.isHost ? (
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Host
                      </span>
                    ) : p.isReady ? (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Ready
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-700/50 text-slate-400 border border-slate-600/50 rounded-lg text-xs font-semibold flex items-center gap-1">
                        Waiting
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Lobby Emote Bar */}
        <div className="mb-6 flex items-center justify-between gap-2 p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-1">
            <Smile className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Emote:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {LOBBY_EMOTES.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSendEmote(emoji)}
                className="w-8 h-8 rounded-lg bg-slate-700/60 hover:bg-slate-700 active:scale-90 text-sm flex items-center justify-center transition cursor-pointer"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center gap-3">
          {isHost ? (
            <button
              onClick={onStartGame}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-2xl font-black text-sm text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START RACE NOW!</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleReady(!isReady)}
              className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isReady ? 'READY! (Click to Unready)' : 'READY UP!'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
