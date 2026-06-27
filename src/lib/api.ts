import type {
  PlannedRouteDto,
  ProblemDetail,
  RoutePlanRequest,
  RouteResultDto,
  TollPlazaImportResultDto,
} from "./types";

/**
 * Cliente da API PersonalRouter. As chamadas usam caminhos relativos (`/api/*`)
 * que o Next reescreve para o backend (ver next.config.ts), evitando CORS.
 */

const BASE = "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly problem?: ProblemDetail;

  constructor(message: string, status: number, problem?: ProblemDetail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let problem: ProblemDetail | undefined;
  let message = `Erro ${res.status}`;
  try {
    const body = await res.json();
    problem = body as ProblemDetail;
    message = problem.detail || problem.title || message;
  } catch {
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {
      /* mantém a mensagem padrão */
    }
  }
  return new ApiError(message, res.status, problem);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao backend. Ele está rodando em :8080?",
      0,
    );
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;
  return (await res.json()) as T;
}

/* ---------- Rotas ---------- */

/** Calcula uma rota sem persistir (preview). */
export function planRoute(body: RoutePlanRequest): Promise<RouteResultDto> {
  return request<RouteResultDto>("/routes/plan", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Calcula e persiste uma nova rota. */
export function createRoute(body: RoutePlanRequest): Promise<PlannedRouteDto> {
  return request<PlannedRouteDto>("/routes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Lista todas as rotas salvas. */
export function listRoutes(): Promise<PlannedRouteDto[]> {
  return request<PlannedRouteDto[]>("/routes");
}

/** Retorna uma rota salva pelo id. */
export function getRoute(id: string): Promise<PlannedRouteDto> {
  return request<PlannedRouteDto>(`/routes/${id}`);
}

/** Remove uma rota salva. */
export function deleteRoute(id: string): Promise<void> {
  return request<void>(`/routes/${id}`, { method: "DELETE" });
}

/* ---------- Praças de pedágio ---------- */

/** Faz upload de um CSV de praças de pedágio (assíncrono). */
export function importTolls(file: File): Promise<TollPlazaImportResultDto> {
  const form = new FormData();
  form.append("file", file);
  return request<TollPlazaImportResultDto>("/toll-plazas/import", {
    method: "POST",
    body: form,
  });
}

/** Consulta o status de um import de pedágios. */
export function getImport(id: string): Promise<TollPlazaImportResultDto> {
  return request<TollPlazaImportResultDto>(`/toll-plazas/imports/${id}`);
}
