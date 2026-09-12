'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { DuoPlayerProfile } from './DuoPlayerProfile';
import { DuoTopRightMenu } from './DuoTopRightMenu';
import { DuoSideMenu } from './DuoSideMenu';
import { DuoPrimaryButtons } from './DuoPrimaryButtons';
import { DuoMapSelection } from './DuoMapSelection';
import { DuoModals, DuoModalType } from './DuoModals';

interface DuoRampageHomeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => Promise<void> | void;
  onStartSolo: () => void;
  onExit?: () => void;
}

export const DuoRampageHomeScreen: React.FC<DuoRampageHomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartSolo,
  onExit,
}) => {
  const [activeModal, setActiveModal] = useState<DuoModalType>(null);
  const [selectedMapId, setSelectedMapId] = useState('abandoned_city');

  const handleOpenModal = (modal: DuoModalType) => {
    setActiveModal(modal);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-[#050711] select-none overflow-hidden flex flex-col justify-between p-2 xs:p-2.5 sm:p-4 md:p-5 text-white font-knight safe-top safe-bottom safe-left safe-right">
      {/* 1. Master High-Resolution Cinematic Dhaka Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <Image
          src="/images/duo-rampage/background.jpg"
          alt="DUO RAMPAGE Dhaka City Warzone"
          fill
          priority
          className="object-cover object-center transform scale-100 transition-transform duration-1000 ease-out"
          sizes="100vw"
        />

        {/* Atmospheric Fiery Lighting & Subtle Edge Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/40 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/50 pointer-events-none" />

        {/* Floating Sparks & Embers Rising From Burning Street */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute bottom-12 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-400 blur-[1px] animate-pulse" />
          <div className="absolute bottom-20 left-1/3 w-1 h-1 rounded-full bg-orange-500 blur-[1px] animate-ping" />
          <div className="absolute bottom-16 right-1/4 w-2 h-2 rounded-full bg-yellow-400 blur-[1px] animate-pulse" />
          <div className="absolute bottom-28 right-1/3 w-1 h-1 rounded-full bg-red-400 blur-[1px] animate-ping" />
          <div className="absolute bottom-8 left-1/2 w-1.5 h-1.5 rounded-full bg-amber-300 blur-[1px] animate-pulse" />
        </div>
      </div>

      {/* 2. Top Header Navigation Bar */}
      <header className="relative w-full flex items-center justify-between z-20 gap-2 shrink-0">
        {/* Top-Left: Player Profile ("User Card") - Strictly constrained dimensions */}
        <DuoPlayerProfile name="RAMPAGE#001" level={1} xpPercent={65} />

        {/* Top-Right: Settings, How to Play, Friends, Leaderboard, Exit */}
        <DuoTopRightMenu
          onOpenModal={(modal) => handleOpenModal(modal)}
          onExit={onExit}
        />
      </header>

      {/* 3. Middle Section: Landscape vs Portrait Responsive Layout */}
      <main className="relative w-full flex-1 flex flex-col landscape:flex-row sm:flex-row items-center justify-between z-20 my-auto py-1 sm:py-2 min-h-0">
        {/* Left Side Menu - Vertical on Landscape/Desktop, strictly never overlaps header */}
        <div className="hidden landscape:flex sm:flex shrink-0 items-center my-auto">
          <DuoSideMenu
            onOpenModal={(modal) => handleOpenModal(modal)}
            orientation="vertical"
          />
        </div>

        {/* Center Action Area: DUO RAMPAGE Logo & Primary 3D Action Buttons */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-1 sm:-mt-2 md:-mt-3 w-full">
          {/* 3D Action Logo */}
          <div className="relative w-44 xs:w-56 sm:w-72 md:w-[380px] h-12 xs:h-16 sm:h-22 md:h-28 flex flex-col items-center justify-center drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
            <Image
              src="/images/duo-rampage/duo_rampage_logo.png"
              alt="DUO RAMPAGE"
              fill
              className="object-contain filter drop-shadow-[0_8px_25px_rgba(245,158,11,0.5)]"
              priority
            />
          </div>

          {/* Action Tagline */}
          <div className="text-[7.5px] xs:text-[8.5px] sm:text-xs md:text-sm font-knight text-cyan-200 tracking-wider uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,1)] -mt-1 mb-2 sm:mb-3 bg-slate-950/70 backdrop-blur-xs px-2.5 sm:px-3.5 py-0.5 rounded-full border border-cyan-500/40 text-center">
            TWO PLAYERS • ONE MISSION • ENDLESS ACTION
          </div>

          {/* 3 Large Action Buttons: JOIN ROOM / PLAY / QUICK PLAY */}
          <DuoPrimaryButtons
            onCreateRoom={onCreateRoom}
            onJoinRoom={() => handleOpenModal('join_room')}
            onQuickPlay={onStartSolo}
          />

          {/* Mobile Portrait Only: Sleek Quick-Action Dock between Buttons and Map Carousel */}
          <div className="flex landscape:hidden sm:hidden justify-center items-center py-2 w-full shrink-0">
            <DuoSideMenu
              onOpenModal={(modal) => handleOpenModal(modal)}
              orientation="horizontal"
            />
          </div>
        </div>

        {/* Right side spacer to balance left vertical menu on landscape */}
        <div className="w-9 xs:w-10 sm:w-12 md:w-14 shrink-0 pointer-events-none hidden landscape:block sm:block" />
      </main>

      {/* 4. Bottom Section: Map Carousel & Footer Information */}
      <footer className="relative w-full flex flex-col items-center gap-1 z-20 shrink-0">
        {/* Map Selection Carousel - Clean touch/drag scroll, NO arrows */}
        <DuoMapSelection
          selectedMapId={selectedMapId}
          onSelectMap={(id) => setSelectedMapId(id)}
        />

        {/* Footer Slogan & Game Version */}
        <div className="w-full flex items-center justify-between px-2 sm:px-3 text-[8.5px] sm:text-xs font-knight tracking-widest text-slate-400 select-none">
          <span className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            REAL FRIENDS. REAL CHAOS.
          </span>
          <span className="font-knight text-slate-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            v0.1.0
          </span>
        </div>
      </footer>

      {/* 5. Popups & Modals */}
      <DuoModals
        activeModal={activeModal}
        onClose={handleCloseModal}
        onJoinRoom={async (code) => {
          handleCloseModal();
          await onJoinRoom(code);
        }}
        createdRoomCode="742918"
        onStartRoomGame={onStartSolo}
      />
    </div>
  );
};
