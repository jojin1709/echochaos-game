"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import type {
  Challenge,
  FinalResults,
  GameSettings,
  RandomEventType,
  RoomState,
  RoundResultEntry,
} from "@shared/types";

export type LocalPhase =
  | "landing"
  | "create"
  | "join"
  | "connecting"
  | "lobby"
  | "round_intro"
  | "listening"
  | "get_ready"
  | "recording"
  | "processing"
  | "round_results"
  | "random_event"
  | "final_results"
  | "room_error";

const STORAGE_KEY = "echochaos_session";

interface StoredSession {
  code: string;
  playerId: string;
}

export function useGameSocket() {
  const socketRef = useRef(getSocket());
  const [phase, setPhase] = useState<LocalPhase>("landing");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<{ challenge: Challenge; roundIndex: number; totalRounds: number } | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResultEntry[] | null>(null);
  const [finalResults, setFinalResults] = useState<FinalResults | null>(null);
  const [activeEvent, setActiveEvent] = useState<{ event: RandomEventType; description: string } | null>(null);
  const [connected, setConnected] = useState(false);
  const [silentRetry, setSilentRetry] = useState<string | null>(null);

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => {
      setConnected(true);
      const stored = readStoredSession();
      if (stored && phase !== "lobby") {
        socket.emit("rejoin_room", stored, (res) => {
          if (res.ok) {
            setRoom(res.room);
            setPlayerId(stored.playerId);
            setPhase(phaseForRoomState(res.room.state));
          } else {
            clearStoredSession();
          }
        });
      }
    };
    const onDisconnect = () => setConnected(false);

    const onRoomUpdated = (r: RoomState) => setRoom(r);
    const onRoundStarted = (payload: { challenge: Challenge; roundIndex: number; totalRounds: number }) => {
      setCurrentRound(payload);
      setRoundResults(null);
      setActiveEvent(null);
      setPhase("round_intro");
    };
    const onRandomEvent = (payload: { event: RandomEventType; description: string }) => {
      setActiveEvent(payload);
    };
    const onProcessingStarted = () => setPhase("processing");
    const onRoundResults = (payload: { results: RoundResultEntry[]; challenge: Challenge }) => {
      setRoundResults(payload.results);
      setPhase("round_results");
    };
    const onGameFinished = (payload: FinalResults) => {
      setFinalResults(payload);
      setPhase("final_results");
    };
    const onErrorMessage = (payload: { code: string; message: string }) => {
      setErrorMessage(payload.message);
      if (payload.code === "SILENT_RECORDING") {
        setSilentRetry(payload.message);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room_updated", onRoomUpdated);
    socket.on("round_started", onRoundStarted);
    socket.on("random_event", onRandomEvent);
    socket.on("processing_started", onProcessingStarted);
    socket.on("round_results", onRoundResults);
    socket.on("game_finished", onGameFinished);
    socket.on("error_message", onErrorMessage);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room_updated", onRoomUpdated);
      socket.off("round_started", onRoundStarted);
      socket.off("random_event", onRandomEvent);
      socket.off("processing_started", onProcessingStarted);
      socket.off("round_results", onRoundResults);
      socket.off("game_finished", onGameFinished);
      socket.off("error_message", onErrorMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRoom = useCallback((nickname: string) => {
    setErrorMessage(null);
    socketRef.current.emit("create_room", { nickname }, (res) => {
      if (res.ok) {
        setRoom(res.room);
        setPlayerId(res.playerId);
        storeSession({ code: res.room.code, playerId: res.playerId });
        setPhase("lobby");
      } else {
        setErrorMessage(humanizeClientError(res.error));
      }
    });
  }, []);

  const joinRoom = useCallback((nickname: string, code: string) => {
    setErrorMessage(null);
    socketRef.current.emit("join_room", { nickname, code: code.toUpperCase() }, (res) => {
      if (res.ok) {
        setRoom(res.room);
        setPlayerId(res.playerId);
        storeSession({ code: res.room.code, playerId: res.playerId });
        setPhase("lobby");
      } else {
        setErrorMessage(humanizeClientError(res.error));
      }
    });
  }, []);

  const leaveRoom = useCallback(() => {
    if (room) socketRef.current.emit("leave_room", { code: room.code });
    clearStoredSession();
    setRoom(null);
    setPlayerId("");
    setCurrentRound(null);
    setRoundResults(null);
    setFinalResults(null);
    setPhase("landing");
  }, [room]);

  const updateSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      if (room) socketRef.current.emit("update_settings", { code: room.code, settings });
    },
    [room]
  );

  const setReady = useCallback(
    (ready: boolean) => {
      if (room) socketRef.current.emit("player_ready", { code: room.code, ready });
    },
    [room]
  );

  const startGame = useCallback(() => {
    if (room) socketRef.current.emit("start_game", { code: room.code });
  }, [room]);

  const submitRecording = useCallback(
    (audioBase64: string, mimeType: string, clientDurationMs: number) => {
      if (!room) return;
      setPhase("processing");
      setSilentRetry(null);
      socketRef.current.emit("recording_submitted", { code: room.code, audioBase64, mimeType, clientDurationMs });
    },
    [room]
  );

  const nextRound = useCallback(() => {
    if (room) socketRef.current.emit("next_round", { code: room.code });
  }, [room]);

  const playAgain = useCallback(() => {
    if (room) {
      socketRef.current.emit("play_again", { code: room.code });
      setFinalResults(null);
      setPhase("lobby");
    }
  }, [room]);

  const goTo = useCallback((p: LocalPhase) => setPhase(p), []);
  const clearError = useCallback(() => setErrorMessage(null), []);

  return {
    phase,
    room,
    playerId,
    connected,
    errorMessage,
    silentRetry,
    clearSilentRetry: () => setSilentRetry(null),
    currentRound,
    roundResults,
    finalResults,
    activeEvent,
    createRoom,
    joinRoom,
    leaveRoom,
    updateSettings,
    setReady,
    startGame,
    submitRecording,
    nextRound,
    playAgain,
    goTo,
    clearError,
  };
}

function phaseForRoomState(state: RoomState["state"]): LocalPhase {
  switch (state) {
    case "LOBBY":
      return "lobby";
    case "FINISHED":
      return "final_results";
    default:
      return "round_intro";
  }
}

function storeSession(s: StoredSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — non-fatal */
  }
}
function readStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearStoredSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* non-fatal */
  }
}

function humanizeClientError(code: string): string {
  switch (code) {
    case "ROOM_NOT_FOUND":
      return "This party doesn't exist anymore.";
    case "ROOM_FULL":
      return "This party already has 8 players.";
    case "EMPTY_NICKNAME":
      return "Enter a name to join the party.";
    case "DUPLICATE_NICKNAME":
      return "Someone in this party already has that name.";
    case "GAME_ALREADY_STARTED":
      return "This party's game has already started.";
    default:
      return "Something went wrong. Try again.";
  }
}
