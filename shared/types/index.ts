// ============================================================================
// EchoChaos — Shared Types
// Used by BOTH the Next.js frontend and the Node/Socket.IO server so the
// contract between them can never silently drift.
// ============================================================================

export type GameState =
  | "LOBBY"
  | "ROUND_INTRO"
  | "LISTENING"
  | "RECORDING"
  | "PROCESSING"
  | "RESULTS"
  | "EVENT"
  | "FINISHED";

export type Difficulty = "easy" | "mixed" | "hard";

export type CategoryId =
  | "animals"
  | "vehicles"
  | "technology"
  | "household"
  | "funny"
  | "monsters"
  | "human"
  | "random";

export type CharacterColor =
  | "pink"
  | "blue"
  | "yellow"
  | "green"
  | "purple"
  | "orange";

export type CharacterMood =
  | "idle"
  | "ready"
  | "listening"
  | "recording"
  | "thinking"
  | "excited"
  | "winner"
  | "losing";

export type RandomEventType =
  | "DOUBLE_POINTS"
  | "TINY_VOICE"
  | "SPEED_ROUND"
  | "EVERYONE_MIMICS"
  | "REVERSE_ROUND"
  | "ONE_SHOT"
  | "CHAOS_ROUND";

export interface Player {
  id: string; // temporary session id, NOT a persistent account
  socketId: string;
  nickname: string;
  character: CharacterColor;
  isHost: boolean;
  connected: boolean;
  ready: boolean;
  score: number;
  lastRoundScore: number | null;
}

export interface GameSettings {
  rounds: 5 | 10 | 15;
  difficulty: Difficulty;
  categories: CategoryId[] | "mixed";
  randomEvents: boolean;
  roundTimerSeconds: 5 | 10 | 15;
  soundEffects: boolean;
  music: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  rounds: 10,
  difficulty: "mixed",
  categories: "mixed",
  randomEvents: true,
  roundTimerSeconds: 10,
  soundEffects: true,
  music: true,
};

export interface Challenge {
  id: string;
  name: string;
  category: CategoryId;
  difficulty: number; // 1-3
  audioUrl: string;
  duration: number; // seconds
  tags: string[];
  emoji: string; // fallback visual when no art asset exists
}

export interface AudioFeatures {
  rmsEnergy: number;
  durationSeconds: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  spectralBandwidth: number;
  spectralRolloff: number;
  pitchHz: number | null;
  envelope: number[]; // coarse amplitude-over-time bins, normalized 0-1
}

export interface ScoreBreakdown {
  pitchSimilarity: number;
  spectralSimilarity: number;
  timingSimilarity: number;
  energySimilarity: number;
  durationSimilarity: number;
  total: number; // 0-100, weighted composite
}

export interface RoundResultEntry {
  playerId: string;
  nickname: string;
  character: CharacterColor;
  score: number; // this round's similarity score, 0-100
  breakdown: ScoreBreakdown;
  pointsAwarded: number; // score + bonuses, after event multipliers
  recordingUrl: string | null; // ephemeral, cleared after round ends
}

export interface RoomState {
  code: string;
  hostId: string;
  players: Player[];
  settings: GameSettings;
  state: GameState;
  currentRoundIndex: number; // 0-based
  currentChallenge: Challenge | null;
  activeEvent: RandomEventType | null;
  roundResults: RoundResultEntry[] | null;
  createdAt: number;
}

// Trimmed view of RoomState that is safe to broadcast (no server-only fields)
export type PublicRoomState = RoomState;

export interface FinalStats {
  bestMimic: { playerId: string; nickname: string; score: number } | null;
  mostImproved: { playerId: string; nickname: string; delta: number } | null;
  funniestAttempt: { playerId: string; nickname: string; score: number } | null;
  chaosChampion: { playerId: string; nickname: string; eventsPlayed: number } | null;
}

export interface FinalResults {
  leaderboard: Array<{ playerId: string; nickname: string; character: CharacterColor; score: number }>;
  stats: FinalStats;
}
