"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MicPermissionState = "idle" | "requesting" | "granted" | "denied";

interface UseMicRecorderResult {
  permission: MicPermissionState;
  isRecording: boolean;
  levels: number[]; // rolling live amplitude samples, 0-1, for a real (non-fake) waveform
  requestPermission: () => Promise<boolean>;
  startRecording: () => void;
  stopRecording: () => Promise<{ blob: Blob; durationMs: number } | null>;
}

const LEVEL_HISTORY = 48;

/**
 * Wraps MediaDevices + MediaRecorder + Web Audio's AnalyserNode. `levels` is
 * driven by real-time frequency-domain data read every animation frame while
 * recording — this is not a decorative/fake waveform.
 */
export function useMicRecorder(): UseMicRecorderResult {
  const [permission, setPermission] = useState<MicPermissionState>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [levels, setLevels] = useState<number[]>(Array(LEVEL_HISTORY).fill(0));

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;
    setPermission("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioContextCtor();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setPermission("granted");
      return true;
    } catch {
      setPermission("denied");
      return false;
    }
  }, []);

  const tickLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const centered = (data[i] - 128) / 128;
      sum += centered * centered;
    }
    const rms = Math.sqrt(sum / data.length);
    setLevels((prev) => [...prev.slice(1), Math.min(1, rms * 3.5)]);
    rafRef.current = requestAnimationFrame(tickLevels);
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    recorderRef.current = recorder;
    startTimeRef.current = Date.now();
    setIsRecording(true);
    rafRef.current = requestAnimationFrame(tickLevels);
  }, [tickLevels]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; durationMs: number } | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const durationMs = Date.now() - startTimeRef.current;
        setIsRecording(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setLevels(Array(LEVEL_HISTORY).fill(0));
        resolve({ blob, durationMs });
      };
      recorder.stop();
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  return { permission, isRecording, levels, requestPermission, startRecording, stopRecording };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
