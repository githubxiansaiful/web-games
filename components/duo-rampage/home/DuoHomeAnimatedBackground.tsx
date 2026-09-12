'use client';

import React, { useEffect, useState } from 'react';

interface Ember {
  id: number;
  left: number;
  dur: number;
  delay: number;
  dx: string;
  size: number;
}

interface Drop {
  id: number;
  left: number;
  dur: number;
  delay: number;
  opacity: number;
}

export const DuoHomeAnimatedBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<{ embers: Ember[]; drops: Drop[] }>({
    embers: [],
    drops: [],
  });

  useEffect(() => {
    setMounted(true);
    const emberCount = 42;
    const embers: Ember[] = Array.from({ length: emberCount }, (_, i) => ({
      id: i,
      left: 2 + Math.random() * 70,
      dur: 5 + Math.random() * 6,
      delay: Math.random() * 10,
      dx: `${Math.random() * 60 - 30}px`,
      size: 2 + Math.random() * 3,
    }));

    const dropCount = 55;
    const drops: Drop[] = Array.from({ length: dropCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      dur: 0.6 + Math.random() * 0.6,
      delay: Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.4,
    }));

    setParticles({ embers, drops });
  }, []);

  return (
    <div className="dhaka-bg-container absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
      <style>{`
        .dhaka-bg-container {
          --ink: #07090c;
          --fire: #ff6a2e;
          --fire-hot: #ffb14d;
          --neon-green: #3dffa0;
          --neon-blue: #3ecbff;
          --neon-pink: #ff3d81;
          --flag-red: #e0261f;
          --paper: #e9e6df;
          --smoke: #1a1c22;
        }

        /* Background photo */
        .dhaka-bg-photo {
          position: absolute;
          inset: 0;
          background-image: url("/images/duo-rampage/dhaka_uprising_bg.jpg");
          background-size: cover;
          background-position: center 38%;
          filter: saturate(1.12) contrast(1.06) brightness(0.92);
          transform: scale(1.06);
          animation: dhakaDrift 26s ease-in-out infinite alternate;
        }
        @keyframes dhakaDrift {
          0% { transform: scale(1.06) translate(0, 0); }
          100% { transform: scale(1.1) translate(-1.2%, -0.6%); }
        }

        /* Helicopter spotlights */
        .dhaka-beam {
          position: absolute;
          width: 140px;
          height: 600px;
          top: 6%;
          background: linear-gradient(180deg, rgba(220, 235, 255, 0.55), rgba(220, 235, 255, 0.0) 75%);
          clip-path: polygon(48% 0%, 52% 0%, 100% 100%, 0% 100%);
          filter: blur(1px);
          mix-blend-mode: screen;
          opacity: 0.75;
          transform-origin: top center;
          pointer-events: none;
        }
        .dhaka-beam.one {
          left: 60%;
          animation: dhakaSweep1 9s ease-in-out infinite;
        }
        .dhaka-beam.two {
          left: 70%;
          top: 9%;
          height: 520px;
          animation: dhakaSweep2 11s ease-in-out infinite;
          opacity: 0.55;
        }
        @keyframes dhakaSweep1 {
          0%, 100% { transform: rotate(8deg); }
          50% { transform: rotate(-14deg); }
        }
        @keyframes dhakaSweep2 {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(16deg); }
        }

        /* Helicopter position lights */
        .dhaka-heli-light {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          pointer-events: none;
        }
        .dhaka-heli-light.red {
          left: 62.5%;
          top: 6.2%;
          background: #ff2d2d;
          box-shadow: 0 0 6px 2px rgba(255, 45, 45, 0.9);
          animation: dhakaBlink 1.1s infinite;
        }
        .dhaka-heli-light.white {
          left: 71.8%;
          top: 9.6%;
          background: #eaf4ff;
          box-shadow: 0 0 6px 2px rgba(220, 238, 255, 0.9);
          animation: dhakaBlink 1.4s infinite 0.3s;
        }
        @keyframes dhakaBlink {
          0%, 100% { opacity: 0; }
          5% { opacity: 1; }
          12% { opacity: 0.2; }
          18% { opacity: 1; }
          28% { opacity: 0; }
        }

        /* Neon sign glow flickers */
        .dhaka-neon-glow {
          position: absolute;
          border-radius: 6px;
          filter: blur(14px);
          mix-blend-mode: screen;
          pointer-events: none;
        }
        .dhaka-neon-glow.dhaka-sign {
          left: 2%;
          top: 8%;
          width: 19%;
          height: 9%;
          background: var(--neon-green);
          opacity: .5;
          animation: dhakaFlicker 4.4s infinite;
        }
        .dhaka-neon-glow.left-red {
          left: 0%;
          top: 26%;
          width: 15%;
          height: 9%;
          background: var(--flag-red);
          opacity: .42;
          animation: dhakaFlicker 5.6s infinite 0.3s;
        }
        .dhaka-neon-glow.right-blue {
          right: 0%;
          top: 24%;
          width: 16%;
          height: 14%;
          background: var(--neon-blue);
          opacity: .4;
          animation: dhakaFlicker 3.7s infinite 0.6s;
        }
        .dhaka-neon-glow.right-pink {
          right: 1%;
          top: 60%;
          width: 12%;
          height: 9%;
          background: var(--neon-pink);
          opacity: .38;
          animation: dhakaFlicker 5s infinite 1.1s;
        }
        .dhaka-neon-glow.sign-center {
          left: 60%;
          top: 34%;
          width: 16%;
          height: 12%;
          background: #2fffa6;
          opacity: .28;
          animation: dhakaFlicker 6.2s infinite 0.8s;
        }

        @keyframes dhakaFlicker {
          0%, 19%, 21%, 23%, 80%, 100% { opacity: .45; }
          20% { opacity: .08; }
          22% { opacity: .55; }
          50% { opacity: .5; }
          52% { opacity: .15; }
          54% { opacity: .42; }
        }

        /* Smoke columns */
        .dhaka-smoke {
          position: absolute;
          bottom: 32%;
          width: 220px;
          height: 70%;
          background: radial-gradient(closest-side, rgba(40, 42, 48, 0.55), rgba(40, 42, 48, 0));
          filter: blur(6px);
          opacity: 0.5;
          animation: dhakaSmokeUp 14s ease-in infinite;
          pointer-events: none;
        }
        .dhaka-smoke.a { left: 35%; animation-duration: 16s; }
        .dhaka-smoke.b { left: 40%; width: 160px; animation-duration: 12s; animation-delay: 3s; opacity: 0.35; }
        .dhaka-smoke.c { left: 8%; width: 180px; bottom: 38%; animation-duration: 18s; animation-delay: 1.5s; opacity: 0.4; }
        .dhaka-smoke.d { left: 20%; width: 130px; bottom: 34%; animation-duration: 13s; animation-delay: 5s; opacity: 0.3; }
        .dhaka-smoke.e { left: 46%; width: 110px; bottom: 36%; animation-duration: 15s; animation-delay: 2.2s; opacity: 0.3; }
        .dhaka-smoke.f { left: 53%; width: 150px; bottom: 33%; animation-duration: 20s; animation-delay: 6.5s; opacity: 0.32; }
        .dhaka-smoke.g { left: 2%; width: 200px; bottom: 30%; animation-duration: 22s; animation-delay: 0.8s; opacity: 0.28; }

        @keyframes dhakaSmokeUp {
          0% { transform: translateY(10%) scale(0.9); opacity: 0; }
          15% { opacity: 0.5; }
          100% { transform: translateY(-60%) scale(1.5); opacity: 0; }
        }

        /* Drifting haze */
        .dhaka-haze {
          position: absolute;
          left: -20%;
          top: 0%;
          width: 140%;
          height: 60%;
          background:
            radial-gradient(ellipse 30% 40% at 30% 30%, rgba(60, 62, 70, 0.28), transparent 70%),
            radial-gradient(ellipse 25% 35% at 65% 45%, rgba(60, 62, 70, 0.22), transparent 70%),
            radial-gradient(ellipse 35% 30% at 85% 20%, rgba(60, 62, 70, 0.2), transparent 70%);
          filter: blur(10px);
          opacity: 0.55;
          mix-blend-mode: screen;
          pointer-events: none;
          animation: dhakaHazeDrift 40s linear infinite;
        }
        @keyframes dhakaHazeDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(6%); }
        }

        /* Rising Embers */
        .dhaka-ember {
          position: absolute;
          bottom: 6%;
          border-radius: 50%;
          background: var(--fire-hot);
          box-shadow: 0 0 6px 2px rgba(255, 150, 60, 0.9);
          opacity: 0;
          animation-name: dhakaRise;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
        }
        @keyframes dhakaRise {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translate(var(--dx), -70vh) scale(0.3); opacity: 0; }
        }

        /* Rain */
        .dhaka-drop {
          position: absolute;
          top: -10%;
          width: 1px;
          height: 60px;
          background: linear-gradient(180deg, rgba(200, 220, 255, 0), rgba(200, 220, 255, 0.55));
          animation: dhakaFall linear infinite;
        }
        @keyframes dhakaFall {
          0% { transform: translateY(0); }
          100% { transform: translateY(120vh); }
        }

        /* Firelight glow */
        .dhaka-firelight {
          position: absolute;
          left: -5%;
          bottom: 0;
          width: 70%;
          height: 55%;
          background: radial-gradient(ellipse at 30% 100%, rgba(255, 120, 40, 0.55), rgba(255, 90, 20, 0.18) 45%, transparent 75%);
          mix-blend-mode: screen;
          pointer-events: none;
          animation: dhakaFireFlicker 2.6s infinite;
        }
        @keyframes dhakaFireFlicker {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          18% { opacity: 0.55; transform: scale(0.97); }
          32% { opacity: 0.9; transform: scale(1.03); }
          47% { opacity: 0.6; transform: scale(0.98); }
          63% { opacity: 0.85; transform: scale(1.02); }
          78% { opacity: 0.5; transform: scale(0.96); }
          90% { opacity: 0.8; transform: scale(1.01); }
        }

        /* Lightning strikes */
        .dhaka-lightning {
          position: absolute;
          inset: 0;
          background: #e8f2ff;
          opacity: 0;
          mix-blend-mode: overlay;
          pointer-events: none;
          animation: dhakaThunder 9s infinite;
        }
        @keyframes dhakaThunder {
          0%, 100% { opacity: 0; }
          92.5% { opacity: 0; }
          92.6% { opacity: 0.85; }
          92.7% { opacity: 0.1; }
          92.9% { opacity: 0.6; }
          93.1% { opacity: 0; }
          93.4% { opacity: 0.4; }
          93.6% { opacity: 0; }
        }
        .dhaka-lightning.lightning2 {
          animation: dhakaThunder2 15s infinite 4s;
        }
        @keyframes dhakaThunder2 {
          0%, 100% { opacity: 0; }
          60% { opacity: 0; }
          60.1% { opacity: 0.7; }
          60.3% { opacity: 0.05; }
          60.5% { opacity: 0.5; }
          60.7% { opacity: 0; }
        }

        /* Colour grading & vignettes */
        .dhaka-grade {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% 115%, rgba(224, 38, 31, 0.28), transparent 55%),
            linear-gradient(180deg, rgba(5, 8, 14, 0.55) 0%, rgba(5, 8, 14, 0.08) 30%, rgba(5, 8, 14, 0.15) 55%, rgba(5, 8, 14, 0.92) 100%),
            linear-gradient(90deg, rgba(5, 8, 14, 0.55) 0%, transparent 18%, transparent 82%, rgba(5, 8, 14, 0.55) 100%);
          mix-blend-mode: normal;
          pointer-events: none;
        }
        .dhaka-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0px, rgba(0, 0, 0, 0.12) 1px, transparent 2px, transparent 3px);
          mix-blend-mode: overlay;
          opacity: 0.35;
          pointer-events: none;
        }
        .dhaka-vignette {
          position: absolute;
          inset: 0;
          box-shadow: inset 0 0 22vw 4vw rgba(0, 0, 0, 0.75);
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .dhaka-bg-container * {
            animation: none !important;
          }
        }
      `}</style>

      {/* 1. Base Photo */}
      <div className="dhaka-bg-photo" />

      {/* 2. Helicopter Spotlights & Beacon Lights */}
      <div className="dhaka-beam one" />
      <div className="dhaka-beam two" />
      <div className="dhaka-heli-light red" />
      <div className="dhaka-heli-light white" />

      {/* 3. Neon Sign Glow Flickers */}
      <div className="dhaka-neon-glow dhaka-sign" />
      <div className="dhaka-neon-glow left-red" />
      <div className="dhaka-neon-glow right-blue" />
      <div className="dhaka-neon-glow right-pink" />
      <div className="dhaka-neon-glow sign-center" />

      {/* 4. Smoke Plumes & Atmospheric Haze */}
      <div className="dhaka-smoke a" />
      <div className="dhaka-smoke b" />
      <div className="dhaka-smoke c" />
      <div className="dhaka-smoke d" />
      <div className="dhaka-smoke e" />
      <div className="dhaka-smoke f" />
      <div className="dhaka-smoke g" />
      <div className="dhaka-haze" />

      {/* 5. Embers & Cyber Rain */}
      {mounted && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            {particles.embers.map((e) => (
              <div
                key={`ember-${e.id}`}
                className="dhaka-ember"
                style={{
                  left: `${e.left}%`,
                  width: `${e.size}px`,
                  height: `${e.size}px`,
                  animationDuration: `${e.dur}s`,
                  animationDelay: `${e.delay}s`,
                  ['--dx' as any]: e.dx,
                }}
              />
            ))}
          </div>

          <div className="absolute inset-0 pointer-events-none opacity-35">
            {particles.drops.map((d) => (
              <div
                key={`drop-${d.id}`}
                className="dhaka-drop"
                style={{
                  left: `${d.left}%`,
                  animationDuration: `${d.dur}s`,
                  animationDelay: `${d.delay}s`,
                  opacity: d.opacity,
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* 6. Ground Firelight & Sky Lightning Strikes */}
      <div className="dhaka-firelight" />
      <div className="dhaka-lightning" />
      <div className="dhaka-lightning lightning2" />

      {/* 7. Film Grade, CRT Scanlines & Vignette */}
      <div className="dhaka-grade" />
      <div className="dhaka-scanlines" />
      <div className="dhaka-vignette" />
    </div>
  );
};
