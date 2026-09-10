/**
 * Zombie Haven - In-Game Tactical HUD
 * Health bar, Stamina bar, Weapon status, Wave counter, Teammate radar/compass,
 * dynamic crosshair, hitmarkers, scavenge prompts, and hold-E revive circular channel.
 */

'use client';

import React from 'react';
import {
  Heart,
  Zap,
  Volume2,
  VolumeX,
  Navigation,
  AlertTriangle,
  Skull,
  Radio,
  Package,
} from 'lucide-react';
import { ZombieGameEngine } from '@/game/zombie-haven/ZombieGameEngine';
import { zombieAudio } from './ZombieHavenAudio';

interface ZombieHavenHUDProps {
  engine: ZombieGameEngine;
  onExit: () => void;
}

export const ZombieHavenHUD: React.FC<ZombieHavenHUDProps> = ({ engine, onExit }) => {
  const player = engine.localPlayer;
  const weapons = engine.weapons;
  const activeConfig = weapons.getActiveConfig();
  const activeState = weapons.getActiveState();
  const wave = engine.waves.state;
  const remotePlayer = engine.remotePlayerModel;

  const [isMuted, setIsMuted] = React.useState(zombieAudio.getIsMuted());

  const toggleMute = () => {
    const next = zombieAudio.toggleMute();
    setIsMuted(next);
  };

  const hpPercent = Math.max(0, Math.min(100, (player.stats.health / player.stats.maxHealth) * 100));
  const staminaPercent = Math.max(0, Math.min(100, (player.stats.stamina / player.stats.maxStamina) * 100));
  const isLowHealth = player.stats.health < 30 && !player.stats.isDowned;

  // Calculate distance to teammate if present
  let teammateDist = 0;
  let teammateAngle = 0;
  if (remotePlayer) {
    const dx = remotePlayer.group.position.x - player.group.position.x;
    const dz = remotePlayer.group.position.z - player.group.position.z;
    teammateDist = Math.round(Math.hypot(dx, dz));

    // Direction relative to player heading
    const worldAngle = Math.atan2(dx, dz);
    teammateAngle = worldAngle - player.group.rotation.y;
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-3 sm:p-5 z-20">
      {/* 1. Low Health Crimson Vignette Overlay */}
      {isLowHealth && <div className="absolute inset-0 blood-vignette animate-pulse pointer-events-none" />}

      {/* Downed Blackout Overlay (only shown in co-op mode with teammate) */}
      {player.stats.isDowned && remotePlayer && (
        <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
          <div className="p-4 rounded-2xl bg-black/80 border-2 border-red-600 shadow-2xl text-center space-y-2 max-w-sm">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto animate-bounce" />
            <h2 className="font-zombie text-3xl text-red-500 zombie-glow-red tracking-wider">YOU ARE DOWNED!</h2>
            <p className="text-xs font-bold text-slate-300">
              Bleeding out in{' '}
              <span className="text-red-400 font-mono font-black text-sm">
                {Math.max(0, Math.round(player.stats.bleedoutTimer))}s
              </span>
            </p>
            <p className="text-[11px] text-slate-400">Wait for your teammate to hold [E] and revive you!</p>
          </div>
        </div>
      )}

      {/* 2. TOP ROW: Top Bar, Wave Counter, Intermission Banner, Settings */}
      <div className="w-full flex items-start justify-between">
        {/* Left: Teammate Status Card */}
        {remotePlayer ? (
          <div className="bg-slate-950/85 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                remotePlayer.stats.isDowned
                  ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse'
                  : 'bg-indigo-950/70 border-indigo-500/40 text-indigo-400'
              }`}
            >
              <Radio className="w-4 h-4" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-white tracking-wide">{engine.stats.player2Name}</span>
                <span
                  className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                    remotePlayer.stats.isDowned ? 'bg-red-600 text-white animate-bounce' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {remotePlayer.stats.isDowned ? 'DOWNED' : `${teammateDist}m`}
                </span>
              </div>

              {/* Partner Health Bar */}
              <div className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    remotePlayer.stats.isDowned ? 'bg-red-600' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, remotePlayer.stats.health))}%`,
                  }}
                />
              </div>
            </div>

            {/* Compass pointer arrow */}
            <div
              className="p-1 rounded-full bg-slate-900 border border-slate-700 text-amber-400 transition-transform duration-100"
              style={{ transform: `rotate(${teammateAngle}rad)` }}
              title="Teammate Bearing"
            >
              <Navigation className="w-3.5 h-3.5" />
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>SOLO SURVIVAL</span>
          </div>
        )}

        {/* Center: Wave Badge & Countdown */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-red-600/60 shadow-2xl shadow-red-950/50 flex items-center gap-3">
            <Skull className="w-5 h-5 text-red-500 animate-pulse" />
            <div className="text-center">
              <span className="font-zombie text-2xl sm:text-3xl text-red-500 zombie-glow-red tracking-wider leading-none">
                WAVE {wave.currentWave}
              </span>
              <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                {wave.state === 'active'
                  ? `${wave.zombiesRemaining} ZOMBIES REMAINING`
                  : `PREP TIME: ${Math.max(0, Math.ceil(wave.intermissionTimer))}s`}
              </div>
            </div>
          </div>

          {/* Intermission Announcement Banner */}
          {wave.state === 'intermission' && (
            <div className="mt-2 bg-amber-500/20 border border-amber-500/50 px-3 py-1 rounded-full backdrop-blur-sm text-[11px] font-black text-amber-300 animate-pulse tracking-wide">
              ⚡ WAVE CLEARED! SCAVENGE & RELOAD BEFORE NEXT HORDE
            </div>
          )}
        </div>

        {/* Right: Quick Controls & Exit */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onExit}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <span>← Exit</span>
          </button>
        </div>
      </div>

      {/* 3. CENTER SCREEN: Crosshair, Hitmarkers, Prompts */}
      <div className="relative flex-1 flex items-center justify-center pointer-events-none">
        {/* Dynamic Tactical Crosshair (Spec Section 18 & 23) */}
        {!player.stats.isDowned && (
          <div className="relative flex items-center justify-center pointer-events-none">
            {/* Center pinpoint dot */}
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-100 ${
                player.stats.isAiming
                  ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)] scale-110'
                  : 'bg-white/85 shadow-[0_0_2px_rgba(0,0,0,0.8)]'
              }`}
            />

            {/* 4 Reticle Ticks with dynamic gap that contracts on ADS */}
            {/* Top tick */}
            <div
              className={`absolute w-0.5 h-2 rounded-full transition-all duration-100 ${
                player.stats.isAiming
                  ? 'bg-cyan-400 -translate-y-2 opacity-95'
                  : 'bg-white/70 -translate-y-3.5 opacity-75'
              }`}
            />
            {/* Bottom tick */}
            <div
              className={`absolute w-0.5 h-2 rounded-full transition-all duration-100 ${
                player.stats.isAiming
                  ? 'bg-cyan-400 translate-y-2 opacity-95'
                  : 'bg-white/70 translate-y-3.5 opacity-75'
              }`}
            />
            {/* Left tick */}
            <div
              className={`absolute h-0.5 w-2 rounded-full transition-all duration-100 ${
                player.stats.isAiming
                  ? 'bg-cyan-400 -translate-x-2 opacity-95'
                  : 'bg-white/70 -translate-x-3.5 opacity-75'
              }`}
            />
            {/* Right tick */}
            <div
              className={`absolute h-0.5 w-2 rounded-full transition-all duration-100 ${
                player.stats.isAiming
                  ? 'bg-cyan-400 translate-x-2 opacity-95'
                  : 'bg-white/70 translate-x-3.5 opacity-75'
              }`}
            />

            {/* Tactical 4-corner Hitmarker on Damage */}
            {engine.hitmarkerActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-75">
                {engine.isHeadshotKill ? (
                  <Skull className="w-8 h-8 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,1)] animate-ping" />
                ) : (
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <div className="absolute w-3 h-0.5 bg-red-500 rotate-45 -translate-x-2 -translate-y-2 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                    <div className="absolute w-3 h-0.5 bg-red-500 -rotate-45 translate-x-2 -translate-y-2 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                    <div className="absolute w-3 h-0.5 bg-red-500 -rotate-45 -translate-x-2 translate-y-2 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                    <div className="absolute w-3 h-0.5 bg-red-500 rotate-45 translate-x-2 translate-y-2 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Scavenge Loot Prompt */}
        {engine.activeLootTarget && !player.stats.isDowned && (
          <div className="absolute top-2/3 bg-slate-950/90 border border-emerald-500/80 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs text-white font-bold animate-bounce pointer-events-none">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono">E</kbd>{' '}
              to scavenge {engine.activeLootTarget.type.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        )}

        {/* Revive Downed Partner Circular Channel Overlay (co-op mode only) */}
        {remotePlayer && engine.canReviveTeammate && !player.stats.isDowned && (
          <div className="absolute top-2/3 bg-slate-950/95 border-2 border-amber-500 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 pointer-events-none animate-pulse">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" />
              <span>HOLD [E] TO REVIVE TEAMMATE</span>
            </div>

            {/* Circular Progress Bar */}
            <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-75"
                style={{ width: `${engine.revivePercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-300">{engine.revivePercent}% Complete</span>
          </div>
        )}
      </div>

      {/* 4. BOTTOM ROW: Health / Stamina (Left) & Weapons / Ammo (Right) */}
      <div className="w-full flex items-end justify-between">
        {/* Left: Health & Stamina Bars */}
        <div className="bg-slate-950/90 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-slate-800/90 shadow-2xl space-y-2.5 min-w-[200px] sm:min-w-[240px]">
          {/* Health Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-black tracking-wide">
              <span className="flex items-center gap-1.5 text-red-400">
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                <span>HEALTH</span>
              </span>
              <span className="font-mono text-white">
                {Math.round(player.stats.health)} / {player.stats.maxHealth}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  isLowHealth
                    ? 'bg-gradient-to-r from-red-700 to-red-500 animate-pulse'
                    : 'bg-gradient-to-r from-rose-600 to-red-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Stamina Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wide">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                <span>STAMINA</span>
              </span>
              <span className="font-mono text-slate-400">{Math.round(player.stats.stamina)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-100"
                style={{ width: `${staminaPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Weapon & Ammo Card */}
        <div className="bg-slate-950/90 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-slate-800/90 shadow-2xl flex flex-col items-end space-y-1 min-w-[190px] sm:min-w-[220px]">
          <div className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
            <span>{activeConfig.name}</span>
          </div>

          {/* Ammo display */}
          <div className="flex items-baseline gap-1 font-mono">
            <span
              className={`text-3xl sm:text-4xl font-black ${
                activeState.ammoInClip === 0 ? 'text-red-500 animate-pulse' : 'text-white'
              }`}
            >
              {activeState.ammoInClip}
            </span>
            <span className="text-sm font-bold text-slate-500">/ {activeState.reserveAmmo}</span>
          </div>

          {/* Reload Bar or Weapon Switch Tip */}
          {activeState.isReloading ? (
            <div className="w-full space-y-0.5 text-right">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest animate-pulse">
                RELOADING...
              </span>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{
                    width: `${Math.min(100, Math.round(((activeConfig.reloadTime - activeState.reloadTimer) / activeConfig.reloadTime) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
              <span>[1][2][3] WEAPONS</span>
              <span>•</span>
              <span className="text-cyan-400 uppercase font-mono">[K] {player.activeSkin}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
