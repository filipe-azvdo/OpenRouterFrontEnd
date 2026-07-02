# Edição Interativa do Trajeto no Mapa — Validation

**Date**: 2026-07-01
**Spec**: `.specs/features/edicao-interativa-trajeto-mapa/spec.md`
**Diff range**: `840a764..ac4b465` (5 commits: `300c823`, `4b18761`, `437edf7`, `af52a8e`, `ac4b465`)
**Files changed**: `src/components/route/RouteMap.tsx`, `src/components/route/RoutePlanner.tsx`
**Verifier**: independent sub-agent (author ≠ verifier)

**Adaptation note**: This repository has no automated test framework (`package.json` has only `dev`/`build`/`start`/`lint` — confirmed, matches design.md's documented risk). Per the design's own gate definition, evidence for each AC is: (a) `file:line` citation in the implementation, and (b) an independent, freshly-derived interactive check performed live against a running dev server (`localhost:3000`) and real backend (`localhost:8080`), using synthetic DOM mouse events (not the author's recorded coordinates). Network requests were inspected via `preview_network` to corroborate state changes were caused by real `planRoute` calls, not coincidence.

---

## Task Completion

| Task (commit) | Status | Notes |
| --- | --- | --- |
| `300c823` refactor(route-map): use draggable-capable Marker for waypoints | ✅ Done | `CircleMarker` → `Marker` + `divIcon` confirmed in code |
| `4b18761` feat(route-map): keep map visible before first calculated route | ✅ Done | Confirmed interactively — map renders with SP/RJ-style default view pre-calculation |
| `437edf7` feat(route-map): add points by clicking directly on the map | ✅ Done | Confirmed interactively (origin/destination/stop sequencing) |
| `af52a8e` feat(route-map): drag markers to reposition and recalculate route | ✅ Done | Confirmed interactively (success + failure/revert paths) |
| `ac4b465` feat(route-map): remove stop directly from its map popup | ✅ Done | Confirmed interactively |

---

## Spec-Anchored Acceptance Criteria

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| **MAPEDIT-01**: click map, no origin yet → set origin | Marker at clicked point; form lat/lon filled with clicked values; label empty | `RoutePlanner.tsx:271-276` (`handleMapClick`, first branch); `RouteMap.tsx:57-71` (`ClickHandler`) — interactively: clicked at (-10.3757, -41.0889), form showed exactly that lat/lon, label `""`, 1 marker appeared | ✅ PASS |
| **MAPEDIT-02**: click map, origin set, no destination → set destination | Marker at clicked point; destination form fields filled | `RoutePlanner.tsx:278-281` — interactively: with SP origin set, 2nd click populated destination fields and rendered a 2nd marker (verified across multiple runs, including the SP→RJ example flow) | ✅ PASS |
| **MAPEDIT-03**: click map, origin+destination set → insert new stop before destination, respecting 10-stop limit | New stop appended to `stops` (before destination in visit order); blocked at 10 with alert | `RoutePlanner.tsx:282-286` — interactively: with SP→RJ set, clicking added "Parada 1" (lat -23.02/-45.55 via form-fill workaround, and via direct map click producing a routable stop); at exactly 10 existing stops, an 11th click was rejected and stop count stayed at 10 (see edge case row below) | ✅ PASS |
| **MAPEDIT-04**: origin+destination defined (with/without stops) → auto `planRoute`, update polyline/distance/duration/tolls | Result state updates in place | `RoutePlanner.tsx:239-260` (`applyMapEditAndRecalculate` success branch) — interactively: SP→RJ direct = 434.7 km / 5h12min / 22 tolls (curl-verified: 434680 m / 18730 s, 22 `tollPlazas` — matches exactly); SP→stop→RJ = 437.0 km / 5h20min (curl-verified: 436971 m ≈ 437.0 km) | ✅ PASS |
| **MAPEDIT-01.5 / part of MAPEDIT-05**: click while a map-triggered recalculation is in flight → click ignored until it resolves | No new point/marker added; call count does not increase | `RouteMap.tsx:57-71` (`ClickHandler` `disabled={locked}`); `RoutePlanner.tsx:428` (`locked={mapBusy}`) — interactively, with `window.fetch` patched to add a 2.5s artificial delay on `/routes/plan`: after the destination click (2 markers, 0 draggable), a 3rd click fired 500ms into the in-flight window left markers unchanged (`markersRightAfterClick: 2`, same as before) and `planCallsSoFarAtThirdClick` stayed at 1 through to `finalPlanCallCount: 1` — the 3rd click never reached `handleMapClick` | ✅ PASS |
| **MAPEDIT-06**: drag a marker (origin/destination/stop), drop at new position → update lat/lon, form, and trigger new `planRoute` | Point's lat/lon updates; new `planRoute` fired with updated position | `RouteMap.tsx:143-146` (`dragend` handler); `RoutePlanner.tsx:289-309` (`handleMarkerDragEnd`) — interactively: dragged the stop marker from (-23.02,-45.55) to (-22.187,-44.297); form fields updated to the new coordinates; distance changed 437.0km→518.8km (new `planRoute` call, curl-independent corroboration via network log) | ✅ PASS |
| **MAPEDIT-07**: dropped-drag `planRoute` succeeds → update polyline/distance/duration/tolls | Result updates with new geometry/values | Same as above — new distance (518.8km / 7h05min) rendered after successful drag-triggered recalculation | ✅ PASS |
| **MAPEDIT-08**: dropped-drag `planRoute` fails → alert error, revert marker (position **and label**) to pre-drag state, keep last valid `result` | Exact prior lat/lon **and label** restored; `result` (map polyline/distance) unchanged from before the failed drag | `RoutePlanner.tsx:261-265` (revert restores full `snapshot.origin/destination/stops`, i.e. whole `PointForm` incl. `label`) — interactively: set stop label to `"Parada de teste XYZ"` at (-22.187,-44.297), dragged into open ocean at far map edge; after 503 response: lat/lon/label all read back EXACTLY `-22.187404991398775` / `-44.29687500000001` / `"Parada de teste XYZ"` (byte-identical to pre-drag values); distance/duration display stayed at the last-successful `518,8 km` / `7h 05min` (unchanged) | ✅ PASS — label preservation specifically confirmed, not just position |
| **MAPEDIT-09**: marker being dragged (before drop) moves visually without firing `planRoute` | No API call during drag, only on drop | `RouteMap.tsx:141-147` — only `dragend` has a callback; there is no `drag` (in-progress) handler wired to any callback, so Leaflet's own default drag visuals apply with no side effect until drop. Reasoned from code (no per-frame `drag` handler exists to fire recalculation); consistent with all interactive drag tests, which showed exactly one `planRoute` call per completed drag-and-drop, never more | ✅ PASS |
| **MAPEDIT-10**: a map-triggered recalculation is in flight → all markers become non-draggable | `draggable=false` for the duration of the request | `RouteMap.tsx:140` (`draggable={!!onMarkerDragEnd && !locked}`); `RoutePlanner.tsx:428` (`locked={mapBusy}`) — interactively (same delayed-fetch harness as MAPEDIT-01.5): immediately after the destination click, `draggableBefore: 0` — both markers lost the `.leaflet-marker-draggable` class while the request was in flight | ✅ PASS |
| **MAPEDIT-11**: click a stop marker → popup with label + "Remover" button | Popup shows `Parada[— label]` and a "Remover" button | `RouteMap.tsx:153-169` — interactively: popup text read exactly `"Parada — Parada de teste XYZ\n\nRemover\n×"` | ✅ PASS |
| **MAPEDIT-12**: click "Remover" → remove stop from map+form, trigger new `planRoute` with remaining stops | Stop disappears from both map and form; new `planRoute` fired | `RouteMap.tsx:159-166` (`onClick={() => onRemoveStop(...)}`); `RoutePlanner.tsx:311-317` (`handleRemoveStop`) — interactively: marker count 3→2, "Parada 1" fieldset disappeared, new `planRoute` fired and returned 200 | ✅ PASS |
| **MAPEDIT-13**: removal leaves only origin+destination → recalculate the direct route | Direct origin→destination route recalculated normally | Same flow as MAPEDIT-12 — post-removal distance/duration read back exactly `434,7 km` / `5h 12min`, byte-identical to the earlier direct SP→RJ calculation (434680 m / 18730 s, curl-verified) | ✅ PASS |
| **MAPEDIT-14**: open planning page with no points defined → `RouteMap` visible (Brazil-centered, zoom 4), ready for clicks, replacing the old illustrated empty-state card | Map renders immediately, no separate empty-state card gating it | `RoutePlanner.tsx:418-429` (unconditional `<RouteMap ... />` render, not gated behind `result`); `RouteMap.tsx:74,121-122` (`DEFAULT_CENTER = [-15.78, -47.93]`, `zoom={4}`) — interactively: on fresh page load (no clicks/calc yet), `.leaflet-container` was present with `+`/`−` zoom controls and the info alert "Clique no mapa para definir origem e destino..." shown alongside it (not replacing it) | ✅ PASS |
| Marker-click does not also register as a map click (stopPropagation on `Marker`) | Clicking an existing marker opens its tooltip/popup only, no spurious new point | `RouteMap.tsx:142` (`click: (e) => DomEvent.stopPropagation(e)`) | ⚠️ Spec-precision gap — see Discrimination Sensor notes below: this specific scenario (marker click vs. map click) is *also* natively prevented by Leaflet's own `_findEventTargets` target-routing (confirmed by reading `node_modules/leaflet/dist/leaflet-src.js:4466-4489`), independent of the app's own `stopPropagation` call. Interactively, clicking a marker never added a spurious stop, with or without the app-level call — but this could not be conclusively separated from Leaflet's own internal guarantee. Not a functional defect (behavior is correct either way), but the code comment/design rationale attributing this protection solely to the app-level `stopPropagation` call is not fully precise. See "Ranked gaps" below (Minor/Cosmetic). |
| Popup-click does not also register as a map click (`stopPropagation` on popup's inner `<div>`) | Clicking "Remover" only removes the stop, no spurious new point | `RouteMap.tsx:155` (`<div onClick={(e) => e.stopPropagation()}>`) — interactively confirmed both ways: with the call present, marker count went 3→2 cleanly with no ghost fieldset; with it removed (mutation, see Sensor table), a ghost empty "Parada 1" fieldset appeared post-removal (map/form desync) | ✅ PASS (this stopPropagation, unlike the marker one, IS load-bearing — confirmed via mutation) |

**Status**: ✅ All 14 MAPEDIT ACs covered and matched spec-defined outcomes precisely. 1 spec-precision/attribution gap flagged (Minor/Cosmetic, not a functional defect) regarding which mechanism (Leaflet core vs. app code) is actually responsible for marker-click isolation.

---

## Edge Cases (from spec.md)

| Edge case | Result |
| --- | --- |
| Click with origin+destination+10 stops already present → ignore click, show limit alert | ✅ Interactively confirmed: filled 10 stop fieldsets via form, then clicked an empty map point; stop count stayed at 10 (not 11), marker count stayed at 12, "Limite de 10 paradas atingido." alert shown. `RoutePlanner.tsx:282-285` |
| Drag to technically-valid-but-unroutable coordinates (mid-ocean) → treated as recalculation failure, revert (MAPEDIT-08) | ✅ Confirmed — see MAPEDIT-08 row; ocean-drag returned 503, position+label reverted exactly |
| "Usar exemplo" updates map markers to reflect example points (form→map sync) | ✅ Confirmed: clicking "Usar exemplo" immediately rendered 2 markers matching SP/RJ coordinates, via `mapOrigin`/`mapDestination` (`RoutePlanner.tsx:142-144`, `pointOrNull`) |
| Manual lat/lon form edit updates the map marker but does NOT trigger auto-recalculation | ✅ Confirmed: setting stop lat/lon directly via native input value + `input` event (bypassing the map) added a 3rd marker immediately, with zero new `/routes/plan` network calls until the explicit "Calcular rota" click afterward |
| No origin/destination defined → no draggable marker exists (nothing to drag) | ✅ By construction — `RouteMap.tsx:103-109` (`waypoints` array only contains entries for non-null `origin`/`destination`); confirmed empirically: `.leaflet-marker-icon` count was always exactly equal to the number of currently-defined points throughout all tests (0 on fresh load, growing only as points were defined) |

---

## Discrimination Sensor

| # | File:line | Description | Killed? |
| --- | --- | --- | --- |
| 1 | `RoutePlanner.tsx:262-264` | Commented out the 3 `setOrigin/setDestination/setStops(snapshot...)` revert calls in `applyMapEditAndRecalculate`'s catch block | ✅ Killed — interactively, a failed destination drag (into open ocean) left `destLat`/`destLon` stuck at the invalid dragged-to position (`-6.315`, `-19.687`) instead of reverting to `-22.9068`/`-43.1729`, while the error alert still displayed. Reverted; re-confirmed correct revert behavior afterward. |
| 2 | `RouteMap.tsx:142` | Replaced `DomEvent.stopPropagation(e)` in the marker's `click` handler with a no-op | ⚠️ Survived (see note) — no observable behavior change: clicking a marker never triggered a spurious map click, with or without this line. Root-caused via Leaflet source inspection (`_findEventTargets`, `node_modules/leaflet/dist/leaflet-src.js:4466-4489`): Leaflet's own DOM-event-to-target routing already ensures a click landing on a registered interactive target (the marker's icon) is dispatched ONLY to that target's listeners, never additionally to the map's `click` listeners. This specific app-level call is defensive/redundant for this exact scenario, not a functional gap — reverted immediately, no fix task needed for correctness, but flagged as a Minor doc/comment precision issue (see Ranked Gaps). |
| 3 | `RouteMap.tsx:155` | Removed `onClick={(e) => e.stopPropagation()}` from the popup's inner `<div>` | ✅ Killed — interactively, clicking "Remover" inside the popup (with the mutation applied) caused the click to bubble to the map's click handler, which — since origin+destination were already valid — attempted to append a spurious new stop at the click's screen coordinates. That secondary `planRoute` call failed and reverted, but left a **ghost empty "Parada 1" fieldset** in the form while the map correctly showed the stop removed (form/map desync, `markers: 2` but `stopCount: 1` with empty lat/lon/label). Reverted; re-confirmed clean removal (3→2 markers, no ghost fieldset) afterward. |
| 4 | `RoutePlanner.tsx:282` | Changed `stops.length >= 10` to `stops.length >= 1` in `handleMapClick`'s limit guard | ✅ Killed — interactively, with only 1 existing stop (far from the real limit of 10), a 2nd map-click-to-add-stop was incorrectly rejected with "Limite de 10 paradas atingido.", and stop count stayed at 1. Reverted; the real 10-stop limit was re-confirmed separately in the Edge Cases section above. |

**Sensor depth**: lightweight (4 targeted mutations; scope opportunistically expanded from the requested 1-3 once mutation #2 turned out to be a non-defect, to ensure at least 3 genuinely load-bearing mutations were exercised)
**Result**: 3/4 killed, 1 survived-but-benign (root-caused as redundant-by-design, not a test/coverage gap) — **PASS** ✅

All mutations were reverted before finishing; `git status`/`git diff` on `RouteMap.tsx` and `RoutePlanner.tsx` show a clean tree (verified below).

---

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code | ✅ — both files changed are exactly the two named in the design; no incidental files touched |
| Surgical changes | ✅ — `CircleMarker`→`Marker` swap scoped only to waypoints; toll `CircleMarker`s untouched |
| No scope creep | ✅ — no edit-of-saved-routes, no reverse geocoding, no undo/redo, no mobile gestures (all correctly out of scope per spec) |
| Matches existing patterns | ✅ — new `ClickHandler` mirrors the existing `FitBounds` pattern (`useMap`/`useMapEvents` hook wrapper returning `null`), as the design specified |
| Spec-anchored outcome check (asserted values match spec) | ✅ — see per-AC table; all precise where spec was precise, one spec-precision/attribution gap flagged and it is Minor/Cosmetic |
| Per-layer coverage (no formal test layer exists) | ✅ — interactive coverage exercised all 14 ACs + all 4 listed edge cases against a live backend, not just the happy path |
| Every check maps to a spec AC or listed edge case | ✅ — no unclaimed interactive checks; all tied to MAPEDIT-NN or an edge case bullet |
| Documented guidelines followed | `references/coding-principles.md` (tlc-spec-driven skill) — followed; no project-specific frontend style guide found beyond ESLint config, which passes clean |

---

## Gate Check

- **Gate commands**: `npx tsc --noEmit`, `npm run lint` (`next lint`), `npm run build` (`next build`)
- **Result**: 3/3 gates passed, 0 failed (re-run once more after all mutation reverts, to rule out any residual state — still clean)
- **tsc --noEmit**: no output, exit 0
- **next lint**: "No ESLint warnings or errors"
- **next build**: compiled successfully, all 4 routes (`/`, `/_not-found`, `/routes`, `/tolls`) statically generated, no errors
- **No automated test suite exists** (confirmed absent, matches design.md's documented risk) — "test count" tracking is not applicable

---

## Fix Plans

No blocking fix tasks required — the feature is functionally correct and matches every MAPEDIT-NN acceptance criterion precisely, corroborated by live interaction against the real backend (not just code reading).

### Optional non-blocking cleanup: attribution comment precision for marker click stopPropagation

- **Root cause**: `RouteMap.tsx:142`'s `DomEvent.stopPropagation(e)` on the `Marker`'s own `click` handler is redundant for preventing "marker click also registers as map click" — Leaflet's `Map._findEventTargets` (`node_modules/leaflet/dist/leaflet-src.js:4466-4489`) already guarantees a DOM click landing on a registered interactive target (the marker icon, added via `addInteractiveTarget` in Leaflet's own `Marker._initInteraction`) is routed only to that target's Leaflet-level listeners, never additionally to the map's own `click` listeners. The design.md Risks table (row 3) attributes this protection entirely to the app's `stopPropagation` call, which is not fully accurate — the call is harmless defensive code, not incorrect, but the design rationale overstates its necessity for this specific scenario. (It IS still useful/necessary for the sibling case — the popup's inner `<div>` — where Leaflet's target-routing does not apply the same way, as proven by mutation #3 above.)
- **Fix task**: None required functionally. If desired, could update the design.md Risks & Concerns row 3 wording to clarify that the `Marker`-level `stopPropagation` is defense-in-depth (Leaflet's native target-routing is the primary mechanism) while the `Popup`-content-level `stopPropagation` is the one actually load-bearing. Purely documentation precision, not code.
- **Priority**: Cosmetic

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| MAPEDIT-01 | Pending | ✅ Verified |
| MAPEDIT-02 | Pending | ✅ Verified |
| MAPEDIT-03 | Pending | ✅ Verified |
| MAPEDIT-04 | Pending | ✅ Verified |
| MAPEDIT-05 | Pending | ✅ Verified |
| MAPEDIT-06 | Pending | ✅ Verified |
| MAPEDIT-07 | Pending | ✅ Verified |
| MAPEDIT-08 | Pending | ✅ Verified |
| MAPEDIT-09 | Pending | ✅ Verified |
| MAPEDIT-10 | Pending | ✅ Verified |
| MAPEDIT-11 | Pending | ✅ Verified |
| MAPEDIT-12 | Pending | ✅ Verified |
| MAPEDIT-13 | Pending | ✅ Verified |
| MAPEDIT-14 | Pending | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 14/14 MAPEDIT ACs matched spec-defined outcome precisely; 1 spec-precision/attribution gap flagged (Minor/Cosmetic, design-doc wording only, no code defect)

**Sensor**: 3/4 mutations killed; 1 survived but was root-caused as a benign redundancy (Leaflet's own native event-target routing already provides the same guarantee for that specific scenario) rather than a coverage gap — no fix task needed

**Gate**: 3/3 passed (`tsc --noEmit`, `next lint`, `next build`), 0 failed

**What works**: All three user stories (P1 click-to-define-origin/destination/stops, P1 drag-to-reposition with success/failure+revert semantics including exact label preservation, P2 remove-stop-via-popup) and the P3 always-visible-map requirement were independently and interactively confirmed against a live dev server and real backend, using freshly-chosen coordinates and scenarios (not the author's recorded ones). The `mapBusy`/`locked` concurrency guard was conclusively proven via a fetch-delay harness — clicks during an in-flight recalculation are provably dropped (call count and marker count both static during the lock window), and markers lose `draggable` for the duration. Revert-on-failure was proven to restore exact prior lat/lon AND label (not just "something"), matching the subtle MAPEDIT-08 requirement precisely.

**Issues found**: None blocking. One documentation-precision note about which mechanism (Leaflet core vs. app code) is responsible for marker-click isolation — does not affect correctness.

**Next steps**: None required. Feature is ready to ship as validated. Optional: tidy the design.md Risks row wording per the Fix Plans note above, at the team's discretion.
