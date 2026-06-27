/**
 * Decodifica uma polyline codificada (Google Encoded Polyline, precisão 1e5)
 * em pares [lat, lon]. Espelha com.personalrouter.service.PolylineDecoder.
 */
export function decodePolyline(encoded: string | null | undefined): [number, number][] {
  if (!encoded) return [];

  const coordinates: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lon = 0;

  while (index < len) {
    let shift = 0;
    let result = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lon += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / 1e5, lon / 1e5]);
  }

  return coordinates;
}
