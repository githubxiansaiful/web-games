'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  Trophy,
  Star,
  Coins,
  Flame,
  Rocket,
  Zap,
  Settings,
  Key,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Gamepad2,
  Calendar,
  Volume2,
  VolumeX,
  Award,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/ui/UserAvatar';

const AVATAR_PRESETS = [
  '🎮', '🚀', '⚡', '👑', '👾', '🦊', '🤖', '🐱', '🐯', '🐉', '🎯', '🔥', '🕹️', '🌟', '💀', '👽', '🛡️', '⚔️'
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAdmin, updateProfile, deleteAccount, logout, openAuthModal } = useAuth();

  // Active tab inside profile: 'general' | 'security' | 'stats' | 'danger'
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'stats' | 'danger'>('general');

  // Form states
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Audio preference (stored in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Status & notifications
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form fields when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '🎮');
    }
  }, [user]);

  // Load sound setting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSound = localStorage.getItem('xian_sound_enabled');
      if (savedSound !== null) {
        setSoundEnabled(savedSound === 'true');
      }
    }
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('xian_sound_enabled', String(nextVal));
    }
  };

  // Determine player rank / title
  const getPlayerRank = () => {
    const stars = user?.stats?.runnerStars ?? 0;
    const spaceScore = user?.stats?.spaceHighScore ?? 0;
    if (stars >= 9 && spaceScore >= 20000) return { title: 'Neon Legend', color: 'from-amber-400 to-rose-500', badge: 'LEGEND' };
    if (stars >= 6 || spaceScore >= 10000) return { title: 'Cyber Veteran', color: 'from-purple-400 to-indigo-500', badge: 'VETERAN' };
    if (stars >= 3 || spaceScore >= 3000) return { title: 'Arcade Runner', color: 'from-cyan-400 to-blue-500', badge: 'RUNNER' };
    return { title: 'Rookie Challenger', color: 'from-slate-400 to-slate-200', badge: 'ROOKIE' };
  };

  // Handle saving general profile updates
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSaving(true);

    if (!name.trim()) {
      setStatusMsg({ type: 'error', text: 'Player name cannot be blank.' });
      setIsSaving(false);
      return;
    }

    const res = await updateProfile({ name: name.trim(), avatar });
    setIsSaving(false);

    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setStatusMsg(null), 4000);
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  // Handle password update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsSaving(true);
    const res = await updateProfile({ currentPassword, newPassword });
    setIsSaving(false);

    if (res.success) {
      setStatusMsg({
        type: 'success',
        text: 'Password changed successfully! A security notice was sent to your email via Gmail SMTP.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatusMsg(null), 5000);
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Failed to update password.' });
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    setStatusMsg(null);

    const res = await deleteAccount();
    setIsDeleting(false);

    if (res.success) {
      router.push('/');
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Could not delete account.' });
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Player Profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <UserIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black mb-1">Player Profile</h2>
          <p className="text-xs text-slate-400 mb-6">
            Sign in to view your high scores, update your player avatar, change security credentials, and manage your account.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl font-bold text-sm text-white shadow-lg transition active:scale-98 cursor-pointer mb-3"
          >
            Sign In to Profile
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Xian&apos;s Game World</span>
          </Link>
        </div>
      </div>
    );
  }

  const rank = getPlayerRank();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white leading-none">PLAYER PROFILE</h1>
              <span className="text-[10px] text-slate-400">Manage your identity and arcade progression</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 transition shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Portal</span>
            </Link>
          )}
          <button
            onClick={logout}
            className="p-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-700/80 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 rounded-xl transition cursor-pointer"
            title="Sign Out"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Status Notification */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg animate-in fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-500/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs">
              {statusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* HERO PLAYER BANNER CARD */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Cyber Glow Accents */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
            {/* Large Avatar */}
            <div className="relative group">
              <div className="p-1 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 shadow-xl">
                <UserAvatar avatar={user.avatar} name={user.name} size="xl" />
              </div>
              <button
                onClick={() => setActiveTab('general')}
                className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-indigo-300 hover:text-white shadow-md transition cursor-pointer"
                title="Change Avatar"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User Meta */}
            <div className="text-center sm:text-left flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{user.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r ${rank.color} text-slate-950 shadow-sm`}
                >
                  {rank.title}
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    SUPER ADMIN
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user.email}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Action / Sound Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleSound}
                className="px-3 py-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 transition cursor-pointer"
                title="Toggle Web Arcade Audio"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Sound: ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span>Sound: OFF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Runner Stars</div>
                <div className="text-base font-black text-white">{user.stats?.runnerStars ?? 0} / 9</div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Arcade Coins</div>
                <div className="text-base font-black text-white">{user.stats?.coinsTotal ?? 0}</div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Space Best</div>
                <div className="text-base font-black text-white">{(user.stats?.spaceHighScore ?? 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Runner Best</div>
                <div className="text-base font-black text-white">
                  {user.stats?.runnerBestTime ? `${user.stats.runnerBestTime}s` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TABS NAVIGATION */}
        <div className="flex bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Identity & Avatar</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Game Records</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'danger'
                ? 'bg-rose-900/80 text-rose-200 shadow-md'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* 4. TAB CONTENTS */}

        {/* TAB 1: IDENTITY & AVATAR */}
        {activeTab === 'general' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Player Identity & Customization</h3>
              <p className="text-xs text-slate-400">
                Update how your name and avatar appear in multiplayer rooms and global Hall of Fame leaderboards.
              </p>
            </div>

            <form onSubmit={handleSaveGeneral} className="space-y-6">
              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Player Display Name</label>
                <div className="relative max-w-md">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={30}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-500">Max 30 characters. Visible to all players in races.</span>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Registered Email</label>
                <div className="relative max-w-md">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full bg-slate-850/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  Email is your unique identifier. Protected against change for security.
                </span>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-300">Player Avatar</label>

                {/* Preset Avatars */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Preset Emotes:</span>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAvatar(p)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition cursor-pointer ${
                          avatar === p
                            ? 'bg-indigo-600 border-2 border-cyan-400 shadow-md scale-110'
                            : 'bg-slate-800 hover:bg-slate-750 border border-slate-700/80'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Avatar URL */}
                <div className="space-y-1.5 max-w-md pt-2">
                  <span className="text-[11px] text-slate-400 font-medium">Or enter custom Image URL / Google Photo:</span>
                  <input
                    type="url"
                    value={avatar.startsWith('http') ? avatar : ''}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/my-avatar.jpg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                  <span className="text-[10px] text-slate-500">
                    Supports Google account photos, Gravatar, and direct image links.
                  </span>
                </div>

                {/* Avatar Preview */}
                <div className="flex items-center gap-3 p-3 bg-slate-850 rounded-2xl border border-slate-800 max-w-md">
                  <UserAvatar avatar={avatar} name={name} size="lg" />
                  <div>
                    <div className="text-xs font-bold text-white">Avatar Preview</div>
                    <div className="text-[10px] text-slate-400">This is how other runners will see you.</div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: GAME RECORDS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">Arcade Records & Progression</h3>
                <p className="text-xs text-slate-400">
                  Track your race times, star counts, coins, and high scores across all 3 games.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cyber Runner Royale Card */}
                <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-xl">
                        🏃‍♂️
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Cyber Runner Royale</h4>
                        <span className="text-[10px] text-indigo-400 font-semibold uppercase">Parkour Speedrunner</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-black rounded-full border border-indigo-500/40">
                      ★ {user.stats?.runnerStars ?? 0} / 9
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Total Races Finished:</span>
                      <span className="font-bold text-white">{user.stats?.runnerGames ?? 0}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">All-Time Best Speedrun Time:</span>
                      <span className="font-bold text-emerald-400">
                        {user.stats?.runnerBestTime ? `${user.stats.runnerBestTime}s` : 'No runs completed'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Arcade Coins Earned:</span>
                      <span className="font-bold text-amber-400">🪙 {user.stats?.coinsTotal ?? 0}</span>
                    </div>
                  </div>

                  <Link
                    href="/?game=runner"
                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Play Runner Royale</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Neon Space Survivor Card */}
                <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-xl">
                        🚀
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Neon Space Survivor</h4>
                        <span className="text-[10px] text-cyan-400 font-semibold uppercase">Arcade Space Shooter</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-black rounded-full border border-cyan-500/40">
                      SCORE
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Total Missions Launched:</span>
                      <span className="font-bold text-white">{user.stats?.spaceGames ?? 0}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Personal High Score:</span>
                      <span className="font-bold text-cyan-400 font-mono">
                        {(user.stats?.spaceHighScore ?? 0).toLocaleString()} Pts
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Verified Hall of Fame:</span>
                      <span className="font-bold text-purple-300">
                        {user.stats?.spaceHighScore && user.stats.spaceHighScore > 0 ? 'Ranked' : 'Unranked'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/?game=space"
                    className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Launch Space Survivor</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Apex City 3D Card */}
                <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
                        🏙️
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Apex City 3D</h4>
                        <span className="text-[10px] text-amber-400 font-semibold uppercase">3D Open-World Driving</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-amber-950 text-amber-300 text-[10px] font-black rounded-full border border-amber-500/40">
                      NEW 3D
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Environment:</span>
                      <span className="font-bold text-white">4km Open World</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Vehicle:</span>
                      <span className="font-bold text-amber-400">2026 Lamborghini</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Features:</span>
                      <span className="font-bold text-cyan-400">CAD Roads & 3D Cam</span>
                    </div>
                  </div>

                  <Link
                    href="/?game=apex"
                    className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Play Apex City 3D</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Account Security & Credentials</h3>
              <p className="text-xs text-slate-400">
                Update your login password. Passwords are encrypted with salted PBKDF2 SHA-512.
              </p>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Current Password (if set)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  Leave blank if you initially created your account using Google OAuth.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">New Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl text-[11px] text-indigo-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                <span>
                  When you change your password, an email notification will be automatically dispatched via Google Gmail SMTP to <strong>{user.email}</strong>.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: DANGER ZONE */}
        {activeTab === 'danger' && (
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-black text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span>Danger Zone</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Irreversible account management actions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-3">
              <h4 className="text-sm font-bold text-white">Delete Player Account</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permanently deletes your player profile, resets your high scores, cleans your session cookies, and removes your records from the database. A confirmation email will be sent via SMTP.
              </p>

              {user.email === 'xiansaiful@gmail.com' ? (
                <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-amber-200 text-xs">
                  👑 Super Administrator account cannot be deleted.
                </div>
              ) : (
                <>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                    >
                      Delete My Account
                    </button>
                  ) : (
                    <div className="p-4 bg-rose-950/90 border border-rose-500 rounded-2xl space-y-3 max-w-md">
                      <div className="text-xs font-bold text-rose-200">
                        Are you absolutely sure you want to delete your account ({user.email})?
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Yes, Permanently Delete'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
