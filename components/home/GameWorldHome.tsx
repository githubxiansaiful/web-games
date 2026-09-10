'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Users,
  Trophy,
  Shield,
  User as UserIcon,
  Sparkles,
  Zap,
  Star,
  Coins,
  Rocket,
  Flame,
  ArrowRight,
  Gamepad2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GameCanvas } from '@/components/GameCanvas';
import { SpaceGameCanvas } from '@/components/space-game/SpaceGameCanvas';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserAvatar } from '@/components/ui/UserAvatar';

export const GameWorldHome: React.FC = () => {
  const { user, isLoading, isAdmin, openAuthModal } = useAuth();

  // Active game view: null (home), 'runner' (Game 1), 'space' (Game 2)
  // Preserves active game state on browser refresh via URL parameter & localStorage
  const [activeGame, setActiveGame] = useState<'runner' | 'space' | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      if (gameParam === 'runner' || gameParam === 'space') {
        return gameParam;
      }
      const saved = localStorage.getItem('xian_active_game');
      if (saved === 'runner' || saved === 'space') {
        return saved;
      }
    }
    return null;
  });
  const [leaderboard, setLeaderboard] = useState<{ topSpace: any[]; topRunner: any[] }>({
    topSpace: [],
    topRunner: [],
  });
  const [leaderboardTab, setLeaderboardTab] = useState<'space' | 'runner'>('space');

  // Load leaderboard and check hostname
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === '0.0.0.0') {
        const port = window.location.port ? `:${window.location.port}` : '';
        window.location.replace(`http://localhost${port}${window.location.pathname}${window.location.search}`);
        return;
      }
    }

    fetch('/api/games/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaderboard({
            topSpace: data.topSpace || [],
            topRunner: data.topRunner || [],
          });
        }
      })
      .catch(() => {});
  }, []);

  // Listen for browser Back / Forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      if (gameParam === 'runner' || gameParam === 'space') {
        setActiveGame(gameParam);
      } else {
        setActiveGame(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handlePlayGame = (gameKey: 'runner' | 'space') => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setActiveGame(gameKey);
  };

  // Sync URL query param, localStorage, and body classes when activeGame changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (activeGame) {
      localStorage.setItem('xian_active_game', activeGame);
      if (url.searchParams.get('game') !== activeGame) {
        url.searchParams.set('game', activeGame);
        window.history.replaceState({}, '', url.toString());
      }
      document.body.classList.add('game-active');
    } else {
      localStorage.removeItem('xian_active_game');
      if (url.searchParams.has('game')) {
        url.searchParams.delete('game');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
      document.body.classList.remove('game-active');
    }

    return () => {
      document.body.classList.remove('game-active');
    };
  }, [activeGame]);

  // If Game 1 (Runner Royale) is running
  if (activeGame === 'runner') {
    return (
      <div className="fixed inset-0 z-50 w-full h-full bg-slate-950 overflow-hidden touch-none">
        <GameCanvas />
        <button
          onClick={() => setActiveGame(null)}
          className="absolute top-3 left-3 z-50 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-xl transition cursor-pointer"
        >
          <span>← Exit Game</span>
        </button>
      </div>
    );
  }

  // If Game 2 (Space Survivor) is running
  if (activeGame === 'space') {
    return (
      <div className="fixed inset-0 z-50 w-full h-full bg-slate-950 overflow-hidden touch-none">
        <SpaceGameCanvas onGoHome={() => setActiveGame(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#060913] text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white pb-16">
      {/* 1. FLOATING MINIMAL TOP BAR (NO BULKY NAVBAR) */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
        {/* Brand Mark */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
          <div>
            <div className="font-black text-sm tracking-wide text-white leading-none flex items-center gap-1.5">
              <span>XIAN ARCADE</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[9px] font-bold text-cyan-400 tracking-wider">ONLINE GAMES</span>
          </div>
        </div>

        {/* User Pill / Login */}
        <div>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-900/90 border border-slate-800 rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 bg-slate-900/95 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/60 rounded-full pl-1.5 pr-3 py-1 text-xs shadow-md transition active:scale-95"
                title="View Profile"
              >
                <UserAvatar avatar={user.avatar} name={user.name} size="xs" />
                <span className="font-bold text-white text-xs max-w-[90px] truncate">{user.name}</span>
                <span className="text-[10px] text-amber-400 font-black">★{user.stats?.runnerStars ?? 0}</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 transition"
                  title="Admin Portal"
                >
                  <Shield className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-full shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (MOBILE FIRST 99%) */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-3 space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">CHOOSE GAME</h2>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            2 TITLES READY
          </span>
        </div>

        {/* ============================================================ */}
        {/* GAME CARD 1: CYBER RUNNER ROYALE                             */}
        {/* ============================================================ */}
        <div className="group relative rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/60 overflow-hidden shadow-2xl transition-all duration-200">
          {/* Visual Poster Banner */}
          <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 flex flex-col justify-end p-4 sm:p-5">
            {/* Ambient Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />

            {/* Poster Badges */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
              <span className="px-2.5 py-1 rounded-full bg-indigo-600/90 text-white font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                <span>MULTIPLAYER RACE</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-amber-400 font-black text-[10px] tracking-wider uppercase">
                3 STAGES
              </span>
            </div>

            {/* Poster Center Graphic Art */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center shadow-inner">
                <svg className="w-12 h-12 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.8-1.6 8.1-4.9-1-.4 2 6.4 1.3z" />
                </svg>
              </div>
            </div>

            {/* Game Title & Tags on Poster */}
            <div className="relative z-10 space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                Cyber Runner Royale
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-cyan-300">
                <span>Multiplayer Battle Royale</span>
                <span className="text-slate-600">•</span>
                <span>Physics Platformer</span>
                <span className="text-slate-600">•</span>
                <span>Star Speedrun</span>
              </div>
            </div>
          </div>

          {/* Card Body & Actions */}
          <div className="p-4 sm:p-5 space-y-3 bg-slate-900/95">
            {/* Tag Badges */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">REALTIME WS</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300">UP TO 8 PLAYERS</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300">SPEEDRUN TIMER</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300">CUSTOM ROOMS</span>
            </div>

            {/* Tap To Play Button */}
            <button
              onClick={() => handlePlayGame('runner')}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>PLAY RUNNER ROYALE</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GAME CARD 2: NEON SPACE SURVIVOR                             */}
        {/* ============================================================ */}
        <div className="group relative rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/60 overflow-hidden shadow-2xl transition-all duration-200">
          {/* Visual Poster Banner */}
          <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex flex-col justify-end p-4 sm:p-5">
            {/* Ambient Starfield Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0e7490_0%,transparent_60%)] opacity-30" />
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />

            {/* Poster Badges */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/90 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1.5">
                <Rocket className="w-3 h-3 fill-slate-950" />
                <span>ARCADE SHOOTER</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-cyan-400 font-black text-[10px] tracking-wider uppercase">
                BOSS RAIDS
              </span>
            </div>

            {/* Poster Center Graphic Art */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-inner">
                <Flame className="w-12 h-12 text-cyan-400" />
              </div>
            </div>

            {/* Game Title & Tags on Poster */}
            <div className="relative z-10 space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                Neon Space Survivor
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-cyan-300">
                <span>Retro Arcade Space Shooter</span>
                <span className="text-slate-600">•</span>
                <span>Alien Swarms</span>
                <span className="text-slate-600">•</span>
                <span>Epic Boss Fights</span>
              </div>
            </div>
          </div>

          {/* Card Body & Actions */}
          <div className="p-4 sm:p-5 space-y-3 bg-slate-900/95">
            {/* Tag Badges */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">ENDLESS WAVES</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300">SMART BOMBS</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-purple-300">TRIPLE LASERS</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300">GLOBAL LEADERBOARD</span>
            </div>

            {/* Tap To Play Button */}
            <button
              onClick={() => handlePlayGame('space')}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-cyan-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Rocket className="w-4 h-4" />
              <span>LAUNCH MISSION</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. ARCADE HIGH SCORE MACHINE (COMMUNITY LEADERBOARD)         */}
        {/* ============================================================ */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 space-y-3.5">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black tracking-wider text-white uppercase">TOP HIGH SCORES</span>
            </div>

            {/* Game Switcher Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setLeaderboardTab('space')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  leaderboardTab === 'space' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Space
              </button>
              <button
                onClick={() => setLeaderboardTab('runner')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  leaderboardTab === 'runner' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Runner
              </button>
            </div>
          </div>

          {/* Leaderboard Entries List */}
          {leaderboardTab === 'space' ? (
            leaderboard.topSpace.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No high scores registered yet. Play to set the first record!
              </div>
            ) : (
              <div className="divide-y divide-slate-850">
                {leaderboard.topSpace.slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 text-center font-mono font-black ${
                          idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <UserAvatar avatar={item.avatar} name={item.name} size="xs" />
                      <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-400 text-[11px]">
                      {item.score.toLocaleString()} PTS
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            leaderboard.topRunner.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No speedrun records yet. Collect stars to claim your rank!
              </div>
            ) : (
              <div className="divide-y divide-slate-850">
                {leaderboard.topRunner.slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 text-center font-mono font-black ${
                          idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <UserAvatar avatar={item.avatar} name={item.name} size="xs" />
                      <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-[11px]">
                      ★ {item.stars} STARS
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      {/* 4. COMPACT MOBILE FOOTER */}
      <footer className="w-full max-w-2xl mx-auto px-4 py-4 mt-auto flex items-center justify-between text-[11px] text-slate-500">
        <span>Xian Arcade</span>
        <div className="flex items-center gap-3">
          {user && (
            <Link href="/profile" className="text-slate-400 hover:text-white transition">
              Profile
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="text-amber-400/80 hover:text-amber-300 transition">
              Admin
            </Link>
          )}
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
};
