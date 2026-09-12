'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronDown,
  Settings,
  Copy,
  Check,
  Share2,
  Crown,
  Clock,
  Play,
  Lightbulb,
  Plus,
} from 'lucide-react';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import { toast } from '@/hooks/use-toast';
import { DuoRoomData } from '@/game/duo-rampage/types';

interface DuoCreateRoomScreenProps {
  roomCode?: string;
  room?: DuoRoomData | null;
  onBack: () => void;
  onStartMission: () => void;
  onOpenSettings?: () => void;
}

export const DuoCreateRoomScreen: React.FC<DuoCreateRoomScreenProps> = ({
  roomCode = '483921',
  room,
  onBack,
  onStartMission,
  onOpenSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const [region, setRegion] = useState('ASIA (AUTO)');
  const [showRegionMenu, setShowRegionMenu] = useState(false);

  // Active Code (from prop, room object, or default)
  const activeCode = (room?.code ? room.code.replace('#', '') : roomCode).toUpperCase();

  // Player 1 & Player 2 state
  const player1 = room?.players?.[0] || { name: 'RAMPAGE#001', role: 'assault', isReady: true };
  const player2 = room?.players?.[1] || null;
  const isPlayer2Joined = !!player2;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(activeCode);
    setCopied(true);
    duoAudio.playUiClick();
    toast({
      title: 'ROOM ID COPIED',
      description: `#${activeCode} copied to clipboard! Share with your friend.`,
      variant: 'amber',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    duoAudio.playUiClick();
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?game=duo-rampage&room=${activeCode}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me in DUO RAMPAGE!',
          text: `Join my co-op squad in DUO RAMPAGE! Room ID: #${activeCode}`,
          url: shareUrl,
        });
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handleStart = () => {
    duoAudio.playCountdown(0);
    onStartMission();
  };

  return (
    <div className="relative w-full min-h-[100dvh] h-[100dvh] bg-[#050711] select-none overflow-y-auto overflow-x-hidden flex flex-col justify-between p-2 xs:p-3 sm:p-4 md:p-5 text-white font-knight safe-top safe-bottom safe-left safe-right">
      {/* 1. Cinematic Composite Background (Dhaka Armory Hangar with Assault Hero & Blue Hologram) */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <Image
          src="/images/duo-rampage/create_room_composite_bg.png"
          alt="DUO RAMPAGE Armory Hangar Warzone"
          fill
          priority
          className="object-cover object-center transform scale-100"
          sizes="100vw"
        />

        {/* Ambient Lighting & Depth Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60 pointer-events-none" />

        {/* Subtle Hangar Atmosphere Embers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute bottom-16 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-400 blur-[1px] animate-pulse" />
          <div className="absolute bottom-28 left-1/3 w-1 h-1 rounded-full bg-cyan-400 blur-[1px] animate-ping" />
          <div className="absolute bottom-20 right-1/4 w-2 h-2 rounded-full bg-blue-400 blur-[1px] animate-pulse" />
          <div className="absolute bottom-36 right-1/3 w-1 h-1 rounded-full bg-orange-400 blur-[1px] animate-ping" />
        </div>
      </div>

      {/* 2. Top Header Navigation Bar */}
      <header className="relative w-full flex items-center justify-between z-20 gap-2 shrink-0">
        {/* Top-Left: Back to Home Button */}
        <button
          type="button"
          onClick={() => {
            duoAudio.playUiClose();
            onBack();
          }}
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 hover:border-cyan-400/60 rounded-xl shadow-xl transition active:scale-95 cursor-pointer text-left shrink-0 group"
          title="Return to Main Menu"
        >
          <ChevronLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
          <div className="flex flex-col leading-none">
            <span className="font-knight font-bold text-[11px] sm:text-xs text-white uppercase tracking-wider">
              BACK
            </span>
            <span className="font-knight font-medium text-[7.5px] sm:text-[8.5px] text-slate-400 tracking-wider">
              TO HOME
            </span>
          </div>
        </button>

        {/* Top-Center: CREATE ROOM Title & Tagline */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center leading-none">
            <span className="font-knight font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              CREATE
            </span>
            <span className="font-knight font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl bg-gradient-to-b from-[#fde047] via-[#f97316] to-[#dc2626] text-transparent bg-clip-text tracking-wide drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] ml-2">
              ROOM
            </span>
          </div>
          <span className="font-knight font-bold text-[7.5px] xs:text-[9px] sm:text-[11px] md:text-xs text-cyan-200 tracking-widest uppercase mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            INVITE YOUR FRIEND AND FIGHT TOGETHER
          </span>
        </div>

        {/* Top-Right: Region Selector & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Region Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRegionMenu(!showRegionMenu)}
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-knight font-bold text-slate-200 transition active:scale-95 shadow-md cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs tracking-wider">{region}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRegionMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in duration-150">
                {['ASIA (AUTO)', 'EU (CENTRAL)', 'US (EAST)'].map((reg) => (
                  <div
                    key={reg}
                    onClick={() => {
                      setRegion(reg);
                      setShowRegionMenu(false);
                      duoAudio.playUiClick();
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                      region === reg ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {reg}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => {
              duoAudio.playUiClick();
              onOpenSettings?.();
            }}
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 hover:text-white text-xs font-knight font-bold tracking-wider transition active:scale-95 shadow-md cursor-pointer"
            title="Game Settings"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">SETTINGS</span>
          </button>
        </div>
      </header>

      {/* 3. Middle Section: Center Tactical Command Terminal Panel */}
      <main className="relative w-full flex-1 flex items-center justify-center z-20 my-auto py-1 sm:py-2 min-h-0">
        <div className="w-full max-w-[340px] xs:max-w-[390px] sm:max-w-[470px] md:max-w-[510px] bg-gradient-to-b from-[#0c1322]/95 via-[#080e1a]/95 to-[#04060c]/95 border-2 border-cyan-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(6,182,212,0.15)] p-3.5 xs:p-4 sm:p-5 flex flex-col items-center gap-2.5 sm:gap-3.5">
          {/* Header Label: YOUR ROOM ID */}
          <div className="flex flex-col items-center leading-none">
            <span className="font-knight font-extrabold text-[9px] sm:text-[10px] md:text-xs text-cyan-300 uppercase tracking-widest drop-shadow">
              YOUR ROOM ID
            </span>

            {/* Room Code Display Hero + Quick Copy Button */}
            <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
              <span className="font-knight font-black text-3xl xs:text-4xl sm:text-5xl text-amber-400 tracking-widest drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] select-all">
                # {activeCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 sm:p-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-300 hover:text-white transition active:scale-90 cursor-pointer shadow-md"
                title="Copy Room ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <span className="font-knight font-medium text-[8px] xs:text-[9px] sm:text-[10px] text-slate-400 mt-1">
              Share this Room ID with your friend to join
            </span>
          </div>

          {/* Action Buttons Row: COPY ROOM ID (Cyan) & SHARE WITH FRIEND (Emerald) */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
            {/* COPY ROOM ID Button */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex-1 h-10 xs:h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border-t-2 border-cyan-200/90 border-b-4 border-[#075985] text-white font-knight font-bold text-xs xs:text-sm tracking-wider uppercase shadow-[0_6px_20px_rgba(2,132,199,0.5)] flex items-center justify-center gap-1.5 transition-all duration-100 hover:brightness-110 active:translate-y-1 active:border-b-2 cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              {copied ? (
                <Check className="w-4 h-4 text-emerald-200 shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-white shrink-0 group-hover:scale-105 transition-transform drop-shadow" />
              )}
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">
                {copied ? 'COPIED!' : 'COPY ROOM ID'}
              </span>
            </button>

            {/* SHARE WITH FRIEND Button */}
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 h-10 xs:h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#15803d] border-t-2 border-emerald-200/90 border-b-4 border-[#14532d] text-white font-knight font-bold text-xs xs:text-sm tracking-wider uppercase shadow-[0_6px_20px_rgba(22,163,74,0.5)] flex items-center justify-center gap-1.5 transition-all duration-100 hover:brightness-110 active:translate-y-1 active:border-b-2 cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              <Share2 className="w-4 h-4 text-white shrink-0 group-hover:scale-105 transition-transform drop-shadow" />
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">
                SHARE WITH FRIEND
              </span>
            </button>
          </div>

          {/* Squad Members Slots Row (Player 1 & Player 2 Cards) */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 w-full">
            {/* Player 1 Card (Host / You) */}
            <div className="flex-1 bg-slate-950/80 border border-cyan-500/40 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center relative shadow-inner">
              {/* Crown Emblem */}
              <Crown className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] fill-amber-400 mb-1" />

              {/* Square Avatar Portrait */}
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden border-2 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)] relative bg-slate-900 shrink-0">
                <Image
                  src="/images/duo-rampage/avatar_hero.png"
                  alt="Player 1 Avatar"
                  fill
                  className="object-cover"
                  sizes="52px"
                />
              </div>

              {/* Name & Level */}
              <span className="font-knight font-black text-xs sm:text-sm text-white tracking-wider uppercase mt-1 truncate">
                {player1.name || 'RAMPAGE#001'}
              </span>
              <span className="font-knight font-medium text-[8px] sm:text-[9px] text-slate-400 -mt-0.5">
                LV. 1
              </span>

              {/* Ready Pill Badge */}
              <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center gap-1 shadow-sm">
                <Check className="w-2.5 h-2.5 text-emerald-400" />
                <span className="font-knight font-bold text-[8.5px] sm:text-[9.5px] text-emerald-400 uppercase tracking-wider">
                  READY
                </span>
              </div>
            </div>

            {/* Player 2 Card (Waiting or Joined) */}
            <div className="flex-1 bg-slate-950/60 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center relative shadow-inner">
              {/* Spacer or Badge */}
              <div className="h-4 mb-1" />

              {/* Avatar: Blue Silhouette Box with Plus Sign */}
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl border border-cyan-500/30 bg-cyan-950/30 flex items-center justify-center text-cyan-300 shadow-inner relative">
                {isPlayer2Joined ? (
                  <span className="font-knight font-black text-base text-cyan-300">P2</span>
                ) : (
                  <Plus className="w-5 h-5 text-cyan-400 animate-pulse" />
                )}
              </div>

              {/* Name */}
              <span className="font-knight font-bold text-xs sm:text-sm text-slate-300 tracking-wider uppercase mt-1 truncate">
                {isPlayer2Joined ? player2.name : 'PLAYER 2'}
              </span>
              <span className="font-knight font-medium text-[8px] sm:text-[9px] text-slate-500 -mt-0.5">
                {isPlayer2Joined ? 'READY TO FIGHT' : 'INVITE CODE SENT'}
              </span>

              {/* Waiting or Ready Pill */}
              {isPlayer2Joined ? (
                <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center gap-1 shadow-sm">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="font-knight font-bold text-[8.5px] sm:text-[9.5px] text-emerald-400 uppercase tracking-wider">
                    READY
                  </span>
                </div>
              ) : (
                <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 flex items-center gap-1 shadow-sm">
                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                  <span className="font-knight font-bold text-[8.5px] sm:text-[9.5px] text-slate-300 uppercase tracking-wider">
                    WAITING...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Waiting Spinner Notice */}
          <div className="flex flex-col items-center justify-center text-center -my-0.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
              <span className="font-knight font-black text-xs sm:text-sm text-white uppercase tracking-wider drop-shadow">
                {isPlayer2Joined ? 'SQUAD ASSEMBLED!' : 'WAITING FOR PLAYER 2...'}
              </span>
            </div>
            <span className="font-knight font-medium text-[8px] xs:text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
              {isPlayer2Joined
                ? 'Both warriors ready. Tap Start Mission to launch!'
                : 'Once your friend joins, you can start the mission!'}
            </span>
          </div>

          {/* Big START MISSION Button */}
          <button
            type="button"
            onClick={handleStart}
            className={`w-full h-11 xs:h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer relative overflow-hidden group shadow-xl ${
              isPlayer2Joined
                ? 'bg-gradient-to-b from-[#ffea38] via-[#f59e0b] to-[#d97706] border-t-2 border-yellow-100 border-b-5 border-[#78350f] text-slate-950 shadow-[0_10px_35px_rgba(245,158,11,0.65)] hover:brightness-110 active:translate-y-1 active:border-b-2'
                : 'bg-gradient-to-b from-slate-700/90 via-slate-800/90 to-slate-900/90 hover:from-slate-650 hover:to-slate-850 border-t-2 border-slate-600 border-b-4 border-slate-950 text-slate-200 active:translate-y-1 active:border-b-2'
            }`}
          >
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 leading-none">
              <Play className={`w-4 h-4 sm:w-5 sm:h-5 fill-current ${isPlayer2Joined ? 'text-slate-950' : 'text-slate-200'}`} />
              <span
                className={`font-knight font-black text-sm xs:text-base sm:text-lg tracking-wider uppercase ${
                  isPlayer2Joined ? 'text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]' : 'text-white drop-shadow'
                }`}
              >
                START MISSION
              </span>
            </div>
            <span
              className={`font-knight font-bold text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] tracking-widest uppercase mt-0.5 ${
                isPlayer2Joined ? 'text-[#78350f]' : 'text-slate-400'
              }`}
            >
              {isPlayer2Joined ? 'LAUNCH 2-PLAYER SQUAD' : 'Click to launch (Solo Practice or Co-op)'}
            </span>
          </button>
        </div>
      </main>

      {/* 4. Bottom Footer: DUO RAMPAGE Logo (Left) & PRO TIP Card (Right) */}
      <footer className="relative w-full flex items-end justify-between z-20 gap-2 shrink-0 pt-1 xs:pt-2">
        {/* Bottom-Left: 3D Game Logo & Tagline */}
        <div className="flex flex-col items-start select-none">
          <div className="relative w-28 xs:w-36 sm:w-44 h-7 xs:h-9 sm:h-11 flex items-center">
            <Image
              src="/images/duo-rampage/duo_rampage_logo.png"
              alt="DUO RAMPAGE"
              fill
              className="object-contain filter drop-shadow-[0_4px_15px_rgba(245,158,11,0.5)]"
              priority
            />
          </div>
          <span className="font-knight text-[6.5px] xs:text-[7.5px] sm:text-[9px] text-cyan-200 tracking-wider uppercase -mt-0.5 drop-shadow">
            TWO PLAYERS • ONE MISSION • ENDLESS ACTION
          </span>
        </div>

        {/* Bottom-Right: PRO TIP Card */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-amber-500/40 rounded-2xl p-1.5 xs:p-2 sm:px-3 sm:py-2 flex items-center gap-1.5 xs:gap-2 max-w-[170px] xs:max-w-xs sm:max-w-sm shadow-xl shrink-0">
          <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Lightbulb className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-knight font-black text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-amber-400 uppercase tracking-wider">
              PRO TIP:
            </span>
            <span className="font-knight font-medium text-[6.5px] xs:text-[7.5px] sm:text-[9px] text-slate-300 line-clamp-2">
              Share the Room ID with your friend and get ready for some chaos!
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
