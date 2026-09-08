import { GameCanvas } from '@/components/GameCanvas';

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden flex flex-col bg-slate-950">
      <GameCanvas />
    </main>
  );
}
