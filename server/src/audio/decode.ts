// ============================================================================
// Decodes browser-recorded audio (webm/opus from MediaRecorder, or wav) into
// mono 16kHz PCM Float32 samples using ffmpeg. Uses `ffmpeg-static` so no
// system ffmpeg install is required on the deploy target (Render).
// ============================================================================

import { spawn } from "child_process";
// @ts-ignore - ffmpeg-static ships no types
import ffmpegPath from "ffmpeg-static";

export const TARGET_SAMPLE_RATE = 16000;

export function decodeToPcm(inputBuffer: Buffer): Promise<{ samples: Float32Array; sampleRate: number }> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg binary not found (ffmpeg-static failed to resolve)"));
      return;
    }

    const args = [
      "-hide_banner",
      "-loglevel", "error",
      "-i", "pipe:0",
      "-f", "f32le",
      "-ac", "1",
      "-ar", String(TARGET_SAMPLE_RATE),
      "pipe:1",
    ];

    const proc = spawn(ffmpegPath as string, args);
    const chunks: Buffer[] = [];
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => chunks.push(d));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
        return;
      }
      const raw = Buffer.concat(chunks);
      const samples = new Float32Array(
        raw.buffer,
        raw.byteOffset,
        Math.floor(raw.length / 4)
      );
      // Copy out of the shared buffer so it isn't invalidated.
      resolve({ samples: Float32Array.from(samples), sampleRate: TARGET_SAMPLE_RATE });
    });

    proc.stdin.write(inputBuffer);
    proc.stdin.end();
  });
}

/** Quick silence/empty check before spending CPU on full feature extraction. */
export function isEffectivelySilent(samples: Float32Array, threshold = 0.01): boolean {
  if (samples.length === 0) return true;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  const rms = Math.sqrt(sum / samples.length);
  return rms < threshold;
}
