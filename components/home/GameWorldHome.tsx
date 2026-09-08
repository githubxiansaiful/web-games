'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Trophy,
  Users,
  Play,
  Shield,
  Sparkles,
  Zap,
  LogIn,
  LogOut,
  ChevronRight,
  Flame,
  Star,
  Coins,
  Rocket,
  ArrowUpRight,
  UserCheck,
  User as UserIcon,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GameCanvas } from '@/components/GameCanvas';
import { SpaceGameCanvas } from '@/components/space-game/SpaceGameCanvas';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserAvatar } from '@/components/ui/UserAvatar';

export const GameWorldHome: React.FC = () => {
  const { user, isAdmin, logout, openAuthModal } = useAuth();

  // Active game view: null (showcase home), 'runner' (Game 1), 'space' (Game 2)
  const [activeGame, setActiveGame] = useState<'runner' | 'space' | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ topSpace: any[]; topRunner: any[] }>({ topSpace: [], topRunner: [] });
  const [authBannerError, setAuthBannerError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Auto-normalize from 0.0.0.0 to localhost for seamless OAuth compatibility
      if (window.location.hostname === '0.0.0.0') {
        const port = window.location.port ? `:${window.location.port}` : '';
        window.location.replace(`http://localhost${port}${window.location.pathname}${window.location.search}`);
        return;
      }

      // 2. Check for OAuth callback errors in URL
      const params = new URLSearchParams(window.location.search);
      const authErr = params.get('auth_error');
      if (authErr) {
        setAuthBannerError(authErr);
        // Clear param from address bar without reloading
        window.history.replaceState({}, '', window.location.pathname);
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

  const handlePlayGame = (gameKey: 'runner' | 'space') => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setActiveGame(gameKey);
  };

  // If Game 1 is active
  if (activeGame === 'runner') {
    return (
      <div className="relative w-full h-screen bg-slate-950">
        <GameCanvas />
        {/* Quick exit bar at top */}
        <button
          onClick={() => setActiveGame(null)}
          className="absolute top-3 left-3 z-40 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-xl transition cursor-pointer"
        >
          <span>← Xian&apos;s Game World</span>
        </button>
      </div>
    );
  }

  // If Game 2 is active
  if (activeGame === 'space') {
    return (
      <div className="relative w-full h-screen bg-slate-950">
        <SpaceGameCanvas onGoHome={() => setActiveGame(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg tracking-wider text-white leading-none flex items-center gap-1.5">
              <span>XIAN&apos;S GAME WORLD</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">
              ARCADE & MULTIPLAYER HUB
            </span>
          </div>
        </div>

        {/* Right Nav Auth & Admin Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Player Profile Capsule (Links to /profile) */}
              <Link
                href="/profile"
                className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-indigo-500/60 rounded-2xl px-3 py-1.5 text-xs shadow-md transition group cursor-pointer"
                title="Manage Player Profile & Game Stats"
              >
                <UserAvatar avatar={user.avatar} name={user.name} size="sm" />
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-white group-hover:text-indigo-300 transition leading-none">{user.name}</div>
                  <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                    <span>★ {user.stats?.runnerStars ?? 0}</span>
                    <span className="text-slate-500">•</span>
                    <span>🪙 {user.stats?.coinsTotal ?? 0}</span>
                  </div>
                </div>
              </Link>

              {/* Direct Profile Link Button (Mobile / Desktop) */}
              <Link
                href="/profile"
                className="p-2 bg-slate-900 hover:bg-indigo-950/70 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                title="Player Profile & Settings"
              >
                <UserIcon className="w-4 h-4" />
              </Link>

              {/* Admin Portal Button (for Admins) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 transition shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin Portal</span>
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/60 rounded-xl text-slate-400 hover:text-rose-300 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Auth Error Notification Banner (if any) */}
      {authBannerError && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 flex items-center justify-between gap-4 shadow-xl backdrop-blur-md animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Google Sign-In Alert</h4>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  {authBannerError.includes('0.0.0.0') || authBannerError === 'token_failed' || authBannerError.includes('invalid_request')
                    ? 'Google OAuth security policy does not allow 0.0.0.0. Please access the game via http://localhost:3000.'
                    : `Authentication notice: ${authBannerError}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAuthBannerError(null)}
              className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative px-4 sm:px-8 py-12 sm:py-16 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold mb-4 shadow-md">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>XIAN&apos;S NEXT-GEN WEB GAMING ARCADE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-cyan-300 leading-none mb-4">
          XIAN&apos;S GAME WORLD
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Welcome to the cyber gaming playground! Experience fast-paced multiplayer parkour racing and intense arcade retro space shooting. Instant browser play, cloud progression, and zero installations required.
        </p>

        {/* Live Features Bar */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs font-semibold text-slate-300 mb-4">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>2 Epic Games Live</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Multiplayer Rooms</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Google SMTP Notifications</span>
          </div>
        </div>
      </section>

      {/* 3. GAMES SHOWCASE SECTION */}
      <section className="px-4 sm:px-8 py-8 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>FEATURED ARCADE GAMES</span>
              <span className="text-xs bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                2 TITLES
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a game below to launch directly in your browser.</p>
          </div>
        </div>

        {/* The 2 Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ========================================================= */}
          {/* GAME 1 CARD: CYBER RUNNER ROYALE                          */}
          {/* ========================================================= */}
          <div className="group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/70 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            {/* Top Accent Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600" />

            <div>
              {/* Game Badge & Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-950/90 border border-indigo-500/50 flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition">
                  🏃‍♂️
                </div>
                <div className="flex gap-1.5">
                  <span className="px-2.5 py-1 bg-indigo-950 border border-indigo-500/50 text-indigo-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                    MULTIPLAYER ROOMS
                  </span>
                  <span className="px-2.5 py-1 bg-amber-950 border border-amber-500/50 text-amber-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                    POPULAR
                  </span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-300 transition mb-1">
                Cyber Runner Royale
              </h3>
              <p className="text-xs font-semibold text-cyan-400 mb-3">
                High-Speed Sci-Fi Parkour & Real-Time Multiplayer Racing
              </p>

              <p className="text-xs text-slate-400 leading-relaxed mb-5">
                Dash, spring-jump, and double-jump across 3 distinct neon cyberpunk stages. Speedrun solo with gold par times, or create a room and battle friends in 4-player real-time live racing with live rankings and podium ceremonies!
              </p>

              {/* Game Features Checklist */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 mb-6 bg-slate-850/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>3 Unique Stages</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>Real-time Multiplayer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>Mobile Touch Controls</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>60 FPS Optimized Engine</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => handlePlayGame('runner')}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Runner Royale</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* GAME 2 CARD: NEON SPACE SURVIVOR                          */}
          {/* ========================================================= */}
          <div className="group bg-slate-900/90 border border-slate-800 hover:border-cyan-500/70 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            {/* Top Accent Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-600" />

            <div>
              {/* Game Badge & Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition">
                  🚀
                </div>
                <div className="flex gap-1.5">
                  <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                    ARCADE ACTION
                  </span>
                  <span className="px-2.5 py-1 bg-purple-950 border border-purple-500/50 text-purple-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                    NEW RELEASE
                  </span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-cyan-300 transition mb-1">
                Neon Space Survivor
              </h3>
              <p className="text-xs font-semibold text-purple-400 mb-3">
                Retro Neon Starfighter Battles, Alien Swarms & Boss Raids
              </p>

              <p className="text-xs text-slate-400 leading-relaxed mb-5">
                Pilot your neon starfighter across endless cosmic sectors. Upgrade to triple-plasma lasers, trigger screen-shattering smart bombs, dodge tumbling asteroid storms, and take down massive alien dreadnought motherships!
              </p>

              {/* Game Features Checklist */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 mb-6 bg-slate-850/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span>
                  <span>Laser Weapon Upgrades</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span>
                  <span>Epic Mothership Bosses</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span>
                  <span>Smart Bombs & Shields</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span>
                  <span>Retro Web Audio Synth</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => handlePlayGame('space')}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
              >
                <Rocket className="w-4 h-4" />
                <span>Launch Space Survivor</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HALL OF FAME LEADERBOARDS */}
      <section className="px-4 sm:px-8 py-10 max-w-6xl mx-auto w-full">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">ARCADE HALL OF FAME</h3>
                <span className="text-xs text-slate-400">Live verified player rankings on Xian&apos;s Game World</span>
              </div>
            </div>
          </div>

          {leaderboard.topSpace.length === 0 && leaderboard.topRunner.length === 0 ? (
            <div className="bg-slate-850/60 p-6 rounded-2xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-1">No community records set yet.</p>
              <p className="text-xs font-bold text-indigo-300">Play any game above to claim your spot on the Hall of Fame!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {leaderboard.topSpace.map((item, idx) => (
                <div key={item.id} className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div className="text-xl shrink-0">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                  <UserAvatar avatar={item.avatar} name={item.name} size="md" fallbackEmoji="🚀" />
                  <div className="overflow-hidden">
                    <div className="font-bold text-white text-xs sm:text-sm truncate">{item.name}</div>
                    <div className="text-[11px] text-cyan-400 font-mono">{item.score.toLocaleString()} Pts in Space Survivor</div>
                  </div>
                </div>
              ))}
              {leaderboard.topRunner.map((item) => (
                <div key={item.id} className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div className="text-xl shrink-0">⚡</div>
                  <UserAvatar avatar={item.avatar} name={item.name} size="md" fallbackEmoji="🏃‍♂️" />
                  <div className="overflow-hidden">
                    <div className="font-bold text-white text-xs sm:text-sm truncate">{item.name}</div>
                    <div className="text-[11px] text-emerald-400 font-mono">★ {item.stars} Stars in Runner Royale</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-850 py-8 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Gamepad2 className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">Xian&apos;s Game World</span>
            <span>•</span>
            <span>2 Epic Web Games</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/admin" className="hover:text-indigo-400 transition flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Portal</span>
            </Link>
            <span>•</span>
            <span className="text-emerald-500 font-mono">Gmail SMTP (Online)</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
};
