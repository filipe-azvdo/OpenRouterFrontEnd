/**
 * Tipos espelhados dos DTOs do backend PersonalRouter
 * (com.personalrouter.dto.*). Mantenha em sincronia com a API.
 */

export type Profile = "driving-car" | "driving-hgv";

export const PROFILES: { value: Profile; label: string }[] = [
  { value: "driving-car", label: "Carro" },
  { value: "driving-hgv", label: "Caminhão" },
];

/** Ponto geográfico com rótulo opcional (origem, destino, paradas). */
export interface RoutePoint {
  lat: number;
  lon: number;
  label?: string | null;
}

/** Corpo da requisição de planejamento de rota. */
export interface RoutePlanRequest {
  profile?: Profile;
  origin: RoutePoint;
  destination: RoutePoint;
  stops?: RoutePoint[];
  name?: string | null;
}

/** Trecho da rota entre dois pontos consecutivos. */
export interface RouteSegmentDto {
  fromLabel?: string | null;
  toLabel?: string | null;
  distanceMeters: number;
  durationSeconds: number;
}

/** Praça de pedágio ao longo do trajeto. */
export interface TollPlazaDto {
  nome: string;
  concessionaria: string;
  rodovia: string;
  uf: string;
  km: number | string;
  sentido: string;
  latitude: number;
  longitude: number;
}

/** Resultado do cálculo de rota (preview, sem persistir). */
export interface RouteResultDto {
  profile: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: string;
  segments: RouteSegmentDto[];
  tollPlazas: TollPlazaDto[];
}

/** Rota planejada persistida. */
export interface PlannedRouteDto {
  id: string;
  name?: string | null;
  profile: string;
  origin: RoutePoint;
  destination: RoutePoint;
  stops: RoutePoint[];
  distanceMeters: number;
  durationSeconds: number;
  geometry: string;
  tollPlazas: TollPlazaDto[];
  createdAt: string;
}

/** Erro de uma linha específica do CSV de pedágios. */
export interface RowError {
  line: number;
  reason: string;
}

/** Status de um import de praças de pedágio. */
export interface TollPlazaImportResultDto {
  importId: string;
  status: string;
  contentHash: string;
  inserted?: number | null;
  reactivated?: number | null;
  updated?: number | null;
  totalRows?: number | null;
  errors: RowError[];
  createdAt: string;
  finishedAt?: string | null;
}

/** Problem Detail (RFC 7807) retornado pelo Spring em erros. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}
