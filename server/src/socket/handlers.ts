// ============================================================================
// Socket.IO event handlers. This file is the only place that touches sockets
// directly — game rules live in RoomManager, scoring lives in scoring/.
// ============================================================================

import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../../shared/events";
import type { RoundResultEntry, ScoreBreakdown } from "../../../shared/types";
import { RoomManager } from "../rooms/RoomManager";
import { decodeToPcm, isEffectivelySilent } from "../audio/decode";
import { extractFeatures } from "../audio/features";
import { getScoringProvider } from "../scoring/provider";

const MAX_RECORDING_BYTES = 8 * 1024 * 1024; // 8MB hard cap per submission
const MAX_RECORDING_MS = 20_000; // safety cap even if a client misbehaves

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const scoringProvider = getScoringProvider();

export function registerSocketHandlers(io: TypedServer, roomManager: RoomManager): void {
  io.on("connection", (socket: TypedSocket) => {
    socket.data.playerId = "";
    socket.data.roomCode = null;

    socket.on("create_room", ({ nickname }, ack) => {
      const clean = (nickname || "").trim();
      if (!clean) return ack({ ok: false, error: "EMPTY_NICKNAME" });
      const { room, playerId } = roomManager.createRoom(clean, socket.id);
      socket.data.playerId = playerId;
      socket.data.roomCode = room.code;
      socket.join(room.code);
      ack({ ok: true, room, playerId });
    });

    socket.on("join_room", ({ nickname, code }, ack) => {
      const result = roomManager.joinRoom(code, nickname, socket.id);
      if ("error" in result) return ack({ ok: false, error: result.error });
      socket.data.playerId = result.playerId;
      socket.data.roomCode = result.room.code;
      socket.join(result.room.code);
      ack({ ok: true, room: result.room, playerId: result.playerId });
      socket.to(result.room.code).emit("room_updated", result.room);
      const joinedPlayer = result.room.players.find((p) => p.id === result.playerId);
      if (joinedPlayer) socket.to(result.room.code).emit("player_joined", joinedPlayer);
    });

    socket.on("leave_room", ({ code }) => {
      handleLeave(socket, roomManager, io, code);
    });

    socket.on("rejoin_room", ({ code, playerId }, ack) => {
      const room = roomManager.reconnectPlayer(code, playerId, socket.id);
      if (!room) return ack({ ok: false, error: "ROOM_NOT_FOUND" });
      socket.data.playerId = playerId;
      socket.data.roomCode = code;
      socket.join(code);
      ack({ ok: true, room });
      socket.to(code).emit("room_updated", room);
    });

    const roundTimers = new Map<string, NodeJS.Timeout>();

    function clearRoundTimer(roomCode: string) {
      const existing = roundTimers.get(roomCode.toUpperCase());
      if (existing) {
        clearTimeout(existing);
        roundTimers.delete(roomCode.toUpperCase());
      }
    }

    function scheduleRoundTimer(roomCode: string, seconds: number) {
      clearRoundTimer(roomCode);
      const code = roomCode.toUpperCase();
      // Allow extra buffer for audio upload and decoding
      const timeoutMs = Math.max(10, seconds + 7) * 1000;
      const timer = setTimeout(() => {
        const room = roomManager.getRoom(code);
        if (!room || room.state.state === "RESULTS" || room.state.state === "LOBBY" || room.state.state === "FINISHED") {
          return;
        }
        const challenge = room.state.currentChallenge;
        if (!challenge) return;
        const results = roomManager.finalizeRound(code);
        roomManager.setState(code, "RESULTS");
        io.to(code).emit("round_results", { results, challenge });
        io.to(code).emit("room_updated", roomManager.getPublicState(code)!);
      }, timeoutMs);
      roundTimers.set(code, timer);
    }

    socket.on("update_settings", ({ code, settings, playerId }) => {
      const pId = socket.data.playerId || playerId;
      if (!pId) return;
      if (!socket.data.playerId) socket.data.playerId = pId;
      const room = roomManager.updateSettings(code, pId, settings);
      if (room) io.to(code).emit("room_updated", room);
    });

    socket.on("player_ready", ({ code, ready, playerId }) => {
      const pId = socket.data.playerId || playerId;
      if (!pId) return;
      if (!socket.data.playerId) socket.data.playerId = pId;
      const room = roomManager.setReady(code, pId, ready);
      if (room) io.to(code).emit("room_updated", room);
    });

    socket.on("start_game", ({ code, playerId }) => {
      const pId = socket.data.playerId || playerId;
      if (!pId) return;
      if (!socket.data.playerId) socket.data.playerId = pId;
      const check = roomManager.canStart(code, pId);
      if (!check.ok) {
        socket.emit("error_message", { code: check.error, message: humanizeError(check.error) });
        return;
      }
      const room = roomManager.startGame(code);
      if (!room || !room.currentChallenge) return;
      scheduleRoundTimer(code, room.settings.roundTimerSeconds);
      io.to(code).emit("room_updated", room);
      io.to(code).emit("round_started", {
        challenge: room.currentChallenge,
        roundIndex: room.currentRoundIndex,
        totalRounds: room.settings.rounds,
      });
      if (room.activeEvent) {
        io.to(code).emit("random_event", {
          event: room.activeEvent,
          description: roomManager.eventDescription(room.activeEvent),
        });
      }
    });

    socket.on("recording_submitted", async ({ code, audioBase64, mimeType, clientDurationMs, playerId }) => {
      try {
        const pId = socket.data.playerId || playerId;
        if (!pId) return;
        if (!socket.data.playerId) socket.data.playerId = pId;

        if (clientDurationMs > MAX_RECORDING_MS) {
          socket.emit("error_message", { code: "RECORDING_TOO_LONG", message: "That recording is too long." });
          return;
        }
        const buffer = Buffer.from(audioBase64, "base64");
        if (buffer.byteLength > MAX_RECORDING_BYTES) {
          socket.emit("error_message", { code: "RECORDING_TOO_LARGE", message: "That recording is too large." });
          return;
        }

        const room = roomManager.getRoom(code);
        const player = room?.state.players.find((p) => p.id === pId);
        const challenge = room?.state.currentChallenge;
        if (!room || !player || !challenge) return;

        socket.emit("processing_started");

        const { samples: playerSamples, sampleRate } = await decodeToPcm(buffer);

        let breakdown: ScoreBreakdown;
        if (isEffectivelySilent(playerSamples)) {
          // Graceful fallback for soft or low-gain microphones so the party never freezes
          breakdown = {
            pitchSimilarity: 15,
            spectralSimilarity: 15,
            timingSimilarity: 15,
            energySimilarity: 15,
            durationSimilarity: 15,
            total: 15,
          };
        } else {
          const targetFeatures = await getOrBuildTargetFeatures(challenge.id, challenge.duration, sampleRate);
          const playerFeatures = extractFeatures(playerSamples, sampleRate);
          breakdown = await scoringProvider.score(targetFeatures, playerFeatures);
        }

        const entry: RoundResultEntry = {
          playerId: player.id,
          nickname: player.nickname,
          character: player.character,
          score: breakdown.total,
          breakdown,
          pointsAwarded: breakdown.total,
          recordingUrl: null,
        };
        roomManager.recordSubmission(code, entry);
        io.to(code).emit("player_score", { playerId: player.id, score: breakdown.total });

        if (roomManager.allSubmitted(code) || room.state.activeEvent === "ONE_SHOT") {
          clearRoundTimer(code);
          const results = roomManager.finalizeRound(code);
          roomManager.setState(code, "RESULTS");
          io.to(code).emit("round_results", { results, challenge });
          io.to(code).emit("room_updated", roomManager.getPublicState(code)!);
        }
      } catch (err) {
        console.error("recording_submitted failed:", err);
        socket.emit("error_message", { code: "PROCESSING_FAILED", message: "Couldn't process that recording." });
      }
    });

    socket.on("next_round", ({ code }) => {
      clearRoundTimer(code);
      const room = roomManager.advanceToNextRound(code);
      if (!room) return;
      if (room.state === "FINISHED") {
        const final = roomManager.buildFinalResults(code);
        io.to(code).emit("room_updated", room);
        if (final) io.to(code).emit("game_finished", final);
        return;
      }
      scheduleRoundTimer(code, room.settings.roundTimerSeconds);
      io.to(code).emit("room_updated", room);
      if (room.currentChallenge) {
        io.to(code).emit("round_started", {
          challenge: room.currentChallenge,
          roundIndex: room.currentRoundIndex,
          totalRounds: room.settings.rounds,
        });
      }
      if (room.activeEvent) {
        io.to(code).emit("random_event", {
          event: room.activeEvent,
          description: roomManager.eventDescription(room.activeEvent),
        });
      }
    });

    socket.on("play_again", ({ code }) => {
      const room = roomManager.resetForPlayAgain(code);
      if (room) io.to(code).emit("room_updated", room);
    });

    socket.on("disconnect", () => {
      const result = roomManager.disconnectPlayer(socket.id);
      if (!result) return;
      io.to(result.code).emit("room_updated", result.room);
      if (result.hostChanged) io.to(result.code).emit("host_changed", result.room.hostId);
    });
  });
}

