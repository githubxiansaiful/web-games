'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, ArrowRight, Home, Coins, Clock } from 'lucide-react';

interface PodiumRunner {
  id: string;
  name: string;
  color: string;
  rank: number;
  timeElapsed?: number;
  coins?: number;
  isMe: boolean;
}

interface MultiplayerPodiumModalProps {
  isOpen: boolean;
  stageName: string;
  isHost: boolean;
  runners: PodiumRunner[];
  onNextStage: () => void;
  onReturnToLobby: () => void;
}

export const MultiplayerPodiumModal: React.FC<MultiplayerPodiumModalProps> = ({
  isOpen,
  stageName,
  isHost,
  runners,
  onNextStage,
  onReturnToLobby,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sortedRunners = [...runners].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const first = sortedRunners.find((r) => r.rank === 1);
  const second = sortedRunners.find((r) => r.rank === 2);
  const third = sortedRunners.find((r) => r.rank === 3);
  const others = sortedRunners.filter((r) => (r.rank || 99) > 3);

  const formatTime = (sec?: number) => {
    if (!sec) return '--:--';
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${m.toString().padStart(2, '0')}:${parseFloat(s) < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-250 select-none overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center text-white relative max-h-[95vh] overflow-y-auto my-auto">
        <div className="inline-flex p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 mb-2 animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white mb-1">RACE FINISHED!</h2>
        <p className="text-slate-300 font-medium text-xs sm:text-sm mb-6">{stageName}</p>

        {/* 3-Tier Podium Display */}
        <div className="flex items-end justify-center gap-2 sm:gap-3 mb-8 pt-6">
          {/* 2nd Place (Silver) */}
          <div className="flex flex-col items-center flex-1 max-w-[100px]">
            {second ? (
              <>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-lg mb-2 relative"
                  style={{ backgroundColor: second.color }}
                >
                  {second.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold truncate max-w-full mb-1">
                  {second.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mb-2">
                  {formatTime(second.timeElapsed)}
                </span>
              </>
            ) : (
              <div className="h-20" />
            )}
            <div className="w-full h-24 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-slate-300 shadow-lg">
              <span className="text-2xl font-black">🥈</span>
              <span className="text-xs font-bold text-slate-200">2ND</span>
            </div>
          </div>

          {/* 1st Place (Gold) */}
          <div className="flex flex-col items-center flex-1 max-w-[120px]">
            {first ? (
              <>
                <div className="relative mb-2">
                  <Crown className="w-6 h-6 text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce fill-current" />
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-xl ring-4 ring-amber-400/50"
                    style={{ backgroundColor: first.color }}
                  >
                    {first.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <span className="text-sm font-black text-amber-300 truncate max-w-full mb-1">
                  {first.name}
                </span>
                <span className="text-xs text-amber-200 font-mono mb-2">
                  {formatTime(first.timeElapsed)}
                </span>
              </>
            ) : (
              <div className="h-24" />
            )}
            <div className="w-full h-32 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-amber-200 shadow-xl">
              <span className="text-3xl font-black">🥇</span>
              <span className="text-xs font-black text-amber-950">WINNER</span>
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="flex flex-col items-center flex-1 max-w-[100px]">
            {third ? (
              <>
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-lg mb-2"
                  style={{ backgroundColor: third.color }}
                >
                  {third.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold truncate max-w-full mb-1">
                  {third.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mb-2">
                  {formatTime(third.timeElapsed)}
                </span>
              </>
            ) : (
              <div className="h-16" />
            )}
            <div className="w-full h-18 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-amber-600 shadow-md">
              <span className="text-xl font-black">🥉</span>
              <span className="text-[11px] font-bold text-amber-200">3RD</span>
            </div>
          </div>
        </div>

        {/* Other runners */}
        {others.length > 0 && (
          <div className="bg-slate-800/60 rounded-2xl p-3 mb-6 border border-slate-700/60 text-left space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Other Runners
            </span>
            {others.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 w-4">{i + 4}.</span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="font-medium">{r.name}</span>
                </div>
                <span className="font-mono text-slate-400">{formatTime(r.timeElapsed)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          {isHost ? (
            <>
              <button
                onClick={onNextStage}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl font-black text-sm text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <span>Play Next Stage</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onReturnToLobby}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-xs sm:text-sm text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4 text-indigo-400" />
                <span>Return to Lobby</span>
              </button>
            </>
          ) : (
            <div className="text-center py-2">
              <span className="text-xs text-slate-400 animate-pulse">
                Waiting for host to pick next action...
              </span>
              <button
                onClick={onReturnToLobby}
                className="mt-3 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-xs text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Back to Lobby</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
