import type { StyleSpecification } from "maplibre-gl";

const esri = (path: string) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/${path}/MapServer/tile/{z}/{y}/{x}`;

export const BASE_STYLE: StyleSpecification = {
  version: 8,
  name: "moil-basemap",
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    imagery: {
      type: "raster",
      tiles: [esri("World_Imagery")],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Tiles © Esri",
    },
    topo: {
      type: "raster",
      tiles: [esri("World_Topo_Map")],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Tiles © Esri",
    },
    places: {
      type: "raster",
      tiles: [esri("Reference/World_Boundaries_and_Places")],
      tileSize: 256,
      maxzoom: 19,
    },
    roads: {
      type: "raster",
      tiles: [esri("Reference/World_Transportation")],
      tileSize: 256,
      maxzoom: 19,
    },
    sentinel2: {
      type: "raster",
      tiles: [
        "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg",
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution:
        "© Sentinel-2 cloudless by EOX IT Services GmbH (Contains modified Copernicus Sentinel data)",
    },
  },
  layers: [
    { id: "imagery", type: "raster", source: "imagery" },
    { id: "sentinel2", type: "raster", source: "sentinel2", layout: { visibility: "none" } },
    { id: "topo", type: "raster", source: "topo", layout: { visibility: "none" } },
  ],
};
