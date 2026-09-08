'use client';

import React from 'react';
import { RemotePlayerState } from '@/lib/multiplayerTypes';
import { Trophy, Smile, Crown } from 'lucide-react';

interface MultiplayerRaceHUDProps {
  myPlayerId: string;
  myPlayerName: string;
  myPlayerColor: string;
  myProgressPercent: number;
  myFinished: boolean;
  myFinishRank?: number;
  remotePlayers: Map<string, RemotePlayerState>;
  onSendEmote: (emoji: string) => void;
}

export const MultiplayerRaceHUD: React.FC<MultiplayerRaceHUDProps> = ({
  myPlayerId,
  myPlayerName,
  myPlayerColor,
  myProgressPercent,
  myFinished,
  myFinishRank,
  remotePlayers,
  onSendEmote,
}) => {
  // Combine local and remote players into a ranked leaderboard
  const allRunners = [
    {
      id: myPlayerId,
      name: myPlayerName,
      color: myPlayerColor,
      progress: myProgressPercent,
      finished: myFinished,
      rank: myFinishRank,
      isMe: true,
    },
    ...Array.from(remotePlayers.values()).map((rp) => ({
      id: rp.id,
      name: rp.name,
      color: rp.color,
      progress: rp.progressPercent || 0,
      finished: rp.finished || false,
      rank: rp.finishRank,
      isMe: false,
    })),
  ];

  // Sort: Finished players first (by rank), then active runners by progress descending
  allRunners.sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.rank || 99) - (b.rank || 99);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });

  const EMOTES = ['🚀', '👋', '💀', '🎉', '⚡'];

  return (
    <>
      {/* Mini Race Leaderboard (Top Right) */}
      <div className="absolute top-16 right-3 sm:right-4 z-20 pointer-events-none select-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl p-2.5 shadow-xl text-white w-48 sm:w-56 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>RACE STANDINGS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {allRunners.length} Runners
            </span>
          </div>

          <div className="space-y-1.5">
            {allRunners.map((runner, idx) => {
              const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;

              return (
                <div
                  key={runner.id}
                  className={`px-2 py-1 rounded-lg text-xs flex items-center justify-between gap-1.5 ${
                    runner.isMe ? 'bg-indigo-950/60 border border-indigo-500/50' : 'bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-[11px] w-4 text-center">
                      {runner.finished ? (runner.rank === 1 ? '🥇' : runner.rank === 2 ? '🥈' : '🥉') : rankEmoji}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: runner.color }}
                    />
                    <span className="font-medium text-slate-200 truncate max-w-[80px] sm:max-w-[100px]">
                      {runner.name} {runner.isMe && '(You)'}
                    </span>
                  </div>

                  <div>
                    {runner.finished ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-1 py-0.5 rounded border border-emerald-800/60">
                        DONE!
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        {Math.floor(runner.progress)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating In-Game Emote Bar (Bottom Center-Left) */}
      <div className="absolute bottom-22 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-1.5 shadow-xl select-none">
        {EMOTES.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendEmote(emoji)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-700 active:scale-90 text-sm sm:text-base flex items-center justify-center transition cursor-pointer"
            title={`Send ${emoji} emote`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};
