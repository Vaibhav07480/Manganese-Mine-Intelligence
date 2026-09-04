export type MineMethod = "UG" | "OC";
export type SiteKind = "mine" | "prospect";
export type StateName =
  | "Maharashtra"
  | "Madhya Pradesh"
  | "Gujarat"
  | "Chhattisgarh";

export type OverlayId =
  | "reserves"
  | "drills"
  | "ndvi"
  | "rainfall"
  | "moisture"
  | "lst"
  | "equipment";

export type BasemapId = "satellite" | "hybrid" | "terrain";
export type RiskLevel = "low" | "medium" | "high";

export interface Site {
  id: string;
  name: string;
  kind: SiteKind;
  method?: MineMethod;
  state: StateName;
  district: string;
  lngLat: [number, number];
  depthM?: number;
  gradeBand: string;
  product: string;
  bookedReservesMt: number;
  predictedReservesMt: number;
  drillHoles: number;
  drillDensityPerKm2: number;
  gradeCv: number;
  lateriticSignal: number;
  leaseKm2: number;
  lease: [number, number][];
  notes: string;
}

export interface MonthMeta {
  month: string;
  label: string;
  short: string;
}

export interface MonthPoint {
  productionT: number;
  targetT: number;
  downtimeHours: number;
  blastDelayHours: number;
  rainfallMm: number;
  soilMoisture: number;
  ndvi: number;
  lstC: number;
  equipmentAvail: number;
}

export interface OverlayCell {
  id: number;
  siteId: string;
  polygon: [number, number][];
  ndvi: number[];
  rainfall: number[];
  moisture: number[];
  lst: number[];
  reserve: number[];
}

export interface DrillHole {
  id: string;
  siteId: string;
  lngLat: [number, number];
  depthM: number;
  mnPct: number;
}

export type EquipmentKind = "shovel" | "dumper" | "drill" | "loco";

export interface EquipmentUnit {
  id: string;
  siteId: string;
  kind: EquipmentKind;
  name: string;
  lngLat: [number, number];
  downMonths: number[];
}

export interface ActionStep {
  title: string;
  detail: string;
}

export interface Driver {
  key: string;
  label: string;
  weight: number;
  value: number;
}

export interface SiteInsight {
  confidence: number;
  extractableMt: number;
  risk: number;
  riskLevel: RiskLevel;
  riskColor: string;
  forecastT: number;
  targetT: number;
  gapT: number;
  sentence: string;
  actions: ActionStep[];
  drivers: Driver[];
  series: MonthPoint[];
  current: MonthPoint;
}
