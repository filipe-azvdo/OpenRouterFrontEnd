import { Badge } from "@/components/ui/Badge";
import type { TollPlazaDto } from "@/lib/types";

/** Lista de praças de pedágio sobre o trajeto. */
export function TollPlazaList({ tollPlazas }: { tollPlazas: TollPlazaDto[] }) {
  if (tollPlazas.length === 0) {
    return (
      <p className="text-sm text-steel">
        Nenhuma praça de pedágio encontrada sobre este trajeto.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-hairline-soft">
      {tollPlazas.map((t, i) => (
        <li key={`${t.rodovia}-${t.km}-${i}`} className="flex items-start justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">{t.nome}</p>
            <p className="text-[13px] text-steel">
              {t.concessionaria} · {t.sentido}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-right">
            <Badge tone="cream">
              {t.rodovia} · {t.uf}
            </Badge>
            <span className="text-[13px] text-steel">km {String(t.km)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
