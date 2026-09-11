"use client";

import type { ReactNode } from "react";
import type { Player } from "@shared/types";
import { PlayerRail } from "@/components/PlayerRail";

interface Props {
  children: ReactNode;
  roundLabel?: string;
  players?: Player[];
  activePlayerIds?: string[];
  highlightWinnerId?: string;
  onLeave?: () => void;
}

export function Stage({ children, roundLabel, players, activePlayerIds, highlightWinnerId, onLeave }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="spotlight" />
      <header className="flex items-center justify-between px-6 py-4 relative z-10">
        <span className="font-display text-2xl font-bold tracking-tight text-cream">
          Echo<span className="text-action-yellow">Chaos</span>
        </span>
        <div className="flex items-center gap-4">
          {roundLabel && (
            <span className="font-display text-sm md:text-base bg-stage-panel border-2 border-stage-line rounded-pill px-4 py-1.5 text-cream/90">
              {roundLabel}
            </span>
          )}
          {onLeave && (
            <button
              onClick={onLeave}
              className="focus-ring text-cream/50 hover:text-cream text-sm font-body underline decoration-dotted"
            >
              Leave
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 relative z-10">
        <div className="w-full max-w-2xl">{children}</div>
      </main>

      {players && players.length > 0 && (
        <footer className="relative z-10 pb-6">
          <PlayerRail players={players} activePlayerIds={activePlayerIds} highlightWinnerId={highlightWinnerId} />
        </footer>
      )}
    </div>
  );
}

export function StageCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`stage-surface rounded-xl2 shadow-stage p-8 md:p-10 animate-popIn ${className}`}>{children}</div>
  );
}
