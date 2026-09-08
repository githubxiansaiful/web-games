'use client';

import React, { useState, useEffect } from 'react';
import { PLAYER_COLORS, PlayerColor } from '@/lib/multiplayerTypes';
import { LEVELS } from '@/lib/levels';
import {
  Users,
  Play,
  PlusCircle,
  LogIn,
  Dice5,
  Sparkles,
  Gamepad2,
  Volume2,
  VolumeX,
  Layers,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import { sounds } from '@/lib/audio';

interface HomePageProps {
  onStartSolo: (stageId?: number) => void;
  onCreateRoom: (code: string, playerName: string, playerColor: string, stageId: number) => void;
  onJoinRoom: (
    code: string,
    playerName: string,
    playerColor: string
  ) => Promise<{ success: boolean; message?: string } | void> | void;
  onOpenSoloStages: () => void;
}

const RANDOM_NAMES = [
  'NeonDash',
  'CyberFox',
  'PixelKnight',
  'TurboSprint',
  'HyperVolt',
  'FlashNinja',
  'StarRunner',
  'SonicBlaze',
  'ShadowLeap',
  'AcrobatX',
];

export const HomePage: React.FC<HomePageProps> = ({
  onStartSolo,
  onCreateRoom,
  onJoinRoom,
  onOpenSoloStages,
}) => {
  const [playerName, setPlayerName] = useState('Runner');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>(PLAYER_COLORS[0]);
  const [joinCode, setJoinCode] = useState('');
  const [selectedStage, setSelectedStage] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'solo'>('create');

  // Load saved profile on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('runner_player_name');
      const savedColorId = localStorage.getItem('runner_player_color');
      if (savedName) setPlayerName(savedName);
      else {
        const rand = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
        setPlayerName(rand);
      }
      if (savedColorId) {
        const found = PLAYER_COLORS.find((c) => c.id === savedColorId);
        if (found) setSelectedColor(found);
      }
      setIsMuted(sounds.getMuted());
    } catch {
      // ignore
    }
  }, []);

  const handleNameChange = (val: string) => {
    const clean = val.slice(0, 14);
    setPlayerName(clean);
    try {
      localStorage.setItem('runner_player_name', clean);
    } catch {
      // ignore
    }
  };

  const handleColorSelect = (col: PlayerColor) => {
    setSelectedColor(col);
    try {
      localStorage.setItem('runner_player_color', col.id);
    } catch {
      // ignore
    }
  };

  const handleRandomizeName = () => {
    const rand = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    handleNameChange(rand);
  };

  const handleCreateRoom = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    onCreateRoom(code, playerName.trim() || 'Runner', selectedColor.primary, selectedStage);
  };

  const handleJoinRoom = async () => {
    const code = joinCode.trim();
    if (!code) {
      setJoinError('Please enter a room code');
      return;
    }
    if (code.length < 4) {
      setJoinError('Room code is too short');
      return;
    }
    setJoinError('');
    const res = await onJoinRoom(code, playerName.trim() || 'Runner', selectedColor.primary);
    if (res && !res.success && res.message) {
      setJoinError(res.message);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
      {/* Dynamic Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Radiant Glow Lights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-3 mb-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span className="font-black tracking-wider text-sm text-slate-200">
            PLATFORMER RUN
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition active:scale-95 cursor-pointer shadow-md"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Home Container */}
      <main className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl z-10 my-auto">
        {/* Title & Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold mb-3 tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REAL-TIME MULTIPLAYER PLATFORMER</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-cyan-300">
            RUNNER ROYALE
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Create a room, share your 6-digit code with friends, race to the goal flag, and conquer obstacles together!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Runner Profile & Suit Color Customizer */}
          <div className="lg:col-span-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center justify-between">
              <span>Runner Customizer</span>
              <span className="text-[10px] text-indigo-400 font-mono">PLAYER PROFILE</span>
            </h3>

            {/* Live Character Visual Preview */}
            <div className="w-full h-36 bg-slate-950/60 border border-slate-700/50 rounded-xl mb-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              <div
                className="w-12 h-16 rounded-2xl shadow-xl flex items-center justify-center font-black text-2xl text-white relative transition-transform hover:scale-105 duration-200"
                style={{
                  backgroundColor: selectedColor.primary,
                  boxShadow: `0 0 25px ${selectedColor.glow}`,
                }}
              >
                {/* Glowing Visor */}
                <div className="w-7 h-2 bg-white rounded-full absolute top-3 shadow-md" />
                {/* Waving Scarf */}
                <div className="w-3 h-5 bg-rose-500 rounded-sm absolute -left-2 top-4 -rotate-12" />
              </div>
              <span className="mt-2 text-xs font-bold text-slate-200 tracking-wide">
                {playerName || 'Runner'}
              </span>
              <span className="text-[10px] text-slate-400">{selectedColor.name}</span>
            </div>

            {/* Runner Name Input */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Runner Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter your name..."
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                  maxLength={14}
                />
                <button
                  onClick={handleRandomizeName}
                  className="px-3 bg-slate-700 hover:bg-slate-600 active:scale-95 rounded-xl text-slate-200 transition cursor-pointer"
                  title="Randomize Name"
                >
                  <Dice5 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Color Palette Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Runner Suit Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PLAYER_COLORS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => handleColorSelect(col)}
                    className={`h-9 rounded-xl transition-all cursor-pointer relative flex items-center justify-center ${
                      selectedColor.id === col.id
                        ? 'ring-2 ring-white scale-105 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:scale-100'
                    }`}
                    style={{ backgroundColor: col.primary }}
                    title={col.name}
                  >
                    {selectedColor.id === col.id && (
                      <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Game Mode Tabs (Create Room / Join Room / Solo) */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Mode Switch Tabs */}
            <div className="flex p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 mb-5">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Room</span>
              </button>

              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'join'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Join Room</span>
              </button>

              <button
                onClick={() => setActiveTab('solo')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'solo'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>Solo Practice</span>
              </button>
            </div>

            {/* Tab 1: CREATE ROOM */}
            {activeTab === 'create' && (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-base text-white">Host a Multiplayer Match</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-5">
                    Generate a unique 6-digit room code, choose a stage, and invite up to 8 runners to race against each other!
                  </p>

                  {/* Stage Picker */}
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Choose Starting Stage:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 mb-6">
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => setSelectedStage(lvl.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          selectedStage === lvl.id
                            ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/40 text-white'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-bold text-indigo-400">
                          Stage {lvl.id}
                        </div>
                        <div className="font-bold text-xs truncate mt-0.5">{lvl.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateRoom}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 rounded-2xl font-black text-sm text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>CREATE ROOM & OPEN LOBBY</span>
                </button>
              </div>
            )}

            {/* Tab 2: JOIN ROOM */}
            {activeTab === 'join' && (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LogIn className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-base text-white">Join Friend's Room</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-5">
                    Enter the 6-digit room code shared by your friend (e.g. <span className="font-mono text-cyan-300 font-bold">123456</span>) to join their lobby.
                  </p>

                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Enter Room Code:
                  </label>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 8));
                        setJoinError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                      placeholder="e.g. 123456"
                      className="w-full bg-slate-900 border-2 border-slate-700 focus:border-cyan-400 rounded-2xl px-4 py-3.5 text-center text-2xl font-black tracking-widest font-mono text-white placeholder-slate-600 outline-none transition"
                    />
                  </div>
                  {joinError && (
                    <div className="text-rose-300 text-xs font-semibold mb-3.5 bg-rose-950/60 p-3 rounded-xl border border-rose-800/60 flex items-start gap-2 text-left leading-relaxed">
                      <span className="text-sm flex-shrink-0">⚠️</span>
                      <span>{joinError}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleJoinRoom}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 rounded-2xl font-black text-sm text-white shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer mt-4"
                >
                  <LogIn className="w-5 h-5" />
                  <span>JOIN ROOM NOW</span>
                </button>
              </div>
            )}

            {/* Tab 3: SOLO PRACTICE */}
            {activeTab === 'solo' && (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-base text-white">Single-Player Campaign</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-5">
                    Hone your movement, double-jumps, and moving platform timing, collect all coins, and beat par times!
                  </p>

                  <div className="space-y-2 mb-6">
                    {LEVELS.map((lvl) => (
                      <div
                        key={lvl.id}
                        onClick={() => onStartSolo(lvl.id)}
                        className="p-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-xl flex items-center justify-between transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white"
                            style={{
                              background: `linear-gradient(135deg, ${lvl.theme.skyGradient[0]}, ${lvl.theme.groundTopColor})`,
                            }}
                          >
                            {lvl.id}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition">
                              {lvl.name}
                            </div>
                            <div className="text-[10px] text-slate-400">{lvl.subtitle}</div>
                          </div>
                        </div>
                        <Play className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition fill-current" />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onStartSolo(1)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-2xl font-black text-sm text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>PLAY SOLO CAMPAIGN</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Quick Instructions */}
        <div className="mt-8 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-wrap justify-center gap-4 sm:gap-6">
          <span className="hidden md:inline">🎮 Arrow Keys or WASD to run & jump</span>
          <span className="inline md:hidden">📱 Touch on-screen controls to run & jump</span>
          <span>✨ Double tap jump in air for double jump</span>
          <span>⚡ Stand on moving platforms to cross hazards</span>
        </div>
      </main>
    </div>
  );
};
