"use client";

import React, { useEffect, useRef, useState } from "react";
import { ISLAND_DISTRICTS, DistrictInfo } from "@/game/data/islandMapData";

export interface GameMapProps {
  src?: string;
  className?: string;
  onSelectDistrict?: (districtId: string) => void;
  highlightId?: string | null;
  playerPos?: { x: number; z: number; angle?: number } | null;
  waypointPos?: { x: number; z: number } | null;
  vehicles?: Array<{ x: number; z: number; type: string }>;
  showDistrictLabels?: boolean;
}

export const GameMap: React.FC<GameMapProps> = ({
  src = "/maps/apex-city-map.svg",
  className,
  onSelectDistrict,
  highlightId,
  playerPos,
  waypointPos,
  vehicles,
  showDistrictLabels = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(src)
      .then((res) => res.text())
      .then((svgText) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svgText;
        setLoaded(true);

        // Ensure the loaded SVG scales responsively and keeps aspect ratio
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.setAttribute("width", "100%");
          svgEl.setAttribute("height", "100%");
          svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
          svgEl.style.display = "block";
          svgEl.style.maxWidth = "100%";
          svgEl.style.maxHeight = "100%";
        }
      })
      .catch((err) => console.error("Error loading apex city map SVG:", err));

    return () => {
      cancelled = true;
    };
  }, [src]);

  // Convert 3D world coords (centered at Central City 750, 440) to SVG coords (0..1536, 0..1024)
  const worldToSvg = (wx: number, wz: number) => {
    return {
      x: 750 + wx,
      y: 440 + wz,
    };
  };

  const pSvg = playerPos ? worldToSvg(playerPos.x, playerPos.z) : null;
  const wSvg = waypointPos ? worldToSvg(waypointPos.x, waypointPos.z) : null;

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className || ""}`}
    >
      {/* 1. Underlying SVG Map Base */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center select-none"
      />

      {/* 2. Interactive SVG Vector Overlay (Labels, Blips, Waypoints) */}
      {loaded && (
        <svg
          viewBox="0 0 1536 1024"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        >
          <defs>
            <filter id="badgeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.6" />
            </filter>
            <filter id="playerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.9" />
            </filter>
            <filter id="waypointGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#facc15" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* 2A. Interactive District Pins & Badges */}
          {showDistrictLabels &&
            ISLAND_DISTRICTS.map((d: DistrictInfo) => {
              const isSelected =
                highlightId === d.id || highlightId === `label-${d.id}`;
              const isHovered = hoveredDistrict === d.id;
              const pillWidth = Math.max(90, d.name.length * 7.5 + 26);
              const halfW = pillWidth / 2;

              // Color accents by district category
              const accentColor =
                d.buildingType === "skyscraper"
                  ? "#06b6d4" // Downtown Cyan
                  : d.buildingType === "industrial"
                  ? "#f59e0b" // Industrial Amber
                  : d.buildingType === "airport"
                  ? "#38bdf8" // Airport Sky
                  : d.buildingType === "resort"
                  ? "#14b8a6" // Resort Teal
                  : "#a855f7"; // Residential Purple

              return (
                <g
                  key={d.id}
                  id={`label-${d.id}`}
                  transform={`translate(${d.svgPos.x}, ${d.svgPos.y})`}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectDistrict?.(d.id)}
                  onMouseEnter={() => setHoveredDistrict(d.id)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  opacity={
                    highlightId && !isSelected && !isHovered ? 0.45 : 1
                  }
                  style={{ transition: "opacity 0.2s ease" }}
                >
                  {/* Badge Background Pill */}
                  <rect
                    x={-halfW}
                    y={-14}
                    width={pillWidth}
                    height={28}
                    rx={14}
                    fill={
                      isSelected
                        ? "rgba(15, 23, 42, 0.95)"
                        : isHovered
                        ? "rgba(30, 41, 59, 0.95)"
                        : "rgba(10, 15, 29, 0.85)"
                    }
                    stroke={
                      isSelected
                        ? "#06b6d4"
                        : isHovered
                        ? "#94a3b8"
                        : "rgba(100, 116, 139, 0.5)"
                    }
                    strokeWidth={isSelected ? 2.5 : 1.2}
                    filter={isSelected ? "url(#badgeGlow)" : undefined}
                  />

                  {/* Category Accent Dot */}
                  <circle
                    cx={-halfW + 12}
                    cy={0}
                    r={isSelected || isHovered ? 4.5 : 3.5}
                    fill={accentColor}
                  />

                  {/* District Name */}
                  <text
                    x={-halfW + 22}
                    y={4}
                    fill={isSelected ? "#38bdf8" : "#f8fafc"}
                    fontSize="11"
                    fontWeight={isSelected ? "900" : "700"}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="0.3"
                  >
                    {d.name}
                  </text>
                </g>
              );
            })}

          {/* 2B. Live Vehicle Blips */}
          {vehicles?.map((v, i) => {
            const pos = worldToSvg(v.x, v.z);
            const isPolice = v.type === "police";
            const isSports = v.type === "sports";
            const fillColor = isPolice
              ? "#3b82f6"
              : isSports
              ? "#06b6d4"
              : "#eab308";

            return (
              <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle
                  r="7"
                  fill={fillColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))"
                />
              </g>
            );
          })}

          {/* 2C. Mission Waypoint Pulsing Marker */}
          {wSvg && (
            <g transform={`translate(${wSvg.x}, ${wSvg.y})`} filter="url(#waypointGlow)">
              <circle r="14" fill="#facc15" fillOpacity="0.35">
                <animate
                  attributeName="r"
                  values="10;22;10"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fillOpacity"
                  values="0.5;0.1;0.5"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Outer rotated diamond */}
              <polygon
                points="0,-14 12,0 0,14 -12,0"
                fill="#facc15"
                stroke="#09090b"
                strokeWidth="2.5"
              />
              <circle r="3" fill="#09090b" />
            </g>
          )}

          {/* 2D. Live Player Blip & Heading Arrow */}
          {pSvg && (
            <g transform={`translate(${pSvg.x}, ${pSvg.y})`} filter="url(#playerGlow)">
              <circle
                r="10"
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              {playerPos?.angle !== undefined && (
                <path
                  d="M 0 -17 L 7 2 L 0 -2 L -7 2 Z"
                  fill="#ffffff"
                  transform={`rotate(${(-playerPos.angle * 180) / Math.PI})`}
                />
              )}
            </g>
          )}
        </svg>
      )}

      {/* Loading Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-wider uppercase text-cyan-400">
            Streaming Apex Island Vector Map...
          </span>
        </div>
      )}
    </div>
  );
};

export default GameMap;
