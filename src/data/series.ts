import { clamp, hash01 } from "../lib/math";
import { SITES } from "./mines";
import type { MonthMeta, MonthPoint, Site } from "./types";

export const MONTHS: MonthMeta[] = [
  { month: "2025-10", label: "Oct 2025", short: "Oct" },
  { month: "2025-11", label: "Nov 2025", short: "Nov" },
  { month: "2025-12", label: "Dec 2025", short: "Dec" },
  { month: "2026-01", label: "Jan 2026", short: "Jan" },
  { month: "2026-02", label: "Feb 2026", short: "Feb" },
  { month: "2026-03", label: "Mar 2026", short: "Mar" },
  { month: "2026-04", label: "Apr 2026", short: "Apr" },
  { month: "2026-05", label: "May 2026", short: "May" },
  { month: "2026-06", label: "Jun 2026", short: "Jun" },
  { month: "2026-07", label: "Jul 2026", short: "Jul" },
  { month: "2026-08", label: "Aug 2026", short: "Aug" },
  { month: "2026-09", label: "Sep 2026", short: "Sep" },
];

export const CURRENT_MONTH_INDEX = 11;

const RAIN = [72, 22, 14, 16, 18, 20, 14, 16, 175, 355, 318, 188];
const NDVI = [0.42, 0.35, 0.32, 0.31, 0.33, 0.36, 0.34, 0.32, 0.48, 0.62, 0.64, 0.55];
const LST = [32, 28, 26, 27, 32, 36, 40, 42, 31, 26, 26, 29];
const MOISTURE = [0.28, 0.18, 0.14, 0.15, 0.16, 0.17, 0.14, 0.13, 0.48, 0.72, 0.7, 0.52];

const WET_SCALE: Record<string, number> = {
  balaghat: 1.15,
  ukwa: 1.18,
  tirodi: 1.08,
  sitapatore: 1.08,
  dongri: 1.02,
  chikla: 1.0,
  kandri: 0.9,
  munsar: 0.9,
  gumgaon: 0.88,
  beldongri: 0.92,
  pani: 0.72,
  bhudkum: 1.05,
  selva: 1.12,
  nilkanthpur: 1.22,
};

const ANNUAL: Record<string, { production: number; target: number }> = {
  balaghat: { production: 450_000, target: 480_000 },
  ukwa: { production: 168_000, target: 180_000 },
  tirodi: { production: 96_000, target: 120_000 },
  sitapatore: { production: 42_000, target: 58_000 },
  dongri: { production: 268_000, target: 300_000 },
  chikla: { production: 144_000, target: 150_000 },
  kandri: { production: 132_000, target: 144_000 },
  munsar: { production: 102_000, target: 114_000 },
  gumgaon: { production: 118_000, target: 132_000 },
  beldongri: { production: 58_000, target: 78_000 },
};

interface Incident {
  downtime?: number;
  blast?: number;
  avail?: number;
  prodMul?: number;
}

const INCIDENTS: Record<string, Partial<Record<number, Incident>>> = {
  dongri: {
    8: { blast: 28, prodMul: 0.82 },
    9: { downtime: 92, blast: 64, avail: 0.61, prodMul: 0.62 },
    10: { downtime: 54, blast: 36, avail: 0.7, prodMul: 0.71 },
    11: { blast: 18, prodMul: 0.84 },
  },
  tirodi: {
    8: { prodMul: 0.78, blast: 22 },
    9: { downtime: 70, blast: 40, avail: 0.66, prodMul: 0.58 },
    10: { downtime: 118, avail: 0.52, prodMul: 0.48 },
    11: { downtime: 36, prodMul: 0.8 },
  },
  sitapatore: {
    9: { downtime: 40, blast: 24, prodMul: 0.55 },
    10: { downtime: 44, prodMul: 0.52 },
    11: { prodMul: 0.7 },
  },
  kandri: {
    6: { downtime: 48, avail: 0.78 },
    7: { downtime: 74, avail: 0.7, prodMul: 0.82 },
  },
  gumgaon: {
    1: { downtime: 42, avail: 0.8, prodMul: 0.84 },
    2: { downtime: 50, avail: 0.76, prodMul: 0.8 },
    3: { downtime: 38, prodMul: 0.86 },
  },
  beldongri: {
    4: { downtime: 30, prodMul: 0.74 },
    9: { prodMul: 0.68 },
  },
  munsar: {
    10: { downtime: 28, prodMul: 0.86 },
  },
};

function seasonalProduction(site: Site, monthIndex: number): number {
  if (site.kind === "prospect") return 1;
  if (site.method === "OC") {
    const wet = [1, 1, 1, 1, 1, 1, 1, 0.97, 0.78, 0.58, 0.62, 0.8][monthIndex];
    return wet;
  }
  return [1, 1.02, 1.01, 1, 0.99, 0.98, 0.97, 0.96, 0.94, 0.92, 0.93, 0.96][monthIndex];
}

function buildPoint(site: Site, monthIndex: number): MonthPoint {
  const wet = WET_SCALE[site.id] ?? 1;
  const jitter = (key: string, span: number) =>
    (hash01(`${site.id}:${monthIndex}:${key}`) - 0.5) * span;

  const rainfallMm = Math.max(0, RAIN[monthIndex] * wet + jitter("rain", 18));
  const ndvi = clamp(NDVI[monthIndex] * (0.82 + site.lateriticSignal * 0.08) + jitter("ndvi", 0.05), 0.12, 0.78);
  const lstC = LST[monthIndex] + (site.method === "OC" ? 1.8 : 0) + jitter("lst", 1.6);
  const soilMoisture = clamp(MOISTURE[monthIndex] * wet * 0.9 + jitter("sm", 0.06), 0.08, 0.88);

  if (site.kind === "prospect") {
    return {
      productionT: 0,
      targetT: 0,
      downtimeHours: 0,
      blastDelayHours: 0,
      rainfallMm,
      soilMoisture,
      ndvi,
      lstC,
      equipmentAvail: 1,
    };
  }

  const plan = ANNUAL[site.id];
  const targetT = plan.target / 12;
  const incident = INCIDENTS[site.id]?.[monthIndex] ?? {};
  const prodMul = incident.prodMul ?? 1;
  const productionT = (plan.production / 12) * seasonalProduction(site, monthIndex) * prodMul;
  const downtimeHours = incident.downtime ?? (site.method === "OC" && monthIndex >= 8 && monthIndex <= 10 ? 18 + monthIndex : 8);
  const blastDelayHours =
    incident.blast ?? (site.method === "OC" && rainfallMm > 140 ? 12 + rainfallMm / 40 : 4);
  const equipmentAvail = incident.avail ?? clamp(0.94 - downtimeHours / 400, 0.5, 0.98);

  return {
    productionT,
    targetT,
    downtimeHours,
    blastDelayHours,
    rainfallMm,
    soilMoisture,
    ndvi,
    lstC,
    equipmentAvail,
  };
}

export const SERIES: Record<string, MonthPoint[]> = Object.fromEntries(
  SITES.map((site) => [site.id, MONTHS.map((_, i) => buildPoint(site, i))]),
);

export function seriesFor(siteId: string): MonthPoint[] {
  return SERIES[siteId];
}
