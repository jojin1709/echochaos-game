// ============================================================================
// RoomManager — authoritative, in-memory room + game state machine.
//
// Rooms are ephemeral (never persisted to a DB) and are destroyed after all
// players disconnect for ROOM_EMPTY_TIMEOUT_MS. The server is the single
// source of truth for state transitions, scores, and challenge selection —
// clients only ever display what the server broadcasts.
// ============================================================================

import { randomUUID } from "crypto";
import type {
  CharacterColor,
  Challenge,
  FinalResults,
  GameSettings,
  Player,
  RandomEventType,
  RoomState,
  RoundResultEntry,
} from "../../../shared/types";
import { DEFAULT_SETTINGS } from "../../../shared/types";
import { pickRandomChallenges } from "../game/challenges";

const ROOM_EMPTY_TIMEOUT_MS = 5 * 60 * 1000; // destroy 5 min after last player leaves
const MAX_PLAYERS = 8;
const MIN_PLAYERS_TO_START = 2;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

const CHARACTER_COLORS: CharacterColor[] = ["pink", "blue", "yellow", "green", "purple", "orange"];

const EVENT_DESCRIPTIONS: Record<RandomEventType, string> = {
  DOUBLE_POINTS: "Double points this round!",
  TINY_VOICE: "Mimic it... but very quietly.",
  SPEED_ROUND: "Only 3 seconds to record!",
  EVERYONE_MIMICS: "Everyone mimics the same challenge!",
  REVERSE_ROUND: "Recordings will be played backwards!",
  ONE_SHOT: "No retries this round — one shot only!",
  CHAOS_ROUND: "Random challenge, short timer. Pure chaos!",
};

interface InternalRoom {
  state: RoomState;
  challengeQueue: Challenge[];
  emptySince: number | null;
  playerBestScore: Map<string, number>; // for "most improved"
  playerEventCount: Map<string, number>; // for "chaos champion"
  pendingSubmissions: Map<string, RoundResultEntry>; // playerId -> result, filled during PROCESSING
}

export class RoomManager {
  private rooms = new Map<string, InternalRoom>();

