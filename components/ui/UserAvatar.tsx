'use client';

import React, { useState } from 'react';

interface UserAvatarProps {
  avatar?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackEmoji?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name,
  size = 'md',
  className = '',
  fallbackEmoji = '🎮',
}) => {
  const [hasError, setHasError] = useState(false);

  const isUrl = Boolean(
    avatar &&
      (avatar.startsWith('http://') ||
        avatar.startsWith('https://') ||
        avatar.startsWith('/'))
  );

  const sizeMap = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (isUrl && !hasError) {
    return (
      <img
        src={avatar!}
        alt={name || 'Player Avatar'}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`${currentSize} rounded-full object-cover border border-slate-700/80 shadow-inner shrink-0 ${className}`}
      />
    );
  }

  // If avatar is a non-URL string (e.g. emoji like '👑' or '🕹️')
  if (avatar && !isUrl) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 select-none ${currentSize} ${className}`}
      >
        {avatar}
      </span>
    );
  }

  // Fallback to name initial
  if (name && name.trim().length > 0) {
    const initial = name.trim().charAt(0).toUpperCase();
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-black text-white shrink-0 shadow-sm select-none ${currentSize} ${className}`}
      >
        {initial}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${currentSize} ${className}`}
    >
      {fallbackEmoji}
    </span>
  );
};
