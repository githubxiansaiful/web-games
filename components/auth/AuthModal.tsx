'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, LogIn, UserPlus, Sparkles, CheckCircle, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalView, openAuthModal, closeAuthModal, login, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    if (authModalView === 'login') {
      const res = await login(email, password);
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Failed to sign in');
      }
    } else if (authModalView === 'register') {
      if (!name.trim()) {
        setError('Please provide your name');
        setIsSubmitting(false);
        return;
      }
      const res = await register(name, email, password);
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Registration failed');
      } else {
        setSuccessMsg('🎉 Account created! Welcome email dispatched to your inbox via Google SMTP.');
      }
    } else if (authModalView === 'forgot') {
      // Trigger password reset request
      try {
        const res = await fetch('/api/admin/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email }),
        });
        setIsSubmitting(false);
        if (res.ok) {
          setSuccessMsg('Reset instructions and verification test email sent to ' + email);
        } else {
          setError('Could not dispatch reset email. Please try again.');
        }
      } catch {
        setIsSubmitting(false);
        setError('Network error');
      }
    }
  };

  const handleGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    if (clientId) {
      let redirectUri = `${window.location.origin}/api/auth/callback/google`;
      // Google OAuth strictly forbids 0.0.0.0; normalize to localhost
      if (window.location.hostname === '0.0.0.0' || window.location.hostname === '127.0.0.1') {
        const port = window.location.port ? `:${window.location.port}` : '';
        redirectUri = `http://localhost${port}/api/auth/callback/google`;
      }

      const state = encodeURIComponent(JSON.stringify({ redirectUri, from: window.location.origin }));
      const scope = 'openid email profile';
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&prompt=select_account`;
      window.location.href = url;
      return;
    }

    setError('Google Sign-In requires NEXT_PUBLIC_GOOGLE_CLIENT_ID. Please configure it in your Google Cloud Console project.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-indigo-500/40 rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl text-white relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>XIAN&apos;S GAME WORLD</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {authModalView === 'login' && 'Welcome Back!'}
            {authModalView === 'register' && 'Create Player Profile'}
            {authModalView === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {authModalView === 'login' && 'Sign in to access games, save stars, and join multiplayer races.'}
            {authModalView === 'register' && 'Sign up for instant access. Welcome email sent via Gmail SMTP!'}
            {authModalView === 'forgot' && 'Enter your email address to receive password instructions.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        {authModalView !== 'forgot' && (
          <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-5 border border-slate-700/60">
            <button
              onClick={() => {
                openAuthModal('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                authModalView === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => {
                openAuthModal('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                authModalView === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>
        )}

        {/* Error / Success Banners */}
        {error && (
          <div className="mb-4 p-3 bg-rose-950/70 border border-rose-500/60 rounded-xl text-rose-200 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {authModalView === 'login' && error.toLowerCase().includes('register') && (
              <button
                type="button"
                onClick={() => {
                  openAuthModal('register');
                  setError(null);
                }}
                className="self-start inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer mt-0.5"
              >
                👉 Click here to switch to Register & create this account
              </button>
            )}
            {authModalView === 'register' && error.toLowerCase().includes('sign in') && (
              <button
                type="button"
                onClick={() => {
                  openAuthModal('login');
                  setError(null);
                }}
                className="self-start inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 underline cursor-pointer mt-0.5"
              >
                👉 Click here to switch to Sign In & log in
              </button>
            )}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalView === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Player Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CyberHero99"
                  className="w-full bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition"
              />
            </div>
          </div>

          {authModalView !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {authModalView === 'login' && (
                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {authModalView === 'login' && <LogIn className="w-4 h-4" />}
                {authModalView === 'register' && <UserPlus className="w-4 h-4" />}
                <span>
                  {authModalView === 'login' && 'Sign In to Play'}
                  {authModalView === 'register' && 'Create Account & Send Email'}
                  {authModalView === 'forgot' && 'Send Reset Email'}
                </span>
              </>
            )}
          </button>

          {authModalView === 'login' && (
            <div className="mt-2.5 text-center text-xs text-slate-400">
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  openAuthModal('register');
                  setError(null);
                }}
                className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer"
              >
                Register now
              </button>
            </div>
          )}

          {authModalView === 'register' && (
            <div className="mt-2.5 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  openAuthModal('login');
                  setError(null);
                }}
                className="text-cyan-300 hover:text-cyan-200 font-bold underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </form>

        {/* Divider */}
        {authModalView !== 'forgot' && (
          <>
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-800" />
              <span className="px-3 text-[11px] text-slate-500 font-medium uppercase">Or continue with</span>
              <div className="flex-1 border-t border-slate-800" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

        {authModalView === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => openAuthModal('login')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
