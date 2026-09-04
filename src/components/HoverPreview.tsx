import type { Site, SiteInsight } from "../data/types";

interface HoverPreviewProps {
  site: Site;
  insight: SiteInsight;
  x: number;
  y: number;
}

export function HoverPreview({ site, insight, x, y }: HoverPreviewProps) {
  const method = site.kind === "mine" ? site.method : "Prospect";
  return (
    <div
      className="hover-preview"
      style={{ left: x + 16, top: y + 16 }}
    >
      <strong>{site.name}</strong>
      <span>
        {method} · confidence {(insight.confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
}
