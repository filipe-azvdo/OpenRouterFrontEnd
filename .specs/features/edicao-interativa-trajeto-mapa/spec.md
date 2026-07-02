# Edição Interativa do Trajeto no Mapa — Specification

## Problem Statement

Hoje, para planejar uma rota, o usuário do PersonalRouter precisa digitar manualmente latitude/longitude de origem, destino e cada parada em um formulário (`RoutePlanner.tsx`). A maioria dos usuários não sabe coordenadas de cor, o que torna o fluxo de criação de rota lento e pouco intuitivo. O mapa (`RouteMap.tsx`) hoje é somente leitura — serve apenas para visualizar o resultado já calculado.

## Goals

- [ ] Usuário consegue definir origem, destino e paradas clicando diretamente no mapa, sem precisar saber coordenadas
- [ ] Usuário consegue ajustar um ponto já definido arrastando o marcador, com a rota recalculada automaticamente ao soltar
- [ ] Formulário lateral e mapa permanecem sempre sincronizados como uma única fonte de verdade

## Out of Scope

Explicitamente excluído desta versão. Documentado para prevenir scope creep.

| Feature | Reason |
| ------- | ------ |
| Adicionar parada clicando sobre a linha da rota (polyline) | Não selecionado nesta rodada — fluxo de adição é só clique sequencial no mapa vazio |
| Reordenar a sequência de visita das paradas arrastando no mapa | Ordem de visita continua sendo a ordem das paradas no formulário (ver Assumption ORDER) |
| Otimização automática da ordem de paradas por proximidade geográfica | Fora do escopo — não pedido |
| Edição por toque/gestos mobile específicos (pinch, long-press) | Fora do escopo desta v1; interação alvo é desktop com mouse (clique/arrastar) |
| Geocoding reverso (mostrar endereço/nome do local clicado) | Fora do escopo — mapa continua mostrando só lat/lon e rótulo manual |
| Desfazer/refazer (undo/redo) histórico de edições no mapa | Fora do escopo — reversão cobre apenas o caso de falha de recálculo (ver AC MAPEDIT-08) |
| Editar uma rota já salva (tela "Rotas salvas") pelo mapa, persistindo a alteração no banco (`updateRoute` / `PUT /routes/{id}`) | Confirmado explicitamente com o usuário como fora de escopo — candidato a feature futura. Nesta v1 a edição interativa existe apenas no fluxo de Planejamento (antes de salvar); `SavedRoutes.tsx` continua somente leitura |

---

## Assumptions & Open Questions

Toda ambiguidade foi resolvida ou registrada aqui — nada fica silenciosamente indefinido.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | --------------- | --------- | ---------- |
| Fluxo de adição de pontos por clique | Clique direto sequencial: 1º clique (sem origem) define origem; 2º clique (com origem, sem destino) define destino; cliques seguintes (com origem e destino) inserem uma nova parada antes do destino | Escolhido pelo usuário — mais direto que exigir um botão de "modo" | y |
| Ordem de visita das paradas (ORDER) | Ordem = posição das paradas no array/formulário. Arrastar uma parada no mapa move sua posição (lat/lon) mas não reordena a sequência de visita | Escolhido pelo usuário — sem otimização geográfica automática nesta v1 | y |
| Recálculo ao editar | Recalcula apenas ao soltar o marcador (`dragend`), não durante o arraste (`drag`) | Escolhido pelo usuário — evita chamadas excessivas à API durante o arraste | y |
| Sincronização mapa ↔ formulário | Bidirecional e imediata: editar no mapa atualiza os campos lat/lon do formulário e vice-versa | Escolhido pelo usuário — mapa e formulário são a mesma fonte de verdade | y |
| Falha no recálculo automático | Mostra alerta de erro e reverte o marcador para a última posição válida (pré-arraste), mantendo a última rota calculada com sucesso | Escolhido pelo usuário | y |
| Remoção de parada pelo mapa | Botão "Remover" dentro do popup/tooltip do marcador da parada | Escolhido pelo usuário — evita remoção acidental por duplo clique | y |
| Visibilidade do mapa | Mapa fica sempre visível (substitui o card ilustrativo do estado vazio), centrado no Brasil por padrão, pronto para receber cliques desde o carregamento da página | Escolhido pelo usuário | y |
| Edição concorrente durante recálculo em andamento | Enquanto uma requisição de recálculo (`planRoute`) estiver em andamento por causa de uma edição no mapa, marcadores ficam não-arrastáveis (`draggable=false`) e cliques no mapa são ignorados; interação é reabilitada quando a resposta (sucesso ou erro) chega | Dimensão de concorrência não foi discutida explicitamente com o usuário — assumido o padrão mais simples e seguro (bloquear em vez de cancelar/enfileirar requisições) para evitar condição de corrida entre múltiplas edições | n — assumption |
| Limite de paradas via mapa | Mesmo limite do formulário: máximo 10 paradas (`stops.length < 10`); clique para adicionar nova parada além do limite é ignorado e mostra alerta | Consistência com a regra já existente em `RoutePlanner.tsx` | n — assumption (inferida do código existente) |
| Validação de coordenadas de clique | Todo clique no `MapContainer` do Leaflet já produz lat/lon numéricos válidos dentro dos limites (-90..90 / -180..180); nenhuma validação adicional de bounds é necessária além da já existente para o formulário | Leaflet garante o range; risco residual é ponto geograficamente inválido (meio do oceano), coberto pelo tratamento de falha de recálculo | n — assumption |
| Rotas já salvas (`savedId` presente) | Editar o trajeto pelo mapa após salvar não atualiza a rota persistida automaticamente; usuário precisa clicar em "Salvar rota" novamente para persistir as mudanças (mesmo comportamento atual de "Calcular" vs "Salvar") | Consistente com o padrão existente onde `handlePlan` e `handleSave` são ações distintas | y — confirmado explicitamente pelo usuário |

