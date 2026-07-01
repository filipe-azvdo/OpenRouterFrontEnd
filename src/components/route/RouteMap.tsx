"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { DomEvent, LatLngBounds, divIcon, type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { decodePolyline } from "@/lib/polyline";
import type { RoutePoint, TollPlazaDto } from "@/lib/types";

export type WaypointKind = "origin" | "destination" | "stop";

const WAYPOINT_COLOR: Record<WaypointKind, string> = {
  origin: "#1f1f1f",
  destination: "#fa520f",
  stop: "#ffb83e",
};

/** Ícone em div (sem imagem externa) — evita o path quebrado do ícone padrão do Leaflet sob bundlers. */
function waypointIcon(kind: WaypointKind) {
  const size = kind === "stop" ? 12 : 16;
  return divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${WAYPOINT_COLOR[kind]};border:2px solid #1f1f1f;box-sizing:border-box;"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface RouteMapProps {
  geometry?: string | null;
  origin?: RoutePoint | null;
  destination?: RoutePoint | null;
  stops?: RoutePoint[];
  tollPlazas?: TollPlazaDto[];
  className?: string;
  /** Clique em área vazia do mapa (não em um marcador) — omitido mantém o mapa somente leitura. */
  onMapClick?: (point: { lat: number; lon: number }) => void;
  /** Soltar um marcador arrastado. `stopIndex` só é relevante quando `kind === "stop"`. */
  onMarkerDragEnd?: (kind: WaypointKind, stopIndex: number | null, point: { lat: number; lon: number }) => void;
  /** Enquanto true, ignora cliques no mapa e desabilita o arraste dos marcadores (recálculo em andamento). */
  locked?: boolean;
}

function ClickHandler({
  onClick,
  disabled,
}: {
  onClick?: (point: { lat: number; lon: number }) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (disabled || !onClick) return;
      onClick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

/** Centro default: Brasil (caso não haja pontos). */
const DEFAULT_CENTER: LatLngExpression = [-15.78, -47.93];

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(new LatLngBounds(points), { padding: [32, 32] });
  }, [map, points]);
  return null;
}

export default function RouteMap({
  geometry,
  origin,
  destination,
  stops = [],
  tollPlazas = [],
  className = "",
  onMapClick,
  onMarkerDragEnd,
  locked = false,
}: RouteMapProps) {
  const line = useMemo(() => decodePolyline(geometry), [geometry]);

  const waypoints = useMemo(() => {
    const pts: { point: RoutePoint; kind: WaypointKind; stopIndex: number | null }[] = [];
    if (origin) pts.push({ point: origin, kind: "origin", stopIndex: null });
    stops.forEach((s, idx) => pts.push({ point: s, kind: "stop", stopIndex: idx }));
    if (destination) pts.push({ point: destination, kind: "destination", stopIndex: null });
    return pts;
  }, [origin, destination, stops]);

  const allPoints = useMemo<[number, number][]>(() => {
    const fromLine = line;
    const fromWaypoints = waypoints.map((w) => [w.point.lat, w.point.lon] as [number, number]);
    const fromTolls = tollPlazas.map((t) => [t.latitude, t.longitude] as [number, number]);
    return [...fromLine, ...fromWaypoints, ...fromTolls];
  }, [line, waypoints, tollPlazas]);

  return (
    <div className={["overflow-hidden rounded-lg border border-hairline-soft", className].join(" ")}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={4}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", minHeight: 360 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {line.length > 1 && (
          <Polyline positions={line} pathOptions={{ color: "#fa520f", weight: 5, opacity: 0.9 }} />
        )}

        {waypoints.map((w, i) => (
          <Marker
            key={`wp-${i}`}
            position={[w.point.lat, w.point.lon]}
            icon={waypointIcon(w.kind)}
            draggable={!!onMarkerDragEnd && !locked}
            eventHandlers={{
              click: (e) => DomEvent.stopPropagation(e),
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onMarkerDragEnd?.(w.kind, w.stopIndex, { lat: ll.lat, lon: ll.lng });
              },
            }}
          >
            <Tooltip>
              {w.kind === "origin" ? "Origem" : w.kind === "destination" ? "Destino" : "Parada"}
              {w.point.label ? ` — ${w.point.label}` : ""}
            </Tooltip>
          </Marker>
        ))}

        {tollPlazas.map((t, i) => (
          <CircleMarker
            key={`toll-${i}`}
            center={[t.latitude, t.longitude]}
            radius={5}
            pathOptions={{ color: "#cc3a05", weight: 1.5, fillColor: "#ffd900", fillOpacity: 0.95 }}
          >
            <Tooltip>
              <strong>{t.nome}</strong>
              <br />
              {t.rodovia} · {t.uf} · km {String(t.km)}
            </Tooltip>
          </CircleMarker>
        ))}

        <FitBounds points={allPoints} />
        <ClickHandler onClick={onMapClick} disabled={locked} />
      </MapContainer>
    </div>
  );
}
