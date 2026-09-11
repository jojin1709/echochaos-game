"use client";

import type { Player } from "@shared/types";
import { Character } from "./Character";

interface Props {
  players: Player[];
  activePlayerIds?: string[]; // players who have completed the current action (e.g. submitted)
  highlightWinnerId?: string;
}

export function PlayerRail({ players, activePlayerIds, highlightWinnerId }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-6 px-4 py-2">
      {players.map((p) => {
        const isDone = activePlayerIds?.includes(p.id);
        const isWinner = highlightWinnerId === p.id;
        return (
          <div key={p.id} className="flex flex-col items-center gap-1" style={{ opacity: p.connected ? 1 : 0.35 }}>
            <Character color={p.character} mood={isWinner ? "winner" : isDone ? "excited" : "idle"} size={56} />
            <span className="font-display text-sm text-cream/90 flex items-center gap-1">
              {p.isHost && <span aria-label="Host">👑</span>}
              {p.nickname}
            </span>
            {isDone && <span className="text-[10px] text-success font-body font-bold">READY</span>}
          </div>
        );
      })}
    </div>
  );
}
