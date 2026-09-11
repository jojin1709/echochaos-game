// ============================================================================
// Audio similarity scoring.
//
// `AudioScoringProvider` is the abstraction so a real ML classifier
// (`MLAudioScoringProvider`) can be dropped in later without touching game
// logic. `AudioFeatureScoringProvider` below is the real v1 implementation —
// it compares measurable DSP features, not a random number.
// ============================================================================

import type { AudioFeatures, ScoreBreakdown } from "../../../shared/types";

export interface AudioScoringProvider {
  score(target: AudioFeatures, player: AudioFeatures): Promise<ScoreBreakdown>;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** 1.0 when values are equal, decaying smoothly as they diverge (relative to `scale`). */
function similarity(a: number, b: number, scale: number): number {
  if (scale <= 0) return a === b ? 1 : 0;
  const diff = Math.abs(a - b) / scale;
  return clamp01(1 - diff);
}

/** Cosine similarity between two envelopes, resampled to equal length. */
function envelopeSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0.5;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0.5;
  return clamp01(dot / denom);
}

export class AudioFeatureScoringProvider implements AudioScoringProvider {
  async score(target: AudioFeatures, player: AudioFeatures): Promise<ScoreBreakdown> {
    // Pitch: only meaningful if both clips have a detectable pitch.
    let pitchSimilarity: number;
    if (target.pitchHz && player.pitchHz) {
      // Compare on a log scale (musical distance) rather than raw Hz.
      const logDiff = Math.abs(Math.log2(target.pitchHz) - Math.log2(player.pitchHz));
      pitchSimilarity = clamp01(1 - logDiff / 2); // 2 octaves = 0 similarity
    } else if (!target.pitchHz && !player.pitchHz) {
      pitchSimilarity = 0.7; // both unvoiced/noisy (e.g. hiss, growl) — treat as a soft match
    } else {
      pitchSimilarity = 0.2; // one had clear pitch, the other didn't
    }

    const centroidSim = similarity(target.spectralCentroid, player.spectralCentroid, 4000);
    const bandwidthSim = similarity(target.spectralBandwidth, player.spectralBandwidth, 3000);
    const rolloffSim = similarity(target.spectralRolloff, player.spectralRolloff, 5000);
    const spectralSimilarity = clamp01(
      centroidSim * 0.5 + bandwidthSim * 0.25 + rolloffSim * 0.25
    );

    const timingSimilarity = envelopeSimilarity(target.envelope, player.envelope);

    const energySimilarity = similarity(target.rmsEnergy, player.rmsEnergy, 0.3);

    const durationSimilarity = similarity(
      target.durationSeconds,
      player.durationSeconds,
      Math.max(target.durationSeconds, 1)
    );

    const total =
      pitchSimilarity * 0.25 +
      spectralSimilarity * 0.3 +
      timingSimilarity * 0.2 +
      energySimilarity * 0.15 +
      durationSimilarity * 0.1;

    return {
      pitchSimilarity: Math.round(pitchSimilarity * 100),
      spectralSimilarity: Math.round(spectralSimilarity * 100),
      timingSimilarity: Math.round(timingSimilarity * 100),
      energySimilarity: Math.round(energySimilarity * 100),
      durationSimilarity: Math.round(durationSimilarity * 100),
      total: Math.round(clamp01(total) * 100),
    };
  }
}

// Placeholder for a future learned model. Intentionally unimplemented — swap
// this in via `getScoringProvider()` below once a real model exists.
export class MLAudioScoringProvider implements AudioScoringProvider {
  async score(_target: AudioFeatures, _player: AudioFeatures): Promise<ScoreBreakdown> {
    throw new Error(
      "MLAudioScoringProvider is not implemented yet. Use AudioFeatureScoringProvider."
    );
  }
}

export function getScoringProvider(): AudioScoringProvider {
  return new AudioFeatureScoringProvider();
}
