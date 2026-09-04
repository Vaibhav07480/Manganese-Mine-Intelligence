import { clamp } from "../lib/math";
import type { Driver, MonthPoint, RiskLevel, Site } from "../data/types";
import { WEIGHTS } from "./weights";

export interface ShortfallResult {
  risk: number;
  riskLevel: RiskLevel;
  forecastT: number;
  targetT: number;
  gapT: number;
  drivers: Driver[];
}

export function shortfallForecast(site: Site, month: MonthPoint): ShortfallResult {
  if (site.kind === "prospect") {
    return {
      risk: 0,
      riskLevel: "low",
      forecastT: 0,
      targetT: 0,
      gapT: 0,
      drivers: [],
    };
  }

  const downtime = clamp(month.downtimeHours / 160, 0, 1);
  const blast = clamp(month.blastDelayHours / 80, 0, 1);
  const rain =
    site.method === "OC"
      ? clamp((month.rainfallMm - 60) / 280, 0, 1)
      : clamp((month.rainfallMm - 220) / 420, 0, 0.35);
  const depletion = clamp((month.targetT - month.productionT) / Math.max(month.targetT, 1), 0, 1);

  const drivers: Driver[] = [
    { key: "downtime", label: "Equipment downtime", weight: WEIGHTS.downtime, value: downtime },
    { key: "blastDelay", label: "Blasting delay", weight: WEIGHTS.blastDelay, value: blast },
    { key: "rainAnomaly", label: "Rain / haul-road constraint", weight: WEIGHTS.rainAnomaly, value: rain },
    { key: "depletion", label: "Reserve depletion vs plan", weight: WEIGHTS.depletion, value: depletion },
  ];

  const risk = drivers.reduce((sum, d) => sum + d.weight * d.value, 0);
  const forecastT = month.targetT * (1 - risk * 0.85) * (0.72 + 0.28 * month.equipmentAvail);

  return {
    risk,
    riskLevel: riskLevel(risk),
    forecastT,
    targetT: month.targetT,
    gapT: month.targetT - forecastT,
    drivers,
  };
}

export function riskLevel(risk: number): RiskLevel {
  if (risk >= 0.42) return "high";
  if (risk >= 0.24) return "medium";
  return "low";
}