**Open questions:** none — todas resolvidas ou registradas acima.

---

## User Stories

### P1: Definir origem e destino clicando no mapa ⭐ MVP

**User Story**: Como usuário planejando uma rota, quero clicar no mapa para definir a origem e o destino, para não precisar digitar coordenadas.

**Why P1**: É o núcleo do problema (digitar lat/lon é ruim) e a base para as demais interações.

**Acceptance Criteria**:

1. WHEN o usuário clica no mapa e a origem ainda não está definida THEN o sistema SHALL definir esse ponto como origem, exibir um marcador de origem naquele local, e preencher os campos de latitude/longitude/rótulo do formulário de origem com os valores clicados (rótulo vazio)
2. WHEN o usuário clica no mapa, a origem já está definida e o destino ainda não THEN o sistema SHALL definir esse ponto como destino, exibir um marcador de destino, e preencher os campos do formulário de destino
3. WHEN origem e destino já estão definidos e o usuário clica novamente no mapa THEN o sistema SHALL adicionar uma nova parada naquele ponto, inserida na sequência imediatamente antes do destino, respeitando o limite de 10 paradas
4. WHEN origem e destino estão definidos (com ou sem paradas) THEN o sistema SHALL disparar automaticamente o cálculo da rota (`planRoute`) e atualizar polyline, distância, duração e pedágios exibidos
5. WHEN o clique no mapa ocorre enquanto uma requisição de recálculo anterior ainda está em andamento THEN o sistema SHALL ignorar o clique até a requisição em andamento terminar

**Independent Test**: Com o mapa vazio (nenhum ponto definido), clicar em dois pontos distintos do mapa deve exibir marcador de origem e destino e mostrar a rota calculada entre eles — sem digitar nenhuma coordenada.

---

### P1: Arrastar marcador existente para reposicionar ⭐ MVP

**User Story**: Como usuário, quero arrastar o marcador de origem, destino ou de uma parada para ajustar sua posição exata no mapa, e ver a rota recalculada automaticamente.

**Why P1**: Complementa a criação por clique — permite correção fina sem reabrir o formulário.

**Acceptance Criteria**:

1. WHEN o usuário arrasta um marcador (origem, destino ou parada) e solta em uma nova posição THEN o sistema SHALL atualizar a lat/lon daquele ponto, atualizar os campos correspondentes no formulário, e disparar um novo `planRoute` com a posição atualizada
2. WHEN o `planRoute` disparado após o drop responde com sucesso THEN o sistema SHALL atualizar polyline, distância, duração e pedágios com o resultado
3. WHEN o `planRoute` disparado após o drop falha (erro de API ou rota impossível) THEN o sistema SHALL exibir um alerta de erro e reverter o marcador (posição, formulário e mapa) para a posição anterior ao arraste, mantendo a última rota válida exibida
4. WHEN um marcador está sendo arrastado (evento `drag`, antes de soltar) THEN o sistema SHALL mover o marcador visualmente em tempo real SEM disparar `planRoute`
5. WHEN uma requisição de recálculo por edição no mapa está em andamento THEN o sistema SHALL tornar todos os marcadores não-arrastáveis até a resposta chegar

**Independent Test**: Com uma rota já calculada, arrastar o marcador de destino para um novo ponto válido deve recalcular e atualizar distância/pedágios; arrastar para um ponto sem rota possível deve mostrar erro e voltar o marcador ao lugar original.

---

### P2: Remover parada pelo popup do marcador

**User Story**: Como usuário, quero remover uma parada diretamente pelo mapa, sem precisar localizar o campo correspondente no formulário.

**Why P2**: Melhora a ergonomia mas não é essencial ao MVP — remoção via formulário já existe hoje.

**Acceptance Criteria**:

