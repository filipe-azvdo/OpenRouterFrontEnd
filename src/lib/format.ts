/** Formata metros em km com uma casa decimal (pt-BR). */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`;
}

/** Formata segundos em "Xh Ym" (ou "Ym" quando menos de 1h). */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
}

/** Formata uma data ISO em pt-BR (dd/mm/aaaa hh:mm). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Rótulo amigável do perfil de transporte. */
export function profileLabel(profile: string): string {
  switch (profile) {
    case "driving-car":
      return "Carro";
    case "driving-hgv":
      return "Caminhão";
    default:
      return profile;
  }
}
