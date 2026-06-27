import type { HTMLAttributes } from "react";

type Tone = "orange" | "cream" | "dark";

const TONES: Record<Tone, string> = {
  orange: "bg-primary text-on-primary",
  cream: "bg-cream-deeper text-ink",
  dark: "bg-ink text-on-primary",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Badge/pill — único lugar onde rounded-full é permitido (DESIGN.md). */
export function Badge({ tone = "cream", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none",
        TONES[tone],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
