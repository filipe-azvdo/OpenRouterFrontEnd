"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { RouteSummary } from "./RouteSummary";
import { TollPlazaList } from "./TollPlazaList";
import { ApiError, createRoute, planRoute } from "@/lib/api";
import { PROFILES, type Profile, type RoutePlanRequest, type RoutePoint } from "@/lib/types";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-hairline-soft bg-surface text-steel">
      <Spinner /> <span className="ml-2 text-sm">Carregando mapa…</span>
    </div>
  ),
});

interface PointForm {
  lat: string;
  lon: string;
  label: string;
}

const EMPTY_POINT: PointForm = { lat: "", lon: "", label: "" };

// Exemplo: São Paulo → Rio de Janeiro (para testar rapidamente).
const EXAMPLE = {
  origin: { lat: "-23.5505", lon: "-46.6333", label: "São Paulo" },
  destination: { lat: "-22.9068", lon: "-43.1729", label: "Rio de Janeiro" },
};

interface ResultState {
  profile: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: string;
  tollPlazas: import("@/lib/types").TollPlazaDto[];
  origin: RoutePoint;
  destination: RoutePoint;
  stops: RoutePoint[];
  savedId?: string;
}

function toPoint(p: PointForm): RoutePoint {
  return {
    lat: Number(p.lat),
    lon: Number(p.lon),
    label: p.label.trim() || null,
  };
}

