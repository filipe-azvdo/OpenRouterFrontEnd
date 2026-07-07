import { formatDistance, formatDuration, profileLabel } from "@/lib/format";

interface RouteSummaryProps {
  profile: string;
  distanceMeters: number;
  durationSeconds: number;
  tollCount: number;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 px-1">
      <div className="break-words font-editorial text-stat leading-none text-ink">{value}</div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-steel">
        {label}
      </div>
    </div>
  );
}

/** Linha de estatísticas da rota — tipografia editorial (DESIGN.md stat-cell). */
export function RouteSummary({
  profile,
  distanceMeters,
  durationSeconds,
  tollCount,
}: RouteSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      <Stat value={formatDistance(distanceMeters)} label="Distância" />
      <Stat value={formatDuration(durationSeconds)} label="Duração" />
      <Stat value={profileLabel(profile)} label="Perfil" />
      <Stat value={String(tollCount)} label="Pedágios" />
    </div>
  );
}
