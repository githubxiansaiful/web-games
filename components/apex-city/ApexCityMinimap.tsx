'use client';

import React, { useRef, useEffect, useState } from 'react';
import { EventBus } from '@/game/core/EventBus';
import { worldToSvg } from '@/game/data/islandMapData';
import { Maximize2 } from 'lucide-react';

interface ApexCityMinimapProps {
  onOpenFullMap?: () => void;
}

export const ApexCityMinimap: React.FC<ApexCityMinimapProps> = ({ onOpenFullMap }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Preload the real SVG vector map
    const img = new Image();
    img.src = '/maps/game-map.svg';
    img.onload = () => {
      mapImageRef.current = img;
      setImageLoaded(true);
    };
  }, []);

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
      const radius = center - 3;

      ctx.clearRect(0, 0, size, size);

      // 1. Circular Clip for Radar
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.clip();

      const img = mapImageRef.current;
      const svgCenter = worldToSvg(data.playerPos.x, data.playerPos.z);

      // 2. Draw Real SVG Map centered around player's current position
      if (img && img.complete) {
        // Zoom window in SVG coords: view ~320 SVG units across the radar
        const viewSpan = 320;
        const sx = svgCenter.x - viewSpan / 2;
        const sy = svgCenter.y - viewSpan / 2;

        ctx.drawImage(img, sx, sy, viewSpan, viewSpan, 0, 0, size, size);
      } else {
        // Fallback ocean background while image loads
        ctx.fillStyle = '#0d2b3e';
        ctx.fillRect(0, 0, size, size);
      }

      // Radar range rings overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.45, 0, Math.PI * 2);
      ctx.arc(center, center, radius * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Transform for Vehicles and Waypoint markers relative to player center
      const zoom = size / 320; // Scale factor from SVG units to canvas pixels

      // Vehicle Blips
      for (const v of data.vehicles) {
        const vSvg = worldToSvg(v.x, v.z);
        const dx = (vSvg.x - svgCenter.x) * zoom;
        const dy = (vSvg.y - svgCenter.y) * zoom;

        const screenX = center + dx;
        const screenY = center + dy;

        ctx.beginPath();
        if (v.type === 'police') {
          ctx.fillStyle = '#3b82f6';
          ctx.arc(screenX, screenY, 4.5, 0, Math.PI * 2);
        } else if (v.type === 'sports') {
          ctx.fillStyle = '#06b6d4';
          ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = '#eab308';
          ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Mission Waypoint Marker (Pulsing Yellow Diamond)
      if (data.waypoint) {
        const wSvg = worldToSvg(data.waypoint.x, data.waypoint.z);
        const dx = (wSvg.x - svgCenter.x) * zoom;
        const dy = (wSvg.y - svgCenter.y) * zoom;

        const screenX = center + dx;
        const screenY = center + dy;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-5, -5, 10, 10);
        ctx.restore();
      }

      // 4. Player Direction Arrow (At center of radar)
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(-data.playerAngle);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 7);
      ctx.lineTo(0, 3);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // Restore circular clip

      // 5. Outer Bezel Border
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.strokeStyle = data.wantedLevel > 0 ? '#ef4444' : 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    eventBus.on('MINIMAP_UPDATE', handleMinimapUpdate);

    return () => {
      eventBus.off('MINIMAP_UPDATE', handleMinimapUpdate);
    };
  }, [imageLoaded]);

  return (
    <div className="relative group">
      {/* Circular Radar Display */}
      <div className="relative w-44 h-44 rounded-full overflow-hidden shadow-2xl bg-slate-950 border-2 border-slate-700/80">
        <canvas ref={canvasRef} width={176} height={176} className="w-full h-full" />

        {/* Full Map Open Button Overlay */}
        {onOpenFullMap && (
          <button
            onClick={onOpenFullMap}
            className="absolute top-2 right-2 p-1.5 bg-slate-900/90 hover:bg-cyan-600 rounded-full text-slate-300 hover:text-white transition shadow-md pointer-events-auto cursor-pointer"
            title="Open Full Map [M]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* District & Map Prompt */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-bold text-slate-400 whitespace-nowrap">
        Press [M] Full Map
      </div>
    </div>
  );
};
