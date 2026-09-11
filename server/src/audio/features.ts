// ============================================================================
// Audio feature extraction — operates on decoded PCM samples (Float32Array,
// mono, any sample rate — pass sampleRate in).
//
// This is a real signal-processing implementation (RMS, ZCR, spectral
// centroid/bandwidth/rolloff via FFT, coarse pitch via autocorrelation, and
// an amplitude envelope) — NOT a random number generator. It is intentionally
// a classic DSP baseline rather than a trained ML model; see scoring/README
// notes in the server README for how to swap in MLAudioScoringProvider later.
// ============================================================================

import type { AudioFeatures } from "../../../shared/types";

/** Minimal radix-2 FFT (in-place, iterative). Length must be a power of two. */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wIm;
        const nextIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
        curIm = nextIm;
      }
    }
  }
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function magnitudeSpectrum(frame: Float32Array): Float64Array {
  const n = nextPowerOfTwo(frame.length);
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  // Hann window to reduce spectral leakage
  for (let i = 0; i < frame.length; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frame.length - 1 || 1));
    re[i] = frame[i] * w;
  }
  fft(re, im);
  const half = n / 2;
  const mag = new Float64Array(half);
  for (let i = 0; i < half; i++) {
    mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
  }
  return mag;
}

function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / (samples.length || 1));
}

function zeroCrossingRate(samples: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i] >= 0) !== (samples[i - 1] >= 0)) crossings++;
  }
  return crossings / (samples.length || 1);
}

function spectralCentroidBandwidthRolloff(
  mag: Float64Array,
  sampleRate: number,
  fftSize: number
): { centroid: number; bandwidth: number; rolloff: number } {
  const binHz = sampleRate / fftSize;
  let sumMag = 0;
  let weightedSum = 0;
  for (let i = 0; i < mag.length; i++) {
    sumMag += mag[i];
    weightedSum += mag[i] * (i * binHz);
  }
  const centroid = sumMag > 0 ? weightedSum / sumMag : 0;

  let varianceSum = 0;
  for (let i = 0; i < mag.length; i++) {
    const freq = i * binHz;
    varianceSum += mag[i] * Math.pow(freq - centroid, 2);
  }
  const bandwidth = sumMag > 0 ? Math.sqrt(varianceSum / sumMag) : 0;

  const rolloffThreshold = 0.85 * sumMag;
  let cumulative = 0;
  let rolloff = 0;
  for (let i = 0; i < mag.length; i++) {
    cumulative += mag[i];
    if (cumulative >= rolloffThreshold) {
      rolloff = i * binHz;
      break;
    }
  }

  return { centroid, bandwidth, rolloff };
}

/** Coarse pitch estimate (Hz) via autocorrelation. Returns null if unvoiced/noisy. */
function estimatePitch(samples: Float32Array, sampleRate: number): number | null {
  const minHz = 70;
  const maxHz = 1000;
  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.floor(sampleRate / minHz);
  if (samples.length < maxLag * 2) return null;

  let bestLag = -1;
  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    let energy = 0;
    for (let i = 0; i < samples.length - lag; i++) {
      corr += samples[i] * samples[i + lag];
      energy += samples[i] * samples[i];
    }
    const normCorr = energy > 0 ? corr / energy : 0;
    if (normCorr > bestCorr) {
      bestCorr = normCorr;
      bestLag = lag;
    }
  }

  if (bestLag <= 0 || bestCorr < 0.3) return null; // too noisy / unvoiced
  return sampleRate / bestLag;
}

/** Coarse amplitude envelope: `bins` normalized RMS values across the clip. */
function amplitudeEnvelope(samples: Float32Array, bins: number): number[] {
  const out: number[] = [];
  const chunk = Math.max(1, Math.floor(samples.length / bins));
  let maxVal = 0;
  for (let b = 0; b < bins; b++) {
    const start = b * chunk;
    const end = Math.min(samples.length, start + chunk);
    if (start >= end) {
      out.push(0);
      continue;
    }
    const slice = samples.subarray(start, end);
    const val = rms(slice);
    maxVal = Math.max(maxVal, val);
    out.push(val);
  }
  return maxVal > 0 ? out.map((v) => v / maxVal) : out;
}

export function extractFeatures(samples: Float32Array, sampleRate: number): AudioFeatures {
  const durationSeconds = samples.length / sampleRate;
  const energy = rms(samples);
  const zcr = zeroCrossingRate(samples);

  // Use a representative analysis window (up to 1 second, centered) for the
  // spectral features so short recordings and long ones are comparable.
  const windowSize = Math.min(samples.length, nextPowerOfTwo(sampleRate));
  const start = Math.max(0, Math.floor((samples.length - windowSize) / 2));
  const frame = samples.subarray(start, start + windowSize);
  const mag = magnitudeSpectrum(frame);
  const { centroid, bandwidth, rolloff } = spectralCentroidBandwidthRolloff(
    mag,
    sampleRate,
    nextPowerOfTwo(frame.length)
  );

  const pitchHz = estimatePitch(samples, sampleRate);
  const envelope = amplitudeEnvelope(samples, 20);

  return {
    rmsEnergy: energy,
    durationSeconds,
    zeroCrossingRate: zcr,
    spectralCentroid: centroid,
    spectralBandwidth: bandwidth,
    spectralRolloff: rolloff,
    pitchHz,
    envelope,
  };
}
