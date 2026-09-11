"use client";

import { useState } from "react";
import type { GameSettings, RoomState } from "@shared/types";
import { Stage, StageCard } from "@/game/Stage";
import { ChunkyButton } from "@/components/ChunkyButton";
import { Character } from "@/components/Character";

interface Props {
  room: RoomState;
  playerId: string;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onSetReady: (ready: boolean) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function Lobby({ room, playerId, onUpdateSettings, onSetReady, onStart, onLeave }: Props) {
  const [copied, setCopied] = useState(false);
  const me = room.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const connectedCount = room.players.filter((p) => p.connected).length;

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Stage onLeave={onLeave}>
      <StageCard>
        <div className="text-center mb-6">
          <p className="font-display text-sm text-cream/60 uppercase tracking-wide">Room code</p>
          <button
            onClick={copyCode}
            className="focus-ring font-display text-4xl md:text-5xl font-extrabold text-action-yellow tracking-[0.2em] mt-1"
            title="Click to copy"
          >
            {room.code}
          </button>
          <p className="text-xs text-cream/40 mt-1 font-body">{copied ? "Copied!" : "Click the code to copy it"}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {room.players.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1 bg-stage-deep/60 rounded-xl2 p-3">
              <Character color={p.character} mood={p.ready ? "ready" : "idle"} size={48} />
              <span className="font-display text-sm text-cream flex items-center gap-1">
                {p.isHost && "👑"} {p.nickname}
              </span>
              <span className={`text-xs font-body ${p.ready ? "text-success" : "text-cream/40"}`}>
                {p.ready ? "Ready" : "Not ready"}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center font-body text-cream/60 text-sm mb-6">{connectedCount} / 8 players</p>

        <GameSettingsPanel settings={room.settings} editable={isHost} onChange={onUpdateSettings} />

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <ChunkyButton
            variant={me?.ready ? "outline" : "success"}
            className="flex-1"
            onClick={() => onSetReady(!me?.ready)}
          >
            {me?.ready ? "Not ready" : "I'm ready"}
          </ChunkyButton>
          {isHost && (
            <ChunkyButton
              variant="yellow"
              className="flex-1"
              disabled={connectedCount < 2}
              onClick={onStart}
              title={connectedCount < 2 ? "Need at least 2 players" : undefined}
            >
              Start Game
            </ChunkyButton>
          )}
        </div>
        {isHost && connectedCount < 2 && (
          <p className="text-center text-xs text-cream/40 mt-2 font-body">Waiting for at least one more player...</p>
        )}
      </StageCard>
    </Stage>
  );
}

function GameSettingsPanel({
  settings,
  editable,
  onChange,
}: {
  settings: GameSettings;
  editable: boolean;
  onChange: (s: Partial<GameSettings>) => void;
}) {
  return (
    <div className="bg-stage-deep/50 rounded-xl2 p-5">
      <p className="font-display text-sm text-cream/60 uppercase tracking-wide mb-4">Game settings</p>
      <div className="grid grid-cols-2 gap-4">
        <SettingRow label="Rounds">
          <SegmentedControl
            options={[5, 10, 15]}
            value={settings.rounds}
            editable={editable}
            onChange={(v) => onChange({ rounds: v as GameSettings["rounds"] })}
          />
        </SettingRow>
        <SettingRow label="Difficulty">
          <SegmentedControl
            options={["easy", "mixed", "hard"]}
            value={settings.difficulty}
            editable={editable}
            onChange={(v) => onChange({ difficulty: v as GameSettings["difficulty"] })}
          />
        </SettingRow>
        <SettingRow label="Round timer">
          <SegmentedControl
            options={[5, 10, 15]}
            suffix="s"
            value={settings.roundTimerSeconds}
            editable={editable}
            onChange={(v) => onChange({ roundTimerSeconds: v as GameSettings["roundTimerSeconds"] })}
          />
        </SettingRow>
        <SettingRow label="Random events">
          <ToggleSwitch checked={settings.randomEvents} editable={editable} onChange={(v) => onChange({ randomEvents: v })} />
        </SettingRow>
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-body text-cream/50 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  editable,
  suffix = "",
  onChange,
}: {
  options: T[];
  value: T;
  editable: boolean;
  suffix?: string;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={String(opt)}
          disabled={!editable}
          onClick={() => onChange(opt)}
          className={`focus-ring px-3 py-1.5 rounded-pill text-xs font-display font-bold capitalize transition-colors ${
            value === opt ? "bg-action-yellow text-stage-deep" : "bg-stage-panel text-cream/70"
          } ${editable ? "cursor-pointer" : "cursor-default opacity-70"}`}
        >
          {opt}
          {suffix}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({ checked, editable, onChange }: { checked: boolean; editable: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      disabled={!editable}
      onClick={() => onChange(!checked)}
      className={`focus-ring w-12 h-7 rounded-pill relative transition-colors ${checked ? "bg-success" : "bg-stage-panel"}`}
      aria-pressed={checked}
    >
      <span
        className="absolute top-0.5 left-0.5 w-6 h-6 bg-cream rounded-pill transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}
