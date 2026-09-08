'use client';

import dynamic from 'next/dynamic';

const GameWorldHome = dynamic(
  () => import('@/components/home/GameWorldHome').then((mod) => mod.GameWorldHome),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-white select-none">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-black text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-cyan-300 animate-pulse">
          LOADING XIAN&apos;S GAME WORLD...
        </span>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="relative w-full min-h-screen flex flex-col bg-slate-950">
      <GameWorldHome />
    </main>
  );
}
