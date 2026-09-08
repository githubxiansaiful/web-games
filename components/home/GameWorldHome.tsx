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
import { ApexCityCanvas } from '@/components/apex-city/ApexCityCanvas';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserAvatar } from '@/components/ui/UserAvatar';

export const GameWorldHome: React.FC = () => {
  const { user, isLoading, isAdmin, openAuthModal } = useAuth();

  // Active game view: null (home), 'runner' (Game 1), 'space' (Game 2), 'apex' (Game 3)
  const [activeGame, setActiveGame] = useState<'runner' | 'space' | 'apex' | null>(null);
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

  const handlePlayGame = (gameKey: 'runner' | 'space' | 'apex') => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setActiveGame(gameKey);
  };

  // Lock body scrolling when a game canvas is active, restore for home page
  useEffect(() => {
    if (activeGame) {
      document.body.classList.add('game-active');
    } else {
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

  // If Game 3 (Apex City 3D) is running
  if (activeGame === 'apex') {
    return (
      <div className="fixed inset-0 z-50 w-full h-full bg-slate-950 overflow-hidden touch-none">
        <ApexCityCanvas onExit={() => setActiveGame(null)} />
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
            3 TITLES READY
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
                <span>Speedrun Solo</span>
                <span className="text-slate-600">•</span>
                <span>4-Player Rooms</span>
                <span className="text-slate-600">•</span>
                <span>Star Challenges</span>
              </div>
            </div>
          </div>

          {/* Card Body & Actions */}
          <div className="p-4 sm:p-5 space-y-3 bg-slate-900/95">
            {/* User Stats Snapshot if logged in */}
            {user && (
              <div className="flex items-center justify-between text-xs bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Your Progress:</span>
                <div className="flex items-center gap-3 font-bold">
                  <span className="text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{user.stats?.runnerStars ?? 0} / 9</span>
                  </span>
                  <span className="text-emerald-400">
                    {user.stats?.runnerBestTime ? `${user.stats.runnerBestTime}s Best` : 'No run yet'}
                  </span>
                </div>
              </div>
            )}

            {/* Tap To Play Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handlePlayGame('runner')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>PLAY SOLO RACE</span>
              </button>

              <button
                onClick={() => handlePlayGame('runner')}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-cyan-300 hover:text-white font-bold text-sm rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>JOIN / CREATE ROOM</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GAME CARD 2: NEON SPACE SURVIVOR                             */}
        {/* ============================================================ */}
        <div className="group relative rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/60 overflow-hidden shadow-2xl transition-all duration-200">
          {/* Visual Poster Banner */}
          <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-cyan-950 to-indigo-950 flex flex-col justify-end p-4 sm:p-5">
            {/* Cosmic Starfield Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0e7490_0%,transparent_60%)] opacity-30" />
            <div className="absolute top-6 left-8 w-1.5 h-1.5 bg-white rounded-full opacity-80" />
            <div className="absolute top-16 right-16 w-1 h-1 bg-cyan-300 rounded-full opacity-60" />
            <div className="absolute bottom-20 left-24 w-1 h-1 bg-purple-300 rounded-full opacity-70" />
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />

            {/* Poster Badges */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
              <span className="px-2.5 py-1 rounded-full bg-cyan-600/90 text-white font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1.5">
                <Rocket className="w-3 h-3" />
                <span>ARCADE SHOOTER</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-cyan-300 font-black text-[10px] tracking-wider uppercase">
                BOSS RAIDS
              </span>
            </div>

            {/* Poster Center Graphic Art */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-inner">
                <svg className="w-12 h-12 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.5s-5 4-5 11.5c0 3 2 5.5 5 5.5s5-2.5 5-5.5C17 6.5 12 2.5 12 2.5zM7.5 18l-3.5 2 1-3.5L7.5 18zm9 0l3.5 2-1-3.5L16.5 18z" />
                </svg>
              </div>
            </div>

            {/* Game Title & Tags on Poster */}
            <div className="relative z-10 space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                Neon Space Survivor
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-purple-300">
                <span>Laser Upgrades</span>
                <span className="text-slate-600">•</span>
                <span>Alien Swarms</span>
                <span className="text-slate-600">•</span>
                <span>Smart Bombs</span>
              </div>
            </div>
          </div>

          {/* Card Body & Actions */}
          <div className="p-4 sm:p-5 space-y-3 bg-slate-900/95">
            {/* User Stats Snapshot if logged in */}
            {user && (
              <div className="flex items-center justify-between text-xs bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Your High Score:</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {(user.stats?.spaceHighScore ?? 0).toLocaleString()} Pts
                </span>
              </div>
            )}

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
        {/* GAME CARD 3: APEX CITY 3D: UNDERGROUND                       */}
        {/* ============================================================ */}
        <div className="group relative rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-amber-500/60 overflow-hidden shadow-2xl transition-all duration-200">
          {/* Visual Poster Banner */}
          <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex flex-col justify-end p-4 sm:p-5">
            {/* Ambient City Neon Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#7c3aed_0%,transparent_60%)] opacity-35" />
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />

            {/* Poster Badges */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                <span>3D OPEN WORLD</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-amber-400 font-black text-[10px] tracking-wider uppercase">
                60 FPS THREE.JS
              </span>
            </div>

            {/* Poster Center Graphic Art */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shadow-inner text-4xl">
                🏙️
              </div>
            </div>

            {/* Game Title & Tags on Poster */}
            <div className="relative z-10 space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                Apex City 3D
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-amber-300">
                <span>Arcade Sports Cars</span>
                <span className="text-slate-600">•</span>
                <span>5-Star Police Chases</span>
                <span className="text-slate-600">•</span>
                <span>Missions & Cash</span>
              </div>
            </div>
          </div>

          {/* Card Body & Actions */}
          <div className="p-4 sm:p-5 space-y-3 bg-slate-900/95">
            {/* Tag Badges */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">GTA-INSPIRED</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300">3RD PERSON CAMERA</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-purple-300">SYNDICATE SHOOTOUTS</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300">RADAR MINIMAP</span>
            </div>

            {/* Tap To Play Button */}
            <button
              onClick={() => handlePlayGame('apex')}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>ENTER APEX CITY (3D)</span>
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
