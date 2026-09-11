"use client";

import type { Challenge, RoundResultEntry } from "@shared/types";
import { Stage, StageCard } from "@/game/Stage";
import { ChunkyButton } from "@/components/ChunkyButton";
import { Character } from "@/components/Character";

interface Props {
  results: RoundResultEntry[];
  challenge: Challenge;
  roundIndex: number;
  totalRounds: number;
  isHost: boolean;
  onNextRound: () => void;
  onLeave: () => void;
}

function reactionFor(score: number): string {
  if (score >= 90) return "That was almost perfect!";
  if (score >= 75) return "Okay... that's actually impressive!";
  if (score >= 50) return "Not bad!";
  if (score >= 25) return "We heard something.";
  return "What was that?!";
}

export function RoundResults({ results, challenge, roundIndex, totalRounds, isHost, onNextRound, onLeave }: Props) {
  const winner = results[0];
  const isLastRound = roundIndex + 1 >= totalRounds;

  return (
    <Stage onLeave={onLeave} roundLabel={`Round ${roundIndex + 1} / ${totalRounds}`}>
      <StageCard>
        <div className="text-center mb-6">
          <p className="font-display text-xs uppercase tracking-widest text-cream/50 mb-1">Round results</p>
          <p className="text-5xl mb-1">{challenge.emoji}</p>
          <h2 className="font-display text-2xl font-bold text-cream">{challenge.name}</h2>
        </div>

        <div className="space-y-2 mb-6">
          {results.map((r, i) => (
            <div
              key={r.playerId}
              className={`flex items-center gap-3 rounded-xl2 px-4 py-3 ${
                i === 0 ? "bg-action-yellow/20 border-2 border-action-yellow" : "bg-stage-deep/50"
              }`}
            >
              <span className="font-display font-bold text-cream/50 w-5">{i + 1}</span>
              <Character color={r.character} mood={i === 0 ? "winner" : "idle"} size={40} />
              <span className="font-display font-bold text-cream flex-1">{r.nickname}</span>
              <span className="font-display font-extrabold text-action-yellow text-lg">{r.pointsAwarded}</span>
            </div>
          ))}
        </div>

        {winner && (
          <div className="text-center mb-6">
            <p className="font-display text-lg text-cream mb-1">🏆 {winner.nickname}</p>
            <p className="font-body text-cream/60 italic">&ldquo;{reactionFor(winner.score)}&rdquo;</p>
          </div>
        )}

        {isHost ? (
          <ChunkyButton variant="yellow" className="w-full" onClick={onNextRound}>
            {isLastRound ? "See Final Results" : "Next Round"}
          </ChunkyButton>
        ) : (
          <p className="text-center font-body text-cream/50 text-sm">Waiting for the host to continue...</p>
        )}
      </StageCard>
    </Stage>
  );
}
