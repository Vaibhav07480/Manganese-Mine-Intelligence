import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import { DRILL_HOLES, EQUIPMENT, OVERLAY_CELLS } from "../data/overlays";
import type { Site, SiteInsight } from "../data/types";

export function overlayCollection(monthIndex: number): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: OVERLAY_CELLS.map((cell) => ({
      type: "Feature",
      id: cell.id,
      properties: {
        siteId: cell.siteId,
        ndvi: cell.ndvi[monthIndex],
        rainfall: Math.min(1, cell.rainfall[monthIndex] / 400),
        moisture: cell.moisture[monthIndex],
        lst: Math.min(1, Math.max(0, (cell.lst[monthIndex] - 20) / 28)),
        reserve: cell.reserve[monthIndex],
      },
      geometry: { type: "Polygon", coordinates: [cell.polygon] },
    })),
  };
}

export function leaseCollection(
  sites: Site[],
  insights: Record<string, SiteInsight>,
): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: sites.map((site) => ({
      type: "Feature",
      id: site.id,
      properties: {
        id: site.id,
        name: site.name,
        kind: site.kind,
        confidence: insights[site.id]?.confidence ?? 0.5,
      },
      geometry: { type: "Polygon", coordinates: [site.lease] },
    })),
  };
}

export function siteCollection(
  sites: Site[],
  insights: Record<string, SiteInsight>,
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: sites.map((site) => {
      const insight = insights[site.id];
      return {
        type: "Feature",
        id: site.id,
        properties: {
          id: site.id,
          name: site.name,
          kind: site.kind,
          method: site.method ?? "EX",
          risk: insight?.risk ?? 0,
          color: insight?.riskColor ?? "#2F6B4F",
        },
        geometry: { type: "Point", coordinates: site.lngLat },
      };
    }),
  };
}

export function drillCollection(): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: DRILL_HOLES.map((hole) => ({
      type: "Feature",
      id: hole.id,
      properties: {
        id: hole.id,
        siteId: hole.siteId,
        mn: hole.mnPct,
        depth: hole.depthM,
      },
      geometry: { type: "Point", coordinates: hole.lngLat },
    })),
  };
}

export function equipmentCollection(monthIndex: number): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: EQUIPMENT.map((unit) => {
      const down = unit.downMonths.includes(monthIndex);
      return {
        type: "Feature",
        id: unit.id,
        properties: {
          id: unit.id,
          siteId: unit.siteId,
          name: unit.name,
          kind: unit.kind,
          label: unit.kind.slice(0, 2).toUpperCase(),
          down: down ? 1 : 0,
        },
        geometry: { type: "Point", coordinates: unit.lngLat },
      } satisfies Feature<Point>;
    }),
  };
}
