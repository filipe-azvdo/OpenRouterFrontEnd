"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { LatLngBounds, type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { decodePolyline } from "@/lib/polyline";
import type { RoutePoint, TollPlazaDto } from "@/lib/types";

interface RouteMapProps {
  geometry?: string | null;
  origin?: RoutePoint | null;
  destination?: RoutePoint | null;
  stops?: RoutePoint[];
  tollPlazas?: TollPlazaDto[];
  className?: string;
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
}: RouteMapProps) {
  const line = useMemo(() => decodePolyline(geometry), [geometry]);

  const waypoints = useMemo(() => {
    const pts: { point: RoutePoint; kind: "origin" | "destination" | "stop" }[] = [];
    if (origin) pts.push({ point: origin, kind: "origin" });
    stops.forEach((s) => pts.push({ point: s, kind: "stop" }));
    if (destination) pts.push({ point: destination, kind: "destination" });
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

        {waypoints.map((w, i) => {
          const isEnd = w.kind === "origin" || w.kind === "destination";
          return (
            <CircleMarker
              key={`wp-${i}`}
              center={[w.point.lat, w.point.lon]}
              radius={isEnd ? 8 : 6}
              pathOptions={{
                color: "#1f1f1f",
                weight: 2,
                fillColor: w.kind === "origin" ? "#1f1f1f" : w.kind === "destination" ? "#fa520f" : "#ffb83e",
                fillOpacity: 1,
              }}
            >
              <Tooltip>
                {w.kind === "origin" ? "Origem" : w.kind === "destination" ? "Destino" : "Parada"}
                {w.point.label ? ` — ${w.point.label}` : ""}
              </Tooltip>
            </CircleMarker>
          );
        })}

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
      </MapContainer>
    </div>
  );
}
