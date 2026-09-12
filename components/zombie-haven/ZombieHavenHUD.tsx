/**
 * Zombie Haven - In-Game Tactical HUD
 * Health bar, Weapon status, Wave counter, Teammate radar/compass,
 * dynamic crosshair, hitmarkers, scavenge prompts, and hold-E revive circular channel.
 */

'use client';

import React from 'react';
import {
  Heart,
  Volume2,
  VolumeX,
  Navigation,
  AlertTriangle,
  Skull,
  Radio,
  Package,
  Sliders,
  Copy,
  Check,
  RotateCcw,
  X,
} from 'lucide-react';
import { ZombieGameEngine } from '@/game/zombie-haven/ZombieGameEngine';
import { zombieAudio } from './ZombieHavenAudio';
import {
  GUN_SETTINGS,
  saveGunSettings,
  resetGunSettings,
  DEFAULT_GUN_SETTINGS,
  GunSettingsConfig,
} from '@/game/zombie-haven/weapons/GunSettings';

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

  // Gun Position Tuner state
  const [showGunTuner, setShowGunTuner] = React.useState(false);
  const [activeTunerTab, setActiveTunerTab] = React.useState<'handSocket' | 'pistol' | 'shotgun' | 'rifle'>('pistol');
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [tunerValues, setTunerValues] = React.useState<GunSettingsConfig>(() => JSON.parse(JSON.stringify(GUN_SETTINGS)));

  const updateTunerField = (
    group: 'position' | 'rotationDeg' | 'scale',
    axis: 'x' | 'y' | 'z' | '',
    val: number
  ) => {
    setTunerValues((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (group === 'scale') {
        (next[activeTunerTab] as any).scale = val;
      } else {
        (next[activeTunerTab] as any)[group][axis] = val;
      }
      saveGunSettings(next);
      player.refreshWeaponTransforms();
      return next;
    });
  };

  const handleResetTuner = () => {
    resetGunSettings();
    const fresh = JSON.parse(JSON.stringify(DEFAULT_GUN_SETTINGS));
    setTunerValues(fresh);
    player.refreshWeaponTransforms();
  };

  const handleCopyCode = () => {
    const code = `export const GUN_SETTINGS: GunSettingsConfig = ${JSON.stringify(tunerValues, null, 2)};`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const hpPercent = Math.max(0, Math.min(100, (player.stats.health / player.stats.maxHealth) * 100));
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
            onClick={() => {
              if (document.pointerLockElement) {
                document.exitPointerLock();
              }
              setShowGunTuner((prev) => !prev);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer no-pointer-lock ${
              showGunTuner
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-amber-300 hover:text-amber-200'
            }`}
            title="Adjust Gun Positions & Angles"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Gun Tuner</span>
          </button>

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

      {/* 4. BOTTOM ROW: Health Card (Left) & Weapons / Ammo Card (Right) */}
      <div className="w-full flex items-end justify-between">
        {/* Left: Health Card */}
        <div className="bg-slate-950/90 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-slate-800/90 shadow-2xl space-y-2 min-w-[190px] sm:min-w-[220px]">
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

      {/* 4. Live In-Game Gun Position Tuner Modal */}
      {showGunTuner && (
        <div className="fixed right-4 top-16 w-80 sm:w-96 max-h-[82vh] overflow-y-auto bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white z-50 pointer-events-auto no-pointer-lock flex flex-col gap-3 text-xs select-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm tracking-wide text-amber-400">Weapon Position Tuner</span>
            </div>
            <button
              onClick={() => setShowGunTuner(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer no-pointer-lock"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Target Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 no-pointer-lock">
            {(['handSocket', 'pistol', 'shotgun', 'rifle'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTunerTab(tab);
                  if (tab === 'pistol' || tab === 'shotgun' || tab === 'rifle') {
                    weapons.switchWeapon(tab);
                    player.setWeaponVisual(tab);
                  }
                }}
                className={`py-1.5 px-1 rounded-lg font-bold text-[11px] capitalize transition cursor-pointer no-pointer-lock ${
                  activeTunerTab === tab
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab === 'handSocket' ? 'Socket' : tab}
              </button>
            ))}
          </div>

          {/* Current Target Sliders */}
          {(() => {
            const current = tunerValues[activeTunerTab];
            return (
              <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 no-pointer-lock">
                <div className="text-[11px] font-black uppercase text-amber-300/90 tracking-wider">
                  {activeTunerTab === 'handSocket'
                    ? 'Right Hand Bone Socket'
                    : `${activeTunerTab.toUpperCase()} Offset`}
                </div>

                {/* Position X */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Left / Right (X):</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {current.position.x.toFixed(3)}m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.20"
                    max="0.20"
                    step="0.002"
                    value={current.position.x}
                    onChange={(e) => updateTunerField('position', 'x', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer no-pointer-lock"
                  />
                </div>

                {/* Position Y */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Up / Down (Y):</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {current.position.y.toFixed(3)}m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.20"
                    max="0.20"
                    step="0.002"
                    value={current.position.y}
                    onChange={(e) => updateTunerField('position', 'y', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer no-pointer-lock"
                  />
                </div>

                {/* Position Z */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Forward / Back (Z):</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {current.position.z.toFixed(3)}m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.30"
                    max="0.30"
                    step="0.002"
                    value={current.position.z}
                    onChange={(e) => updateTunerField('position', 'z', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer no-pointer-lock"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] font-black uppercase text-amber-300/90 tracking-wider">
                  Rotation Angles (Degrees)
                </div>

                {/* Rotation X (Pitch) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Pitch (Tilt Up/Down):</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {Math.round(current.rotationDeg.x)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={Math.round(current.rotationDeg.x)}
                    onChange={(e) => updateTunerField('rotationDeg', 'x', parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer no-pointer-lock"
                  />
                </div>

                {/* Rotation Y (Yaw) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Yaw (Turn Left/Right):</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {Math.round(current.rotationDeg.y)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={Math.round(current.rotationDeg.y)}
                    onChange={(e) => updateTunerField('rotationDeg', 'y', parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer no-pointer-lock"
                  />
                </div>

                {/* Rotation Z (Roll) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Roll (Twist Gun):</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {Math.round(current.rotationDeg.z)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={Math.round(current.rotationDeg.z)}
                    onChange={(e) => updateTunerField('rotationDeg', 'z', parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer no-pointer-lock"
                  />
                </div>

                {/* Scale (for weapons) */}
                {'scale' in current && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Scale (Size):</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {((current as any).scale || 1.0).toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.02"
                      value={(current as any).scale || 1.0}
                      onChange={(e) => updateTunerField('scale', '', parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer no-pointer-lock"
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1 no-pointer-lock">
            <button
              onClick={handleCopyCode}
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer no-pointer-lock"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleResetTuner}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer no-pointer-lock"
              title="Reset to Defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
