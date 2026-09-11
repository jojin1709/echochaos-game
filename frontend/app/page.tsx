"use client";

import { useState } from "react";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Landing } from "@/game/screens/Landing";
import { JoinParty } from "@/game/screens/JoinParty";
import { Lobby } from "@/game/screens/Lobby";
import { RoundFlow } from "@/game/screens/RoundFlow";
import { RoundResults } from "@/game/screens/RoundResults";
import { FinalResultsScreen } from "@/game/screens/FinalResultsScreen";
import { Stage, StageCard } from "@/game/Stage";
import { ChunkyButton } from "@/components/ChunkyButton";

export default function HomePage() {
  const game = useGameSocket();
  const [pendingNickname, setPendingNickname] = useState("");

  const me = game.room?.players.find((p) => p.id === game.playerId);
  const isHost = me?.isHost ?? false;

  // --- Pre-room screens -----------------------------------------------
  if (game.phase === "landing") {
    return (
      <Landing
        errorMessage={game.errorMessage}
        onChooseCreate={(nickname) => {
          game.clearError();
          game.createRoom(nickname);
        }}
        onChooseJoin={(nickname) => {
          game.clearError();
          setPendingNickname(nickname);
          game.goTo("join");
        }}
      />
    );
  }

  if (game.phase === "join") {
    return (
      <JoinParty
        nickname={pendingNickname}
        errorMessage={game.errorMessage}
        onJoin={(nickname, code) => {
          game.clearError();
          game.joinRoom(nickname, code);
        }}
        onBack={() => {
          game.clearError();
          game.goTo("landing");
        }}
      />
    );
  }

  // --- In-room screens ---------------------------------------------------
  if (!game.room) {
    return (
      <Stage>
        <StageCard className="text-center">
          <p className="font-body text-cream/60">Connecting...</p>
        </StageCard>
      </Stage>
    );
  }

  if (game.phase === "lobby") {
    return (
      <Lobby
        room={game.room}
        playerId={game.playerId}
        onUpdateSettings={game.updateSettings}
        onSetReady={game.setReady}
        onStart={game.startGame}
        onLeave={game.leaveRoom}
      />
    );
  }

  if (
    ["round_intro", "listening", "get_ready", "recording", "processing"].includes(game.phase) &&
    game.currentRound
  ) {
    return (
      <RoundFlow
        phase={game.phase}
        setPhase={game.goTo}
        challenge={game.currentRound.challenge}
        roundIndex={game.currentRound.roundIndex}
        totalRounds={game.currentRound.totalRounds}
        roundTimerSeconds={game.room.settings.roundTimerSeconds}
        activeEvent={game.activeEvent}
        onSubmit={game.submitRecording}
        onLeave={game.leaveRoom}
        silentRetryMessage={game.silentRetry}
        onDismissSilentRetry={game.clearSilentRetry}
      />
    );
  }

  if (game.phase === "round_results" && game.roundResults && game.currentRound) {
    return (
      <RoundResults
        results={game.roundResults}
        challenge={game.currentRound.challenge}
        roundIndex={game.currentRound.roundIndex}
        totalRounds={game.currentRound.totalRounds}
        isHost={isHost}
        onNextRound={game.nextRound}
        onLeave={game.leaveRoom}
      />
    );
  }

  if (game.phase === "final_results" && game.finalResults) {
    return (
      <FinalResultsScreen
        results={game.finalResults}
        isHost={isHost}
        onPlayAgain={game.playAgain}
        onLeave={game.leaveRoom}
      />
    );
  }

  // Fallback (e.g. reconnecting to a room whose live round state we haven't
  // replayed yet) — send the player back to the lobby view of their room.
  return (
    <Stage onLeave={game.leaveRoom}>
      <StageCard className="text-center">
        <p className="font-body text-cream/60 mb-4">Catching up with the party...</p>
        {!game.connected && (
          <div className="mt-2">
            <p className="font-display text-cream mb-1">Connection lost</p>
            <p className="font-body text-cream/50 text-sm mb-4">Trying to reconnect...</p>
            <span className="inline-block animate-pulse">● ● ●</span>
          </div>
        )}
        <div className="mt-4">
          <ChunkyButton variant="outline" onClick={game.leaveRoom}>
            Back to Home
          </ChunkyButton>
        </div>
      </StageCard>
    </Stage>
  );
}