1. WHEN o usuário clica em um marcador de parada THEN o sistema SHALL exibir um popup/tooltip com o rótulo da parada e um botão "Remover"
2. WHEN o usuário clica no botão "Remover" do popup THEN o sistema SHALL remover aquela parada da lista (mapa e formulário) e disparar um novo `planRoute` com as paradas restantes
3. WHEN a remoção deixa a rota sem paradas (só origem e destino) THEN o sistema SHALL recalcular normalmente a rota direta entre origem e destino

**Independent Test**: Com uma rota de origem → parada → destino, clicar no marcador da parada, clicar "Remover", e verificar que a parada some do mapa, do formulário e a rota recalcula direto origem→destino.

---

### P3: Mapa sempre visível desde o carregamento da página

**User Story**: Como usuário, quero ver o mapa desde que abro a tela de planejamento, mesmo antes de definir qualquer ponto, para poder começar a clicar imediatamente.

**Why P3**: É um pré-requisito de UX para as histórias P1, mas o valor isolado (mapa vazio visível) é pequeno — pode ser entregue like parte da P1 sem story separada, mantido como P3 para rastreabilidade do requisito de layout.

**Acceptance Criteria**:

1. WHEN o usuário abre a página de planejamento de rota sem nenhum ponto definido THEN o sistema SHALL exibir o `RouteMap` vazio (centralizado no Brasil, zoom 4) no lugar do card ilustrativo atual, pronto para receber cliques

---

## Edge Cases

- WHEN o usuário clica no mapa e já existem origem, destino e 10 paradas (limite máximo) THEN o sistema SHALL ignorar o clique e exibir um alerta informando o limite de paradas atingido
- WHEN o usuário arrasta um marcador para uma posição com coordenadas tecnicamente válidas mas sem rota possível (ex.: meio do oceano, ilha sem malha viária) THEN o sistema SHALL tratar como falha de recálculo (reverter posição, ver AC MAPEDIT-08)
- WHEN o usuário usa "Usar exemplo" (preenche formulário via botão) THEN o sistema SHALL atualizar os marcadores do mapa para refletir os pontos do exemplo (sincronização formulário → mapa)
- WHEN o usuário edita manualmente um campo lat/lon no formulário (sem usar o mapa) THEN o sistema SHALL atualizar a posição do marcador correspondente no mapa (sincronização formulário → mapa), sem disparar recálculo automático (recálculo automático é exclusivo de interações de mapa: clique e drag; edição por formulário continua exigindo clique em "Calcular rota", mantendo o comportamento atual)
- WHEN não há origem nem destino definidos e o usuário tenta arrastar algo THEN o sistema SHALL não exibir nenhum marcador arrastável (não há o que arrastar)

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --------------- | ----------- | ------ | ------- |
| MAPEDIT-01 | P1: Definir origem/destino clicando | Implementing | ✅ Verified |
| MAPEDIT-02 | P1: Definir origem/destino clicando | Implementing | ✅ Verified |
| MAPEDIT-03 | P1: Definir origem/destino clicando | Implementing | ✅ Verified |
| MAPEDIT-04 | P1: Definir origem/destino clicando | Implementing | ✅ Verified |
| MAPEDIT-05 | P1: Definir origem/destino clicando | Implementing | ✅ Verified |
| MAPEDIT-06 | P1: Arrastar marcador existente | Implementing | ✅ Verified |
| MAPEDIT-07 | P1: Arrastar marcador existente | Implementing | ✅ Verified |
| MAPEDIT-08 | P1: Arrastar marcador existente | Implementing | ✅ Verified |
| MAPEDIT-09 | P1: Arrastar marcador existente | Implementing | ✅ Verified |
| MAPEDIT-10 | P1: Arrastar marcador existente | Implementing | ✅ Verified |
| MAPEDIT-11 | P2: Remover parada pelo popup | Implementing | ✅ Verified |
| MAPEDIT-12 | P2: Remover parada pelo popup | Implementing | ✅ Verified |
| MAPEDIT-13 | P2: Remover parada pelo popup | Implementing | ✅ Verified |
| MAPEDIT-14 | P3: Mapa sempre visível | Implementing | ✅ Verified |

**ID format:** `MAPEDIT-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 14 total, 14 verified, 0 unmapped — see `.specs/features/edicao-interativa-trajeto-mapa/validation.md` for per-AC evidence

---

## Success Criteria

Como saberemos que a feature foi bem-sucedida:

- [ ] Um usuário consegue planejar uma rota completa (origem, destino, ao menos 1 parada) usando exclusivamente cliques e arrastos no mapa, sem digitar nenhuma coordenada manualmente
- [ ] Toda edição no mapa (clique, drag, remover) mantém formulário e mapa consistentes entre si em 100% dos casos testados
- [ ] Falhas de recálculo após um drag nunca deixam o mapa em estado inconsistente (marcador sempre reverte corretamente)
