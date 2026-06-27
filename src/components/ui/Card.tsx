import type { HTMLAttributes } from "react";

type Tone = "base" | "cream" | "soft";

const TONES: Record<Tone, string> = {
  base: "bg-canvas border border-hairline-soft",
  cream: "bg-cream border border-beige-deep text-ink",
  soft: "bg-surface-cream-soft border border-transparent text-ink",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
}

/** Card editorial — raio 12px (DESIGN.md card-base / card-cream). */
export function Card({ tone = "base", className = "", ...props }: CardProps) {
  return (
    <div
      className={["rounded-lg p-6", TONES[tone], className].join(" ")}
      {...props}
    />
  );
}
