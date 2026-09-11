"use client";

import type { FinalResults as FinalResultsType } from "@shared/types";
import { Stage, StageCard } from "@/game/Stage";
import { ChunkyButton } from "@/components/ChunkyButton";
import { Character } from "@/components/Character";
import { Confetti } from "@/components/Effects";

interface Props {
  results: FinalResultsType;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function FinalResultsScreen({ results, isHost, onPlayAgain, onLeave }: Props) {
  const champion = results.leaderboard[0];

  return (
    <Stage onLeave={onLeave}>
      <Confetti />
      <StageCard className="text-center">
        <p className="font-display text-sm uppercase tracking-widest text-cream/50 mb-2">Game over!</p>
        {champion && (
          <>
            <Character color={champion.character} mood="winner" size={80} className="mx-auto mb-2" />
            <p className="text-3xl mb-1">🏆</p>
            <h2 className="font-display text-3xl font-extrabold text-action-yellow">{champion.nickname}</h2>
            <p className="font-display text-xl text-cream/80 mb-6">{champion.score} pts</p>
          </>
        )}

        <div className="space-y-2 mb-6 text-left">
          {results.leaderboard.map((p, i) => (
            <div
              key={p.playerId}
              className={`flex items-center gap-3 rounded-xl2 px-4 py-2.5 ${
                i === 0 ? "bg-action-yellow/20 border-2 border-action-yellow" : "bg-stage-deep/50"
              }`}
            >
              <span className="font-display font-bold text-cream/50 w-6">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <Character color={p.character} size={32} />
              <span className="font-display font-bold text-cream flex-1">{p.nickname}</span>
              <span className="font-display font-extrabold text-cream">{p.score}</span>
            </div>
          ))}
        </div>

        {(results.stats.bestMimic || results.stats.chaosChampion) && (
          <div className="grid grid-cols-2 gap-3 mb-6 text-left">
            {results.stats.bestMimic && (
              <StatCard label="Best Mimic" value={results.stats.bestMimic.nickname} sub={`${results.stats.bestMimic.score} pts`} />
            )}
            {results.stats.chaosChampion && (
              <StatCard
                label="Chaos Champion"
                value={results.stats.chaosChampion.nickname}
                sub={`${results.stats.chaosChampion.eventsPlayed} events`}
              />
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {isHost ? (
            <ChunkyButton variant="yellow" className="flex-1" onClick={onPlayAgain}>
              Play Again
            </ChunkyButton>
          ) : (
            <p className="flex-1 text-center font-body text-cream/50 text-sm self-center">Waiting for host...</p>
          )}
          <ChunkyButton variant="outline" className="flex-1" onClick={onLeave}>
            Back to Home
          </ChunkyButton>
        </div>
      </StageCard>
    </Stage>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-stage-deep/50 rounded-xl2 p-3">
      <p className="text-[10px] font-display uppercase tracking-wide text-cream/40 mb-1">{label}</p>
      <p className="font-display font-bold text-cream text-sm">{value}</p>
      <p className="text-xs text-cream/50 font-body">{sub}</p>
    </div>
  );
}
