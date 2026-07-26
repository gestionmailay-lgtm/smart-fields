// Shared between server routes that need to resolve an archived Aranet/Priva sensor to its
// agronomic meaning (app/api/aranet/archive-daily/route.ts, app/api/agro-target-ranges/route.ts)
// and the client's own day-by-day analysis (app/dashboard/aranet/page.tsx). Duplicating this in
// each file was drifting (the cron's version and the target-ranges route need to agree on
// exactly which role maps to which climate field, and on the same 5 time-of-day windows), so it
// lives in one place now.
export const ROLE_TO_CLIMATE_FIELD: { [role: string]: string } = {
  temp_serre: "tempAvg",
  temp_exterieure: "tempOutAvg",
  vpd_haut: "vpdAvg",
  hr_serre: "rhAvg",
  ec_pain: "ecAvg",
  humidite_pain: "wcAvg",
  poids_pain: "slabWeightAvg",
  temp_pain: "substrateTempAvg",
  consommation_eau: "waterConsumptionAvg",
  radiation_instantanee: "radAvg",
  vitesse_vent: "windAvg",
  co2: "co2Avg",
  pluie: "rainAvg"
};

// Five agronomic time-of-day windows (not a flat day/night split): light, temperature and
// substrate demand genuinely differ across them, so a factor's "good" range at Midi isn't its
// "good" range at Nuit - target ranges and the limiting-factor analysis are computed per slot,
// not once for the whole day.
export const AGRO_TIME_SLOTS: { label: string; start: number; end: number }[] = [
  { label: "Nuit", start: 22, end: 6 },
  { label: "Matin", start: 6, end: 10 },
  { label: "Midi", start: 10, end: 14 },
  { label: "Après-midi", start: 14, end: 18 },
  { label: "Soir", start: 18, end: 22 }
];

export function isHourInSlot(hour: number, start: number, end: number): boolean {
  return start <= end ? (hour >= start && hour < end) : (hour >= start || hour < end);
}
