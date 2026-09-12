'use client';

import React, { useState } from 'react';
import { X, LogIn, AlertCircle } from 'lucide-react';

interface DuoRampageJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}

export const DuoRampageJoinModal: React.FC<DuoRampageJoinModalProps> = ({
  isOpen,
  onClose,
  onJoin,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onJoin(code);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Room not found! Check your 6-digit code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">
          JOIN DUO ROOM
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Enter the 6-digit room code shared by your teammate.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center gap-2.5 text-red-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">
              6-DIGIT ROOM CODE
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="#123456"
              maxLength={8}
              autoFocus
              className="w-full text-center py-3.5 px-4 bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-2xl font-mono text-2xl font-black text-amber-400 placeholder:text-slate-700 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-cyan-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>CONNECT TO ROOM</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
