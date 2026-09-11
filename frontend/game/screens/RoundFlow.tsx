"use client";

import { useEffect, useRef, useState } from "react";
import type { Challenge, RandomEventType } from "@shared/types";
import { Stage, StageCard } from "@/game/Stage";
import { ChunkyButton } from "@/components/ChunkyButton";
import { IdleWaveform, LiveWaveform } from "@/components/Effects";
import { blobToBase64, useMicRecorder } from "@/hooks/useMicRecorder";
import type { LocalPhase } from "@/hooks/useGameSocket";

interface Props {
  phase: LocalPhase;
  setPhase: (p: LocalPhase) => void;
  challenge: Challenge;
  roundIndex: number;
  totalRounds: number;
  roundTimerSeconds: number;
  activeEvent: { event: RandomEventType; description: string } | null;
  onSubmit: (audioBase64: string, mimeType: string, durationMs: number) => void;
  onLeave: () => void;
  silentRetryMessage?: string | null;
  onDismissSilentRetry?: () => void;
}

const EVENT_EMOJI: Record<RandomEventType, string> = {
  DOUBLE_POINTS: "✨",
  TINY_VOICE: "🤫",
  SPEED_ROUND: "⚡",
  EVERYONE_MIMICS: "👥",
  REVERSE_ROUND: "⏪",
  ONE_SHOT: "🎯",
  CHAOS_ROUND: "🌀",
};

