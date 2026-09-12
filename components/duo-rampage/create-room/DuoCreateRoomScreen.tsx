'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DuoRoomData } from '@/game/duo-rampage/types';
import { duoAudio } from '@/game/duo-rampage/audio/DuoAudioEngine';

interface DuoCreateRoomScreenProps {
  roomCode?: string;
  room?: DuoRoomData | null;
  initialMode?: 'create' | 'join';
  onBack: () => void;
  onStartMission: () => void;
  onJoinRoomSubmit?: (code: string) => Promise<void> | void;
  onOpenSettings?: () => void;
}

export const DuoCreateRoomScreen: React.FC<DuoCreateRoomScreenProps> = ({
  roomCode = '483921',
  room,
  initialMode = 'create',
  onBack,
  onStartMission,
  onJoinRoomSubmit,
  onOpenSettings,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>(initialMode);
  const [inputCode, setInputCode] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [region, setRegion] = useState('ASIA (AUTO)');
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync mode if initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Extract clean code
  const activeCode = (room?.code ? room.code.replace('#', '') : roomCode).toUpperCase();

  // Players
  const player1 = room?.players?.[0] || { name: 'RAMPAGE#001', role: 'assault', isReady: true };
  const player2 = room?.players?.[1] || null;
  const isPlayer2Joined = !!player2;

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const copyRoomId = async (customCode?: string) => {
    const codeToCopy = customCode || activeCode;
    duoAudio.playUiClick();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText('#' + codeToCopy);
      } else {
        const area = document.createElement('textarea');
        area.value = '#' + codeToCopy;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      showToast(`Room ID #${codeToCopy} copied!`);
    } catch {
      showToast(`Room ID #${codeToCopy} copied!`);
    }
  };

  const handleShare = async () => {
    duoAudio.playUiClick();
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/?game=duo-rampage&room=${activeCode}`
        : '';
    const shareData = {
      title: 'DUO RAMPAGE Co-op Squad',
      text: `Join my DUO RAMPAGE co-op room: #${activeCode}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        await copyRoomId();
        showToast('Room ID copied for sharing');
      }
    } else {
      await copyRoomId();
      showToast('Room ID copied for sharing');
    }
  };

  const handlePasteCode = async () => {
    duoAudio.playUiClick();
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        const clean = text.replace(/[^0-9A-Za-z]/g, '').slice(0, 6).toUpperCase();
        if (clean) {
          setInputCode(clean);
          showToast(`Pasted #${clean}`);
          return;
        }
      }
    } catch {
      // ignore
    }
    showToast('Paste from clipboard or type 6 digits');
  };

  const handleConnect = async () => {
    const codeToJoin = inputCode.trim().replace('#', '');
    if (codeToJoin.length < 4) {
      showToast('Please enter a valid room code');
      return;
    }
    duoAudio.playDash();
    showToast(`Connecting to #${codeToJoin}...`);
    if (onJoinRoomSubmit) {
      await onJoinRoomSubmit(codeToJoin);
    }
  };

  const handleStart = () => {
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
          height: 56px;
          min-width: 143px;
          padding: 0 20px 0 13px;
          display: flex;
          align-items: center;
          gap: 11px;
          background: linear-gradient(180deg, rgba(12,27,48,.95), rgba(6,17,31,.92));
          border: 1px solid rgba(77,125,176,.55);
          clip-path: polygon(0 50%, 10% 0, 100% 0, 100% 100%, 10% 100%);
          box-shadow: 0 8px 22px rgba(0,0,0,.3), inset 0 0 18px rgba(35,100,160,.13);
          transition: .18s;
          z-index: 10;
        }
        .duo-back-btn:hover, .duo-settings-btn:hover, .duo-region-btn:hover {
          filter: brightness(1.18);
          transform: translateY(-1px);
        }
        .duo-back-arrow {
          font-family: Arial, sans-serif;
          font-size: 50px;
          line-height: 1;
          transform: translateY(-3px);
          font-weight: 300;
          color: #38bdf8;
        }
        .duo-back-btn strong, .duo-settings-btn strong, .duo-region-btn strong {
          display: block;
          font-size: 18px;
          letter-spacing: .5px;
          font-weight: 700;
        }
        .duo-back-btn small {
          display: block;
          font-size: 11px;
          letter-spacing: .8px;
          color: #9fb4c8;
          margin-top: -2px;
          font-weight: 600;
        }

        /* Top-Right Navigation */
        .duo-top-right {
          position: absolute;
          top: 20px;
          right: 28px;
          display: flex;
          gap: 12px;
          z-index: 10;
        }
        .duo-region-btn, .duo-settings-btn {
          height: 56px;
          padding: 0 17px;
          background: rgba(8,20,36,.88);
          border: 1px solid rgba(87,126,163,.5);
          box-shadow: 0 7px 20px rgba(0,0,0,.28);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: .18s;
        }
        .duo-region-btn {
          min-width: 180px;
          position: relative;
        }
        .duo-settings-btn {
          min-width: 139px;
        }
        .duo-online-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #21e65d;
          box-shadow: 0 0 12px #21e65d;
        }
        .duo-chevron {
          font-family: Arial, sans-serif;
          font-size: 26px;
          margin-left: auto;
          line-height: 1;
        }
        .duo-gear {
          font-size: 28px;
          line-height: 1;
        }

        /* Region Dropdown Menu */
        .duo-region-dropdown {
          position: absolute;
          right: 0;
          top: 60px;
          width: 100%;
          background: rgba(6, 17, 31, 0.96);
          border: 1px solid rgba(87, 126, 163, 0.7);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
          padding: 4px;
          z-index: 50;
        }
        .duo-region-item {
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 700;
          color: #9fb4c8;
          cursor: pointer;
          transition: .15s;
        }
        .duo-region-item:hover, .duo-region-item.active {
          background: rgba(18, 180, 255, 0.2);
          color: #38bdf8;
        }

        /* Hero Heading */
        .duo-hero-heading {
          position: absolute;
          top: 26px;
          left: 50%;
          transform: translateX(-50%);
          width: min(680px, 54vw);
          text-align: center;
          z-index: 3;
        }
        .duo-hero-heading h1 {
          margin: 0;
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(44px, 5.5vw, 92px);
          line-height: .84;
          font-weight: 700;
          letter-spacing: -2px;
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
          margin: 5px 0 0;
          font-size: clamp(12px, 1.1vw, 20px);
          font-weight: 700;
          letter-spacing: 1.4px;
          color: #d5efff;
          text-shadow: 0 3px 9px #000;
          text-transform: uppercase;
        }

        /* Mode Switcher Tabs */
        .duo-mode-tabs {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          background: rgba(6, 17, 31, 0.8);
          padding: 3px;
          border: 1px solid rgba(87, 126, 163, 0.4);
          border-radius: 6px;
        }
        .duo-mode-tab {
          padding: 4px 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 4px;
          transition: .15s;
          color: #94aec5;
        }
        .duo-mode-tab.active {
          background: linear-gradient(180deg, #12b4ff, #0875d9);
          color: #ffffff;
          box-shadow: 0 0 12px rgba(18, 180, 255, 0.4);
        }

        /* Hero Characters */
        .duo-hero-player {
          position: absolute;
          z-index: 2;
          left: 12.5%;
          bottom: 13.2%;
          height: 80%;
          max-height: 790px;
          filter: drop-shadow(0 20px 16px rgba(0,0,0,.55));
          pointer-events: none;
          object-fit: contain;
        }
        .duo-hero-hologram {
          position: absolute;
          z-index: 2;
          right: 13.2%;
          bottom: 17%;
          height: 64%;
          filter: drop-shadow(0 0 24px rgba(30,170,255,.75));
          pointer-events: none;
          object-fit: contain;
        }

        /* Central Terminal Panel */
        .duo-room-panel {
          position: absolute;
          z-index: 4;
          left: 50%;
          top: 20%;
          transform: translateX(-50%);
          width: min(548px, 34vw);
          min-width: 475px;
          padding: 17px 25px 22px;
          background: linear-gradient(180deg, rgba(7,20,36,.94), rgba(4,13,25,.9));
          border: 1px solid rgba(69,117,165,.75);
          clip-path: polygon(5% 0, 95% 0, 100% 7%, 100% 96%, 95% 100%, 5% 100%, 0 96%, 0 7%);
          box-shadow: 0 20px 45px rgba(0,0,0,.5), inset 0 0 35px rgba(20,87,143,.13);
        }

        /* Room ID Box */
        .duo-room-id-box {
          padding: 2px 20px 8px;
          text-align: center;
        }
        .duo-eyebrow {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #a9c8e4;
          text-transform: uppercase;
        }
        .duo-room-id-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-top: 4px;
        }
        .duo-room-id-text {
          font-size: 47px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: 2px;
          color: #ffc21c;
          text-shadow: 0 0 16px rgba(255,180,0,.22);
          user-select: all;
        }
        .duo-room-id-input {
          font-size: 38px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: 6px;
          color: #ffc21c;
          text-shadow: 0 0 16px rgba(255,180,0,.22);
          background: rgba(11, 41, 73, 0.6);
          border: 2px solid #238ee5;
          border-radius: 6px;
          padding: 4px 14px;
          text-align: center;
          width: 230px;
          outline: none;
          text-transform: uppercase;
        }
        .duo-room-id-input::placeholder {
          color: rgba(255, 194, 28, 0.4);
          letter-spacing: 4px;
        }
        .duo-icon-btn {
          width: 52px;
          height: 43px;
          background: #0b2949;
          border: 2px solid #238ee5;
          box-shadow: inset 0 0 14px rgba(0,160,255,.15);
          font-size: 24px;
          color: #dff5ff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: .15s;
        }
        .duo-icon-btn:hover {
          filter: brightness(1.2);
        }
        .duo-room-id-box p {
          margin: 6px 0 0;
          color: #9db6cc;
          font-size: 14px;
          font-weight: 600;
        }

        /* Action Buttons Row */
        .duo-action-row {
          display: grid;
          grid-template-columns: 1fr 1.18fr;
          gap: 14px;
          margin: 5px 0 14px;
        }
        .duo-action-btn {
          height: 58px;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: .3px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          clip-path: polygon(5% 0, 95% 0, 100% 14%, 100% 86%, 95% 100%, 5% 100%, 0 86%, 0 14%);
          transition: .16s;
        }
        .duo-action-btn.blue {
          background: linear-gradient(180deg, #12b4ff, #0875d9);
          border: 1px solid #6ad9ff;
          box-shadow: 0 0 22px rgba(0,154,255,.2), inset 0 0 15px rgba(255,255,255,.12);
        }
        .duo-action-btn.green {
          background: linear-gradient(180deg, #18e75d, #04aa42);
          border: 1px solid #6dff9d;
          box-shadow: 0 0 22px rgba(0,255,97,.18), inset 0 0 15px rgba(255,255,255,.1);
        }
        .duo-action-btn:hover {
          filter: brightness(1.14);
          transform: translateY(-1px);
        }
        .duo-btn-icon {
          font-size: 22px;
          line-height: 1;
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
          padding-top: 12px;
          box-shadow: inset 0 0 20px rgba(0,86,145,.08);
        }
        .duo-portrait-wrap {
          width: 60px;
          height: 60px;
          margin: auto;
          overflow: hidden;
          border-radius: 50%;
          border: 2px solid #f3a619;
          background: #102033;
          box-shadow: 0 0 14px rgba(255,174,20,.25);
          position: relative;
        }
        .duo-portrait-wrap img {
          width: 180%;
          height: 180%;
          object-fit: cover;
          object-position: 45% 18%;
          transform: translate(-22%, -8%);
        }
        .duo-player-name {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: .4px;
          margin-top: 5px;
          text-transform: uppercase;
        }
        .duo-level {
          font-size: 13px;
          color: #b8cbe0;
          font-weight: 600;
        }
        .duo-ready {
          margin: 7px auto 0;
          color: #38f16e;
          font-weight: 700;
          font-size: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .duo-ready span {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          background: #35ee64;
          color: #04180b;
          border-radius: 5px;
          font-family: Arial;
          font-weight: 900;
          font-size: 15px;
        }
        .duo-waiting {
          padding-top: 20px;
        }
        .duo-waiting-person {
          height: 64px;
          color: #248fe4;
          font-family: Arial, sans-serif;
          font-size: 56px;
          line-height: .75;
          text-shadow: 0 0 13px rgba(0,148,255,.3);
          position: relative;
        }
        .duo-waiting-person span {
          position: absolute;
          font-size: 30px;
          left: 50%;
          top: 22px;
          transform: translateX(-50%);
        }
        .duo-waiting-label {
          margin-top: 14px;
          color: #8bb4d8;
          font-size: 17px;
          font-weight: 700;
        }
        .duo-clock {
          font-size: 24px;
          vertical-align: -2px;
          margin-right: 4px;
        }

        /* Waiting Status & Spinner */
        .duo-waiting-status {
          text-align: center;
          padding: 12px 0 8px;
        }
        .duo-loader {
          width: 28px;
          height: 28px;
          border: 4px dotted #00a9ff;
          border-radius: 50%;
          display: inline-block;
          vertical-align: middle;
          margin-right: 9px;
          animation: duoSpin 1.2s linear infinite;
        }
        .duo-waiting-status strong {
          font-size: 16px;
          letter-spacing: .3px;
          vertical-align: middle;
          font-weight: 700;
        }
        .duo-waiting-status p {
          margin: 3px 0 0;
          color: #94aec5;
          font-size: 13px;
        }
        @keyframes duoSpin {
          to { transform: rotate(360deg); }
        }

        /* Start Mission Button */
        .duo-start-btn {
          width: 82%;
          height: 64px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          clip-path: polygon(4% 0, 96% 0, 100% 20%, 100% 80%, 96% 100%, 4% 100%, 0 80%, 0 20%);
          transition: .18s;
        }
        .duo-start-btn.ready {
          background: linear-gradient(180deg, #ffc727, #f77f00);
          border: 2px solid #ffe072;
          box-shadow: 0 0 28px rgba(247,127,0,.45), inset 0 0 22px rgba(255,255,255,.3);
          color: #1a0800;
        }
        .duo-start-btn.ready .duo-play-triangle {
          color: #1a0800;
        }
        .duo-start-btn.ready small {
          color: #4a1e00;
        }
        .duo-start-btn.ready:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }
        .duo-start-btn.disabled {
          background: linear-gradient(180deg, #73869a, #465666);
          border: 2px solid #a5b7c8;
          box-shadow: inset 0 0 22px rgba(255,255,255,.12), 0 9px 18px rgba(0,0,0,.3);
          opacity: .85;
          color: #eef7ff;
        }
        .duo-start-btn.disabled:hover {
          filter: brightness(1.1);
        }
        .duo-start-btn strong {
          display: block;
          font-size: 22px;
          letter-spacing: .4px;
          font-weight: 700;
        }
        .duo-start-btn small {
          display: block;
          font-size: 12px;
          color: #d4dee8;
          font-weight: 600;
        }
        .duo-play-triangle {
          font-size: 26px;
          color: #e4edf4;
        }

        /* Bottom Logo & Pro Tip */
        .duo-game-logo {
          position: absolute;
          z-index: 4;
          left: 27px;
          bottom: 17px;
          width: 245px;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 7px 10px rgba(0,0,0,.5));
          pointer-events: none;
        }
        .duo-tip-card {
          position: absolute;
          z-index: 5;
          right: 27px;
          bottom: 24px;
          width: 337px;
          min-height: 66px;
          padding: 9px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(7,19,33,.91);
          border: 1px solid rgba(71,104,136,.7);
          clip-path: polygon(5% 0, 95% 0, 100% 16%, 100% 84%, 95% 100%, 5% 100%, 0 84%, 0 16%);
          box-shadow: 0 9px 25px rgba(0,0,0,.4);
        }
        .duo-tip-icon {
          width: 29px;
          height: 29px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 2px solid #ffb61a;
          color: #ffb61a;
          font-weight: 800;
          font-size: 16px;
          shrink-0: 0;
        }
        .duo-tip-card strong {
          font-size: 14px;
          color: #ffb61a;
        }
        .duo-tip-card p {
          margin: 0;
          color: #b7c7d5;
          font-size: 13px;
          line-height: 1.15;
        }

        /* Toast Popup */
        .duo-toast {
          position: absolute;
          left: 50%;
          bottom: 26px;
          transform: translate(-50%, 20px);
          padding: 10px 20px;
          background: rgba(5,18,31,.96);
          border: 1px solid #2b9eea;
          box-shadow: 0 10px 30px rgba(0, 154, 255, 0.4);
          border-radius: 6px;
          opacity: 0;
          pointer-events: none;
          transition: .25s;
          z-index: 50;
          font-weight: 700;
          font-size: 15px;
          color: #eaf7ff;
        }
        .duo-toast.show {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        /* Responsive Breakpoints from reference HTML/CSS */
        @media (max-width: 1100px) {
          .duo-hero-player { left: 7%; height: 71%; }
          .duo-hero-hologram { right: 7%; height: 57%; }
          .duo-room-panel { width: 470px; min-width: 470px; }
          .duo-tip-card { width: 285px; }
          .duo-game-logo { width: 190px; }
        }

        @media (max-width: 850px) {
          .duo-hero-player { left: 1%; height: 59%; bottom: 20%; }
          .duo-hero-hologram { right: 0; height: 48%; bottom: 23%; opacity: .88; }
          .duo-room-panel { width: 410px; min-width: 410px; top: 18%; padding-left: 18px; padding-right: 18px; }
          .duo-top-right { right: 12px; }
          .duo-back-btn { left: 12px; }
          .duo-region-btn { min-width: 155px; }
          .duo-settings-btn { min-width: 120px; }
          .duo-hero-heading { top: 24px; width: 500px; }
          .duo-hero-heading h1 { font-size: 52px; }
          .duo-game-logo { left: 12px; bottom: 12px; width: 160px; }
          .duo-tip-card { right: 12px; bottom: 12px; width: 245px; }
        }

        @media (max-height: 700px) {
          .duo-hero-player { height: 72%; bottom: 8%; }
          .duo-hero-hologram { height: 57%; bottom: 13%; }
          .duo-room-panel { top: 16%; transform: translateX(-50%) scale(.9); transform-origin: top center; }
          .duo-hero-heading { top: 16px; }
          .duo-hero-heading h1 { font-size: 50px; }
        }

        @media (max-width: 680px) {
          .duo-top-right .duo-region-btn { display: none; }
          .duo-settings-btn { min-width: 50px; width: 50px; padding: 0; justify-content: center; }
          .duo-settings-btn strong { display: none; }
          .duo-back-btn { min-width: 104px; width: 104px; }
          .duo-back-btn small { display: none; }
          .duo-back-btn strong { font-size: 16px; }
          .duo-hero-player { opacity: .22; left: -5%; height: 54%; bottom: 28%; }
          .duo-hero-hologram { opacity: .22; right: -6%; height: 44%; bottom: 29%; }
          .duo-room-panel { width: min(94vw, 430px); min-width: 0; top: 13%; padding: 14px 15px 16px; }
          .duo-room-id-text { font-size: 38px; }
          .duo-room-id-input { font-size: 32px; width: 190px; }
          .duo-action-btn { font-size: 14px; height: 52px; }
          .duo-player-card { height: 152px; }
          .duo-hero-heading { top: 18px; width: 78vw; }
          .duo-hero-heading h1 { font-size: 40px; }
          .duo-hero-heading p { font-size: 11px; }
          .duo-game-logo { display: none; }
          .duo-tip-card { display: none; }
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
          <small>TO HOME</small>
        </span>
      </button>

      <div className="duo-top-right">
        {/* Region Selector */}
        <div className="relative">
          <button
            type="button"
            className="duo-region-btn"
            onClick={() => {
              duoAudio.playUiClick();
              setShowRegionMenu(!showRegionMenu);
            }}
          >
            <span className="duo-online-dot" />
            <strong>{region}</strong>
            <span className="duo-chevron">⌄</span>
          </button>

          {showRegionMenu && (
            <div className="duo-region-dropdown">
              {['ASIA (AUTO)', 'EU (CENTRAL)', 'US (EAST)'].map((reg) => (
                <div
                  key={reg}
                  className={`duo-region-item ${region === reg ? 'active' : ''}`}
                  onClick={() => {
                    setRegion(reg);
                    setShowRegionMenu(false);
                    duoAudio.playUiClick();
                  }}
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
          className="duo-settings-btn"
          onClick={() => {
            duoAudio.playUiClick();
            if (onOpenSettings) onOpenSettings();
            else showToast('Settings: Master Audio 100%');
          }}
        >
          <span className="duo-gear">⚙</span>
          <strong>SETTINGS</strong>
        </button>
      </div>

      {/* 3. Hero Heading with Mode Toggle */}
      <section className="duo-hero-heading">
        <h1>
          <span>{mode === 'create' ? 'CREATE' : 'JOIN'}</span>{' '}
          <em>ROOM</em>
        </h1>
        <p>
          {mode === 'create'
            ? 'INVITE YOUR FRIEND AND FIGHT TOGETHER'
            : 'ENTER A 6-DIGIT ROOM CODE TO SQUAD UP'}
        </p>

        {/* Quick Mode Toggle */}
        <div className="duo-mode-tabs">
          <button
            type="button"
            className={`duo-mode-tab ${mode === 'create' ? 'active' : ''}`}
            onClick={() => {
              duoAudio.playUiClick();
              setMode('create');
            }}
          >
            HOST ROOM
          </button>
          <button
            type="button"
            className={`duo-mode-tab ${mode === 'join' ? 'active' : ''}`}
            onClick={() => {
              duoAudio.playUiClick();
              setMode('join');
            }}
          >
            JOIN FRIEND
          </button>
        </div>
      </section>

      {/* 4. Layered Standee Characters (from HTML assets) */}
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
        {mode === 'create' ? (
          /* CREATE ROOM CONTENT */
          <>
            <div className="duo-room-id-box">
              <div className="duo-eyebrow">YOUR ROOM ID</div>
              <div className="duo-room-id-row">
                <div className="duo-room-id-text">#{activeCode}</div>
                <button
                  type="button"
                  className="duo-icon-btn"
                  onClick={() => copyRoomId()}
                  aria-label="Copy room ID"
                  title="Copy room ID"
                >
                  ▣
                </button>
              </div>
              <p>Share this Room ID with your friend to join</p>
            </div>

            <div className="duo-action-row">
              <button
                type="button"
                className="duo-action-btn blue"
                onClick={() => copyRoomId()}
              >
                <span className="duo-btn-icon">▣</span> COPY ROOM ID
              </button>
              <button
                type="button"
                className="duo-action-btn green"
                onClick={handleShare}
              >
                <span className="duo-btn-icon">↗</span> SHARE WITH FRIEND
              </button>
            </div>

            <div className="duo-player-row">
              <article className="duo-player-card">
                <div className="duo-portrait-wrap">
                  <img src="/images/duo-rampage/player1.png" alt="Host Avatar" />
                </div>
                <div className="duo-player-name">{player1.name || 'RAMPAGE#001'}</div>
                <div className="duo-level">LV. 1</div>
                <div className="duo-ready">
                  <span>✓</span> READY
                </div>
              </article>

              <article className="duo-player-card duo-waiting">
                {isPlayer2Joined ? (
                  <>
                    <div className="duo-portrait-wrap" style={{ borderColor: '#38bdf8' }}>
                      <img src="/images/duo-rampage/player2_hologram.png" alt="Partner Avatar" />
                    </div>
                    <div className="duo-player-name">{player2?.name || 'PLAYER 2'}</div>
                    <div className="duo-level" style={{ color: '#38bdf8' }}>PARTNER HERO</div>
                    <div className="duo-ready">
                      <span>✓</span> READY
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

            <div className="duo-waiting-status">
              <div className="duo-loader" />
              <strong>
                {isPlayer2Joined ? 'SQUAD ASSEMBLED!' : 'WAITING FOR PLAYER 2...'}
              </strong>
              <p>
                {isPlayer2Joined
                  ? 'Both warriors ready. Tap Start Mission to launch!'
                  : 'Once your friend joins, you can start the mission!'}
              </p>
            </div>

            <button
              type="button"
              className={`duo-start-btn ${isPlayer2Joined ? 'ready' : 'disabled'}`}
              onClick={handleStart}
            >
              <span className="duo-play-triangle">▶</span>
              <span>
                <strong>START MISSION</strong>
                <small>
                  {isPlayer2Joined ? 'LAUNCH 2-PLAYER SQUAD' : 'Click to launch (Solo or Waiting for friend)'}
                </small>
              </span>
            </button>
          </>
        ) : (
          /* JOIN ROOM CONTENT */
          <>
            <div className="duo-room-id-box">
              <div className="duo-eyebrow">ENTER ROOM CODE</div>
              <div className="duo-room-id-row">
                <span style={{ fontSize: '32px', color: '#ffc21c', fontWeight: 700 }}>#</span>
                <input
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 6).toUpperCase();
                    setInputCode(clean);
                  }}
                  placeholder="483921"
                  className="duo-room-id-input font-knight"
                  autoFocus
                />
                <button
                  type="button"
                  className="duo-icon-btn"
                  onClick={handlePasteCode}
                  title="Paste from clipboard"
                >
                  📋
                </button>
              </div>
              <p>Enter the 6-digit PIN code shared by your squad leader</p>
            </div>

            <div className="duo-action-row">
              <button
                type="button"
                className="duo-action-btn blue"
                onClick={handlePasteCode}
              >
                <span className="duo-btn-icon">📋</span> PASTE CODE
              </button>
              <button
                type="button"
                className="duo-action-btn green"
                onClick={handleConnect}
              >
                <span className="duo-btn-icon">⚔</span> CONNECT
              </button>
            </div>

            <div className="duo-player-row">
              <article className="duo-player-card">
                <div className="duo-portrait-wrap">
                  <img src="/images/duo-rampage/player1.png" alt="You" />
                </div>
                <div className="duo-player-name">YOU (JOINING)</div>
                <div className="duo-level">HEAVY / ASSAULT</div>
                <div className="duo-ready">
                  <span>✓</span> READY
                </div>
              </article>

              <article className="duo-player-card duo-waiting">
                <div className="duo-portrait-wrap" style={{ borderColor: '#38bdf8' }}>
                  <img src="/images/duo-rampage/player2_hologram.png" alt="Squad Leader" />
                </div>
                <div className="duo-player-name">
                  {inputCode ? `#${inputCode}` : 'TARGET HOST'}
                </div>
                <div className="duo-waiting-label" style={{ color: '#38bdf8' }}>
                  {inputCode.length >= 4 ? 'READY TO CONNECT' : 'ENTER PIN ABOVE'}
                </div>
              </article>
            </div>

            <div className="duo-waiting-status">
              <div className="duo-loader" />
              <strong>ENTER CODE & TAP CONNECT TO SQUAD UP!</strong>
              <p>Instant peer connection across Asia, Europe and Americas</p>
            </div>

            <button
              type="button"
              className={`duo-start-btn ${inputCode.length >= 4 ? 'ready' : 'disabled'}`}
              onClick={handleConnect}
            >
              <span className="duo-play-triangle">▶</span>
              <span>
                <strong>JOIN MISSION</strong>
                <small>Connect to leader's room</small>
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
            {mode === 'create'
              ? 'Share the Room ID with your friend and get ready for some chaos!'
              : 'Ask your friend for their 6-digit room PIN or click their invite link!'}
          </p>
        </div>
      </aside>

      {/* 7. Toast Notification */}
      <div className={`duo-toast ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </main>
  );
};
