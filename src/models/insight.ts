import { MINES, SITES } from "../data/mines";
import { MONTHS, SERIES } from "../data/series";
import type { ActionStep, MonthPoint, Site, SiteInsight } from "../data/types";
import { extractableThisMonth, reserveConfidence } from "./reserves";
import { shortfallForecast } from "./shortfall";
import { riskColor } from "./weights";

export function insightFor(site: Site, monthIndex: number): SiteInsight {
  const series = SERIES[site.id];
  const current = series[monthIndex];
  const confidence = reserveConfidence(site, current);
  const extractableMt = extractableThisMonth(site, current, confidence);
  const shortfall = shortfallForecast(site, current);
  const actions = recommend(site, current, monthIndex, confidence, shortfall.risk);
  const sentence = riskSentence(site, current, monthIndex, confidence, shortfall);

  return {
    confidence,
    extractableMt,
    risk: shortfall.risk,
    riskLevel: site.kind === "prospect" ? (confidence < 0.35 ? "high" : confidence < 0.55 ? "medium" : "low") : shortfall.riskLevel,
    riskColor: riskColor(
      site.kind === "prospect"
        ? confidence < 0.35
          ? "high"
          : confidence < 0.55
            ? "medium"
            : "low"
        : shortfall.riskLevel,
    ),
    forecastT: shortfall.forecastT,
    targetT: shortfall.targetT,
    gapT: shortfall.gapT,
    sentence,
    actions,
    drivers: shortfall.drivers,
    series,
    current,
  };
}

export function allInsights(monthIndex: number): Record<string, SiteInsight> {
  return Object.fromEntries(SITES.map((site) => [site.id, insightFor(site, monthIndex)]));
}

export function recommend(
  site: Site,
  month: MonthPoint,
  monthIndex: number,
  confidence: number,
  risk: number,
): ActionStep[] {
  const steps: ActionStep[] = [];
  const donor = bestDonor(site.id, monthIndex);

  if (site.kind === "prospect") {
    steps.push({
      title: "Grid soil geochem over the laterite cap",
      detail: `${site.name} has a lateritic signal of ${Math.round(site.lateriticSignal * 100)}% but only ${site.drillHoles} holes. Close the surface grid before the next monsoon.`,
    });
    steps.push({
      title: "Infill drill to 200 m centres",
      detail: `Density is ${site.drillDensityPerKm2.toFixed(0)} holes/km². Raise it toward 20 before booking inferred tonnes.`,
    });
    if (month.ndvi > 0.5) {
      steps.push({
        title: "Wait out canopy, then reshoot LST / NDVI",
        detail: `${MONTHS[monthIndex].label} vegetation is masking alteration. Task a dry-season scene for the next ranking.`,
      });
    } else {
      steps.push({
        title: "Rank this block against Selva and Bhudkum",
        detail: "Use the same confidence model so exploration metres follow surface-plus-subsurface score, not lease order.",
      });
    }
    return steps.slice(0, 4);
  }

  if (site.method === "OC" && month.rainfallMm > 140) {
    steps.push({
      title: "Slip the blast window past the rain cell",
      detail: `${month.rainfallMm.toFixed(0)} mm this month. Hold charged faces until a 48-hour dry spell; keep pre-split only on the high wall.`,
    });
  }

  if (month.downtimeHours > 40 && donor) {
    steps.push({
      title: `Redeploy dumpers from ${donor.name}`,
      detail: `${month.downtimeHours.toFixed(0)} h lost here. ${donor.name} is low-risk this month and can spare ROM trucks for 10–12 days.`,
    });
  }

  if (site.method === "OC" && risk > 0.35 && donor) {
    steps.push({
      title: `Shift oxide feed to ${donor.name} underground faces`,
      detail: "Keep the crushing plant warm with UG lumpy ore until the haul road firms. Protect customer nominations first.",
    });
  }

  if (month.blastDelayHours > 24) {
    steps.push({
      title: "Re-sequence the blast pattern",
      detail: `${month.blastDelayHours.toFixed(0)} h of blast slip. Move to smaller evening shots and pre-stock the ROM pad on night shift.`,
    });
  }

  const gap = site.bookedReservesMt - site.predictedReservesMt;
  if (gap > 0.4 || confidence < 0.55) {
    steps.push({
      title: "Infill drill the hanging-wall pinch",
      detail: `Booked ${site.bookedReservesMt.toFixed(1)} Mt vs predicted ${site.predictedReservesMt.toFixed(1)} Mt. Add holes until density exceeds 20/km² before the next mine plan.`,
    });
  }

  if (month.equipmentAvail < 0.75) {
    steps.push({
      title: "Park the failed shovel, swing the spare",
      detail: `Availability is ${(month.equipmentAvail * 100).toFixed(0)}%. Open a second loading point rather than waiting on OEM parts.`,
    });
  }

  if (steps.length === 0) {
    steps.push({
      title: "Hold the current shift roster",
      detail: `${site.name} is inside plan. Keep skip / shovel utilisation and do not raid this fleet for other pits.`,
    });
    steps.push({
      title: "Advance grade-control sampling one lift",
      detail: "Use the spare metres to tighten the short-term ore/waste contact while the face is dry.",
    });
  }

  return steps.slice(0, 4);
}

function bestDonor(excludeId: string, monthIndex: number): Site | undefined {
  const scored = MINES.filter((m) => m.id !== excludeId && m.method === "UG").map((m) => ({
    site: m,
    risk: shortfallForecast(m, SERIES[m.id][monthIndex]).risk,
  }));
  scored.sort((a, b) => a.risk - b.risk);
  return scored[0]?.site;
}

function riskSentence(
  site: Site,
  month: MonthPoint,
  monthIndex: number,
  confidence: number,
  shortfall: ReturnType<typeof shortfallForecast>,
): string {
  const when = MONTHS[monthIndex].label;
  if (site.kind === "prospect") {
    return `${site.name} is an exploration block. Model confidence is ${(confidence * 100).toFixed(0)}% from ${site.drillHoles} holes and a ${Math.round(site.lateriticSignal * 100)}% laterite/NDVI signal.`;
  }
  if (shortfall.riskLevel === "low") {
    return `${site.name} is on plan in ${when}. Underground faces can hold about ${Math.round(shortfall.forecastT).toLocaleString("en-IN")} t against a ${Math.round(shortfall.targetT).toLocaleString("en-IN")} t target.`;
  }
  const gapPct = Math.max(0, (shortfall.gapT / Math.max(shortfall.targetT, 1)) * 100);
  const rainBit =
    site.method === "OC" && month.rainfallMm > 120
      ? `${month.rainfallMm.toFixed(0)} mm of rain on the haul road`
      : `${month.downtimeHours.toFixed(0)} h of equipment downtime`;
  const blastBit =
    month.blastDelayHours > 16 ? ` plus ${month.blastDelayHours.toFixed(0)} h of blast slip` : "";
  return `${rainBit}${blastBit} puts ${site.name} about ${gapPct.toFixed(0)}% below the ${when} target.`;
}
