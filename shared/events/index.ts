// ============================================================================
// EchoChaos — Shared Socket.IO Event Contract
// Strongly typed client<->server events. Import these types on both sides so
// `socket.emit`/`socket.on` calls are checked by the compiler.
// ============================================================================

import type {
  Challenge,
  FinalResults,
  GameSettings,
  Player,
  RandomEventType,
  RoomState,
  RoundResultEntry,
} from "../types";

// ---- Client -> Server -------------------------------------------------

export interface ClientToServerEvents {
  create_room: (
    payload: { nickname: string },
    ack: (res: { ok: true; room: RoomState; playerId: string } | { ok: false; error: string }) => void
  ) => void;

  join_room: (
    payload: { nickname: string; code: string },
    ack: (res: { ok: true; room: RoomState; playerId: string } | { ok: false; error: string }) => void
  ) => void;

  leave_room: (payload: { code: string }) => void;

  rejoin_room: (
    payload: { code: string; playerId: string },
    ack: (res: { ok: true; room: RoomState } | { ok: false; error: string }) => void
  ) => void;

  update_settings: (payload: { code: string; settings: Partial<GameSettings>; playerId?: string }) => void;

  player_ready: (payload: { code: string; ready: boolean; playerId?: string }) => void;

  start_game: (payload: { code: string; playerId?: string }) => void;

  recording_submitted: (payload: {
    code: string;
    // base64-encoded webm/opus audio blob captured via MediaRecorder
    audioBase64: string;
    mimeType: string;
    clientDurationMs: number;
    playerId?: string;
  }) => void;

  next_round: (payload: { code: string; playerId?: string }) => void;

  play_again: (payload: { code: string; playerId?: string }) => void;
}

// ---- Server -> Client -------------------------------------------------

export interface ServerToClientEvents {
  room_updated: (room: RoomState) => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string) => void;
  host_changed: (newHostId: string) => void;

  round_started: (payload: { challenge: Challenge; roundIndex: number; totalRounds: number }) => void;
  processing_started: () => void;

  player_score: (payload: { playerId: string; score: number }) => void;
  round_results: (payload: { results: RoundResultEntry[]; challenge: Challenge }) => void;

  random_event: (payload: { event: RandomEventType; description: string }) => void;

  game_finished: (payload: FinalResults) => void;

  error_message: (payload: { code: string; message: string }) => void;
  connection_lost: () => void;
  reconnected: (room: RoomState) => void;
}

export interface InterServerEvents {
  // Reserved for future horizontal scaling (multi-instance room routing).
}

export interface SocketData {
  playerId: string;
  roomCode: string | null;
}
