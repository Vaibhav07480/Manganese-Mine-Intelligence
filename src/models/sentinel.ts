import { hash01 } from "../lib/math";
import { SERIES } from "../data/series";
import type { SentinelBand, SentinelTelemetry, Site } from "../data/types";

export function getSentinelTelemetry(site: Site, monthIndex: number): SentinelTelemetry {
  const series = SERIES[site.id];
  const point = series[monthIndex];

  // Derive MGRS tile based on longitude & latitude
  let mgrsTile = "44QMF";
  if (site.lngLat[0] > 80.0) {
    mgrsTile = "44QNF";
  } else if (site.lngLat[0] < 79.4) {
    mgrsTile = "44QLE";
  }

  const relativeOrbit = (site.id.charCodeAt(0) % 2 === 0) ? "R062" : "R105";

  // Seasonal cloud coverage estimate (higher during monsoon months 5-8: June-Sept)
  const isMonsoon = monthIndex >= 5 && monthIndex <= 8;
  const cloudCoveragePct = isMonsoon
    ? Number((6.2 + hash01(`${site.id}:cloud:${monthIndex}`) * 11.4).toFixed(1))
    : Number((0.4 + hash01(`${site.id}:cloud:${monthIndex}`) * 1.8).toFixed(1));

  // Spectral reflectance model (0.0 to 1.0) calibrated for manganese gossan / opencast pits
  const ndvi = point.ndvi;
  const pitExposure = site.kind === "mine" ? (site.method === "OC" ? 0.38 : 0.22) : 0.14;
  const laterite = site.lateriticSignal;

  // Blue (B2 - 490 nm): lower in iron/Mn oxide areas due to charge transfer absorption
  const b2 = Math.max(0.04, Math.min(0.25, 0.09 + pitExposure * 0.05 - laterite * 0.03));
  
  // Green (B3 - 560 nm): moderate
  const b3 = Math.max(0.06, Math.min(0.32, 0.12 + ndvi * 0.08 + pitExposure * 0.04));
  
  // Red (B4 - 665 nm): elevated on bare iron/manganese laterite outcrops
  const b4 = Math.max(0.08, Math.min(0.42, 0.14 + laterite * 0.15 + pitExposure * 0.08 - ndvi * 0.06));
  
  // NIR (B8 - 842 nm): high over vegetation, moderate over soil
  const b8 = Math.max(0.12, Math.min(0.65, 0.18 + ndvi * 0.38 - pitExposure * 0.06));
  
  // SWIR-1 (B11 - 1610 nm): diagnostic for hydroxyls, soil moisture, and weathered pit surfaces
  const b11 = Math.max(0.14, Math.min(0.55, 0.22 + laterite * 0.18 + pitExposure * 0.12 - point.soilMoisture * 0.09));
  
  // SWIR-2 (B12 - 2190 nm): key alteration band for lateritic clay & manganese ore gossans
  const b12 = Math.max(0.10, Math.min(0.52, 0.19 + laterite * 0.21 + pitExposure * 0.10 - point.soilMoisture * 0.08));

  const bands: SentinelBand[] = [
    { band: "B2", name: "Blue", wavelength: "490 nm", reflectance: Number(b2.toFixed(3)) },
    { band: "B3", name: "Green", wavelength: "560 nm", reflectance: Number(b3.toFixed(3)) },
    { band: "B4", name: "Red", wavelength: "665 nm", reflectance: Number(b4.toFixed(3)) },
    { band: "B8", name: "NIR", wavelength: "842 nm", reflectance: Number(b8.toFixed(3)) },
    { band: "B11", name: "SWIR-1", wavelength: "1610 nm", reflectance: Number(b11.toFixed(3)) },
    { band: "B12", name: "SWIR-2", wavelength: "2190 nm", reflectance: Number(b12.toFixed(3)) },
  ];

  const ironOxideIndex = Number((b4 / Math.max(b2, 0.01)).toFixed(2));
  const lateriteAlterationRatio = Number((b11 / Math.max(b12, 0.01)).toFixed(2));

  return {
    mgrsTile,
    relativeOrbit,
    sensor: "Copernicus Sentinel-2 MSI (Level-2A)",
    resolution: "10m VNIR · 20m SWIR",
    cloudCoveragePct,
    ironOxideIndex,
    lateriteAlterationRatio,
    bands,
  };
}
