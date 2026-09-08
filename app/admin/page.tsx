'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Users,
  Mail,
  Gamepad2,
  Settings,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Key,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  ArrowLeft,
  Eye,
  LogOut,
  Sparkles,
  Award,
  Play,
} from 'lucide-react';
import { useAuth, AuthUser } from '@/context/AuthContext';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: string;
  htmlPreview?: string;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalGamesPlayed: number;
  emailsSent: number;
  emailsFailed: number;
  totalGames: number;
  smtpServer: string;
  smtpUser: string;
  smtpStatus: string;
}

export default function AdminPage() {
  const { user, isLoading: isAuthLoading, isAdmin, login, logout, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'emails' | 'games' | 'settings'>('dashboard');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<AuthUser[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [gamesList, setGamesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state for Users
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Test Email State
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [addUserMsg, setAddUserMsg] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);

  // Email Preview Modal
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<EmailLog | null>(null);

  // Direct Admin Login Form state for unauthorized users
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, emailsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/emails'),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
        if (d.games) setGamesList(d.games);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsersList(d.users);
      }
      if (emailsRes.ok) {
        const d = await emailsRes.json();
        setEmailLogs(d.logs);
      }
    } catch (e) {
      console.warn('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, fetchAdminData]);

  // Handle direct admin login
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsAdminLoggingIn(true);
    const res = await login(adminEmail, adminPass);
    setIsAdminLoggingIn(false);
    if (!res.success) {
      setAdminLoginError(res.error || 'Failed to authenticate admin');
    }
  };

  // Handle Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailTo) return;
    setTestEmailStatus({ loading: true });
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmailTo }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestEmailStatus({ loading: false, success: true, message: data.message });
        fetchAdminData();
      } else {
        setTestEmailStatus({ loading: false, success: false, message: data.error || 'Failed to send test email' });
      }
    } catch (e: any) {
      setTestEmailStatus({ loading: false, success: false, message: e?.message || 'Network error' });
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddUserMsg('User created! Welcome email dispatched via SMTP.');
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchAdminData();
        setTimeout(() => {
          setIsAddUserOpen(false);
          setAddUserMsg(null);
        }, 1500);
      } else {
        setAddUserMsg(`Error: ${data.error || 'Could not create user'}`);
      }
    } catch {
      setAddUserMsg('Network error while creating user');
    }
  };

  // Helper to check if a user is the primary super admin
  const isTargetSuperAdmin = (u: AuthUser) => {
    return u.id === 'usr_admin_xian' || u.id === 'usr_admin_initial' || u.email.toLowerCase() === 'xiansaiful@gmail.com';
  };

  // Handle Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.id === user?.id) {
      if (editingUser.status !== 'active') {
        alert('Security Violation: You cannot suspend your own administrator account!');
        return;
      }
      if (editingUser.role !== 'admin') {
        alert('Security Violation: You cannot demote your own administrator role!');
        return;
      }
    }

    if (isTargetSuperAdmin(editingUser)) {
      if (editingUser.status !== 'active') {
        alert('Protected Account: The primary Super Admin account cannot be suspended!');
        return;
      }
      if (editingUser.role !== 'admin') {
        alert('Protected Account: The primary Super Admin role cannot be revoked!');
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          role: editingUser.role,
          status: editingUser.status,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingUser(null);
        fetchAdminData();
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch {
      alert('Network error while saving user');
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (u: AuthUser) => {
    if (isTargetSuperAdmin(u) && u.id !== user?.id) {
      alert('Protected Account: Only the Super Admin themselves can reset their password.');
      return;
    }

    if (!confirm(`Are you sure you want to reset password for ${u.email}? A temporary password and notification email will be dispatched via Google SMTP.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${u.id}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Password reset successfully!\nTemporary Password: ${data.temporaryPassword}\nNotification email dispatched to ${u.email}`);
        fetchAdminData();
      } else {
        alert(`Failed to reset password: ${data.error}`);
      }
    } catch {
      alert('Network error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (u: AuthUser) => {
    if (u.id === user?.id) {
      alert('Security Violation: You cannot delete your own account from the admin dashboard!');
      return;
    }
    if (isTargetSuperAdmin(u)) {
      alert('Protected Account: Super admin account cannot be deleted!');
      return;
    }
    if (!confirm(`WARNING: Are you sure you want to permanently delete user ${u.name} (${u.email})? A deletion confirmation email will be sent via SMTP.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete user');
      }
    } catch {
      alert('Network error');
    }
  };

  // ----------------------------------------------------
  // Unauthorized Screen for Non-Admin Users
  // ----------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Verifying Admin Session...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black mb-1 text-white">ADMIN PORTAL</h1>
          <p className="text-xs text-slate-400 mb-6">
            Access restricted to verified administrators of Xian&apos;s Game World.
          </p>

          {adminLoginError && (
            <div className="mb-4 p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-rose-200 text-xs text-left flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{adminLoginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5 text-left mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Password</label>
              <input
                type="password"
                required
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isAdminLoggingIn}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isAdminLoggingIn ? 'Authenticating...' : 'Sign In as Super Admin'}
            </button>
          </form>

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

  // Filter users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition"
            title="Return to Game World"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-600/40">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-wide text-white leading-none">
                XIAN&apos;S GAME WORLD
              </h1>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                ADMINISTRATION PORTAL
              </span>
            </div>
          </div>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-slate-850 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
            <UserAvatar avatar={user?.avatar} name={user?.name} size="xs" fallbackEmoji="👑" />
            <span className="font-semibold text-slate-200">{user?.email}</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">
              SUPER ADMIN
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-700/60 text-rose-300 rounded-xl transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800/80 p-3 sm:p-4 shrink-0">
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users ({usersList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'emails'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email Logs ({emailLogs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'games'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Games Showcase</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>SMTP & System</span>
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">Platform Dashboard</h2>
                <p className="text-xs text-slate-400">Live metrics across Xian&apos;s Game World arcade platform.</p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Total Players</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{stats?.totalUsers ?? usersList.length}</div>
                  <span className="text-[11px] text-emerald-400 font-medium">● {stats?.activeUsers ?? usersList.length} Active Accounts</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Games Played</span>
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{stats?.totalGamesPlayed ?? 2400}</div>
                  <span className="text-[11px] text-cyan-400 font-medium">Across 2 Featured Games</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Emails Dispatched</span>
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{stats?.emailsSent ?? emailLogs.length}</div>
                  <span className="text-[11px] text-emerald-400 font-medium">via smtp.gmail.com (SSL)</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">SMTP Status</span>
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-lg font-black text-emerald-400">ONLINE</div>
                  <span className="text-[11px] text-slate-400 truncate block">sharedxian@gmail.com</span>
                </div>
              </div>

              {/* Quick Test Email Card */}
              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Quick Google SMTP Verification</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Send a live test notification email from <code className="text-indigo-300">sharedxian@gmail.com</code> to verify real-time email delivery.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                  <input
                    type="email"
                    placeholder="Enter destination email..."
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleSendTestEmail}
                    disabled={testEmailStatus?.loading || !testEmailTo}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testEmailStatus?.loading ? 'Sending...' : 'Send Test'}</span>
                  </button>
                </div>
                {testEmailStatus?.message && (
                  <div className={`mt-2 text-xs font-semibold ${testEmailStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {testEmailStatus.message}
                  </div>
                )}
              </div>

              {/* Recent Users Table preview */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Recent Players</h3>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    View All Users →
                  </button>
                </div>
                <div className="divide-y divide-slate-800">
                  {usersList.slice(0, 4).map((u) => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar avatar={u.avatar} name={u.name} size="md" />
                        <div>
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">User Accounts</h2>
                  <p className="text-xs text-slate-400">Manage players, roles, status, passwords, and deletions.</p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="user">Users</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Player</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Runner Stars</th>
                        <th className="p-3">Space Best</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {filteredUsers.map((u) => {
                        const isSelf = u.id === user?.id;
                        const isSuper = isTargetSuperAdmin(u);

                        return (
                          <tr key={u.id} className="hover:bg-slate-850/50 transition">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <UserAvatar avatar={u.avatar} name={u.name} size="sm" />
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white">{u.name}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded text-[9px] font-black uppercase">
                                      YOU
                                    </span>
                                  )}
                                  {isSuper && (
                                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-black uppercase">
                                      👑 Super Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-slate-300 font-mono text-[11px]">{u.email}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="p-3 text-amber-400 font-bold">★ {u.stats?.runnerStars ?? 0}</td>
                            <td className="p-3 text-cyan-400 font-mono">{(u.stats?.spaceHighScore ?? 0).toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingUser(u)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                                  title="Edit User Profile"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {(!isSuper || isSelf) && (
                                  <button
                                    onClick={() => handleResetPassword(u)}
                                    className="p-1.5 bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-400 rounded-lg transition cursor-pointer"
                                    title="Reset Password & Send Email"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {!isSelf && !isSuper && (
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 rounded-lg transition cursor-pointer"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL LOGS */}
          {activeTab === 'emails' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Google SMTP Email Logs</h2>
                  <p className="text-xs text-slate-400">All notifications dispatched via smtp.gmail.com (SSL Encrypted).</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sender: <strong className="text-white">sharedxian@gmail.com</strong></span>
                </div>
              </div>

              {/* Email logs table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Status</th>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Template</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3 text-right">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {emailLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            No emails recorded yet. Trigger an email above or register a new user!
                          </td>
                        </tr>
                      ) : (
                        emailLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-850/50 transition">
                            <td className="p-3">
                              {log.status === 'sent' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Sent</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-400 font-bold" title={log.error}>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Failed</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-200 font-mono text-[11px]">{log.to}</td>
                            <td className="p-3 font-semibold text-white truncate max-w-[200px]">{log.subject}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                {log.template}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {new Date(log.sentAt).toLocaleString()}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedEmailPreview(log)}
                                className="p-1.5 bg-slate-800 hover:bg-indigo-950 text-slate-300 hover:text-indigo-400 rounded-lg transition cursor-pointer"
                                title="View Email Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GAMES SHOWCASE MANAGER */}
          {activeTab === 'games' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-white">Featured Games Manager</h2>
                <p className="text-xs text-slate-400">Manage active arcade games on Xian&apos;s Game World.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gamesList.map((g) => (
                  <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{g.icon || '🎮'}</span>
                        <div>
                          <h3 className="font-black text-base text-white">{g.title}</h3>
                          <span className="text-xs text-indigo-400 font-semibold">{g.genre}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 bg-indigo-950 border border-indigo-500/50 text-indigo-300 text-[10px] font-black rounded-full">
                        {g.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                      {g.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-300 pt-3 border-t border-slate-800">
                      <div>Plays: <strong className="text-white">{g.playCount}</strong></div>
                      <div>Rating: <strong className="text-amber-400">★ {g.rating}</strong></div>
                      <div>Mode: <strong className="text-cyan-400">{g.multiplayer ? 'Multiplayer Rooms' : 'Single Arcade'}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS & SMTP */}
          {activeTab === 'settings' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h2 className="text-xl font-black text-white">System & SMTP Configuration</h2>
                <p className="text-xs text-slate-400">Configured live services and notification routing.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>Google Gmail SMTP Server</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-850 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">SMTP Server Host</span>
                    <span className="font-mono font-bold text-white">smtp.gmail.com</span>
                  </div>
                  <div className="bg-slate-850 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">Port / Encryption</span>
                    <span className="font-mono font-bold text-white">465 (SSL / TLS Secure)</span>
                  </div>
                  <div className="bg-slate-850 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">Authenticated Username</span>
                    <span className="font-mono font-bold text-indigo-300">sharedxian@gmail.com</span>
                  </div>
                  <div className="bg-slate-850 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">Google App Password</span>
                    <span className="font-mono font-bold text-emerald-400">•••• •••• •••• •••• (Active)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  <span>Multiplayer Socket Server</span>
                </h3>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-700/60 text-xs">
                  <span className="text-slate-400 block text-[11px]">Socket Relay Cluster</span>
                  <span className="font-mono font-bold text-cyan-300">https://runner-royale-socket.onrender.com</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl">
            <h3 className="text-lg font-black mb-1">Add New Player / Admin</h3>
            <p className="text-xs text-slate-400 mb-4">A welcome email will be automatically sent via SMTP.</p>

            {addUserMsg && (
              <div className="mb-3 p-2.5 bg-indigo-950 border border-indigo-500 rounded-xl text-xs text-indigo-200">
                {addUserMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="user">User (Player)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white cursor-pointer"
                >
                  Create & Send Email
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (() => {
        const isSelfEdit = editingUser.id === user?.id;
        const isSuperEdit = isTargetSuperAdmin(editingUser);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-black text-white">Edit User Profile</h3>
                {isSuperEdit && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-black uppercase">
                    👑 Super Admin
                  </span>
                )}
                {isSelfEdit && !isSuperEdit && (
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded text-[10px] font-black uppercase">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-4">{editingUser.email}</p>

              {isSelfEdit && (
                <div className="mb-3 p-2.5 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-[11px] text-indigo-200">
                  🛡️ You are editing your own administrator account. You cannot suspend or demote yourself.
                </div>
              )}

              {isSuperEdit && !isSelfEdit && (
                <div className="mb-3 p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-[11px] text-amber-200">
                  👑 Super Admin account privileges and active status are immutable.
                </div>
              )}

              <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Player Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Role</label>
                  {isSelfEdit || isSuperEdit ? (
                    <div>
                      <input
                        type="text"
                        disabled
                        value="admin (Locked - Cannot Demote)"
                        className="w-full bg-slate-800/60 border border-slate-700 text-slate-400 rounded-xl px-3 py-2 cursor-not-allowed font-medium"
                      />
                    </div>
                  ) : (
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Status</label>
                  {isSelfEdit || isSuperEdit ? (
                    <div>
                      <input
                        type="text"
                        disabled
                        value="active (Locked - Cannot Suspend)"
                        className="w-full bg-slate-800/60 border border-slate-700 text-emerald-400 rounded-xl px-3 py-2 cursor-not-allowed font-medium"
                      />
                    </div>
                  ) : (
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white cursor-pointer"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Email Preview Modal */}
      {selectedEmailPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-sm text-white">{selectedEmailPreview.subject}</h3>
                <span className="text-xs text-slate-400 font-mono">To: {selectedEmailPreview.to}</span>
              </div>
              <button
                onClick={() => setSelectedEmailPreview(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
              {selectedEmailPreview.htmlPreview || 'No preview available'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
