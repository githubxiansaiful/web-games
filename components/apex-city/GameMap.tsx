"use client";

import React, { useEffect, useRef, useState } from "react";

export interface GameMapProps {
  src?: string;
  className?: string;
  onSelectDistrict?: (districtId: string) => void;
  highlightId?: string | null;
  playerPos?: { x: number; z: number; angle?: number } | null;
  waypointPos?: { x: number; z: number } | null;
  vehicles?: Array<{ x: number; z: number; type: string }>;
}

export const DISTRICT_LABEL_IDS = [
  "label-mount-crest",
  "label-caldera-pass",
  "label-redwood",
  "label-sandy-ridge",
  "label-northwood",
  "label-lakeview",
  "label-eastvale",
  "label-central-city",
  "label-oak-heights",
  "label-pacific-bluffs",
  "label-riverside",
  "label-harborview",
  "label-southbridge",
  "label-sunset-bay",
  "label-dragon-island",
  "label-west-end",
  "label-skyline-airport",
  "label-twin-beaches",
  "label-southport",
  "label-crescent-island",
];

export const GameMap: React.FC<GameMapProps> = ({
  src = "/maps/game-map.svg",
  className,
  onSelectDistrict,
  highlightId,
  playerPos,
  waypointPos,
  vehicles,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(src)
      .then((res) => res.text())
      .then((svgText) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svgText;
        setLoaded(true);

        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.setAttribute("width", "100%");
          svgEl.setAttribute("height", "100%");
          svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
          svgEl.style.display = "block";
          svgEl.style.maxWidth = "100%";
          svgEl.style.maxHeight = "100%";
        }

        // Wire up interactivity on the district label groups
        DISTRICT_LABEL_IDS.forEach((id) => {
          const el = containerRef.current?.querySelector<SVGGElement>(`#${id}`);
          if (!el) return;
          el.style.cursor = "pointer";
          el.style.transition = "opacity 0.2s ease, transform 0.2s ease";
          el.addEventListener("click", () => {
            const cleanId = id.replace("label-", "");
            onSelectDistrict?.(cleanId);
          });
          el.addEventListener("mouseenter", () => {
            el.setAttribute("opacity", "0.75");
          });
          el.addEventListener("mouseleave", () => {
            el.setAttribute("opacity", "1");
          });
        });
      })
      .catch((err) => console.error("Error loading vector game map SVG:", err));

    return () => {
      cancelled = true;
    };
  }, [src, onSelectDistrict]);

  // Highlight a district from outside
  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    DISTRICT_LABEL_IDS.forEach((id) => {
      const el = containerRef.current?.querySelector<SVGGElement>(`#${id}`);
      if (!el) return;
      const cleanId = id.replace("label-", "");
      const isTarget =
        highlightId &&
        (id === highlightId ||
          cleanId === highlightId ||
          `label-${highlightId}` === id);
      el.setAttribute("opacity", highlightId && !isTarget ? "0.35" : "1");
    });
  }, [highlightId, loaded]);

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
      {/* 1. Underlying Editable Vector SVG Map */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center select-none"
      />

      {/* 2. Real-time Entities Overlay (Player, Waypoints, Vehicles) */}
      {loaded && (
        <svg
          viewBox="0 0 1536 1024"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        >
          <defs>
            <filter id="playerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38bdf8" floodOpacity="0.9" />
            </filter>
            <filter id="waypointGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#facc15" floodOpacity="0.95" />
            </filter>
          </defs>

          {/* Vehicles Blips */}
          {vehicles?.map((v, i) => {
            const pos = worldToSvg(v.x, v.z);
            const color =
              v.type === "police"
                ? "#3b82f6"
                : v.type === "sports"
                ? "#06b6d4"
                : "#eab308";
            return (
              <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle
                  r="7"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                />
              </g>
            );
          })}

          {/* Mission Waypoint Pulsing Diamond */}
          {wSvg && (
            <g transform={`translate(${wSvg.x}, ${wSvg.y})`} filter="url(#waypointGlow)">
              <circle r="14" fill="#facc15" fillOpacity="0.35">
                <animate
                  attributeName="r"
                  values="10;24;10"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fillOpacity"
                  values="0.5;0.1;0.5"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <polygon
                points="0,-14 12,0 0,14 -12,0"
                fill="#facc15"
                stroke="#09090b"
                strokeWidth="2.5"
              />
              <circle r="3" fill="#09090b" />
            </g>
          )}

          {/* Player Live Marker & Heading Direction Arrow */}
          {pSvg && (
            <g transform={`translate(${pSvg.x}, ${pSvg.y})`} filter="url(#playerGlow)">
              <circle r="10" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2.5" />
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
            Loading Vector Game Map...
          </span>
        </div>
      )}
    </div>
  );
};

export default GameMap;
