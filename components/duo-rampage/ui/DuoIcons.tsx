'use client';

import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/** 3D Embossed Gold Coin with Specular Reflection (Replaces all low-res emojis) */
export const DuoCoin: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="duoCoinGoldBase" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="25%" stopColor="#f59e0b" />
        <stop offset="70%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="duoCoinInner" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="duoCoinRim" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    {/* Outer Coin Body */}
    <circle cx="16" cy="16" r="15" fill="url(#duoCoinGoldBase)" stroke="#78350f" strokeWidth="1" />
    <circle cx="16" cy="16" r="14" fill="none" stroke="url(#duoCoinRim)" strokeWidth="1.2" />
    {/* Inner Sunken Face */}
    <circle cx="16" cy="16" r="11" fill="url(#duoCoinInner)" stroke="#92400e" strokeWidth="1" />
    {/* Specular Highlight Arc */}
    <path
      d="M7 16 A9 9 0 0 1 25 16"
      stroke="#ffffff"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.6"
    />
    {/* Center Embossed Star / D Symbol */}
    <polygon
      points="16,8 18.5,13 24,13.8 20,17.7 21,23.2 16,20.5 11,23.2 12,17.7 8,13.8 13.5,13"
      fill="#fffbeb"
      stroke="#92400e"
      strokeWidth="0.8"
      className="drop-shadow-sm"
    />
  </svg>
);

/** Golden Supply Crate / Treasure Chest (Store Icon) */
export const DuoChestIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="chestGoldLid" x1="0" y1="4" x2="32" y2="14" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="chestGoldBody" x1="0" y1="14" x2="32" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="60%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
    {/* Lid */}
    <path
      d="M3 11 C3 8 7 6 16 6 C25 6 29 8 29 11 L28 14 L4 14 Z"
      fill="url(#chestGoldLid)"
      stroke="#451a03"
      strokeWidth="1.5"
    />
    {/* Chest Body */}
    <path
      d="M4 14 L28 14 L26.5 26 C26.5 27 25 28 23 28 L9 28 C7 28 5.5 27 5.5 26 Z"
      fill="url(#chestGoldBody)"
      stroke="#451a03"
      strokeWidth="1.5"
    />
    {/* Steel Banding & Lock */}
    <rect x="7" y="14" width="3.5" height="13" fill="#fbbf24" stroke="#451a03" strokeWidth="0.8" />
    <rect x="21.5" y="14" width="3.5" height="13" fill="#fbbf24" stroke="#451a03" strokeWidth="0.8" />
    {/* Center Golden Lock Plate */}
    <rect x="13.5" y="12" width="5" height="6.5" rx="1.5" fill="#fef08a" stroke="#451a03" strokeWidth="1" />
    <circle cx="16" cy="15" r="1" fill="#78350f" />
  </svg>
);

/** Tactical Submachine Gun / Pistol (Loadout Icon) */
export const DuoWeaponIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <path
      d="M3 10 H22 V14 H28 V16 H22 V18 H19 V26 H15 V18 H10 L7 21 L4 19 V10 Z M6 12 V14 H10 V12 H6 Z"
      fillRule="evenodd"
    />
  </svg>
);

/** Tactical Combat Helmet with Visor (Characters Icon) */
export const DuoHelmetIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    {/* Helmet Shell */}
    <path
      d="M16 4 C9 4 5 9 5 16 C5 21 7 24 9 26 L12 26 L12 22 L20 22 L20 26 L23 26 C25 24 27 21 27 16 C27 9 23 4 16 4 Z"
      fill="currentColor"
      opacity="0.9"
    />
    {/* Cyber Visor */}
    <path
      d="M8 14 C10 13 13 12.5 16 12.5 C19 12.5 22 13 24 14 L23.5 18 C21.5 17 19 16.5 16 16.5 C13 16.5 10.5 17 8.5 18 Z"
      fill="#f43f5e"
      stroke="#881337"
      strokeWidth="0.8"
    />
    {/* Chin Guard */}
    <rect x="13" y="20" width="6" height="4" rx="1" fill="#1e293b" />
  </svg>
);

