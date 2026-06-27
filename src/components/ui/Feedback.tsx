/** Indicador de carregamento minimalista (anel girando em laranja). */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={[
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      ].join(" ")}
    />
  );
}

type AlertTone = "error" | "info" | "success";

const ALERT_TONES: Record<AlertTone, string> = {
  error: "border-primary/30 bg-primary/5 text-primary-deep",
  info: "border-beige-deep bg-cream text-ink",
  success: "border-green-600/30 bg-green-50 text-green-800",
};

/** Faixa de mensagem (erro/info/sucesso). */
export function Alert({
  tone = "info",
  children,
}: {
  tone?: AlertTone;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={[
        "rounded-md border px-4 py-3 text-sm",
        ALERT_TONES[tone],
      ].join(" ")}
    >
      {children}
    </div>
  );
}
