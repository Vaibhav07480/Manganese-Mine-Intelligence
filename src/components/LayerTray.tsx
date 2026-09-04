import type { BasemapId, OverlayId } from "../data/types";

const BASEMAPS: { id: BasemapId; label: string }[] = [
  { id: "satellite", label: "Satellite" },
  { id: "hybrid", label: "Hybrid" },
  { id: "terrain", label: "Terrain" },
];

const LAYERS: { id: OverlayId; label: string }[] = [
  { id: "reserves", label: "Reserves" },
  { id: "drills", label: "Drill holes" },
  { id: "ndvi", label: "NDVI" },
  { id: "rainfall", label: "Rainfall" },
  { id: "moisture", label: "Soil moisture" },
  { id: "lst", label: "Land temperature" },
  { id: "equipment", label: "Equipment" },
];

const RAMPS: Partial<Record<OverlayId, { low: string; high: string; min: string; max: string }>> = {
  reserves: { low: "#C4B7A2", high: "#3A1F16", min: "Low Mn", max: "High Mn" },
  ndvi: { low: "#6B4A2B", high: "#2F6B4F", min: "Bare", max: "Canopy" },
  rainfall: { low: "#E4D7C4", high: "#1E3F4A", min: "Dry", max: "Wet" },
  moisture: { low: "#D9C7A8", high: "#3F6F5C", min: "Arid", max: "Saturated" },
  lst: { low: "#C4B7A2", high: "#D6452A", min: "Cool", max: "Hot" },
};

interface LayerTrayProps {
  basemap: BasemapId;
  overlays: OverlayId[];
  onBasemap: (id: BasemapId) => void;
  onToggle: (id: OverlayId) => void;
  onZoom: (delta: number) => void;
}

export function LayerTray({ basemap, overlays, onBasemap, onToggle, onZoom }: LayerTrayProps) {
  const legendId = overlays.find((id) => RAMPS[id]);
  const legend = legendId ? RAMPS[legendId] : undefined;

  return (
    <div className="tray">
      <div className="basemap-switch" role="tablist" aria-label="Basemap">
        {BASEMAPS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={basemap === item.id}
            className={basemap === item.id ? "is-on" : ""}
            onClick={() => onBasemap(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="layer-list">
        {LAYERS.map((layer) => (
          <label key={layer.id} className="layer-row">
            <input
              type="checkbox"
              checked={overlays.includes(layer.id)}
              onChange={() => onToggle(layer.id)}
            />
            <span>{layer.label}</span>
          </label>
        ))}
      </div>
      {legend && (
        <div className="legend">
          <span>{legend.min}</span>
          <span className="legend-ramp" style={{ background: `linear-gradient(90deg, ${legend.low}, ${legend.high})` }} />
          <span>{legend.max}</span>
        </div>
      )}
      <div className="zoom-stack">
        <button type="button" aria-label="Zoom in" onClick={() => onZoom(1)}>
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => onZoom(-1)}>
          −
        </button>
      </div>
    </div>
  );
}
