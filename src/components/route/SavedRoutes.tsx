"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { RouteSummary } from "./RouteSummary";
import { TollPlazaList } from "./TollPlazaList";
import { ApiError, deleteRoute, listRoutes } from "@/lib/api";
import { formatDateTime, formatDistance, formatDuration, profileLabel } from "@/lib/format";
import type { PlannedRouteDto } from "@/lib/types";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-hairline-soft bg-surface text-steel">
      <Spinner /> <span className="ml-2 text-sm">Carregando mapa…</span>
    </div>
  ),
});

export function SavedRoutes() {
  const [routes, setRoutes] = useState<PlannedRouteDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlannedRouteDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setRoutes(await listRoutes());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Falha ao carregar as rotas.");
      setRoutes([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteRoute(id);
      setRoutes((prev) => prev?.filter((r) => r.id !== id) ?? null);
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Falha ao remover a rota.");
    } finally {
      setDeletingId(null);
    }
  }

  if (routes === null) {
    return (
      <div className="flex items-center gap-2 text-steel">
        <Spinner /> Carregando rotas…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert tone="error">{error}</Alert>}

      {routes.length === 0 ? (
        <Card tone="cream" className="text-center">
          <p className="font-editorial text-2xl text-ink">Nenhuma rota salva ainda</p>
          <p className="mt-2 text-sm text-steel">
            Vá em <strong>Planejar</strong>, calcule uma rota e clique em “Salvar rota”.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {routes.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-ink">
                    {r.name || "Rota sem nome"}
                  </h3>
                  <Badge tone="cream">{profileLabel(r.profile)}</Badge>
                </div>
                <p className="mt-1 text-[13px] text-steel">
                  {formatDistance(r.distanceMeters)} · {formatDuration(r.durationSeconds)} ·{" "}
                  {r.tollPlazas.length} pedágio(s) · {formatDateTime(r.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setSelected((cur) => (cur?.id === r.id ? null : r))}
                >
                  {selected?.id === r.id ? "Ocultar" : "Ver no mapa"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-primary-deep"
                  disabled={deletingId === r.id}
                  onClick={() => handleDelete(r.id)}
                >
                  {deletingId === r.id ? <Spinner /> : "Excluir"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-4">
          <Card>
            <RouteSummary
              profile={selected.profile}
              distanceMeters={selected.distanceMeters}
              durationSeconds={selected.durationSeconds}
              tollCount={selected.tollPlazas.length}
            />
          </Card>
          <RouteMap
            className="min-h-[380px]"
            geometry={selected.geometry}
            origin={selected.origin}
            destination={selected.destination}
            stops={selected.stops}
            tollPlazas={selected.tollPlazas}
          />
          <Card>
            <h3 className="mb-3 text-base font-semibold text-ink">
              Pedágios no trajeto ({selected.tollPlazas.length})
            </h3>
            <TollPlazaList tollPlazas={selected.tollPlazas} />
          </Card>
        </div>
      )}
    </div>
  );
}
