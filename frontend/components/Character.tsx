"use client";

import type { CharacterColor, CharacterMood } from "@shared/types";

const FILL: Record<CharacterColor, string> = {
  pink: "#FF6FA5",
  blue: "#4CC3FF",
  yellow: "#FFD65C",
  green: "#5CE0A0",
  purple: "#B78CFF",
  orange: "#FF9F5C",
};

const SHADE: Record<CharacterColor, string> = {
  pink: "#E24E85",
  blue: "#2A9FE0",
  yellow: "#E8B93A",
  green: "#38B87F",
  purple: "#9563E8",
  orange: "#E87B38",
};

interface CharacterProps {
  color: CharacterColor;
  mood?: CharacterMood;
  size?: number;
  className?: string;
}

/**
 * Original blob-style character, built entirely from vector shapes (no
 * external art assets). Face/limb state changes based on `mood` so the same
 * six characters can react through the whole game loop.
 */
export function Character({ color, mood = "idle", size = 96, className = "" }: CharacterProps) {
  const fill = FILL[color];
  const shade = SHADE[color];
  const bounce = mood === "excited" || mood === "winner";
  const wobble = mood === "listening" || mood === "recording";

  return (
    <div
      className={`inline-block ${bounce ? "animate-float" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* body */}
        <ellipse cx="50" cy="58" rx="34" ry="30" fill={fill} />
        <ellipse cx="50" cy="86" rx="26" ry="8" fill={shade} opacity="0.35" />
        {/* recording pulse ring */}
        {mood === "recording" && (
          <circle cx="50" cy="55" r="36" fill="none" stroke="#FF4D6D" strokeWidth="3" className="animate-pulseRing" />
        )}
        {/* ears / antennae */}
        <circle cx="26" cy="30" r={wobble ? 7 : 6} fill={fill} />
        <circle cx="74" cy="30" r={wobble ? 7 : 6} fill={fill} />

        {/* face */}
        <EyesAndMouth mood={mood} />
      </svg>
    </div>
  );
}

function EyesAndMouth({ mood }: { mood: CharacterMood }) {
  switch (mood) {
    case "thinking":
      return (
        <g>
          <circle cx="40" cy="52" r="4" fill="#1B1533" />
          <circle cx="62" cy="50" r="4" fill="#1B1533" />
          <path d="M40 68 Q50 64 60 68" stroke="#1B1533" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "excited":
    case "winner":
      return (
        <g>
          <path d="M34 50 Q40 44 46 50" stroke="#1B1533" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M56 50 Q62 44 68 50" stroke="#1B1533" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M36 66 Q50 80 64 66" stroke="#1B1533" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "losing":
      return (
        <g>
          <circle cx="40" cy="54" r="4" fill="#1B1533" />
          <circle cx="62" cy="54" r="4" fill="#1B1533" />
          <path d="M38 72 Q50 62 64 72" stroke="#1B1533" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "listening":
      return (
        <g>
          <circle cx="40" cy="52" r="5.5" fill="#1B1533" />
          <circle cx="62" cy="52" r="5.5" fill="#1B1533" />
          <ellipse cx="51" cy="68" rx="6" ry="4" fill="#1B1533" />
        </g>
      );
    case "recording":
      return (
        <g>
          <circle cx="40" cy="52" r="5" fill="#1B1533" />
          <circle cx="62" cy="52" r="5" fill="#1B1533" />
          <ellipse cx="51" cy="70" rx="9" ry="7" fill="#1B1533" />
        </g>
      );
    case "ready":
      return (
        <g>
          <path d="M34 52 L46 52" stroke="#1B1533" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M56 52 L68 52" stroke="#1B1533" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M40 66 Q50 74 60 66" stroke="#1B1533" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="40" cy="52" r="4.5" fill="#1B1533" />
          <circle cx="62" cy="52" r="4.5" fill="#1B1533" />
          <path d="M42 66 Q50 71 58 66" stroke="#1B1533" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}
