import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "dark" | "secondary" | "cream" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary border border-transparent hover:bg-primary-deep active:bg-primary-deep",
  dark: "bg-ink text-on-primary border border-transparent hover:bg-charcoal",
  secondary:
    "bg-transparent text-ink border border-hairline-strong hover:border-ink",
  cream: "bg-cream text-ink border border-beige-deep hover:bg-cream-deeper",
  ghost: "bg-transparent text-primary border border-transparent hover:underline",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** Botão editorial — raio 8px, NÃO pílula (ver DESIGN.md). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5",
          "text-sm font-medium leading-tight transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-hairline disabled:text-muted",
          VARIANTS[variant],
          className,
        ].join(" ")}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