  private generateRoomCode(): string {
    let code: string;
    do {
      code = Array.from({ length: 6 }, () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]).join("");
    } while (this.rooms.has(code));
    return code;
  }

  private assignCharacter(existing: Player[]): CharacterColor {
    const used = new Set(existing.map((p) => p.character));
    const free = CHARACTER_COLORS.find((c) => !used.has(c));
    return free ?? CHARACTER_COLORS[Math.floor(Math.random() * CHARACTER_COLORS.length)];
  }

  createRoom(nickname: string, socketId: string): { room: RoomState; playerId: string } {
    const code = this.generateRoomCode();
    const playerId = randomUUID();
    const player: Player = {
      id: playerId,
      socketId,
      nickname: nickname.slice(0, 20),
      character: this.assignCharacter([]),
      isHost: true,
      connected: true,
      ready: false,
      score: 0,
      lastRoundScore: null,
    };

    const room: InternalRoom = {
      state: {
        code,
        hostId: playerId,
        players: [player],
        settings: { ...DEFAULT_SETTINGS },
        state: "LOBBY",
        currentRoundIndex: -1,
        currentChallenge: null,
        activeEvent: null,
        roundResults: null,
        createdAt: Date.now(),
      },
      challengeQueue: [],
      emptySince: null,
      playerBestScore: new Map(),
      playerEventCount: new Map(),
      pendingSubmissions: new Map(),
    };

    this.rooms.set(code, room);
    return { room: room.state, playerId };
  }

  joinRoom(code: string, nickname: string, socketId: string): { room: RoomState; playerId: string } | { error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { error: "ROOM_NOT_FOUND" };
    if (room.state.state !== "LOBBY") return { error: "GAME_ALREADY_STARTED" };
    if (room.state.players.filter((p) => p.connected).length >= MAX_PLAYERS) return { error: "ROOM_FULL" };
    if (!nickname || !nickname.trim()) return { error: "EMPTY_NICKNAME" };
    if (room.state.players.some((p) => p.connected && p.nickname.toLowerCase() === nickname.trim().toLowerCase())) {
      return { error: "DUPLICATE_NICKNAME" };
    }

    const playerId = randomUUID();
    const player: Player = {
      id: playerId,
      socketId,
      nickname: nickname.trim().slice(0, 20),
      character: this.assignCharacter(room.state.players),
      isHost: false,
      connected: true,
      ready: false,
      score: 0,
      lastRoundScore: null,
    };
    room.state.players.push(player);
    room.emptySince = null;
    return { room: room.state, playerId };
  }

  getRoom(code: string): InternalRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getPublicState(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase())?.state;
  }

  setReady(code: string, playerId: string, ready: boolean): RoomState | undefined {
    const room = this.getRoom(code);
    const player = room?.state.players.find((p) => p.id === playerId);
    if (player) player.ready = ready;
    return room?.state;
  }

  updateSettings(code: string, playerId: string, settings: Partial<GameSettings>): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;
    if (room.state.hostId !== playerId) return room.state; // only host can change settings
    room.state.settings = { ...room.state.settings, ...settings };
    return room.state;
  }

  canStart(code: string, playerId: string): { ok: true } | { ok: false; error: string } {
    const room = this.getRoom(code);
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
    if (room.state.hostId !== playerId) return { ok: false, error: "NOT_HOST" };
    const connectedCount = room.state.players.filter((p) => p.connected).length;
    if (connectedCount < MIN_PLAYERS_TO_START) return { ok: false, error: "NOT_ENOUGH_PLAYERS" };
    return { ok: true };
  }

  startGame(code: string): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;
    room.challengeQueue = pickRandomChallenges(
      room.state.settings.rounds,
      room.state.settings.categories,
      room.state.settings.difficulty
    );
    room.state.currentRoundIndex = -1;
    room.state.players.forEach((p) => {
      p.score = 0;
      p.lastRoundScore = null;
    });
    room.playerBestScore.clear();
    room.playerEventCount.clear();
    return this.advanceToNextRound(code);
  }

  /** Moves the room into ROUND_INTRO/LISTENING for the next challenge, or FINISHED if out of rounds. */
  advanceToNextRound(code: string): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;

    const nextIndex = room.state.currentRoundIndex + 1;
    if (nextIndex >= room.challengeQueue.length) {
      room.state.state = "FINISHED";
      room.state.currentChallenge = null;
      return room.state;
    }

    room.state.currentRoundIndex = nextIndex;
    room.state.currentChallenge = room.challengeQueue[nextIndex];
    room.state.roundResults = null;
    room.pendingSubmissions.clear();

    // Roll a random event ~35% of the time (skip round 0 so players see a normal round first).
    room.state.activeEvent = null;
    if (room.state.settings.randomEvents && nextIndex > 0 && Math.random() < 0.35) {
      const events = Object.keys(EVENT_DESCRIPTIONS) as RandomEventType[];
      room.state.activeEvent = events[Math.floor(Math.random() * events.length)];
      room.playerEventCount.forEach((_, id) => room.playerEventCount.set(id, (room.playerEventCount.get(id) ?? 0) + 1));
    }

    room.state.state = "ROUND_INTRO";
    room.state.players.forEach((p) => (p.lastRoundScore = null));
    return room.state;
  }

  eventDescription(event: RandomEventType): string {
    return EVENT_DESCRIPTIONS[event];
  }

  setState(code: string, state: RoomState["state"]): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;
    room.state.state = state;
    return room.state;
  }

  recordSubmission(code: string, entry: RoundResultEntry): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.pendingSubmissions.set(entry.playerId, entry);
  }

  allSubmitted(code: string): boolean {
    const room = this.getRoom(code);
    if (!room) return false;
    const connected = room.state.players.filter((p) => p.connected);
    return connected.every((p) => room.pendingSubmissions.has(p.id));
  }

  /** Finalizes round: applies bonuses/event multipliers, updates cumulative scores, returns sorted results. */
  finalizeRound(code: string): RoundResultEntry[] {
    const room = this.getRoom(code);
    if (!room) return [];

    const entries = Array.from(room.pendingSubmissions.values());
    const multiplier = room.state.activeEvent === "DOUBLE_POINTS" ? 2 : 1;
    const topScore = Math.max(0, ...entries.map((e) => e.score));

    for (const entry of entries) {
      let points = entry.score;
      if (entry.score === topScore && topScore > 0) points += 10; // winner bonus
      points += 5; // participation bonus
      points *= multiplier;
      entry.pointsAwarded = Math.round(points);

      const player = room.state.players.find((p) => p.id === entry.playerId);
      if (player) {
        player.score += entry.pointsAwarded;
        player.lastRoundScore = entry.score;
      }

      const prevBest = room.playerBestScore.get(entry.playerId) ?? 0;
      room.playerBestScore.set(entry.playerId, Math.max(prevBest, entry.score));
    }

    entries.sort((a, b) => b.pointsAwarded - a.pointsAwarded);
    room.state.roundResults = entries;
    return entries;
  }

  buildFinalResults(code: string): FinalResults | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;

    const leaderboard = [...room.state.players]
      .sort((a, b) => b.score - a.score)
      .map((p) => ({ playerId: p.id, nickname: p.nickname, character: p.character, score: p.score }));

    let bestMimic: FinalResults["stats"]["bestMimic"] = null;
    let best = -1;
    room.playerBestScore.forEach((score, playerId) => {
      if (score > best) {
        best = score;
        const p = room.state.players.find((pl) => pl.id === playerId);
        if (p) bestMimic = { playerId, nickname: p.nickname, score };
      }
    });

    let chaosChampion: FinalResults["stats"]["chaosChampion"] = null;
    let maxEvents = 0;
    room.playerEventCount.forEach((count, playerId) => {
      if (count > maxEvents) {
        maxEvents = count;
        const p = room.state.players.find((pl) => pl.id === playerId);
        if (p) chaosChampion = { playerId, nickname: p.nickname, eventsPlayed: count };
      }
    });

    return {
      leaderboard,
      stats: {
        bestMimic,
        mostImproved: null, // requires cross-round deltas beyond this v1's tracked data
        funniestAttempt: null, // reserved for future "funny meter" heuristic
        chaosChampion: maxEvents > 0 ? chaosChampion : null,
      },
    };
  }

  resetForPlayAgain(code: string): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;
    room.state.state = "LOBBY";
    room.state.currentRoundIndex = -1;
    room.state.currentChallenge = null;
    room.state.activeEvent = null;
    room.state.roundResults = null;
    room.state.players.forEach((p) => {
      p.ready = false;
      p.score = 0;
      p.lastRoundScore = null;
    });
    return room.state;
  }

  disconnectPlayer(socketId: string): { code: string; room: RoomState; hostChanged: boolean } | undefined {
    for (const [code, room] of this.rooms) {
      const player = room.state.players.find((p) => p.socketId === socketId);
      if (!player) continue;
      player.connected = false;

      let hostChanged = false;
      if (room.state.hostId === player.id) {
        const nextHost = room.state.players.find((p) => p.connected);
        if (nextHost) {
          room.state.hostId = nextHost.id;
          nextHost.isHost = true;
          player.isHost = false;
          hostChanged = true;
        }
      }

      if (room.state.players.every((p) => !p.connected)) {
        room.emptySince = Date.now();
      }

      return { code, room: room.state, hostChanged };
    }
    return undefined;
  }

  reconnectPlayer(code: string, playerId: string, socketId: string): RoomState | undefined {
    const room = this.getRoom(code);
    const player = room?.state.players.find((p) => p.id === playerId);
    if (!room || !player) return undefined;
    player.connected = true;
    player.socketId = socketId;
    room.emptySince = null;
    return room.state;
  }

  removePlayer(code: string, playerId: string): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;
    room.state.players = room.state.players.filter((p) => p.id !== playerId);
    if (room.state.players.length === 0) {
      room.emptySince = Date.now();
    } else if (room.state.hostId === playerId) {
      const nextHost = room.state.players[0];
      room.state.hostId = nextHost.id;
      nextHost.isHost = true;
    }
    return room.state;
  }

  /** Call periodically to garbage-collect rooms that have been empty too long. */
  sweepEmptyRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.emptySince && now - room.emptySince > ROOM_EMPTY_TIMEOUT_MS) {
        this.rooms.delete(code);
      }
    }
  }

  roomCount(): number {
    return this.rooms.size;
  }
}
