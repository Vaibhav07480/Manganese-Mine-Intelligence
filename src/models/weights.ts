export const COLORS = {
  oxide: "#3A1F16",
  khaki: "#C4B7A2",
  vermillion: "#D6452A",
  canopy: "#2F6B4F",
  amber: "#B56E14",
  ink: "#1A1612",
  paper: "#F7F3EC",
  glass: "rgba(247, 243, 236, 0.92)",
} as const;

export function riskColor(level: "low" | "medium" | "high"): string {
  if (level === "high") return COLORS.vermillion;
  if (level === "medium") return COLORS.amber;
  return COLORS.canopy;
}

export const WEIGHTS = {
  downtime: 0.3,
  blastDelay: 0.25,
  rainAnomaly: 0.25,
  depletion: 0.2,
} as const;
