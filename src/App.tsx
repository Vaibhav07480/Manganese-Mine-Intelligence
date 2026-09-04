import { useEffect, useMemo, useState } from "react";
import { HoverPreview } from "./components/HoverPreview";
import { LayerTray } from "./components/LayerTray";
import { PlacePanel } from "./components/PlacePanel";
import { SearchBar } from "./components/SearchBar";
import { TimeSlider } from "./components/TimeSlider";
import { SITE_BY_ID } from "./data/mines";
import { CURRENT_MONTH_INDEX } from "./data/series";
import type { BasemapId, OverlayId } from "./data/types";
import { MapCanvas } from "./map/MapCanvas";
import { allInsights } from "./models/insight";

const DEFAULT_OVERLAYS: OverlayId[] = ["reserves"];

export default function App() {
  const [monthIndex, setMonthIndex] = useState(CURRENT_MONTH_INDEX);
  const [overlays, setOverlays] = useState<OverlayId[]>(DEFAULT_OVERLAYS);
  const [basemap, setBasemap] = useState<BasemapId>("satellite");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [zoomTick, setZoomTick] = useState({ n: 0, delta: 0 });

  const insights = useMemo(() => allInsights(monthIndex), [monthIndex]);
  const selected = selectedId ? SITE_BY_ID[selectedId] : undefined;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleOverlay = (id: OverlayId) => {
    setOverlays((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <div className="app" data-panel={selected ? "open" : "closed"}>
      <MapCanvas
        monthIndex={monthIndex}
        overlays={overlays}
        basemap={basemap}
        selectedId={selectedId}
        insights={insights}
        panelOpen={Boolean(selected)}
        zoomTick={zoomTick}
        onSelect={setSelectedId}
        onHover={(id, x, y) => setHover(id ? { id, x, y } : null)}
      />

      <SearchBar selectedId={selectedId} onSelect={setSelectedId} />

      <LayerTray
        basemap={basemap}
        overlays={overlays}
        onBasemap={setBasemap}
        onToggle={toggleOverlay}
        onZoom={(delta) => setZoomTick((tick) => ({ n: tick.n + 1, delta }))}
      />

      <TimeSlider monthIndex={monthIndex} onChange={setMonthIndex} />

      {selected && (
        <PlacePanel
          site={selected}
          insight={insights[selected.id]}
          monthIndex={monthIndex}
          onClose={() => setSelectedId(null)}
        />
      )}

      {hover && hover.id !== selectedId && SITE_BY_ID[hover.id] && (
        <HoverPreview
          site={SITE_BY_ID[hover.id]}
          insight={insights[hover.id]}
          x={hover.x}
          y={hover.y}
        />
      )}
    </div>
  );
}
