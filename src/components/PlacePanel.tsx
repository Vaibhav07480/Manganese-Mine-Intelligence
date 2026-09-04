import { useState } from "react";
import { WEIGHTS } from "../models/weights";
import type { MonthPoint, Site, SiteInsight } from "../data/types";

interface PlacePanelProps {
  site: Site;
  insight: SiteInsight;
  monthIndex: number;
  onClose: () => void;
}

export function PlacePanel({ site, insight, monthIndex, onClose }: PlacePanelProps) {
  const [openScore, setOpenScore] = useState(false);
  const method = site.kind === "mine" ? (site.method === "UG" ? "Underground" : "Opencast") : "Greenfield prospect";

  return (
    <aside className="place-panel" aria-label={site.name}>
      <button type="button" className="place-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <p className="place-kicker">
        {site.state} · {site.district}
      </p>
      <h1>{site.name}</h1>
      <p className="place-sub">
        {method}
        {site.depthM ? ` · ${site.depthM} m` : ""} · {site.gradeBand}
      </p>

      <p className="place-reserve">
        <span className="place-figure">{site.predictedReservesMt.toFixed(1)}</span>
        <span className="place-unit">Mt predicted</span>
      </p>
      <p className="place-booked">
        {site.kind === "mine"
          ? `Booked ${site.bookedReservesMt.toFixed(1)} Mt · model confidence ${(insight.confidence * 100).toFixed(0)}%`
          : `No booked reserve · model confidence ${(insight.confidence * 100).toFixed(0)}%`}
      </p>

      <p className="place-risk" style={{ color: insight.riskColor }}>
        {insight.sentence}
      </p>

      {site.kind === "mine" && (
        <Sparkline series={insight.series} monthIndex={monthIndex} />
      )}

      {site.kind === "mine" && (
        <p className="place-forecast">
          30-day forecast {Math.round(insight.forecastT).toLocaleString("en-IN")} t vs target{" "}
          {Math.round(insight.targetT).toLocaleString("en-IN")} t
        </p>
      )}

      <ol className="place-actions">
        {insight.actions.map((step, index) => (
          <li key={step.title}>
            <span className="step-num">{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <button type="button" className="score-toggle" onClick={() => setOpenScore((v) => !v)}>
        {openScore ? "Hide scoring" : "How this is scored"}
      </button>
      {openScore && (
        <div className="score-body">
          <p>
            Shortfall risk = {WEIGHTS.downtime.toFixed(2)}·downtime + {WEIGHTS.blastDelay.toFixed(2)}·blast
            delay + {WEIGHTS.rainAnomaly.toFixed(2)}·rain (heavier on opencast) + {WEIGHTS.depletion.toFixed(2)}
            ·depletion vs plan.
          </p>
          <p>
            Reserve confidence blends drill density, grade consistency, laterite / NDVI surface signal, and
            booked versus predicted tonnes. Wet opencast faces are down-weighted for extractable metal this
            month.
          </p>
          {insight.drivers.length > 0 && (
            <ul>
              {insight.drivers.map((driver) => (
                <li key={driver.key}>
                  {driver.label} {(driver.value * 100).toFixed(0)}% · weight {driver.weight.toFixed(2)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}

function Sparkline({ series, monthIndex }: { series: MonthPoint[]; monthIndex: number }) {
  const w = 308;
  const h = 92;
  const max = Math.max(...series.map((s) => Math.max(s.productionT, s.targetT)), 1);
  const x = (i: number) => 8 + (i / 11) * (w - 16);
  const y = (v: number) => h - 22 - (v / max) * (h - 34);
  const prod = series.map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(s.productionT).toFixed(1)}`).join(" ");
  const tgt = series.map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(s.targetT).toFixed(1)}`).join(" ");
  const cx = x(monthIndex);
  const cy = y(series[monthIndex].productionT);

  return (
    <figure className="spark">
      <figcaption>
        <span>Production</span>
        <span className="spark-target">Target</span>
      </figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Monthly production versus target">
        <path d={tgt} fill="none" stroke="#C4B7A2" strokeWidth="1.6" strokeDasharray="4 4" />
        <path d={prod} fill="none" stroke="#3A1F16" strokeWidth="2.2" />
        <line x1={cx} y1={12} x2={cx} y2={h - 18} stroke="#D6452A" strokeWidth="1" opacity="0.55" />
        <circle cx={cx} cy={cy} r="3.5" fill="#D6452A" />
      </svg>
    </figure>
  );
}
