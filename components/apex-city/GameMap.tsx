"use client";

import React, { useEffect, useRef, useState } from "react";

type GameMapProps = {
  src?: string;
  className?: string;
  onSelectDistrict?: (districtId: string) => void;
  highlightId?: string | null;
  playerPos?: { x: number; z: number; angle?: number } | null;
  waypointPos?: { x: number; z: number } | null;
  vehicles?: Array<{ x: number; z: number; type: string }>;
};

const DISTRICT_LABEL_IDS = [
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

        // Ensure SVG scales responsively
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.setAttribute("width", "100%");
          svgEl.setAttribute("height", "100%");
          svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
          svgEl.style.display = "block";
        }

        // Wire up interactivity on district labels
        DISTRICT_LABEL_IDS.forEach((id) => {
          const el = containerRef.current?.querySelector<SVGGElement>(`#${id}`);
          if (!el) return;
          el.style.cursor = "pointer";
          el.addEventListener("click", () => onSelectDistrict?.(id));
          el.addEventListener("mouseenter", () => el.setAttribute("opacity", "0.7"));
          el.addEventListener("mouseleave", () => el.setAttribute("opacity", "1"));
        });
      })
      .catch((err) => console.error("Error loading game map SVG:", err));

    return () => {
      cancelled = true;
    };
  }, [src, onSelectDistrict]);

  // Highlight a district
  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    DISTRICT_LABEL_IDS.forEach((id) => {
      const el = containerRef.current?.querySelector<SVGGElement>(`#${id}`);
      el?.setAttribute("opacity", highlightId && id !== highlightId ? "0.4" : "1");
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
    <div className={`relative ${className || ""}`} style={{ width: "100%", height: "100%" }}>
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" />

      {/* Real-time Blips Overlay */}
      {loaded && (
        <svg
          viewBox="0 0 1536 1024"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Vehicles Blips */}
          {vehicles?.map((v, i) => {
            const pos = worldToSvg(v.x, v.z);
            const color = v.type === "police" ? "#3b82f6" : v.type === "sports" ? "#06b6d4" : "#eab308";
            return (
              <circle
                key={i}
                cx={pos.x}
                cy={pos.y}
                r="7"
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
              />
            );
          })}

          {/* Mission Waypoint Marker */}
          {wSvg && (
            <g transform={`translate(${wSvg.x}, ${wSvg.y})`}>
              <circle r="12" fill="#facc15" fillOpacity="0.4">
                <animate attributeName="r" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <polygon points="0,-12 10,0 0,12 -10,0" fill="#facc15" stroke="#000000" strokeWidth="2" />
            </g>
          )}

          {/* Player Blip */}
          {pSvg && (
            <g transform={`translate(${pSvg.x}, ${pSvg.y})`}>
              <circle r="9" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
              {playerPos?.angle !== undefined && (
                <path
                  d="M 0 -15 L 6 0 L -6 0 Z"
                  fill="#38bdf8"
                  transform={`rotate(${(-playerPos.angle * 180) / Math.PI})`}
                />
              )}
            </g>
          )}
        </svg>
      )}
    </div>
  );
};

export default GameMap;
