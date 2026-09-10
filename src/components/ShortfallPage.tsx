import { useMemo, useState } from "react";
import { SITES } from "../data/mines";
import { MONTHS } from "../data/series";
import type { MineMethod, RiskLevel } from "../data/types";
import { allInsights } from "../models/insight";

interface ShortfallPageProps {
  monthIndex: number;
  onMonthChange: (month: number) => void;
  onSelectSiteOnMap: (siteId: string) => void;
}

export function ShortfallPage({
  monthIndex,
  onMonthChange,
  onSelectSiteOnMap,
}: ShortfallPageProps) {
  const [methodFilter, setMethodFilter] = useState<"ALL" | MineMethod>("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | RiskLevel>("ALL");
  const [selectedMineId, setSelectedMineId] = useState<string | null>(null);

  const insights = useMemo(() => allInsights(monthIndex), [monthIndex]);

  // Operational mines only
  const operationalMines = useMemo(
    () => SITES.filter((s) => s.kind === "mine"),
    [],
  );

  // Filtered mines
  const filteredMines = useMemo(() => {
    return operationalMines.filter((mine) => {
      const insight = insights[mine.id];
      if (!insight) return false;
      if (methodFilter !== "ALL" && mine.method !== methodFilter) return false;
      if (riskFilter !== "ALL" && insight.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [operationalMines, insights, methodFilter, riskFilter]);

  // Aggregate KPI metrics
  const kpi = useMemo(() => {
    let totalTarget = 0;
    let totalForecast = 0;
    let highRiskCount = 0;
    let medRiskCount = 0;
    let lowRiskCount = 0;

    for (const mine of operationalMines) {
      const ins = insights[mine.id];
      if (!ins) continue;
      totalTarget += ins.targetT;
      totalForecast += ins.forecastT;
      if (ins.riskLevel === "high") highRiskCount += 1;
      else if (ins.riskLevel === "medium") medRiskCount += 1;
      else lowRiskCount += 1;
    }

    const totalGap = Math.max(0, totalTarget - totalForecast);
    const gapPct = totalTarget > 0 ? (totalGap / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalForecast,
      totalGap,
      gapPct,
      highRiskCount,
      medRiskCount,
      lowRiskCount,
    };
  }, [operationalMines, insights]);

  const activeMine = selectedMineId
    ? operationalMines.find((m) => m.id === selectedMineId)
    : filteredMines[0];
  const activeInsight = activeMine ? insights[activeMine.id] : undefined;

  return (
    <main className="shortfall-page" aria-label="Shortfall Prediction Dashboard">
      <div className="shortfall-container">
        {/* Header with Title and Month Scrub */}
        <div className="shortfall-top-bar">
          <div>
            <span className="shortfall-kicker">30-DAY OPERATIONAL FORECAST</span>
            <h1 className="shortfall-heading">Production Shortfall Intelligence</h1>
          </div>

          {/* Month Selector */}
          <div className="shortfall-month-control">
            <span className="month-control-label">Projection Month:</span>
            <div className="month-chips">
              {MONTHS.map((m, idx) => (
                <button
                  key={m.month}
                  type="button"
                  className={`month-chip ${idx === monthIndex ? "is-active" : ""}`}
                  onClick={() => onMonthChange(idx)}
                >
                  {m.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="shortfall-kpis">
          <div className="kpi-card">
            <span className="kpi-label">Target Production</span>
            <span className="kpi-val">
              {Math.round(kpi.totalTarget).toLocaleString("en-IN")}{" "}
              <span className="kpi-unit">tonnes</span>
            </span>
            <span className="kpi-hint">Combined monthly budget</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Forecasted Output</span>
            <span className="kpi-val">
              {Math.round(kpi.totalForecast).toLocaleString("en-IN")}{" "}
              <span className="kpi-unit">tonnes</span>
            </span>
            <span className="kpi-hint">
              {((kpi.totalForecast / kpi.totalTarget) * 100).toFixed(1)}% fulfillment expected
            </span>
          </div>

          <div className="kpi-card is-gap">
            <span className="kpi-label">Projected Shortfall</span>
            <span className="kpi-val text-vermillion">
              −{Math.round(kpi.totalGap).toLocaleString("en-IN")}{" "}
              <span className="kpi-unit">tonnes</span>
            </span>
            <span className="kpi-hint text-vermillion">
              {kpi.gapPct.toFixed(1)}% overall deficit
            </span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Operational Risk Profile</span>
            <div className="kpi-risk-pills">
              <span className="risk-pill high">{kpi.highRiskCount} High</span>
              <span className="risk-pill med">{kpi.medRiskCount} Med</span>
              <span className="risk-pill low">{kpi.lowRiskCount} Low</span>
            </div>
            <span className="kpi-hint">Across {operationalMines.length} operating mines</span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="shortfall-filters">
          <div className="filter-group">
            <span className="filter-label">Method:</span>
            <div className="filter-pills">
              <button
                type="button"
                className={`filter-pill ${methodFilter === "ALL" ? "is-active" : ""}`}
                onClick={() => setMethodFilter("ALL")}
              >
                All Methods
              </button>
              <button
                type="button"
                className={`filter-pill ${methodFilter === "OC" ? "is-active" : ""}`}
                onClick={() => setMethodFilter("OC")}
              >
                Opencast (OC)
              </button>
              <button
                type="button"
                className={`filter-pill ${methodFilter === "UG" ? "is-active" : ""}`}
                onClick={() => setMethodFilter("UG")}
              >
                Underground (UG)
              </button>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Risk Level:</span>
            <div className="filter-pills">
              <button
                type="button"
                className={`filter-pill ${riskFilter === "ALL" ? "is-active" : ""}`}
                onClick={() => setRiskFilter("ALL")}
              >
                All Risks
              </button>
              <button
                type="button"
                className={`filter-pill ${riskFilter === "high" ? "is-active" : ""}`}
                onClick={() => setRiskFilter("high")}
              >
                High Risk
              </button>
              <button
                type="button"
                className={`filter-pill ${riskFilter === "medium" ? "is-active" : ""}`}
                onClick={() => setRiskFilter("medium")}
              >
                Medium Risk
              </button>
              <button
                type="button"
                className={`filter-pill ${riskFilter === "low" ? "is-active" : ""}`}
                onClick={() => setRiskFilter("low")}
              >
                Low Risk
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Section: Table & Mitigation Details */}
        <div className="shortfall-grid">
          {/* Left Table */}
          <div className="shortfall-table-wrap">
            <table className="shortfall-table">
              <thead>
                <tr>
                  <th>Mine Site</th>
                  <th>Method</th>
                  <th>Target</th>
                  <th>Forecast</th>
                  <th>Deficit Gap</th>
                  <th>Key Hazard Drivers</th>
                  <th>Risk</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMines.map((mine) => {
                  const ins = insights[mine.id];
                  if (!ins) return null;
                  const isSelected = activeMine?.id === mine.id;
                  const gapPct = ins.targetT > 0 ? (ins.gapT / ins.targetT) * 100 : 0;

                  return (
                    <tr
                      key={mine.id}
                      className={`table-row ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setSelectedMineId(mine.id)}
                    >
                      <td>
                        <div className="mine-cell-name">
                          <strong>{mine.name}</strong>
                          <span className="mine-cell-district">
                            {mine.district}, {mine.state}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`method-badge ${mine.method?.toLowerCase()}`}>
                          {mine.method === "OC" ? "Opencast" : "Underground"}
                        </span>
                      </td>
                      <td className="font-mono">
                        {Math.round(ins.targetT).toLocaleString("en-IN")} t
                      </td>
                      <td className="font-mono">
                        {Math.round(ins.forecastT).toLocaleString("en-IN")} t
                      </td>
                      <td>
                        <div className="gap-cell">
                          <span className={ins.gapT > 0 ? "text-vermillion font-mono" : "font-mono"}>
                            {ins.gapT > 0 ? `−${Math.round(ins.gapT).toLocaleString("en-IN")} t` : "On target"}
                          </span>
                          {ins.gapT > 0 && (
                            <div className="gap-mini-bar-track">
                              <div
                                className="gap-mini-bar-fill"
                                style={{ width: `${Math.min(100, gapPct)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="driver-mini-bars">
                          {ins.drivers.map((d) => (
                            <div
                              key={d.key}
                              className="driver-bar-item"
                              title={`${d.label}: ${(d.value * 100).toFixed(0)}% (Weight: ${d.weight.toFixed(2)})`}
                            >
                              <span className="driver-key">{d.key.slice(0, 3)}</span>
                              <div className="driver-track">
                                <div
                                  className="driver-fill"
                                  style={{
                                    width: `${Math.round(d.value * 100)}%`,
                                    backgroundColor:
                                      d.value > 0.6
                                        ? "#D6452A"
                                        : d.value > 0.3
                                          ? "#D08A4A"
                                          : "#2F6B4F",
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`risk-badge ${ins.riskLevel}`}>
                          {ins.riskLevel.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="inspect-map-btn"
                          title="Fly to mine on map"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSiteOnMap(mine.id);
                          }}
                        >
                          View Map ↗
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right Detail / Mitigation Card */}
          {activeMine && activeInsight && (
            <aside className="shortfall-sidebar" aria-label="Mitigation and Tactical Actions">
              <div className="sidebar-header">
                <span className="sidebar-kicker">
                  {activeMine.district} · {activeMine.state}
                </span>
                <h2>{activeMine.name}</h2>
                <p className="sidebar-sub">
                  {activeMine.method === "OC" ? "Opencast Pit" : "Underground Mine"} ·{" "}
                  {activeMine.gradeBand}
                </p>
              </div>

              {/* Mine Forecast Summary */}
              <div className="sidebar-metrics">
                <div className="sidebar-metric-box">
                  <span className="box-label">Monthly Target</span>
                  <span className="box-val font-mono">
                    {Math.round(activeInsight.targetT).toLocaleString("en-IN")} t
                  </span>
                </div>
                <div className="sidebar-metric-box">
                  <span className="box-label">30-Day Forecast</span>
                  <span className="box-val font-mono">
                    {Math.round(activeInsight.forecastT).toLocaleString("en-IN")} t
                  </span>
                </div>
                <div className="sidebar-metric-box is-gap">
                  <span className="box-label">Projected Deficit</span>
                  <span className="box-val text-vermillion font-mono">
                    {activeInsight.gapT > 0
                      ? `−${Math.round(activeInsight.gapT).toLocaleString("en-IN")} t`
                      : "0 t"}
                  </span>
                </div>
              </div>

              {/* Risk Sentence */}
              <div
                className="sidebar-risk-callout"
                style={{ borderLeftColor: activeInsight.riskColor }}
              >
                <p>{activeInsight.sentence}</p>
              </div>

              {/* Hazard Drivers Analysis */}
              <div className="sidebar-drivers">
                <h4>Primary Hazard Drivers</h4>
                <div className="driver-list">
                  {activeInsight.drivers.map((d) => (
                    <div key={d.key} className="driver-row">
                      <div className="driver-row-label">
                        <span>{d.label}</span>
                        <span className="font-mono">{(d.value * 100).toFixed(0)}%</span>
                      </div>
                      <div className="driver-row-track">
                        <div
                          className="driver-row-fill"
                          style={{
                            width: `${Math.round(d.value * 100)}%`,
                            backgroundColor:
                              d.value > 0.5
                                ? "#D6452A"
                                : d.value > 0.25
                                  ? "#D08A4A"
                                  : "#2F6B4F",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ordered Mitigation Actions */}
              <div className="sidebar-actions">
                <h4>Ordered Tactical Mitigations</h4>
                <ol className="action-steps">
                  {activeInsight.actions.map((action, idx) => (
                    <li key={action.title}>
                      <span className="action-step-num">{idx + 1}</span>
                      <div>
                        <strong>{action.title}</strong>
                        <p>{action.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="sidebar-footer">
                <button
                  type="button"
                  className="sidebar-jump-btn"
                  onClick={() => onSelectSiteOnMap(activeMine.id)}
                >
                  Inspect {activeMine.name} on Interactive Map →
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