function handleLeave(socket: TypedSocket, roomManager: RoomManager, io: TypedServer, code: string) {
  const room = roomManager.removePlayer(code, socket.data.playerId);
  socket.leave(code);
  if (room) {
    io.to(code).emit("room_updated", room);
    io.to(code).emit("player_left", socket.data.playerId);
  }
  socket.data.roomCode = null;
}

function humanizeError(code: string): string {
  switch (code) {
    case "NOT_ENOUGH_PLAYERS":
      return "You need at least 2 players to start.";
    case "NOT_HOST":
      return "Only the host can start the game.";
    case "ROOM_NOT_FOUND":
      return "This party doesn't exist anymore.";
    default:
      return "Something went wrong.";
  }
}

// ---------------------------------------------------------------------------
// Target-feature cache. Real deployments should decode the actual licensed
// challenge audio file once (on server boot or first request) and cache its
// AudioFeatures forever, since target audio never changes. This placeholder
// generates a deterministic-per-challenge pseudo-target so the full scoring
// pipeline (including the UI's live breakdown bars) is real and testable
// before licensed audio is added.
// ---------------------------------------------------------------------------
import type { AudioFeatures } from "../../../shared/types";
const targetFeatureCache = new Map<string, AudioFeatures>();

async function getOrBuildTargetFeatures(challengeId: string, duration: number, sampleRate: number): Promise<AudioFeatures> {
  const cached = targetFeatureCache.get(challengeId);
  if (cached) return cached;

  // Deterministic seed from challenge id so the same challenge always scores consistently.
  let seed = 0;
  for (let i = 0; i < challengeId.length; i++) seed = (seed * 31 + challengeId.charCodeAt(i)) >>> 0;
  const rand = mulberry32(seed);

  const length = Math.max(1, Math.floor(duration * sampleRate));
  const samples = new Float32Array(length);
  const baseFreq = 150 + rand() * 700; // 150-850Hz "voice-like" fundamental
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    samples[i] = 0.4 * Math.sin(2 * Math.PI * baseFreq * t) * Math.exp(-1.5 * Math.abs(t - duration / 2));
  }
  const features = extractFeatures(samples, sampleRate);
  targetFeatureCache.set(challengeId, features);
  return features;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
