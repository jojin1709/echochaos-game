"use client";

import { useState } from "react";
import { ChunkyButton } from "@/components/ChunkyButton";

interface Props {
  nickname: string;
  onJoin: (nickname: string, code: string) => void;
  onBack: () => void;
  errorMessage?: string | null;
}

export function JoinParty({ nickname: initialNickname, onJoin, onBack, errorMessage }: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="stage-surface rounded-xl2 shadow-stage p-8 w-full max-w-sm">
        <h2 className="font-display text-2xl font-bold text-cream mb-6">Join a Party</h2>

        <label className="block font-display text-sm text-cream/70 mb-2">Your name</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="focus-ring w-full rounded-pill bg-stage-deep border-2 border-stage-line px-5 py-3 text-cream font-body mb-4"
        />

        <label className="block font-display text-sm text-cream/70 mb-2">Party code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="XK7P2Q"
          className="focus-ring w-full rounded-pill bg-stage-deep border-2 border-stage-line px-5 py-3 text-cream font-display tracking-[0.3em] text-center mb-4"
        />

        {errorMessage && <p className="text-record text-sm font-body mb-3">{errorMessage}</p>}

        <div className="flex flex-col gap-3">
          <ChunkyButton
            variant="yellow"
            className="w-full"
            disabled={!nickname.trim() || code.length < 4}
            onClick={() => onJoin(nickname.trim(), code)}
          >
            Join Party
          </ChunkyButton>
          <button onClick={onBack} className="focus-ring text-cream/60 hover:text-cream text-sm font-body">
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