function isValidPoint(p: PointForm): boolean {
  const lat = Number(p.lat);
  const lon = Number(p.lon);
  return (
    p.lat.trim() !== "" &&
    p.lon.trim() !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function PointFields({
  legend,
  value,
  onChange,
  onRemove,
}: {
  legend: string;
  value: PointForm;
  onChange: (next: PointForm) => void;
  onRemove?: () => void;
}) {
  return (
    <fieldset className="rounded-md border border-hairline-soft p-3">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-steel">
        {legend}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        <Input
          inputMode="decimal"
          placeholder="Latitude"
          aria-label={`${legend} — latitude`}
          value={value.lat}
          onChange={(e) => onChange({ ...value, lat: e.target.value })}
        />
        <Input
          inputMode="decimal"
          placeholder="Longitude"
          aria-label={`${legend} — longitude`}
          value={value.lon}
          onChange={(e) => onChange({ ...value, lon: e.target.value })}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          placeholder="Rótulo (opcional)"
          aria-label={`${legend} — rótulo`}
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
        {onRemove && (
          <Button type="button" variant="secondary" onClick={onRemove} aria-label="Remover parada">
            Remover
          </Button>
        )}
      </div>
    </fieldset>
  );
}

export function RoutePlanner() {
  const [profile, setProfile] = useState<Profile>("driving-car");
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState<PointForm>(EMPTY_POINT);
  const [destination, setDestination] = useState<PointForm>(EMPTY_POINT);
  const [stops, setStops] = useState<PointForm[]>([]);

  const [loading, setLoading] = useState<null | "plan" | "save">(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  function buildRequest(): RoutePlanRequest | null {
    if (!isValidPoint(origin)) {
      setError("Informe coordenadas válidas para a origem.");
      return null;
    }
    if (!isValidPoint(destination)) {
      setError("Informe coordenadas válidas para o destino.");
      return null;
    }
    const validStops = stops.filter((s) => s.lat.trim() !== "" || s.lon.trim() !== "");
    for (const s of validStops) {
      if (!isValidPoint(s)) {
        setError("Há uma parada com coordenadas inválidas.");
        return null;
      }
    }
    setError(null);
    return {
      profile,
      origin: toPoint(origin),
      destination: toPoint(destination),
      stops: validStops.map(toPoint),
      name: name.trim() || null,
    };
  }

  async function handlePlan() {
    const req = buildRequest();
    if (!req) return;
    setLoading("plan");
    setSavedMsg(null);
    try {
      const res = await planRoute(req);
      setResult({
        profile: res.profile,
        distanceMeters: res.distanceMeters,
        durationSeconds: res.durationSeconds,
        geometry: res.geometry,
        tollPlazas: res.tollPlazas,
        origin: req.origin,
        destination: req.destination,
        stops: req.stops ?? [],
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Falha ao calcular a rota.");
    } finally {
      setLoading(null);
    }
  }

  async function handleSave() {
    const req = buildRequest();
    if (!req) return;
    setLoading("save");
    setSavedMsg(null);
    try {
      const res = await createRoute(req);
      setResult({
        profile: res.profile,
        distanceMeters: res.distanceMeters,
        durationSeconds: res.durationSeconds,
        geometry: res.geometry,
        tollPlazas: res.tollPlazas,
        origin: res.origin,
        destination: res.destination,
        stops: res.stops,
        savedId: res.id,
      });
      setSavedMsg(`Rota salva com sucesso (${res.name || "sem nome"}).`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Falha ao salvar a rota.");
    } finally {
      setLoading(null);
    }
  }

  function loadExample() {
    setOrigin(EXAMPLE.origin);
    setDestination(EXAMPLE.destination);
    setStops([]);
    setName("São Paulo → Rio de Janeiro");
    setError(null);
    setSavedMsg(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      {/* Formulário */}
      <Card tone="cream" className="h-fit">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Planejar rota</h2>
          <Button type="button" variant="ghost" onClick={loadExample}>
            Usar exemplo
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <Select
            label="Perfil de transporte"
            value={profile}
            onChange={(e) => setProfile(e.target.value as Profile)}
          >
            {PROFILES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>

          <Input
            label="Nome da rota (opcional)"
            placeholder="Ex.: Entrega semanal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <PointFields legend="Origem" value={origin} onChange={setOrigin} />

          {stops.map((s, i) => (
            <PointFields
              key={i}
              legend={`Parada ${i + 1}`}
              value={s}
              onChange={(next) => setStops((prev) => prev.map((p, j) => (j === i ? next : p)))}
              onRemove={() => setStops((prev) => prev.filter((_, j) => j !== i))}
            />
          ))}

          {stops.length < 10 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStops((prev) => [...prev, { ...EMPTY_POINT }])}
            >
              + Adicionar parada
            </Button>
          )}

          <PointFields legend="Destino" value={destination} onChange={setDestination} />

          {error && <Alert tone="error">{error}</Alert>}
          {savedMsg && <Alert tone="success">{savedMsg}</Alert>}

          <div className="mt-1 flex gap-2">
            <Button type="button" onClick={handlePlan} disabled={loading !== null} className="flex-1">
              {loading === "plan" ? <Spinner /> : null}
              Calcular rota
            </Button>
            <Button
              type="button"
              variant="dark"
              onClick={handleSave}
              disabled={loading !== null}
              className="flex-1"
            >
              {loading === "save" ? <Spinner /> : null}
              Salvar rota
            </Button>
          </div>
        </div>
      </Card>

      {/* Resultado */}
      <div className="flex flex-col gap-6">
        {result ? (
          <>
            <Card>
              <RouteSummary
                profile={result.profile}
                distanceMeters={result.distanceMeters}
                durationSeconds={result.durationSeconds}
                tollCount={result.tollPlazas.length}
              />
            </Card>

            <RouteMap
              className="min-h-[420px]"
              geometry={result.geometry}
              origin={result.origin}
              destination={result.destination}
              stops={result.stops}
              tollPlazas={result.tollPlazas}
            />

            <Card>
              <h3 className="mb-3 text-base font-semibold text-ink">
                Pedágios no trajeto ({result.tollPlazas.length})
              </h3>
              <TollPlazaList tollPlazas={result.tollPlazas} />
            </Card>
          </>
        ) : (
          <Card className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <div className="sunset-hero mb-4 flex size-16 items-center justify-center rounded-full text-on-primary">
              <svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden="true">
                <path
                  d="M12 21s-6.5-5.6-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.4-6.5 10-6.5 10Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <p className="font-editorial text-2xl text-ink">Sua rota aparece aqui</p>
            <p className="mt-2 max-w-sm text-sm text-steel">
              Informe origem e destino (ou clique em <strong>Usar exemplo</strong>) e calcule
              para ver distância, duração, mapa e pedágios.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
