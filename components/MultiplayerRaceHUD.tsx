'use client';

import React, { useState } from 'react';
import { RemotePlayerState } from '@/lib/multiplayerTypes';
import { Trophy, Smile, ChevronDown, ChevronUp, X } from 'lucide-react';

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
  const [isMobileStandingsOpen, setIsMobileStandingsOpen] = useState(false);
  const [isMobileEmotesOpen, setIsMobileEmotesOpen] = useState(false);

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

  const myIndex = allRunners.findIndex((r) => r.isMe);
  const myRank = myIndex !== -1 ? myIndex + 1 : 1;
  const myRankDisplay = myFinished
    ? myFinishRank === 1
      ? '🥇 1st'
      : myFinishRank === 2
      ? '🥈 2nd'
      : myFinishRank === 3
      ? '🥉 3rd'
      : `#${myFinishRank}`
    : myRank === 1
    ? '🥇 1st'
    : myRank === 2
    ? '🥈 2nd'
    : myRank === 3
    ? '🥉 3rd'
    : `#${myRank}`;

  const EMOTES = ['🚀', '👋', '💀', '🎉', '⚡'];

  const renderRunnerRow = (runner: typeof allRunners[0], idx: number) => {
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
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. RACE STANDINGS                                        */}
      {/* ======================================================== */}

      {/* MOBILE VIEW (< sm): Sleek Micro-Pill with Dropdown */}
      <div className="absolute top-13 right-2 z-20 pointer-events-auto select-none sm:hidden flex flex-col items-end">
        <button
          onClick={() => setIsMobileStandingsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
          title="Toggle Standings"
          aria-label="Toggle Race Standings"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{myRankDisplay}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({Math.floor(myProgressPercent)}%)
          </span>
          {isMobileStandingsOpen ? (
            <ChevronUp className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-400" />
          )}
        </button>

        {isMobileStandingsOpen && (
          <div className="mt-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl text-white w-48 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5 px-1">
              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> STANDINGS
              </span>
              <span className="text-[10px] font-mono text-slate-400">{allRunners.length} Runners</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {allRunners.map(renderRunnerRow)}
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP VIEW (>= sm): Full Card Standing */}
      <div className="hidden sm:block absolute top-16 right-4 z-20 pointer-events-none select-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl p-2.5 shadow-xl text-white w-56 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>RACE STANDINGS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {allRunners.length} Runners
            </span>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {allRunners.map(renderRunnerRow)}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. IN-GAME EMOTE BAR                                      */}
      {/* ======================================================== */}

      {/* MOBILE VIEW (< sm): Collapsible Floating Emote Bubble */}
      <div className="sm:hidden absolute bottom-22 left-1/2 -translate-x-1/2 z-20 pointer-events-auto select-none flex flex-col items-center">
        {isMobileEmotesOpen ? (
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {EMOTES.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSendEmote(emoji);
                  setIsMobileEmotesOpen(false);
                }}
                className="w-8 h-8 rounded-xl hover:bg-slate-700 active:scale-90 text-base flex items-center justify-center transition cursor-pointer"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setIsMobileEmotesOpen(false)}
              className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer ml-0.5"
              aria-label="Close Emotes"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsMobileEmotesOpen(true)}
            className="px-2.5 py-1 bg-slate-950/40 hover:bg-slate-900/60 active:scale-95 backdrop-blur-sm border border-white/20 rounded-full text-white shadow-md flex items-center gap-1 text-xs transition cursor-pointer"
            title="Open Emotes"
            aria-label="Send Emote"
          >
            <Smile className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-[11px] font-medium text-slate-200">Emote</span>
          </button>
        )}
      </div>

      {/* DESKTOP VIEW (>= sm): Docked Horizontal Emote Bar */}
      <div className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-1.5 shadow-xl select-none">
        {EMOTES.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendEmote(emoji)}
            className="w-9 h-9 rounded-xl hover:bg-slate-700 active:scale-90 text-base flex items-center justify-center transition cursor-pointer"
            title={`Send ${emoji} emote`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};
