import { cellSquare, hash01, offsetLngLat } from "../lib/math";
import { SITES } from "./mines";
import { SERIES } from "./series";
import type { DrillHole, EquipmentKind, EquipmentUnit, OverlayCell, Site } from "./types";

const GRID = 5;
const CELL_M = 460;

export const OVERLAY_CELLS: OverlayCell[] = buildOverlayCells();
export const DRILL_HOLES: DrillHole[] = buildDrillHoles();
export const EQUIPMENT: EquipmentUnit[] = buildEquipment();

function buildOverlayCells(): OverlayCell[] {
  const cells: OverlayCell[] = [];
  let id = 1;
  for (const site of SITES) {
    const origin = -((GRID - 1) / 2) * CELL_M;
    for (let i = 0; i < GRID; i += 1) {
      for (let j = 0; j < GRID; j += 1) {
        const east = origin + i * CELL_M;
        const north = origin + j * CELL_M;
        const cx = (i + 0.5) / GRID - 0.5;
        const cy = (j + 0.5) / GRID - 0.5;
        const dist = Math.hypot(cx, cy);
        const pit = Math.exp(-dist * dist * 7);
        const series = SERIES[site.id];
        const ndvi: number[] = [];
        const rainfall: number[] = [];
        const moisture: number[] = [];
        const lst: number[] = [];
        const reserve: number[] = [];
        const sentinelSwir: number[] = [];
        for (let m = 0; m < 12; m += 1) {
          const jitter = hash01(`${site.id}:${i}:${j}:${m}`) - 0.5;
          ndvi.push(clamp01(series[m].ndvi * (1.15 - pit * 0.55) + jitter * 0.04));
          rainfall.push(Math.max(0, series[m].rainfallMm * (0.92 + dist * 0.18) + jitter * 20));
          moisture.push(clamp01(series[m].soilMoisture * (0.85 + dist * 0.4) - pit * 0.12 + jitter * 0.05));
          lst.push(series[m].lstC + pit * 3.4 + jitter * 1.2);
          const grade = site.predictedReservesMt / Math.max(site.leaseKm2, 0.4);
          reserve.push(clamp01(grade / 9 + pit * 0.55 + site.lateriticSignal * 0.2 + jitter * 0.08));

          // Sentinel-2 SWIR / Laterite Alteration Index (B11 1610nm & B12 2190nm response)
          const dryFactor = Math.max(0.25, 1 - (series[m].rainfallMm / 360));
          const swirAnomaly = clamp01(
            site.lateriticSignal * 0.65 +
              pit * 0.45 * dryFactor +
              (1 - series[m].soilMoisture) * 0.15 +
              jitter * 0.08,
          );
          sentinelSwir.push(swirAnomaly);
        }
        cells.push({
          id,
          siteId: site.id,
          polygon: cellSquare(site.lngLat, east, north, CELL_M),
          ndvi,
          rainfall,
          moisture,
          lst,
          reserve,
          sentinelSwir,
        });
        id += 1;
      }
    }
  }
  return cells;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function buildDrillHoles(): DrillHole[] {
  const holes: DrillHole[] = [];
  for (const site of SITES) {
    const count = site.drillHoles;
    for (let i = 0; i < count; i += 1) {
      const u = hash01(`${site.id}:drill:${i}:e`);
      const v = hash01(`${site.id}:drill:${i}:n`);
      const span = 420 + site.leaseKm2 * 180;
      const lngLat = offsetLngLat(site.lngLat, (u - 0.5) * span * 2, (v - 0.5) * span * 2);
      const mnPct =
        parseGradeMid(site) + (hash01(`${site.id}:mn:${i}`) - 0.5) * 8 * (1 + site.gradeCv);
      holes.push({
        id: `${site.id}-dh-${i + 1}`,
        siteId: site.id,
        lngLat,
        depthM: Math.round(40 + hash01(`${site.id}:z:${i}`) * (site.depthM ?? 90)),
        mnPct: Math.max(6, mnPct),
      });
    }
  }
  return holes;
}

function parseGradeMid(site: Site): number {
  const nums = site.gradeBand.match(/(\d+)/g);
  if (!nums || nums.length === 0) return 18;
  if (nums.length === 1) return Number(nums[0]);
  return (Number(nums[0]) + Number(nums[1])) / 2;
}

function buildEquipment(): EquipmentUnit[] {
  const units: EquipmentUnit[] = [];
  const roster: { kind: EquipmentKind; name: string; e: number; n: number; down: number[] }[] = [];

  const add = (siteId: string, items: typeof roster) => {
    const site = SITES.find((s) => s.id === siteId);
    if (!site) return;
    items.forEach((item, index) => {
      units.push({
        id: `${siteId}-${item.kind}-${index}`,
        siteId,
        kind: item.kind,
        name: item.name,
        lngLat: offsetLngLat(site.lngLat, item.e, item.n),
        downMonths: item.down,
      });
    });
  };

  add("dongri", [
    { kind: "shovel", name: "DB-SHV-01", e: -180, n: 120, down: [] },
    { kind: "shovel", name: "DB-SHV-02", e: 210, n: -80, down: [9, 10] },
    { kind: "dumper", name: "DB-DMP-07", e: -40, n: -200, down: [9] },
    { kind: "dumper", name: "DB-DMP-11", e: 260, n: 160, down: [] },
    { kind: "drill", name: "DB-DRL-03", e: 40, n: 240, down: [9] },
  ]);
  add("tirodi", [
    { kind: "shovel", name: "TR-SHV-01", e: -120, n: 80, down: [10] },
    { kind: "dumper", name: "TR-DMP-04", e: 160, n: -140, down: [9, 10] },
    { kind: "drill", name: "TR-DRL-02", e: 80, n: 180, down: [10] },
  ]);
  add("sitapatore", [
    { kind: "shovel", name: "ST-SHV-01", e: 90, n: -60, down: [9, 10, 11] },
    { kind: "dumper", name: "ST-DMP-02", e: -150, n: 90, down: [] },
  ]);
  add("balaghat", [
    { kind: "loco", name: "BG-LOC-04", e: 140, n: -90, down: [] },
    { kind: "drill", name: "BG-DRL-12", e: -220, n: 70, down: [] },
    { kind: "dumper", name: "BG-DMP-09", e: 40, n: 160, down: [] },
  ]);
  add("chikla", [
    { kind: "loco", name: "CK-LOC-02", e: 80, n: 40, down: [] },
    { kind: "dumper", name: "CK-DMP-05", e: -100, n: -120, down: [] },
  ]);
  add("kandri", [
    { kind: "loco", name: "KD-LOC-01", e: -60, n: 110, down: [7] },
    { kind: "drill", name: "KD-DRL-06", e: 150, n: -70, down: [7] },
  ]);
  add("gumgaon", [
    { kind: "loco", name: "GM-LOC-03", e: 70, n: -40, down: [1, 2] },
    { kind: "drill", name: "GM-DRL-08", e: -160, n: 90, down: [2] },
  ]);
  add("ukwa", [
    { kind: "loco", name: "UK-LOC-01", e: 50, n: 80, down: [] },
    { kind: "dumper", name: "UK-DMP-03", e: -130, n: -50, down: [] },
  ]);
  add("munsar", [
    { kind: "drill", name: "MN-DRL-04", e: 90, n: 60, down: [10] },
  ]);
  add("beldongri", [
    { kind: "drill", name: "BD-DRL-01", e: -70, n: 40, down: [] },
  ]);

  return units;
}
