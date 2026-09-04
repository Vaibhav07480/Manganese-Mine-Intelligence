import { clamp } from "../lib/math";
import type { MonthPoint, Site } from "../data/types";

export function reserveConfidence(site: Site, month: MonthPoint): number {
  const drill = clamp(site.drillDensityPerKm2 / 40, 0, 1);
  const grade = 1 - clamp(site.gradeCv / 0.4, 0, 1);
  const surface =
    site.kind === "prospect"
      ? 0.32 + 0.5 * site.lateriticSignal * (1 - month.ndvi)
      : 0.48 + 0.28 * site.lateriticSignal;
  const bookRatio =
    site.bookedReservesMt > 0
      ? clamp(site.predictedReservesMt / site.bookedReservesMt, 0.4, 1.2)
      : 0.7 + site.lateriticSignal * 0.25;
  const wetPenalty =
    site.method === "OC" ? clamp((month.rainfallMm - 80) / 320, 0, 0.22) : 0;
  return clamp(
    0.28 * drill + 0.22 * grade + 0.32 * surface + 0.18 * bookRatio - wetPenalty,
    0.06,
    0.97,
  );
}

export function extractableThisMonth(
  site: Site,
  month: MonthPoint,
  confidence: number,
): number {
  const wet =
    site.method === "OC" ? 1 - clamp((month.rainfallMm - 40) / 400, 0, 0.35) : 0.96;
  return site.predictedReservesMt * confidence * wet;
}