/** Golden Championship Trophy (Missions Icon) */
export const DuoTrophyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="trophyGold" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    {/* Handles */}
    <path
      d="M7 9 C4 9 3 13 5 16 C7 18 10 18 10 18 M25 9 C28 9 29 13 27 16 C25 18 22 18 22 18"
      stroke="url(#trophyGold)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Cup Body */}
    <path
      d="M9 7 H23 V14 C23 18 19.5 21 16 21 C12.5 21 9 18 9 14 Z"
      fill="url(#trophyGold)"
      stroke="#78350f"
      strokeWidth="1.2"
    />
    {/* Stem & Base */}
    <path d="M14 21 H18 V24 H14 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
    <path d="M10 24 H22 V27 H10 Z" fill="url(#trophyGold)" stroke="#78350f" strokeWidth="1.2" />
    {/* Star on Cup */}
    <polygon points="16,11 17,13 19,13.5 17.5,15 18,17 16,16 14,17 14.5,15 13,13.5 15,13" fill="#ffffff" />
  </svg>
);

/** Calendar Grid with Checkmark (Daily Rewards Icon) */
export const DuoCalendarIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    {/* Calendar Body */}
    <rect x="4" y="6" width="24" height="22" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
    {/* Top Header Bar */}
    <path d="M4 10 C4 7.5 5.5 6 8 6 H24 C26.5 6 28 7.5 28 10 V12 H4 Z" fill="#10b981" />
    {/* Binder Rings */}
    <rect x="9" y="4" width="2.5" height="4" rx="1" fill="#ffffff" />
    <rect x="20.5" y="4" width="2.5" height="4" rx="1" fill="#ffffff" />
    {/* Days Grid Dots / Marks */}
    <circle cx="9" cy="17" r="1.5" fill="#64748b" />
    <circle cx="16" cy="17" r="1.5" fill="#64748b" />
    <circle cx="23" cy="17" r="1.5" fill="#64748b" />
    <circle cx="9" cy="23" r="1.5" fill="#64748b" />
    {/* Active Checkmark on Current Day */}
    <circle cx="16" cy="23" r="2.5" fill="#10b981" />
    <path d="M14.5 23 L15.5 24 L17.5 21.8" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Crossed Assault Rifles Silhouette (Used on PLAY Button) */
export const DuoCrossedRiflesIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <path
      d="M5 26 L10 21 L11.5 22.5 L7.5 26.5 L5 26 Z M11.5 19.5 L22.5 8.5 L25 8.5 L26.5 4.5 L24 4.5 L21.5 7 L19 9.5 L13.5 15 L11.5 19.5 Z M19.5 14 L23.5 18 L22 19.5 L18 15.5 L19.5 14 Z M26.5 26 L21.5 21 L20 22.5 L24 26.5 L26.5 26 Z M20 19.5 L9 8.5 L6.5 8.5 L5 4.5 L7.5 4.5 L10 7 L12.5 9.5 L18 15 L20 19.5 Z M12 14 L8 18 L9.5 19.5 L13.5 15.5 L12 14 Z"
      fillRule="evenodd"
    />
  </svg>
);

/** Two Comrades Squad Silhouette (Used on JOIN ROOM Button) */
export const DuoSquadIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    {/* Left Soldier */}
    <circle cx="11" cy="9" r="4.5" />
    <path d="M4 25 C4 19.5 7 16 11 16 C13 16 14.8 16.8 16 18 C14.5 19.8 14 22 14 25 Z" />
    {/* Right Soldier */}
    <circle cx="21" cy="11" r="5" />
    <path d="M14 25 C14 20 17 17 21 17 C25 17 28 20 28 25 Z" />
  </svg>
);

/** Wireframe Tactical Globe (Used on QUICK PLAY Button) */
export const DuoGlobeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
    <ellipse cx="16" cy="16" rx="6" ry="12" stroke="currentColor" strokeWidth="1.5" />
    <line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5" />
    <line x1="6" y1="10" x2="26" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
    <line x1="6" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1" strokeDasharray="1 1" />
  </svg>
);

/** 5-Star Rating Renderer (Replaces Unicode Stars) */
export const DuoStarRating: React.FC<{ rating: number; max?: number }> = ({ rating, max = 5 }) => (
  <span className="inline-flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        className={`w-3 h-3 ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'}`}
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ))}
  </span>
);