export function RoundFlow({
  phase,
  setPhase,
  challenge,
  roundIndex,
  totalRounds,
  roundTimerSeconds,
  activeEvent,
  onSubmit,
  onLeave,
  silentRetryMessage,
  onDismissSilentRetry,
}: Props) {
  const mic = useMicRecorder();
  const [countdown, setCountdown] = useState(3);
  const [recordSecondsLeft, setRecordSecondsLeft] = useState(roundTimerSeconds);
  const [micError, setMicError] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const effectiveTimer = activeEvent?.event === "SPEED_ROUND" ? 3 : roundTimerSeconds;

  const roundLabel = `Round ${roundIndex + 1} / ${totalRounds}`;

  // ROUND_INTRO -> LISTENING after a short beat
  useEffect(() => {
    if (phase !== "round_intro") return;
    const t = setTimeout(() => setPhase("listening"), activeEvent ? 2600 : 1800);
    return () => clearTimeout(t);
  }, [phase, activeEvent, setPhase]);

  // LISTENING -> request mic permission, then GET_READY
  useEffect(() => {
    if (phase !== "listening") return;
    let cancelled = false;
    const listenMs = Math.min(3500, (challenge.duration + 1.2) * 1000);
    const t = setTimeout(async () => {
      if (cancelled) return;
      const granted = await mic.requestPermission();
      if (!granted) {
        setMicError("EchoChaos needs microphone access to hear your mimic.");
        return;
      }
      setPhase("get_ready");
    }, listenMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // GET_READY countdown 3-2-1 -> RECORDING
  useEffect(() => {
    if (phase !== "get_ready") return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setPhase("recording");
          return 0;
        }
        return c - 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [phase, setPhase]);

  // RECORDING: start mic recorder, countdown, auto-stop
  useEffect(() => {
    if (phase !== "recording") return;
    submittedRef.current = false;
    setRecordSecondsLeft(effectiveTimer);
    mic.startRecording();

    const interval = setInterval(() => {
      setRecordSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    const stopTimer = setTimeout(() => {
      finishRecording();
    }, effectiveTimer * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(stopTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function finishRecording() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const result = await mic.stopRecording();
    if (!result) return;
    const base64 = await blobToBase64(result.blob);
    onSubmit(base64, result.blob.type, result.durationMs);
  }

  if (micError) {
    return (
      <Stage onLeave={onLeave} roundLabel={roundLabel}>
        <StageCard className="text-center">
          <p className="text-5xl mb-4">🎤</p>
          <h2 className="font-display text-2xl font-bold text-cream mb-2">Microphone blocked</h2>
          <p className="text-cream/70 font-body mb-6">{micError}</p>
          <ChunkyButton
            variant="yellow"
            onClick={async () => {
              setMicError(null);
              const granted = await mic.requestPermission();
              if (granted) setPhase("get_ready");
              else setMicError("Still no access — check your browser's site permissions.");
            }}
          >
            Try Again
          </ChunkyButton>
        </StageCard>
      </Stage>
    );
  }

  return (
    <Stage onLeave={onLeave} roundLabel={roundLabel}>
      {activeEvent && (phase === "round_intro" || phase === "listening") && (
        <div className="text-center mb-4 animate-popIn">
          <span className="inline-block bg-record text-cream font-display font-bold px-5 py-2 rounded-pill shadow-record">
            {EVENT_EMOJI[activeEvent.event]} {activeEvent.description}
          </span>
        </div>
      )}

      <StageCard className="text-center">
        {phase === "round_intro" && (
          <>
            <p className="font-display text-xs uppercase tracking-widest text-cream/50 mb-2">{challenge.category}</p>
            <p className="text-7xl mb-3">{challenge.emoji}</p>
            <h2 className="font-display text-3xl font-bold text-cream">{challenge.name}</h2>
          </>
        )}

        {phase === "listening" && (
          <>
            <p className="text-6xl mb-4">{challenge.emoji}</p>
            <h2 className="font-display text-2xl font-bold text-cream mb-2">{challenge.name}</h2>
            <p className="font-body text-cream/60 mb-4">Listen carefully...</p>
            <IdleWaveform />
            <p className="font-body text-cream/40 text-sm mt-4">Get ready...</p>
          </>
        )}

        {phase === "get_ready" && (
          <>
            <p className="font-display text-lg text-cream/70 mb-4">Your turn!</p>
            <p className="text-6xl mb-2">{challenge.emoji}</p>
            <h2 className="font-display text-2xl font-bold text-cream mb-6">{challenge.name}</h2>
            <p className="font-display text-6xl font-extrabold text-action-yellow animate-popIn" key={countdown}>
              {countdown > 0 ? countdown : "🎤"}
            </p>
          </>
        )}

        {phase === "recording" && (
          <>
            <p className="font-display text-lg text-cream/70 mb-1">Your turn!</p>
            <p className="font-display text-4xl font-extrabold text-record mb-3">
              00:{String(recordSecondsLeft).padStart(2, "0")}
            </p>
            <LiveWaveform levels={mic.levels} />
            <p className="font-body text-cream/60 mt-4 mb-6">
              Mimic the {challenge.name.toLowerCase()} now!
            </p>
            <ChunkyButton variant="record" onClick={finishRecording}>
              Stop Recording
            </ChunkyButton>
          </>
        )}

        {phase === "processing" && !silentRetryMessage && (
          <>
            <p className="text-5xl mb-4 animate-float">🎤</p>
            <h2 className="font-display text-2xl font-bold text-cream mb-6">Analyzing your mimic...</h2>
            <ul className="text-left inline-block font-body text-cream/70 space-y-1">
              <li>✓ Timing</li>
              <li>✓ Frequency</li>
              <li>✓ Energy</li>
              <li>✓ Similarity</li>
            </ul>
            <p className="font-body text-cream/40 text-sm mt-4">Calculating your score...</p>
          </>
        )}

        {silentRetryMessage && (
          <div className="mt-4 bg-record/20 border-2 border-record rounded-xl2 p-4">
            <p className="font-body text-cream mb-3">{silentRetryMessage}</p>
            <ChunkyButton variant="record" onClick={() => { onDismissSilentRetry?.(); setPhase("get_ready"); }}>
              Try Again
            </ChunkyButton>
          </div>
        )}
      </StageCard>
    </Stage>
  );
}
