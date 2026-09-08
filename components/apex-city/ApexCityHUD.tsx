'use client';

import React, { useState, useEffect } from 'react';
import { EventBus } from '@/game/core/EventBus';
import { SoundManager } from '@/game/core/SoundManager';
import { ApexCityMinimap } from './ApexCityMinimap';
import {
  Volume2,
  VolumeX,
  Shield,
  Heart,
  DollarSign,
  Star,
  Gauge,
  Crosshair,
  AlertTriangle,
  Compass,
} from 'lucide-react';

interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  cash: number;
  isDriving: boolean;
  speed: number;
}

interface WeaponState {
  name: string;
  icon: string;
  currentAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
}

interface MissionState {
  title: string;
  subtitle?: string;
  currentObjective: string;
  progressDetail?: string;
}

export const ApexCityHUD: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    armor: 100,
    maxArmor: 100,
    cash: 250,
    isDriving: false,
    speed: 0,
  });

  const [weapon, setWeapon] = useState<WeaponState>({
    name: 'Tactical 9mm',
    icon: '🔫',
    currentAmmo: 12,
    reserveAmmo: 999,
    isReloading: false,
  });

  const [wanted, setWanted] = useState<{
    level: number;
    isEscaping: boolean;
  }>({
    level: 0,
    isEscaping: false,
  });

  const [interactionPrompt, setInteractionPrompt] = useState<{
    text: string;
    visible: boolean;
  }>({ text: '', visible: false });

  const [mission, setMission] = useState<MissionState | null>({
    title: 'The Downtown Drop',
    subtitle: 'Contract 1: Smuggled Tech Retrieval',
    currentObjective: 'Locate your cyan Apex GT coupe and press [F] to enter.',
  });

  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const eventBus = EventBus.getInstance();
    const sound = SoundManager.getInstance();
    setIsMuted(sound.getIsMuted());

    const onStats = (data: PlayerStats) => setStats(data);
    const onWeapon = (data: WeaponState) => setWeapon(data);
    const onWanted = (data: { wantedLevel: number; isEscaping: boolean }) =>
      setWanted({ level: data.wantedLevel, isEscaping: data.isEscaping });
    const onPrompt = (data: { text: string; visible: boolean }) =>
      setInteractionPrompt(data);

    const onMissionStart = (data: any) => {
      setMission({
        title: data.title,
        subtitle: data.subtitle,
        currentObjective: data.currentObjective,
      });
      showBanner(`MISSION STARTED: ${data.title}`);
    };

    const onMissionObjComplete = (data: any) => {
      setMission((prev) =>
        prev
          ? {
              ...prev,
              currentObjective: data.nextObjective,
              progressDetail: undefined,
            }
          : null
      );
      showBanner(`OBJECTIVE UPDATED!`);
    };

    const onMissionProgress = (data: { detail: string }) => {
      setMission((prev) => (prev ? { ...prev, progressDetail: data.detail } : null));
    };

    const onMissionComplete = (data: any) => {
      showBanner(`MISSION COMPLETE! +$${data.rewardMoney}`);
    };

    const onHeatEscaped = (data: any) => {
      showBanner(`LOST THE HEAT! +$${data.rewardCash}`);
    };

    eventBus.on('PLAYER_STATS_CHANGED', onStats);
    eventBus.on('WEAPON_STATE_CHANGED', onWeapon);
    eventBus.on('WANTED_LEVEL_CHANGED', onWanted);
    eventBus.on('INTERACTION_PROMPT', onPrompt);
    eventBus.on('MISSION_STARTED', onMissionStart);
    eventBus.on('MISSION_OBJECTIVE_COMPLETED', onMissionObjComplete);
    eventBus.on('MISSION_PROGRESS_UPDATE', onMissionProgress);
    eventBus.on('MISSION_COMPLETED', onMissionComplete);
    eventBus.on('HEAT_ESCAPED', onHeatEscaped);

    return () => {
      eventBus.off('PLAYER_STATS_CHANGED', onStats);
      eventBus.off('WEAPON_STATE_CHANGED', onWeapon);
      eventBus.off('WANTED_LEVEL_CHANGED', onWanted);
      eventBus.off('INTERACTION_PROMPT', onPrompt);
      eventBus.off('MISSION_STARTED', onMissionStart);
      eventBus.off('MISSION_OBJECTIVE_COMPLETED', onMissionObjComplete);
      eventBus.off('MISSION_PROGRESS_UPDATE', onMissionProgress);
      eventBus.off('MISSION_COMPLETED', onMissionComplete);
      eventBus.off('HEAT_ESCAPED', onHeatEscaped);
    };
  }, []);

  const showBanner = (text: string) => {
    setBannerNotice(text);
    setTimeout(() => {
      setBannerNotice((curr) => (curr === text ? null : curr));
    }, 4000);
  };

  const toggleSound = () => {
    const sound = SoundManager.getInstance();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* 1. Crosshair in Center of Screen */}
      {!stats.isDriving && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none opacity-80">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
          <div className="absolute w-5 h-5 border border-cyan-400/40 rounded-full" />
        </div>
      )}

      {/* 2. Top Banner Notification */}
      {bannerNotice && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-2xl flex items-center gap-2 border border-yellow-200">
            <AlertTriangle className="w-4 h-4" />
            <span>{bannerNotice}</span>
          </div>
        </div>
      )}

      {/* 3. Top Left: Health, Armor, and Wanted Stars */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto">
        {/* Vital Status Card */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl min-w-[200px] flex flex-col gap-2">
          {/* Health Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-400">
                <Heart className="w-3.5 h-3.5 fill-emerald-400" />
                <span>HEALTH</span>
              </span>
              <span className="font-mono text-white">{Math.round(stats.health)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150"
                style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Armor Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1 text-cyan-400">
                <Shield className="w-3.5 h-3.5 fill-cyan-400" />
                <span>ARMOR</span>
              </span>
              <span className="font-mono text-white">{Math.round(stats.armor)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-150"
                style={{ width: `${(stats.armor / stats.maxArmor) * 100}%` }}
              />
            </div>
          </div>

          {/* Cash Display */}
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold">CASH</span>
            <span className="font-mono font-black text-emerald-400 text-sm tracking-tight flex items-center">
              ${stats.cash.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Wanted Stars (0 to 5 ⭐) */}
        {wanted.level > 0 && (
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 shadow-xl backdrop-blur-md ${
              wanted.isEscaping
                ? 'bg-slate-900/90 border-yellow-500/60 animate-pulse'
                : 'bg-red-950/90 border-red-500/70'
            }`}
          >
            {[1, 2, 3, 4, 5].map((starIdx) => (
              <Star
                key={starIdx}
                className={`w-4 h-4 ${
                  starIdx <= wanted.level
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-700'
                }`}
              />
            ))}
            <span className="text-[10px] font-black text-white uppercase ml-1.5">
              {wanted.isEscaping ? 'EVADING HEAT' : 'WANTED'}
            </span>
          </div>
        )}
      </div>

      {/* 4. Top Right: Weapon & Ammo Display + Sound & Exit Controls */}
      <div className="absolute top-4 right-4 flex items-start gap-3 pointer-events-auto">
        {/* Weapon Card */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3">
          <div className="text-2xl">{weapon.icon}</div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {weapon.name}
            </div>
            <div className="font-mono font-black text-white text-base leading-none flex items-baseline gap-1">
              <span>{weapon.currentAmmo}</span>
              <span className="text-xs text-slate-500 font-normal">
                / {weapon.reserveAmmo > 900 ? '∞' : weapon.reserveAmmo}
              </span>
              {weapon.isReloading && (
                <span className="text-[10px] text-amber-400 animate-spin ml-1">
                  ↻
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Audio Mute & Exit Game Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={toggleSound}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 transition cursor-pointer shadow-lg"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-red-900/80 border border-slate-700/80 hover:border-red-600 rounded-xl text-xs font-black text-slate-200 hover:text-white transition cursor-pointer shadow-lg"
          >
            Exit
          </button>
        </div>
      </div>

      {/* 5. Center Bottom: Interaction Prompt (e.g. Press [F] to enter car) */}
      {interactionPrompt.visible && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 animate-pulse">
          <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border border-cyan-400/80 backdrop-blur-md text-cyan-300 font-bold text-xs tracking-wide shadow-2xl flex items-center gap-2">
            <span>{interactionPrompt.text}</span>
          </div>
        </div>
      )}

      {/* 6. Bottom Left: Radar Minimap */}
      <div className="absolute bottom-4 left-4">
        <ApexCityMinimap />
      </div>

      {/* 7. Bottom Right: Speedometer Gauge (When in Vehicle) OR Mission Card (On Foot) */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2.5">
        {stats.isDriving ? (
          <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4">
            <Gauge className="w-6 h-6 text-cyan-400" />
            <div className="text-right">
              <div className="font-mono font-black text-3xl text-white tracking-tight leading-none">
                {stats.speed}
              </div>
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                KM/H
              </div>
            </div>
          </div>
        ) : null}

        {/* Mission Objectives Card */}
        {mission && (
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-2xl max-w-xs space-y-1.5 text-right">
            <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
              {mission.title}
            </div>
            <div className="text-xs font-semibold text-slate-200 leading-snug">
              {mission.currentObjective}
            </div>
            {mission.progressDetail && (
              <div className="text-[11px] font-mono font-bold text-cyan-400">
                {mission.progressDetail}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. Controls Guide Legend Overlay (Bottom Center) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[10px] font-bold text-slate-500 bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800/40">
        <span>[WASD] Move/Drive</span>
        <span>•</span>
        <span>[Shift] Sprint</span>
        <span>•</span>
        <span>[Space] Jump/Brake</span>
        <span>•</span>
        <span>[F] Enter/Exit Car</span>
        <span>•</span>
        <span>[Click] Fire</span>
        <span>•</span>
        <span>[R] Reload</span>
        <span>•</span>
        <span>[1-3] Weapons</span>
      </div>
    </div>
  );
};
