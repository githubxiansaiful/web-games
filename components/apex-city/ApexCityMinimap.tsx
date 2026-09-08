'use client';

import React, { useRef, useEffect } from 'react';
import { EventBus } from '@/game/core/EventBus';

export const ApexCityMinimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const eventBus = EventBus.getInstance();

    const handleMinimapUpdate = (data: {
      playerPos: { x: number; z: number };
      playerAngle: number;
      waypoint: { x: number; z: number } | null;
      vehicles: Array<{ x: number; z: number; type: string }>;
      wantedLevel: number;
    }) => {
      const size = canvas.width;
      const center = size / 2;
      const zoom = 0.55; // Pixels per meter

      ctx.clearRect(0, 0, size, size);

      // 1. Radar Circular Background
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, center - 3, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = 'rgba(6, 11, 24, 0.88)';
      ctx.fillRect(0, 0, size, size);

      // Radar sweep grid circles
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center, center, (center - 3) * 0.5, 0, Math.PI * 2);
      ctx.arc(center, center, (center - 3) * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      // Transform coordinate system relative to player
      ctx.save();
      ctx.translate(center, center);

      const px = data.playerPos.x;
      const pz = data.playerPos.z;

      // 2. Draw Simplified City Road Grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();

      // Central Avenues
      ctx.moveTo((-px) * zoom, (-180 - pz) * zoom);
      ctx.lineTo((-px) * zoom, (180 - pz) * zoom);

      ctx.moveTo((-180 - px) * zoom, (-pz) * zoom);
      ctx.lineTo((180 - px) * zoom, (-pz) * zoom);

      // Cross Streets
      ctx.moveTo((-180 - px) * zoom, (-90 - pz) * zoom);
      ctx.lineTo((180 - px) * zoom, (-90 - pz) * zoom);

      ctx.moveTo((-180 - px) * zoom, (90 - pz) * zoom);
      ctx.lineTo((180 - px) * zoom, (90 - pz) * zoom);

      ctx.moveTo((-90 - px) * zoom, (-180 - pz) * zoom);
      ctx.lineTo((-90 - px) * zoom, (180 - pz) * zoom);

      ctx.moveTo((90 - px) * zoom, (-180 - pz) * zoom);
      ctx.lineTo((90 - px) * zoom, (180 - pz) * zoom);

      ctx.stroke();

      // 3. Vehicles Blips
      for (const v of data.vehicles) {
        const vx = (v.x - px) * zoom;
        const vz = (v.z - pz) * zoom;

        ctx.beginPath();
        if (v.type === 'police') {
          ctx.fillStyle = '#3b82f6';
          ctx.arc(vx, vz, 4, 0, Math.PI * 2);
        } else if (v.type === 'sports') {
          ctx.fillStyle = '#06b6d4';
          ctx.arc(vx, vz, 4.5, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = '#eab308';
          ctx.arc(vx, vz, 3.5, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // 4. Mission Waypoint Blip (Bright Yellow Diamond)
      if (data.waypoint) {
        const wx = (data.waypoint.x - px) * zoom;
        const wz = (data.waypoint.z - pz) * zoom;

        ctx.save();
        ctx.translate(wx, wz);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
      }

      ctx.restore(); // Restore player-relative translation

      // 5. Player Arrow (Center of radar)
      ctx.save();
      ctx.translate(center, center);
      // Rotate arrow to match camera yaw
      ctx.rotate(-data.playerAngle);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore(); // Restore circular clip

      // 6. Radar Bezel Border
      ctx.beginPath();
      ctx.arc(center, center, center - 2, 0, Math.PI * 2);
      ctx.strokeStyle = data.wantedLevel > 0 ? '#ef4444' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };

    eventBus.on('MINIMAP_UPDATE', handleMinimapUpdate);

    return () => {
      eventBus.off('MINIMAP_UPDATE', handleMinimapUpdate);
    };
  }, []);

  return (
    <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-2xl bg-slate-950/90 border border-slate-700/60 pointer-events-none">
      <canvas ref={canvasRef} width={144} height={144} className="w-full h-full" />
    </div>
  );
};
