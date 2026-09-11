"use client";

import { useMemo } from "react";

const COLORS = ["#FF6FA5", "#4CC3FF", "#FFD65C", "#5CE0A0", "#B78CFF", "#FF9F5C"];

export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.5 + Math.random() * 2,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

/** Renders a real waveform from live amplitude samples (see useMicRecorder). */
export function LiveWaveform({ levels, color = "#FF4D6D" }: { levels: number[]; color?: string }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16" role="img" aria-label="Live microphone waveform">
      {levels.map((lvl, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full transition-[height] duration-75"
          style={{
            height: `${Math.max(6, lvl * 64)}px`,
            backgroundColor: color,
            opacity: 0.5 + lvl * 0.5,
          }}
        />
      ))}
    </div>
  );
}

/** Idle decorative waveform used before recording starts (clearly not claimed as live). */
export function IdleWaveform({ color = "#4CC3FF" }: { color?: string }) {
  const bars = useMemo(() => Array.from({ length: 24 }, () => 0.2 + Math.random() * 0.8), []);
  return (
    <div className="flex items-center justify-center gap-[3px] h-12" aria-hidden="true">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full opacity-60"
          style={{ height: `${h * 40}px`, backgroundColor: color }}
        />
      ))}
    </div>
  );
}
