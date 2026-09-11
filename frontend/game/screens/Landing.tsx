"use client";

import { useState } from "react";
import { Character } from "@/components/Character";
import { ChunkyButton } from "@/components/ChunkyButton";
import type { CharacterColor } from "@shared/types";

const DECOR: CharacterColor[] = ["pink", "blue", "yellow", "green", "purple", "orange"];

interface Props {
  onChooseCreate: (nickname: string) => void;
  onChooseJoin: (nickname: string) => void;
  errorMessage?: string | null;
}

export function Landing({ onChooseCreate, onChooseJoin, errorMessage }: Props) {
  const [nickname, setNickname] = useState("");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="spotlight" />

      <div className="flex gap-3 md:gap-6 mb-4 relative z-10">
        {DECOR.map((c, i) => (
          <div key={c} style={{ animationDelay: `${i * 0.2}s` }} className="animate-float">
            <Character color={c} mood="excited" size={44} />
          </div>
        ))}
      </div>

      <h1 className="font-display text-5xl md:text-7xl font-extrabold text-cream text-center relative z-10">
        Echo<span className="text-action-yellow">Chaos</span>
      </h1>
      <p className="font-display text-lg md:text-xl text-cream/80 mt-3 text-center relative z-10">
        Hear it. Mimic it. Laugh together.
      </p>

      <div className="stage-surface rounded-xl2 shadow-stage p-8 mt-10 w-full max-w-sm relative z-10">
        <label htmlFor="nickname" className="block font-display text-sm text-cream/70 mb-2">
          Your name
        </label>
        <input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          placeholder="Enter your name..."
          className="focus-ring w-full rounded-pill bg-stage-deep border-2 border-stage-line px-5 py-3 text-cream font-body placeholder:text-cream/30 mb-4"
        />

        {errorMessage && <p className="text-record text-sm font-body mb-3">{errorMessage}</p>}

        <div className="flex flex-col gap-3">
          <ChunkyButton
            variant="yellow"
            className="w-full"
            disabled={!nickname.trim()}
            onClick={() => onChooseCreate(nickname.trim())}
          >
            Create Party
          </ChunkyButton>
          <ChunkyButton
            variant="outline"
            className="w-full"
            disabled={!nickname.trim()}
            onClick={() => onChooseJoin(nickname.trim())}
          >
            Join Party
          </ChunkyButton>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm text-cream/60 font-body relative z-10">
        <span>🎤 Voice powered</span>
        <span>👥 Play with friends</span>
        <span>⚡ No account</span>
        <span>🌐 Play in browser</span>
      </div>

      <footer className="mt-8 text-center relative z-10">
        <p className="text-xs font-body text-cream/50 tracking-wide">
          Developed with ❤️ by{" "}
          <a
            href="https://github.com/jojin1709"
            target="_blank"
            rel="noopener noreferrer"
            className="text-action-yellow font-medium hover:underline transition-colors"
          >
            JOJIN JOHN
          </a>
        </p>
      </footer>
    </div>
  );
}

