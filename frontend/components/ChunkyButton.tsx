"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "yellow" | "success" | "record" | "outline";

const VARIANT_CLASSES: Record<Variant, string> = {
  yellow: "bg-action-yellow text-stage-deep shadow-yellow hover:bg-action-yellowDark",
  success: "bg-success text-stage-deep shadow-success hover:bg-success-dark",
  record: "bg-record text-cream shadow-record hover:bg-record-dark",
  outline: "bg-transparent text-cream border-2 border-stage-line hover:border-cream shadow-none",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function ChunkyButton({ variant = "yellow", className = "", children, ...rest }: Props) {
  return (
    <button
      className={`btn-chunky focus-ring px-8 py-4 text-lg ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
