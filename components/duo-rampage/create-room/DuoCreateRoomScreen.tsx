'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DuoRoomData } from '@/game/duo-rampage/types';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';
import { duoNetwork } from '@/game/duo-rampage/network/DuoNetworkManager';
import { useAuth } from '@/context/AuthContext';
import { DuoMapSelection } from '../home/DuoMapSelection';

interface DuoCreateRoomScreenProps {
  roomCode?: string;
  room?: DuoRoomData | null;
  initialMode?: 'create' | 'join';
  onBack: () => void;
  onStartMission: () => void;
  gameMode?: 'rampage' | 'parkour';
  selectedLevel?: number;
  onJoinRoomSubmit?: (code: string) => Promise<void> | void;
  onOpenSettings?: () => void;
}

export const DuoCreateRoomScreen: React.FC<DuoCreateRoomScreenProps> = ({
  roomCode = '483921',
  room,
  initialMode = 'create',
  gameMode = 'rampage',
  selectedLevel = 1,
  onBack,
  onStartMission,
  onJoinRoomSubmit,
  onOpenSettings,
}) => {
  const { user, openAuthModal } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>(initialMode);
  const [inputCode, setInputCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState('abandoned_city');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveGameMode = room?.gameMode || gameMode;
  const effectiveLevel = room?.selectedLevel || selectedLevel;

  // Real User Information
  const realUserName = user?.name || 'RAMPAGE#001';
  const realUserAvatar = user?.avatar;
  const realUserLevel = user
    ? Math.max(1, (user.stats?.runnerGames || 0) + (user.stats?.spaceGames || 0) + 1)
    : 1;

  // Sync mode if initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Clean room code without '#'
  const activeCode = (room?.code ? room.code.replace(/^#/, '') : roomCode.replace(/^#/, '')).toUpperCase();

  // Players
  const player1 = room?.players?.[0] || {
    name: realUserName,
    avatar: realUserAvatar,
    role: 'assault',
    isReady: true,
  };
  const player2 = room?.players?.[1] || null;
  const isPlayer2Joined = !!player2;

  // Host detection
  const isHost = duoNetwork.isHost || !player2 || player1.name === realUserName;

  // Determine if we should display the active room lobby
  const isInLobby =
    mode === 'create' ||
    isPlayer2Joined ||
    Boolean(room && room.players && room.players.length > 0 && room.players.some((p) => p.name === realUserName));

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const renderAvatar = (avatarStr?: string | null, fallbackImg = '/images/duo-rampage/player1.png', alt = 'Avatar') => {
    const isUrl = Boolean(
      avatarStr &&
        (avatarStr.startsWith('http://') ||
          avatarStr.startsWith('https://') ||
          avatarStr.startsWith('/'))
    );
    if (isUrl) {
      return (
        <img
          src={avatarStr!}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      );
    }
    if (avatarStr && !isUrl) {
      return (
        <span className="text-3xl select-none flex items-center justify-center w-full h-full">
          {avatarStr}
        </span>
      );
    }
    return (
      <img
        src={fallbackImg}
        alt={alt}
        style={{
          width: '180%',
          height: '180%',
          objectFit: 'cover',
          objectPosition: '45% 18%',
          transform: 'translate(-22%, -8%)',
        }}
      />
    );
  };

  const handleConnect = async () => {
    const clean = inputCode.trim().replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    if (clean.length < 4) {
      showToast('Please enter a valid 6-digit room PIN');
      return;
    }

    setIsConnecting(true);
    duoAudio.playDash();
    showToast(`Connecting to squad ${clean}...`);

    try {
      if (onJoinRoomSubmit) {
        await onJoinRoomSubmit(clean);
      }
      setMode('create');
      showToast('Squad joined! In mission lobby.');
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : (err?.message || 'Room not found! Check the 6-digit code.');
      showToast(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStart = () => {
    if (!isHost) {
      showToast('Only the squad leader can launch the mission');
      return;
    }
    duoAudio.playCountdown(0);
    onStartMission();
  };

  return (
    <main className="duo-create-room-shell select-none">
      <style>{`
        .duo-create-room-shell {
          position: relative;
          width: 100vw;
          height: 100vh;
          min-height: 520px;
          overflow: hidden;
          background: #07111e;
          font-family: 'Rajdhani', sans-serif;
          color: #eef7ff;
          touch-action: manipulation;
        }
        .duo-create-room-shell button {
          font: inherit;
          color: inherit;
          border: 0;
          cursor: pointer;
        }
        .duo-bg-layer {
          position: absolute;
          inset: 0;
          background: url("/images/duo-rampage/create_room_bg.png") center center / cover no-repeat;
          transform: scale(1.005);
        }
        .duo-vignette-layer {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,.18) 72%, rgba(0,0,0,.52) 100%);
          pointer-events: none;
        }
        .duo-scanlines-layer {
          position: absolute;
          inset: 0;
          opacity: .035;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,.8) 0 1px, transparent 1px 4px);
          pointer-events: none;
        }

        /* Back Button */
        .duo-back-btn {
          position: absolute;
          top: 20px;
          left: 28px;
          height: 54px;
          min-width: 135px;
          padding: 0 18px 0 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(180deg, rgba(12,27,48,.95), rgba(6,17,31,.92));
          border: 1px solid rgba(77,125,176,.55);
          clip-path: polygon(0 50%, 10% 0, 100% 0, 100% 100%, 10% 100%);
          box-shadow: 0 8px 22px rgba(0,0,0,.3), inset 0 0 18px rgba(35,100,160,.13);
          transition: .18s;
          z-index: 10;
        }
        .duo-back-btn:hover, .duo-settings-btn:hover {
          filter: brightness(1.18);
          transform: translateY(-1px);
        }
        .duo-back-arrow {
          font-family: Arial, sans-serif;
          font-size: 44px;
          line-height: 1;
          transform: translateY(-2px);
          font-weight: 300;
          color: #38bdf8;
        }
        .duo-back-btn strong, .duo-settings-btn strong {
          display: block;
          font-size: 16px;
          letter-spacing: .5px;
          font-weight: 700;
        }
        .duo-back-btn small {
          display: block;
          font-size: 10px;
          letter-spacing: .8px;
          color: #9fb4c8;
          margin-top: -2px;
          font-weight: 600;
        }

        /* Top-Right Navigation & User Badge */
        .duo-top-right {
          position: absolute;
          top: 20px;
          right: 28px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10;
        }
        .duo-settings-btn {
          height: 54px;
          padding: 0 16px;
          background: rgba(8,20,36,.88);
          border: 1px solid rgba(87,126,163,.5);
          box-shadow: 0 7px 20px rgba(0,0,0,.28);
          display: flex;
          align-items: center;
          gap: 10px;
          transition: .18s;
        }
        .duo-user-pill {
          height: 54px;
          padding: 0 16px 0 10px;
          background: rgba(6,17,31,.92);
          border: 1px solid rgba(56,189,248,.4);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,.4);
        }

        /* Hero Heading */
        .duo-hero-heading {
          position: absolute;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: min(680px, 54vw);
          text-align: center;
          z-index: 3;
        }
        .duo-hero-heading h1 {
          margin: 0;
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(38px, 5vw, 76px);
          line-height: .86;
          font-weight: 700;
          letter-spacing: -1.5px;
          text-transform: uppercase;
          text-shadow: 0 7px 0 #07101c, 0 10px 24px rgba(0,0,0,.65);
        }
        .duo-hero-heading h1 span {
          color: #eaf7ff;
          -webkit-text-stroke: 2px #284f78;
        }
        .duo-hero-heading h1 em {
          font-style: normal;
          color: #ff7b16;
          -webkit-text-stroke: 2px #7d2708;
          text-shadow: 0 6px 0 #5b1d0b, 0 10px 20px rgba(0,0,0,.65);
        }
        .duo-hero-heading p {
          margin: 4px 0 0;
          font-size: clamp(11px, 1vw, 16px);
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #d5efff;
          text-shadow: 0 3px 9px #000;
          text-transform: uppercase;
        }

        /* Mode Switcher Tabs */
        .duo-mode-tabs {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          background: rgba(6, 17, 31, 0.85);
          padding: 3px;
          border: 1px solid rgba(87, 126, 163, 0.4);
          border-radius: 8px;
        }
        .duo-mode-tab {
          padding: 6px 18px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 6px;
          transition: .15s;
          color: #94aec5;
        }
        .duo-mode-tab.active {
          background: linear-gradient(180deg, #12b4ff, #0875d9);
          color: #ffffff;
          box-shadow: 0 0 14px rgba(18, 180, 255, 0.45);
        }

        /* Hero Characters */
        .duo-hero-player {
          position: absolute;
          z-index: 2;
          left: 12%;
          bottom: 12%;
          height: 76%;
          max-height: 750px;
          filter: drop-shadow(0 20px 16px rgba(0,0,0,.55));
          pointer-events: none;
          object-fit: contain;
        }
        .duo-hero-hologram {
          position: absolute;
          z-index: 2;
          right: 12%;
          bottom: 15%;
          height: 62%;
          filter: drop-shadow(0 0 24px rgba(30,170,255,.75));
          pointer-events: none;
          object-fit: contain;
        }

        /* Central Terminal Panel */
        .duo-room-panel {
          position: absolute;
          z-index: 4;
          left: 50%;
          top: 18%;
          transform: translateX(-50%);
          width: min(540px, 36vw);
          min-width: 440px;
          padding: 20px 24px 24px;
          background: linear-gradient(180deg, rgba(7,20,36,.96), rgba(4,13,25,.92));
          border: 1px solid rgba(69,117,165,.75);
          clip-path: polygon(5% 0, 95% 0, 100% 7%, 100% 96%, 95% 100%, 5% 100%, 0 96%, 0 7%);
          box-shadow: 0 20px 45px rgba(0,0,0,.6), inset 0 0 35px rgba(20,87,143,.15);
        }

        /* Clean Room PIN Box (NO #, NO Buttons) */
        .duo-room-id-box {
          padding: 10px 18px 12px;
          text-align: center;
          background: rgba(4, 15, 29, 0.7);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 10px;
          margin-bottom: 16px;
        }
        .duo-eyebrow {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #38bdf8;
          text-transform: uppercase;
        }
        .duo-room-id-row {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 6px 0 2px;
        }
        .duo-room-id-text {
          font-size: 52px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 8px;
          color: #ffc21c;
          text-shadow: 0 0 22px rgba(255,180,0,.35);
          user-select: all;
          font-family: 'Rajdhani', sans-serif;
        }
        .duo-room-id-input {
          font-size: 42px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 8px;
          color: #ffc21c;
          text-shadow: 0 0 22px rgba(255,180,0,.35);
          background: rgba(8, 30, 56, 0.85);
          border: 2px solid #38bdf8;
          border-radius: 8px;
          padding: 8px 18px;
          text-align: center;
          width: 100%;
          max-width: 310px;
          outline: none;
          text-transform: uppercase;
          box-shadow: inset 0 0 16px rgba(56, 189, 248, 0.25);
        }
        .duo-room-id-input::placeholder {
          color: rgba(255, 194, 28, 0.3);
          letter-spacing: 6px;
        }
        .duo-room-id-box p {
          margin: 6px 0 0;
          color: #9db6cc;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: .5px;
        }

        /* Player Cards Row */
        .duo-player-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .duo-player-card {
          height: 172px;
          background: linear-gradient(180deg, rgba(11,30,50,.94), rgba(5,17,31,.92));
          border: 1px solid rgba(72,111,147,.62);
          position: relative;
          text-align: center;
          padding-top: 14px;
          box-shadow: inset 0 0 20px rgba(0,86,145,.08);
          border-radius: 8px;
        }
        .duo-portrait-wrap {
          width: 62px;
          height: 62px;
          margin: auto;
          overflow: hidden;
          border-radius: 50%;
          border: 2px solid #f3a619;
          background: #102033;
          box-shadow: 0 0 16px rgba(255,174,20,.3);
          position: relative;
        }
        .duo-player-name {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .4px;
          margin-top: 6px;
          text-transform: uppercase;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 8px;
        }
        .duo-level {
          font-size: 12px;
          color: #b8cbe0;
          font-weight: 600;
          letter-spacing: .5px;
        }
        .duo-ready {
          margin: 7px auto 0;
          color: #38f16e;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .duo-ready span {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          background: #35ee64;
          color: #04180b;
          border-radius: 4px;
          font-family: Arial;
          font-weight: 900;
          font-size: 14px;
        }
        .duo-waiting {
          padding-top: 22px;
        }
        .duo-waiting-person {
          height: 56px;
          color: #248fe4;
          font-family: Arial, sans-serif;
          font-size: 50px;
          line-height: .75;
          text-shadow: 0 0 13px rgba(0,148,255,.3);
          position: relative;
        }
        .duo-waiting-person span {
          position: absolute;
          font-size: 26px;
          right: 32%;
          top: 14%;
          font-weight: 900;
        }
        .duo-waiting-label {
          color: #f7bb25;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: .7px;
          margin-top: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .duo-clock {
          font-size: 16px;
          display: inline-block;
          animation: duoPulse 1.4s infinite;
        }

        /* Waiting / Ready Status Bar */
        .duo-waiting-status {
          margin: 14px 0 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .duo-loader {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(48,153,255,.2);
          border-top-color: #38bdf8;
          border-radius: 50%;
          animation: duoSpin 1.1s linear infinite;
          margin-bottom: 5px;
        }
        .duo-ready-check {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #10b981;
          color: #064e3b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
          margin-bottom: 5px;
        }
        .duo-waiting-status strong {
          font-size: 17px;
          color: #d8eeff;
          letter-spacing: .8px;
        }
        .duo-waiting-status p {
          margin: 0;
          font-size: 13px;
          color: #9cb5cc;
          font-weight: 600;
        }

        /* Large Start / Join Button */
        .duo-start-btn {
          width: 100%;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          clip-path: polygon(4% 0, 96% 0, 100% 20%, 100% 80%, 96% 100%, 4% 100%, 0 80%, 0 20%);
          transition: .18s;
          text-align: left;
        }
        .duo-start-btn.ready {
          background: linear-gradient(180deg, #10b981, #059669);
          border: 1px solid #6ee7b7;
          box-shadow: 0 0 30px rgba(16,185,129,.4), inset 0 0 18px rgba(255,255,255,.2);
          color: #ffffff;
        }
        .duo-start-btn.ready:hover {
          filter: brightness(1.15);
          transform: translateY(-2px);
        }
        .duo-start-btn.disabled {
          background: linear-gradient(180deg, #2d3748, #1a202c);
          border: 1px solid #4a5568;
          color: #718096;
          cursor: not-allowed;
          opacity: 0.85;
        }
        .duo-play-triangle {
          font-size: 26px;
          line-height: 1;
        }
        .duo-start-btn strong {
          display: block;
          font-size: 22px;
          letter-spacing: .7px;
          line-height: 1;
          font-weight: 900;
        }
        .duo-start-btn small {
          display: block;
          font-size: 12px;
          letter-spacing: .8px;
          margin-top: 3px;
          font-weight: 600;
          opacity: .9;
        }

        /* Partner Status Pill */
        .duo-partner-status-pill {
          width: 100%;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: linear-gradient(180deg, rgba(8, 40, 70, 0.95), rgba(4, 20, 40, 0.95));
          border: 1px solid #38bdf8;
          border-radius: 8px;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.3);
          color: #e0f2fe;
          text-align: left;
        }
        .duo-pulse-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 12px #38bdf8;
          animation: duoPulse 1.5s infinite;
        }
        .duo-partner-status-pill strong {
          display: block;
          font-size: 18px;
          font-weight: 800;
          color: #38bdf8;
          letter-spacing: 1px;
        }
        .duo-partner-status-pill small {
          display: block;
          font-size: 12px;
          color: #94a3b8;
        }

        /* Footer Logo & Pro Tip */
        .duo-game-logo {
          position: absolute;
          left: 28px;
          bottom: 24px;
          width: 220px;
          filter: drop-shadow(0 10px 18px rgba(0,0,0,.6));
          z-index: 10;
        }
        .duo-tip-card {
          position: absolute;
          right: 28px;
          bottom: 24px;
          width: 320px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(6,17,31,.9);
          border: 1px solid rgba(87,126,163,.45);
          box-shadow: 0 10px 24px rgba(0,0,0,.35);
          z-index: 10;
          border-radius: 8px;
        }
        .duo-tip-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f59e0b;
          color: #000;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 16px;
          shrink-0;
        }
        .duo-tip-card strong {
          display: block;
          font-size: 12px;
          color: #f59e0b;
          letter-spacing: 1px;
        }
        .duo-tip-card p {
          margin: 2px 0 0;
          font-size: 11px;
          color: #cbd5e1;
          line-height: 1.3;
        }

        /* Toast */
        .duo-toast {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid #38bdf8;
          color: #f0f9ff;
          padding: 10px 24px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s ease;
          z-index: 50;
        }
        .duo-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        @keyframes duoSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes duoPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.6; }
        }

        .duo-map-slider-bottom {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: min(840px, 96vw);
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1400px) {
          .duo-tip-card { display: none; }
          .duo-game-logo { display: none; }
        }

        @media (max-width: 1100px) {
          .duo-hero-player { left: 4%; height: 68%; }
          .duo-hero-hologram { right: 4%; height: 54%; }
          .duo-room-panel { width: 440px; min-width: 440px; }
        }

        @media (max-width: 900px) {
          .duo-hero-player { display: none; }
          .duo-hero-hologram { display: none; }
          .duo-room-panel { width: min(94vw, 440px); min-width: 0; top: 16%; padding: 16px; }
          .duo-hero-heading { width: 90vw; }
          .duo-hero-heading h1 { font-size: 42px; }
          .duo-game-logo { display: none; }
          .duo-tip-card { display: none; }
          .duo-top-right { right: 12px; }
          .duo-back-btn { left: 12px; }
        }

        @media (max-height: 800px) {
          .duo-room-panel { top: 12%; transform: translateX(-50%) scale(.88); transform-origin: top center; }
          .duo-hero-heading { top: 10px; }
          .duo-map-slider-bottom { bottom: 4px; }
        }

        @media (max-height: 700px) {
          .duo-room-panel { top: 11%; transform: translateX(-50%) scale(.82); transform-origin: top center; }
          .duo-hero-heading { top: 8px; }
          .duo-hero-heading h1 { font-size: 36px; }
        }
      `}</style>

      {/* 1. Backdrop Layers */}
      <div className="duo-bg-layer" />
      <div className="duo-vignette-layer" />
      <div className="duo-scanlines-layer" />

      {/* 2. Navigation Header */}
      <button
        type="button"
        className="duo-back-btn"
        onClick={() => {
          duoAudio.playUiClose();
          onBack();
        }}
        aria-label="Back to home"
      >
        <span className="duo-back-arrow">‹</span>
        <span>
          <strong>BACK</strong>
          <small>TO MENU</small>
        </span>
      </button>

      <div className="duo-top-right">
        {/* User Pill */}
        <div className="duo-user-pill">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-amber-400 shrink-0 flex items-center justify-center bg-slate-900">
            {renderAvatar(realUserAvatar, '/images/duo-rampage/player1.png', realUserName)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold font-knight uppercase tracking-wider text-white truncate max-w-[90px]">
              {realUserName}
            </span>
            <span className="text-[10px] text-amber-300 font-bold">
              LV.{realUserLevel}
            </span>
          </div>
        </div>

        {/* Settings Button */}
        <button
          type="button"
          className="duo-settings-btn rounded-xl"
          onClick={() => {
            duoAudio.playUiClick();
            if (onOpenSettings) onOpenSettings();
            else showToast('Audio: Master 100%');
          }}
        >
          <span className="text-lg">⚙</span>
          <strong className="hidden sm:inline">SETTINGS</strong>
        </button>
      </div>

      {/* 3. Hero Heading with Mode Toggle */}
      <section className="duo-hero-heading">
        {effectiveGameMode === 'parkour' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-mono text-[10px] font-black uppercase mb-1 tracking-widest">
            <span>🏃 DHAKA PARKOUR CO-OP</span>
            <span className="text-amber-400">• SECTOR #{effectiveLevel.toString().padStart(2, '0')}</span>
          </div>
        )}
        <h1>
          {isInLobby ? (
            <>
              <span>{effectiveGameMode === 'parkour' ? 'PARKOUR' : 'MISSION'}</span>{' '}
              <em>LOBBY</em>
            </>
          ) : (
            <>
              <span>JOIN</span> <em>{effectiveGameMode === 'parkour' ? 'PARKOUR' : 'SQUAD'}</em>
            </>
          )}
        </h1>
        <p>
          {isInLobby
            ? isPlayer2Joined
              ? effectiveGameMode === 'parkour'
                ? 'SQUAD LINKED • READY FOR URBAN PARKOUR RUN'
                : 'SQUAD ASSEMBLED • STAND BY FOR COMBAT DROP'
              : 'WAITING FOR SQUAD MATE TO JOIN'
            : 'ENTER THE 6-DIGIT ROOM PIN TO SQUAD UP'}
        </p>

        {/* Quick Mode Switcher (Visible before joining) */}
        {!isPlayer2Joined && (
          <div className="duo-mode-tabs">
            <button
              type="button"
              className={`duo-mode-tab ${mode === 'create' ? 'active' : ''}`}
              onClick={() => {
                duoAudio.playUiClick();
                setMode('create');
              }}
            >
              HOST SQUAD
            </button>
            <button
              type="button"
              className={`duo-mode-tab ${mode === 'join' ? 'active' : ''}`}
              onClick={() => {
                duoAudio.playUiClick();
                setMode('join');
              }}
            >
              JOIN SQUAD
            </button>
          </div>
        )}
      </section>

      {/* 4. Layered Standee Characters */}
      <img
        className="duo-hero-player"
        src="/images/duo-rampage/player1.png"
        alt="Player One Hero"
      />
      <img
        className="duo-hero-hologram"
        src="/images/duo-rampage/player2_hologram.png"
        alt="Player Two Hologram"
      />

      {/* 5. Central Room Terminal Panel */}
      <section className="duo-room-panel">
        {isInLobby ? (
          /* ACTIVE ROOM LOBBY CONTENT (Both P1 and P2 see this!) */
          <>
            <div className="duo-room-id-box">
              <div className="duo-eyebrow">MISSION ROOM PIN</div>
              <div className="duo-room-id-row">
                <div className="duo-room-id-text">{activeCode}</div>
              </div>
              <p>
                {isPlayer2Joined
                  ? 'Squad assembled! Stand by for combat drop'
                  : `Share room PIN ${activeCode} with your teammate`}
              </p>
            </div>

            <div className="duo-player-row">
              {/* Player 1 Card (Squad Leader / Assault) */}
              <article className="duo-player-card">
                <div className="duo-portrait-wrap">
                  {renderAvatar(player1.avatar || realUserAvatar, '/images/duo-rampage/player1.png', 'Squad Leader')}
                </div>
                <div className="duo-player-name">{player1.name || realUserName}</div>
                <div className="duo-level">LV. {realUserLevel} • SQUAD LEADER</div>
                <div className="duo-ready">
                  <span>✓</span> READY
                </div>
              </article>

              {/* Player 2 Card (Partner Hero / Heavy Gunner) */}
              <article className={`duo-player-card ${isPlayer2Joined ? '' : 'duo-waiting'}`}>
                {isPlayer2Joined ? (
                  <>
                    <div className="duo-portrait-wrap" style={{ borderColor: '#38bdf8' }}>
                      {renderAvatar(player2?.avatar, '/images/duo-rampage/player2_hologram.png', 'Partner Hero')}
                    </div>
                    <div className="duo-player-name">{player2?.name || 'PARTNER'}</div>
                    <div className="duo-level" style={{ color: '#38bdf8' }}>PARTNER HERO</div>
                    <div className="duo-ready" style={{ color: '#38bdf8' }}>
                      <span style={{ background: '#38bdf8', color: '#032030' }}>✓</span> READY
                    </div>
                  </>
                ) : (
                  <>
                    <div className="duo-waiting-person">
                      ♙<span>+</span>
                    </div>
                    <div className="duo-player-name">PLAYER 2</div>
                    <div className="duo-waiting-label">
                      <span className="duo-clock">◷</span> WAITING...
                    </div>
                  </>
                )}
              </article>
            </div>

            {/* Zone / Sector Info Pill */}
            {effectiveGameMode === 'rampage' ? (
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/70 border border-slate-700/60 rounded-xl mb-3 text-[11px] font-knight uppercase tracking-wider">
                <span className="text-slate-400">ZONE:</span>
                <span className="text-amber-400 font-bold">{selectedMapId.replace('_', ' ')}</span>
                <span className="text-cyan-400 text-[10px] font-mono">SELECT BELOW ↓</span>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/70 border border-slate-700/60 rounded-xl mb-3 text-[11px] font-knight uppercase tracking-wider">
                <span className="text-slate-400">SECTOR:</span>
                <span className="text-cyan-400 font-bold">#01 ROOFTOP INTRODUCTION</span>
                <span className="text-amber-400 text-[10px] font-mono">SUMMER DAY</span>
              </div>
            )}

            <div className="duo-waiting-status">
              {isPlayer2Joined ? (
                <>
                  <div className="duo-ready-check">✓</div>
                  <strong style={{ color: '#34d399' }}>SQUAD ASSEMBLED (2/2)!</strong>
                  <p>
                    {isHost
                      ? 'All warriors linked. Squad Leader, launch the mission!'
                      : 'Connected to Squad Leader. Waiting for host to launch!'}
                  </p>
                </>
              ) : (
                <>
                  <div className="duo-loader" />
                  <strong>WAITING FOR PLAYER 2...</strong>
                  <p>Give your teammate room PIN {activeCode} to squad up</p>
                </>
              )}
            </div>

            {isHost ? (
              <button
                type="button"
                className="duo-start-btn ready"
                onClick={handleStart}
              >
                <span className="duo-play-triangle">▶</span>
                <span>
                  <strong>{effectiveGameMode === 'parkour' ? 'START PARKOUR' : 'START MISSION'}</strong>
                  <small>
                    {isPlayer2Joined
                      ? effectiveGameMode === 'parkour'
                        ? `LAUNCH SECTOR #${effectiveLevel} CO-OP RUN`
                        : 'LAUNCH 2-PLAYER SQUAD DROP'
                      : 'LAUNCH MISSION (OR WAIT FOR SQUAD MATE)'}
                  </small>
                </span>
              </button>
            ) : (
              <div className="duo-partner-status-pill">
                <span className="duo-pulse-dot" />
                <div>
                  <strong>SQUAD READY</strong>
                  <small>Waiting for squad leader to launch mission...</small>
                </div>
              </div>
            )}
          </>
        ) : (
          /* JOIN CODE INPUT VIEW (Clean, Fast, No Clutter, No #) */
          <>
            <div className="duo-room-id-box">
              <div className="duo-eyebrow">ENTER 6-DIGIT ROOM PIN</div>
              <div className="duo-room-id-row">
                <input
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 6).toUpperCase();
                    setInputCode(clean);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConnect();
                  }}
                  placeholder="123456"
                  className="duo-room-id-input font-knight"
                  autoFocus
                />
              </div>
              <p>Type the 6-digit room PIN from your squad leader</p>
            </div>

            <div className="duo-player-row">
              <article className="duo-player-card">
                <div className="duo-portrait-wrap">
                  {renderAvatar(realUserAvatar, '/images/duo-rampage/player1.png', 'You')}
                </div>
                <div className="duo-player-name">{realUserName}</div>
                <div className="duo-level">LV. {realUserLevel} • HERO</div>
                <div className="duo-ready">
                  <span>✓</span> READY
                </div>
              </article>

              <article className="duo-player-card duo-waiting">
                <div className="duo-portrait-wrap" style={{ borderColor: '#38bdf8' }}>
                  <img src="/images/duo-rampage/player2_hologram.png" alt="Target Host" />
                </div>
                <div className="duo-player-name">
                  {inputCode ? inputCode : 'TARGET HOST'}
                </div>
                <div className="duo-waiting-label" style={{ color: '#38bdf8' }}>
                  {inputCode.length >= 4 ? 'READY TO CONNECT' : 'ENTER PIN ABOVE'}
                </div>
              </article>
            </div>

            <div className="duo-waiting-status">
              {isConnecting ? (
                <>
                  <div className="duo-loader" />
                  <strong>CONNECTING TO SQUAD...</strong>
                  <p>Linking peer network</p>
                </>
              ) : (
                <>
                  <div className="duo-loader" />
                  <strong>ENTER PIN & TAP JOIN TO SQUAD UP!</strong>
                  <p>Instant peer connection across browsers</p>
                </>
              )}
            </div>

            <button
              type="button"
              className={`duo-start-btn ${inputCode.length >= 4 && !isConnecting ? 'ready' : 'disabled'}`}
              onClick={handleConnect}
              disabled={inputCode.length < 4 || isConnecting}
            >
              <span className="duo-play-triangle">▶</span>
              <span>
                <strong>{isConnecting ? 'CONNECTING...' : 'JOIN MISSION'}</strong>
                <small>Connect to leader&apos;s room</small>
              </span>
            </button>
          </>
        )}
      </section>

      {/* 6. Footer Logo & Pro Tip Card */}
      <img
        className="duo-game-logo"
        src="/images/duo-rampage/duo_rampage_logo.png"
        alt="DUO RAMPAGE"
      />

      <aside className="duo-tip-card">
        <span className="duo-tip-icon">!</span>
        <div>
          <strong>PRO TIP:</strong>
          <p>
            {isInLobby
              ? 'Stay close together during missions to trigger 2x Damage Rampage boost!'
              : 'Enter the 6-digit PIN code shared by your squad leader and tap Join Mission.'}
          </p>
        </div>
      </aside>

      {/* 6.5. Bottom Deployment Zone Carousel (For Rampage Mode) */}
      {effectiveGameMode === 'rampage' && isInLobby && (
        <div className="duo-map-slider-bottom">
          <div className="text-[10px] sm:text-xs font-knight font-bold uppercase tracking-widest text-cyan-300 drop-shadow mb-0.5">
            SELECT DEPLOYMENT ZONE
          </div>
          <DuoMapSelection
            selectedMapId={selectedMapId}
            onSelectMap={(id) => setSelectedMapId(id)}
          />
        </div>
      )}

      {/* 7. Toast Notification */}
      <div className={`duo-toast ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </main>
  );
};
