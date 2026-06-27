# openRouterFront

Frontend (Next.js + TypeScript) para o **[PersonalRouter](../personalRouter)** — planejamento
de rotas com paradas, perfis de transporte e pedágios sobre o trajeto.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 (tokens do `DESIGN.md` — sistema "sunset" da Mistral) |
| Mapa | Leaflet + react-leaflet (tiles OpenStreetMap, sem chave) |
| Fontes | Inter (UI), Fraunces (display editorial), JetBrains Mono (código) |

## Pré-requisitos

- Node.js 20+ (testado no 24)
- O backend **PersonalRouter** rodando em `http://localhost:8080`
  (`mvn spring-boot:run -Dspring-boot.run.profiles=local` no projeto vizinho)

## Configuração

O Next reescreve `/api/*` para o backend (ver [next.config.ts](next.config.ts)),
evitando CORS. Para apontar para outro host, copie o exemplo e ajuste:

```bash
cp .env.local.example .env.local
# BACKEND_URL=http://localhost:8080
```

## Executando

```bash
npm install
npm run dev      # http://localhost:3000
```

Outros scripts: `npm run build`, `npm run start`, `npm run lint`.

## Funcionalidades

| Página | Rota | API consumida |
|---|---|---|
| Planejar rota | `/` | `POST /api/v1/routes/plan` (preview), `POST /api/v1/routes` (salvar) |
| Rotas salvas | `/routes` | `GET /api/v1/routes`, `DELETE /api/v1/routes/{id}` |
| Pedágios | `/tolls` | `POST /api/v1/toll-plazas/import`, `GET /api/v1/toll-plazas/imports/{id}` |

- O planejador aceita origem, destino e até 10 paradas (lat/lon + rótulo), com botão
  **Usar exemplo** (São Paulo → Rio) para testar rapidamente.
- O resultado mostra distância, duração, perfil, mapa com a polyline decodificada e as
  praças de pedágio plotadas.
- O import de pedágios é assíncrono: a tela faz *polling* do status até `SUCCESS`/`FAILED`.

## Estrutura

```
src/
  app/                # rotas (App Router): /, /routes, /tolls
  components/
    layout/           # Header, Footer, SunsetStripe (assinatura da marca)
    route/            # RoutePlanner, SavedRoutes, RouteMap, RouteSummary, TollPlazaList
    tolls/            # TollImport
    ui/               # Button, Card, Field, Badge, Feedback (primitivos do design system)
  lib/
    api.ts            # cliente tipado da API (com tratamento de ProblemDetail)
    types.ts          # DTOs espelhados do backend
    polyline.ts       # decodificador de polyline (espelha PolylineDecoder.java)
    format.ts         # formatação de distância/duração/datas
```

## Design

As cores, tipografia e componentes seguem o `DESIGN.md` (sistema "sunset" da Mistral AI):
laranja saturado para CTAs, superfícies creme, geometria sóbria (botões 8px, cards 12px)
e a **sunset stripe** — a faixa-assinatura no pé de cada página.
