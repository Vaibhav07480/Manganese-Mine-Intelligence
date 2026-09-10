import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { SITES } from "../data/mines";
import type { BasemapId, OverlayId, Site, SiteInsight } from "../data/types";
import { BASE_STYLE } from "./basemap";
import {
  drillCollection,
  equipmentCollection,
  leaseCollection,
  overlayCollection,
  siteCollection,
} from "./geojson";

interface MapCanvasProps {
  monthIndex: number;
  overlays: OverlayId[];
  basemap: BasemapId;
  selectedId: string | null;
  insights: Record<string, SiteInsight>;
  panelOpen: boolean;
  zoomTick: { n: number; delta: number };
  onSelect: (id: string | null) => void;
  onHover: (id: string | null, x: number, y: number) => void;
}

const HIT_LAYERS = ["sites-core", "sites-halo", "leases-fill", "leases-line"];

export function MapCanvas({
  monthIndex,
  overlays,
  basemap,
  selectedId,
  insights,
  panelOpen,
  zoomTick,
  onSelect,
  onHover,
}: MapCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const monthRef = useRef(monthIndex);
  const overlaysRef = useRef(overlays);
  const basemapRef = useRef(basemap);
  const insightsRef = useRef(insights);
  selectedRef.current = selectedId;
  onSelectRef.current = onSelect;
  onHoverRef.current = onHover;
  monthRef.current = monthIndex;
  overlaysRef.current = overlays;
  basemapRef.current = basemap;
  insightsRef.current = insights;

  useEffect(() => {
    if (!rootRef.current) return;

    const map = new maplibregl.Map({
      container: rootRef.current,
      style: BASE_STYLE,
      center: [79.72, 21.55],
      zoom: 8.15,
      minZoom: 5,
      maxZoom: 16,
      pitch: 0,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.on("load", () => {
      const month = monthRef.current;
      const currentInsights = insightsRef.current;
      map.addSource("overlays", { type: "geojson", data: overlayCollection(month) });
      map.addSource("leases", {
        type: "geojson",
        data: leaseCollection(SITES, currentInsights),
        promoteId: "id",
      });
      map.addSource("sites", {
        type: "geojson",
        data: siteCollection(SITES, currentInsights),
        promoteId: "id",
      });
      map.addSource("drills", { type: "geojson", data: drillCollection() });
      map.addSource("equipment", { type: "geojson", data: equipmentCollection(month) });

      const overlayPaint = (prop: string, stops: [number, string][]) =>
        ({
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", prop],
            ...stops.flat(),
          ],
          "fill-opacity": 0.38,
          "fill-outline-color": "rgba(26,22,18,0.12)",
        }) as maplibregl.FillLayerSpecification["paint"];

      map.addLayer({
        id: "overlay-ndvi",
        type: "fill",
        source: "overlays",
        paint: overlayPaint("ndvi", [
          [0.15, "#6B4A2B"],
          [0.35, "#C4B7A2"],
          [0.55, "#7A9A6A"],
          [0.75, "#2F6B4F"],
        ]),
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "overlay-rainfall",
        type: "fill",
        source: "overlays",
        paint: overlayPaint("rainfall", [
          [0, "#E4D7C4"],
          [0.35, "#8AA4B0"],
          [0.7, "#3D6A7A"],
          [1, "#1E3F4A"],
        ]),
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "overlay-moisture",
        type: "fill",
        source: "overlays",
        paint: overlayPaint("moisture", [
          [0.1, "#D9C7A8"],
          [0.4, "#A3B38A"],
          [0.75, "#3F6F5C"],
        ]),
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "overlay-lst",
        type: "fill",
        source: "overlays",
        paint: overlayPaint("lst", [
          [0.15, "#C4B7A2"],
          [0.45, "#D08A4A"],
          [0.8, "#D6452A"],
        ]),
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "overlay-reserve-grid",
        type: "fill",
        source: "overlays",
        paint: overlayPaint("reserve", [
          [0.1, "#C4B7A2"],
          [0.45, "#8A5A3A"],
          [0.85, "#3A1F16"],
        ]),
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "overlay-sentinel-swir",
        type: "fill",
        source: "overlays",
        paint: overlayPaint("sentinelSwir", [
          [0.15, "#2D1B4E"],
          [0.4, "#A24822"],
          [0.65, "#E69D45"],
          [0.88, "#FFE599"],
        ]),
        layout: { visibility: "none" },
      });

      map.addLayer({
        id: "leases-fill",
        type: "fill",
        source: "leases",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "confidence"],
            0.15,
            "#C4B7A2",
            0.55,
            "#8A5A3A",
            0.9,
            "#3A1F16",
          ],
          "fill-opacity": 0.42,
        },
      });
      map.addLayer({
        id: "leases-line",
        type: "line",
        source: "leases",
        paint: {
          "line-color": "#F7F3EC",
          "line-width": 1.4,
          "line-opacity": 0.9,
        },
      });

      map.addLayer({
        id: "drills-layer",
        type: "circle",
        source: "drills",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": 3.2,
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "mn"],
            12,
            "#C4B7A2",
            28,
            "#B56E14",
            44,
            "#3A1F16",
          ],
          "circle-stroke-width": 0.8,
          "circle-stroke-color": "#F7F3EC",
        },
      });

      map.addLayer({
        id: "equipment-layer",
        type: "circle",
        source: "equipment",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": 7,
          "circle-color": ["case", ["==", ["get", "down"], 1], "#D6452A", "#2F6B4F"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#F7F3EC",
        },
      });
      map.addLayer({
        id: "equipment-label",
        type: "symbol",
        source: "equipment",
        layout: {
          visibility: "none",
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 9,
          "text-offset": [0, 1.35],
        },
        paint: {
          "text-color": "#F7F3EC",
          "text-halo-color": "#1A1612",
          "text-halo-width": 1.2,
        },
      });

      map.addLayer({
        id: "sites-halo",
        type: "circle",
        source: "sites",
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            18,
            13,
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.35,
        },
      });
      map.addLayer({
        id: "sites-core",
        type: "circle",
        source: "sites",
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            9,
            6.5,
          ],
          "circle-color": [
            "case",
            ["==", ["get", "kind"], "prospect"],
            "#C4B7A2",
            "#3A1F16",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#F7F3EC",
        },
      });
      map.addLayer({
        id: "sites-label",
        type: "symbol",
        source: "sites",
        minzoom: 8.4,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 12,
          "text-offset": [0, 1.15],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#F7F3EC",
          "text-halo-color": "#1A1612",
          "text-halo-width": 1.4,
        },
      });

      map.addLayer({
        id: "places",
        type: "raster",
        source: "places",
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "roads",
        type: "raster",
        source: "roads",
        layout: { visibility: "none" },
      });

      readyRef.current = true;
      applyOverlays(map, overlaysRef.current);
      applyBasemap(map, basemapRef.current);
      if (selectedRef.current) {
        map.setFeatureState({ source: "sites", id: selectedRef.current }, { selected: true });
      }
    });

    map.on("click", (event) => {
      const hits = map.queryRenderedFeatures(event.point, { layers: HIT_LAYERS });
      const id = hits[0]?.properties?.id as string | undefined;
      onSelectRef.current(id ?? null);
    });

    map.on("mousemove", (event) => {
      const hits = map.queryRenderedFeatures(event.point, { layers: ["sites-core", "sites-halo"] });
      if (hits[0]?.properties?.id) {
        map.getCanvas().style.cursor = "pointer";
        onHoverRef.current(hits[0].properties.id as string, event.point.x, event.point.y);
      } else {
        map.getCanvas().style.cursor = "";
        onHoverRef.current(null, 0, 0);
      }
    });

    map.on("mouseleave", () => onHoverRef.current(null, 0, 0));

    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // Init once; live props are applied in later effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    setSource(map, "overlays", overlayCollection(monthIndex));
    setSource(map, "leases", leaseCollection(SITES, insights));
    setSource(map, "sites", siteCollection(SITES, insights));
    setSource(map, "equipment", equipmentCollection(monthIndex));
  }, [monthIndex, insights]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyOverlays(map, overlays);
  }, [overlays]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyBasemap(map, basemap);
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    for (const site of SITES) {
      map.setFeatureState(
        { source: "sites", id: site.id },
        { selected: site.id === selectedId },
      );
    }
    if (!selectedId) return;
    const site = SITES.find((s) => s.id === selectedId);
    if (!site) return;
    flyToSite(map, site, panelOpen);
  }, [selectedId, panelOpen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || zoomTick.n === 0) return;
    map.zoomTo(map.getZoom() + zoomTick.delta, { duration: 280 });
  }, [zoomTick]);

  return <div ref={rootRef} className="map-root" />;
}

