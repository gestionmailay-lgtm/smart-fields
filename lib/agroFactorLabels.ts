// Human-readable French labels for the factor keys used across the agronomic agent. Since the
// homogenization pass, the `climate` jsonb in agro_daily_summary (and everywhere derived from
// it - correlations, target ranges, the AI prompt) is keyed directly by agro role slug
// (temp_serre, ec_pain, humidite_pain...) - the same vocabulary as the "Rôle Agronomique"
// dropdown and aranet_daily_archive.agro_role. There's exactly one vocabulary now, not two kept
// in sync by hand (a mismatch here is what caused a real bug earlier: humidite_pain was wired
// server-side but missing client-side).
//
// The map below is only a FALLBACK for when the live agro_roles catalog (fetched via
// /api/agro-roles, see app/dashboard/aranet/page.tsx's agroRoleLabels) hasn't loaded yet, or for
// keys that aren't roles at all (radiation_sum_jcm2 is a top-level agro_daily_summary column, not
// a climate role key; the day/night-split fields are ad-hoc refinements, see the plan's scope
// note) - the DB catalog is the source of truth and always takes priority when provided.
export const AGRO_FACTOR_LABELS: { [factorKey: string]: string } = {
  radiation_sum_jcm2: "Somme de radiation",
  temp_serre: "T°C serre",
  temp_exterieure: "T°C extérieure",
  vpd_haut: "VPD Haut",
  hr_serre: "HR serre",
  hr_exterieure: "HR extérieure",
  humidite_pain: "Humidité du pain",
  ec_pain: "EC pain",
  radiation_instantanee: "Radiation instantanée",
  vitesse_vent: "Vitesse du vent",
  co2: "CO2",
  pluie: "Pluie",
  poids_pain: "Poids du pain",
  temp_pain: "T°C pain",
  consommation_eau: "Consommation d'eau",
  gain_cumule: "Gain cumulé",
  poids_total_plante: "Poids total de plante",
  gros_tuyau: "Gros tuyau",
  position_chassis_abrite: "Position chassis abrité",
  position_chassis_expose: "Position chassis exposé",
  forecast: "Forecas",
  // Day/night-split refinements (see plan scope note) - not first-class roles, kept as-is.
  co2DayAvg: "CO2 (jour)",
  co2NightAvg: "CO2 (nuit)",
  co2DayTrend: "Tendance CO2 (jour)",
  chassisExposeDayAvg: "Châssis exposé (jour, moy.)",
  chassisExposeDayMax: "Châssis exposé (jour, max)",
  windDayAvg: "Vent (jour, moy.)",
  windDayMax: "Vent (jour, max)"
};

// Strips the "_lag1" (previous-day) suffix used by /api/agro-correlations before lookup, and
// appends "(jour précédent)" to the resolved label instead of the raw key. `labelsByKey`, when
// provided, is the live agro_roles catalog and takes priority over the static fallback above.
export function formatAgroFactorLabel(factorKey: string, labelsByKey?: { [key: string]: string }): string {
  const isLag = factorKey.endsWith("_lag1");
  const baseKey = isLag ? factorKey.slice(0, -"_lag1".length) : factorKey;
  const label = labelsByKey?.[baseKey] || AGRO_FACTOR_LABELS[baseKey] || baseKey;
  return isLag ? `${label} (jour précédent)` : label;
}
