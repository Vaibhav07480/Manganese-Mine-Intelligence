export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function offsetLngLat(
  lngLat: [number, number],
  eastM: number,
  northM: number,
): [number, number] {
  const [lng, lat] = lngLat;
  const dLat = northM / 111_320;
  const dLng = eastM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

export function ring(
  center: [number, number],
  radiiM: number[],
  startDeg = -18,
): [number, number][] {
  const pts: [number, number][] = [];
  const n = radiiM.length;
  for (let i = 0; i < n; i += 1) {
    const a = ((startDeg + (360 * i) / n) * Math.PI) / 180;
    pts.push(offsetLngLat(center, Math.sin(a) * radiiM[i], Math.cos(a) * radiiM[i]));
  }
  pts.push(pts[0]);
  return pts;
}

export function cellSquare(
  center: [number, number],
  eastM: number,
  northM: number,
  sizeM: number,
): [number, number][] {
  const sw = offsetLngLat(center, eastM, northM);
  const se = offsetLngLat(center, eastM + sizeM, northM);
  const ne = offsetLngLat(center, eastM + sizeM, northM + sizeM);
  const nw = offsetLngLat(center, eastM, northM + sizeM);
  return [sw, se, ne, nw, sw];
}
