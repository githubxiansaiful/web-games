'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

export const OrientationNotice: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
        setIsPortrait(portrait);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md border border-indigo-500/50 rounded-2xl px-3.5 py-2 text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw]">
      <div className="p-1.5 bg-indigo-500/20 rounded-xl text-indigo-400">
        <Smartphone className="w-4 h-4 rotate-90" />
      </div>
      <div className="text-xs">
        <span className="font-bold text-indigo-300">Landscape Recommended: </span>
        <span className="text-slate-300">Rotate device for optimal view!</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
        aria-label="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