export function flyToSite(map: MapLibreMap, site: Site, panelOpen: boolean): void {
  const wide = window.innerWidth > 720;
  map.flyTo({
    center: site.lngLat,
    zoom: site.kind === "mine" ? 13.15 : 11.6,
    speed: 0.95,
    curve: 1.42,
    essential: true,
    padding: {
      top: 88,
      left: wide && panelOpen ? 392 : 28,
      bottom: 96,
      right: 28,
    },
  });
}

function setSource(map: MapLibreMap, id: string, data: object): void {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  source?.setData(data as Parameters<GeoJSONSource["setData"]>[0]);
}

function applyBasemap(map: MapLibreMap, basemap: BasemapId): void {
  const isSentinel = basemap === "sentinel2";
  const isTopo = basemap === "terrain";
  const isEsri = basemap === "satellite" || basemap === "hybrid";
  const isHybrid = basemap === "hybrid";

  setVis(map, "sentinel2", isSentinel);
  setVis(map, "imagery", isEsri);
  setVis(map, "topo", isTopo);
  setVis(map, "places", isHybrid);
  setVis(map, "roads", isHybrid);
}

const OVERLAY_LAYER: Record<OverlayId, string> = {
  reserves: "leases-fill",
  drills: "drills-layer",
  sentinel_swir: "overlay-sentinel-swir",
  ndvi: "overlay-ndvi",
  rainfall: "overlay-rainfall",
  moisture: "overlay-moisture",
  lst: "overlay-lst",
  equipment: "equipment-layer",
};

function applyOverlays(map: MapLibreMap, overlays: OverlayId[]): void {
  const on = new Set(overlays);
  for (const [key, layer] of Object.entries(OVERLAY_LAYER)) {
    setVis(map, layer, on.has(key as OverlayId));
  }
  setVis(map, "overlay-reserve-grid", on.has("reserves"));
  setVis(map, "equipment-label", on.has("equipment"));
  map.setPaintProperty("leases-fill", "fill-opacity", on.has("reserves") ? 0.42 : 0.08);
}

function setVis(map: MapLibreMap, layer: string, visible: boolean): void {
  if (!map.getLayer(layer)) return;
  map.setLayoutProperty(layer, "visibility", visible ? "visible" : "none");
}
