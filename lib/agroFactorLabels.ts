// Human-readable French labels for the factor keys used across the agronomic agent: the
// climate jsonb fields in agro_daily_summary (same keys as the aiContext object built in
// app/dashboard/aranet/page.tsx's dynamicAgronomicData), plus the top-level radiation_sum_jcm2
// factor from /api/agro-correlations. Shared between the client (Corrélations apprises panel)
// and the server (agro-ai-analysis prompt) so both show the same names instead of raw keys like
// "radiation_sum_jcm2" or "tempAvg". Mirrors the wording already used in the "Rôle Agronomique"
// dropdown (app/dashboard/aranet/page.tsx) so the same concept always reads the same way.
export const AGRO_FACTOR_LABELS: { [factorKey: string]: string } = {
  radiation_sum_jcm2: "Somme de radiation",
  tempAvg: "T°C serre",
  tempOutAvg: "T°C extérieure",
  vpdAvg: "VPD Haut",
  rhAvg: "HR serre",
  wcAvg: "Humidité du pain",
  ecAvg: "EC pain",
  radAvg: "Radiation instantanée",
  windAvg: "Vitesse du vent",
  co2Avg: "CO2",
  rainAvg: "Pluie",
  slabWeightAvg: "Poids du pain",
  substrateTempAvg: "T°C pain",
  waterConsumptionAvg: "Consommation d'eau",
  co2DayAvg: "CO2 (jour)",
  co2NightAvg: "CO2 (nuit)",
  co2DayTrend: "Tendance CO2 (jour)",
  chassisExposeDayAvg: "Châssis exposé (jour, moy.)",
  chassisExposeDayMax: "Châssis exposé (jour, max)",
  windDayAvg: "Vent (jour, moy.)",
  windDayMax: "Vent (jour, max)"
};

// Strips the "_lag1" (previous-day) suffix used by /api/agro-correlations before lookup, and
// appends "(jour précédent)" to the resolved label instead of the raw key.
export function formatAgroFactorLabel(factorKey: string): string {
  const isLag = factorKey.endsWith("_lag1");
  const baseKey = isLag ? factorKey.slice(0, -"_lag1".length) : factorKey;
  const label = AGRO_FACTOR_LABELS[baseKey] || baseKey;
  return isLag ? `${label} (jour précédent)` : label;
}
