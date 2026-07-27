import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { AGRO_TIME_SLOTS, isHourInSlot } from "@/lib/agroRoleMapping";

// Roles under the "Météo extérieure" category (see supabase_migrations/005_agro_roles.sql and
// the live agro_roles catalog) describe conditions outside the greenhouse - identical for every
// compartiment, not tied to any one of them. Kept in sync manually with agro_roles.category,
// same trade-off as every other role-key list hardcoded in this file (gain_cumule, radiation_sum).
const EXTERIOR_WEATHER_ROLES = new Set([
  "temp_ext", "hr_ext", "wind_speed", "wind_direction", "rain", "radiation_instant", "radiation_sum"
]);

// Every Priva metric key encodes its compartment (1-6) as "priva_cN_...". Aranet sensors
// (ARANET_SENSOR_CATALOG below) all belong to a single physical compartment today, matching the
// dashboard's "Compartiment 1 (Aranet + Priva)" option - so they default to compartment "1",
// unless their resolved role is exterior weather (shared by every compartiment - "all").
function resolveCompartment(metricKey: string, role: string | null): string {
  if (role && EXTERIOR_WEATHER_ROLES.has(role)) return "all";
  const match = metricKey.match(/^priva_c(\d+)_/);
  return match ? match[1] : "1";
}

// Ignore SSL verification errors for Aranet Cloud API, same as app/api/aranet/route.ts.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const ARANET_API_KEY = "rvt3mbkpwudukptx2f3as7jcpja3srdw";
const BASE_URL = "https://aranet.cloud/api/v1";
const headers = {
  "Authorization": `ApiKey ${ARANET_API_KEY}`,
  "Accept": "application/json"
};

// Priva OAuth + fetch, duplicated locally from app/api/priva/route.ts (getPrivaToken /
// fetchPrivaWithRetry) for the same reason the Aranet key/fetch logic above is duplicated
// rather than calling this route's own internal API: a cron route should be self-contained.
// Priva's API has a hard rolling 5-day / no-current-day access window (enforced below via
// PRIVA_MAX_DAYS_AGO) - a day outside that window is always skipped for Priva, even though
// Aranet archiving for the same day still proceeds normally.
const PRIVA_CLIENT_ID = process.env.PRIVA_CLIENT_ID || "9b281dc9-967b-4c66-afde-62d2c85c7844";
const PRIVA_CLIENT_SECRET = process.env.PRIVA_CLIENT_SECRET;
const PRIVA_SITE_ID = "e6de5be9-33c8-46df-bc71-bbc8d796185b";
const PRIVA_MAX_DAYS_AGO = 5;

let cachedPrivaToken: string | null = null;
let cachedPrivaTokenExpiry = 0;

async function getPrivaToken(): Promise<string> {
  if (cachedPrivaToken && Date.now() < cachedPrivaTokenExpiry) return cachedPrivaToken;
  if (!PRIVA_CLIENT_SECRET) throw new Error("PRIVA_CLIENT_SECRET is not configured.");

  const res = await fetch("https://auth.priva.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: PRIVA_CLIENT_ID,
      client_secret: PRIVA_CLIENT_SECRET,
      scope: "priva.priva-one priva.access-api priva.historical-data-platform priva.horticulture-services priva.mds-administrator priva.asset-management priva.charts-service"
    }).toString()
  });
  if (!res.ok) throw new Error(`Priva token request failed: ${res.status}`);
  const tokenData = await res.json();
  cachedPrivaToken = tokenData.access_token;
  cachedPrivaTokenExpiry = Date.now() + ((tokenData.expires_in || 3600) - 300) * 1000;
  return cachedPrivaToken as string;
}

// Priva - Météo + Compartiment 1-6, duplicated from app/dashboard/aranet/page.tsx's
// PLOTTABLE_METRICS (keep in sync if sensors are added there) - archived unconditionally every
// night for every compartiment, not only whichever points a user happened to select in the
// dashboard (see the plan: "toutes les données ... pour l'ensemble des compartiments").
const PRIVA_BUILTIN_CATALOG: { metric_key: string; variable_id: string; device_id: string; device_group_id: string | null }[] = [
  { metric_key: "priva_temp_out", variable_id: "00000214-0001-0000-0000-0000000042a9", device_id: "VP9508", device_group_id: null },
  { metric_key: "priva_hum_out", variable_id: "00000214-0001-0000-0000-00000000427e", device_id: "VP9508", device_group_id: null },
  { metric_key: "priva_irr_out", variable_id: "00000214-0001-0000-0000-0000000042fd", device_id: "VP9508", device_group_id: null },
  { metric_key: "priva_wind_out", variable_id: "00000214-0001-0000-0000-0000000042ad", device_id: "VP9508", device_group_id: null },
  ...[1, 2, 3, 4, 5, 6].flatMap(c => [
    { metric_key: `priva_c${c}_temp`, variable_id: `0000002c-0001-000${c}-0000-0000000006f6`, device_id: "VP9508", device_group_id: null },
    { metric_key: `priva_c${c}_temp_target`, variable_id: `0000002c-0001-000${c}-0000-0000000006e5`, device_id: "VP9508", device_group_id: null },
    { metric_key: `priva_c${c}_hum`, variable_id: `000002bb-000${c}-0000-0000-0000000050f2`, device_id: "VP9508", device_group_id: null }
  ])
];

async function archivePrivaForDay(
  supabase: ReturnType<typeof createAdminClient>,
  start: Date,
  end: Date,
  dateStr: string,
  daysAgo: number,
  roleByMetricKey: Map<string, string>
) {
  if (daysAgo > PRIVA_MAX_DAYS_AGO) {
    return { skipped: true, reason: `Hors fenêtre Priva (max ${PRIVA_MAX_DAYS_AGO} jours en arrière).` };
  }

  // Union of the fixed built-in catalog (every compartiment, always archived) and whatever
  // custom Priva points a user has added via the catalog search (e.g. a dedicated exterior
  // radiation sensor tagged "radiation_instant") - deduped by metric_key, custom points win on
  // conflict since they're the more specific, user-confirmed choice.
  const { data: customPoints, error: pointsError } = await supabase
    .from("priva_selected_points")
    .select("metric_key, variable_id, device_id, device_group_id");
  if (pointsError) throw pointsError;

  const pointsByKey = new Map<string, { metric_key: string; variable_id: string; device_id: string; device_group_id: string | null }>();
  PRIVA_BUILTIN_CATALOG.forEach(p => pointsByKey.set(p.metric_key, p));
  (customPoints || []).forEach(p => pointsByKey.set(p.metric_key, p));
  const points = Array.from(pointsByKey.values());

  const token = await getPrivaToken();
  const res = await fetch(`https://horti-api.priva.com/api/sites/${PRIVA_SITE_ID}/data`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "x-api-version": "2.0", "Content-Type": "application/json" },
    body: JSON.stringify({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      datapoints: points.map(p => ({ variableId: p.variable_id, deviceId: p.device_id, deviceGroupId: p.device_group_id || undefined }))
    })
  });
  if (!res.ok) throw new Error(`Priva API ${res.status}`);
  const data = await res.json();
  const series: any[] = data.data || [];

  let archived = 0;
  for (const point of points) {
    const matchSeries = series.find((s: any) => s.datapoint && s.datapoint.variableId === point.variable_id);
    if (!matchSeries || !matchSeries.measurements) continue;

    const perMinute = new Map<number, number>();
    matchSeries.measurements.forEach((v: any) => {
      const val = parseFloat(v.value);
      if (isNaN(val)) return;
      const t = new Date(v.timestampUtc);
      if (t < start || t >= end) return;
      t.setSeconds(0, 0);
      perMinute.set(t.getTime(), val);
    });
    if (perMinute.size === 0) continue;

    const rows = Array.from(perMinute.entries()).map(([timeMs, value]) => ({
      metric_key: point.metric_key,
      reading_time: new Date(timeMs).toISOString(),
      value,
      unit: null,
      archived_for_date: dateStr,
      agro_role: roleByMetricKey.get(point.metric_key) || null,
      compartment: resolveCompartment(point.metric_key, roleByMetricKey.get(point.metric_key) || null)
    }));

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error: insertError } = await supabase.from("aranet_daily_archive").upsert(chunk, { onConflict: "metric_key,reading_time" });
      if (insertError) throw insertError;
      archived += chunk.length;
    }
  }

  return { skipped: false, archived, pointsProcessed: points.length };
}

// Sensor/metric catalog duplicated from app/dashboard/aranet/page.tsx's PLOTTABLE_METRICS -
// keep in sync if sensors are added there.
const ARANET_SENSOR_CATALOG: { [key: string]: { sensorId: string; metricId: string; defaultUnit: string } } = {
  temp_rh_top_1: { sensorId: "1071787", metricId: "1", defaultUnit: "1" },
  temp_rh_top_2: { sensorId: "1071787", metricId: "2", defaultUnit: "2" },
  temp_rh_bottom_1: { sensorId: "1074088", metricId: "1", defaultUnit: "1" },
  temp_rh_bottom_2: { sensorId: "1074088", metricId: "2", defaultUnit: "2" },
  vpd_top_28: { sensorId: "135267713", metricId: "28", defaultUnit: "134" },
  vpd_bottom_28: { sensorId: "135267714", metricId: "28", defaultUnit: "134" },
  vpd_avg_28: { sensorId: "134220332", metricId: "28", defaultUnit: "134" },
  par_12: { sensorId: "6303173", metricId: "12", defaultUnit: "9" },
  dli_29: { sensorId: "136315172", metricId: "29", defaultUnit: "140" },
  slab_ec_wc_8: { sensorId: "6303701", metricId: "8", defaultUnit: "115" },
  slab_ec_wc_11: { sensorId: "6303701", metricId: "11", defaultUnit: "108" },
  slab_ec_wc_10: { sensorId: "6303701", metricId: "10", defaultUnit: "108" },
  slab_ec_wc_1: { sensorId: "6303701", metricId: "1", defaultUnit: "1" },
  slab_weight_7: { sensorId: "134219975", metricId: "7", defaultUnit: "7" },
  plant_weight_7: { sensorId: "134219976", metricId: "7", defaultUnit: "7" },
  plant_weight_gain: { sensorId: "134219976", metricId: "7", defaultUnit: "7" },
  stem_top_114: { sensorId: "5247476", metricId: "114", defaultUnit: "314" },
  stem_bottom_114: { sensorId: "5249180", metricId: "114", defaultUnit: "314" },
  sap_top_114: { sensorId: "5250254", metricId: "114", defaultUnit: "314" },
  sap_bottom_114: { sensorId: "5250268", metricId: "114", defaultUnit: "314" },
  sap_ratio_24: { sensorId: "135267405", metricId: "24", defaultUnit: "18" }
};

// ROLE_TO_CLIMATE_FIELD is imported from lib/agroRoleMapping.ts (shared with
// app/api/agro-target-ranges/route.ts) - deliberately tag-only, no name-based fallback (see
// plan): an untagged sensor's factor is simply absent from a cron-only day.

// Computes and upserts one day's agro_daily_summary row directly from what was just archived
// into aranet_daily_archive, using aranet_metric_roles to know which archived sensor plays which
// role. This is what lets the correlation history grow every night even if nobody opens the
// Analyseur Agronomique tab. Intentionally simplified vs. the browser calculation (no weight-drop
// detection/correction, no day/night split - see plan) - if a human later opens the tab for this
// date, that client-side sync (already in place) overwrites this row with the refined values,
// since agro_daily_summary is keyed by date.
async function computeAndUpsertAgroSummary(
  supabase: ReturnType<typeof createAdminClient>,
  dateStr: string,
  roleByMetricKey: Map<string, string>
) {
  // PostgREST caps rows per request (1000 by default) regardless of how many actually match -
  // a single selected day easily has 10000+ archived readings (10+ sensors x ~1 per minute), so
  // an unpaginated select here silently saw only the first page and, depending on row order,
  // could miss every reading for the tagged sensors entirely (climate ended up empty on most
  // backfilled days until this was paginated).
  const archiveRows: { metric_key: string; reading_time: string; value: number }[] = [];
  const PAGE_SIZE = 1000;
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data: page, error: archiveError } = await supabase
      .from("aranet_daily_archive")
      .select("metric_key, reading_time, value")
      .eq("archived_for_date", dateStr)
      .range(from, from + PAGE_SIZE - 1);
    if (archiveError) throw archiveError;
    if (!page || page.length === 0) break;
    archiveRows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  if (archiveRows.length === 0) {
    return { skipped: true, reason: "Aucune lecture archivée pour cette date." };
  }

  const byMetricKey = new Map<string, { time: number; value: number }[]>();
  archiveRows.forEach(r => {
    if (!byMetricKey.has(r.metric_key)) byMetricKey.set(r.metric_key, []);
    byMetricKey.get(r.metric_key)!.push({ time: new Date(r.reading_time).getTime(), value: Number(r.value) });
  });

  // The agro role IS the climate field name now (homogenized vocabulary - see plan) - no
  // role-to-field translation table needed anymore. Averaged per agronomic time slot (Nuit,
  // Matin, Midi, Après-midi, Soir - same AGRO_TIME_SLOTS/isHourInSlot already used identically
  // in agro-target-ranges/route.ts), not over the full 24h, since the target for a factor
  // genuinely differs between slots and a single daily average masks slot-specific deviations.
  const climate: { [role: string]: { [slotLabel: string]: number } } = {};
  const usedRoles = new Set<string>();
  byMetricKey.forEach((readings, metricKey) => {
    const role = roleByMetricKey.get(metricKey);
    if (!role || usedRoles.has(role)) return; // first tagged sensor wins, same as keysByRole()[0] client-side
    const bySlot: { [slotLabel: string]: number } = {};
    AGRO_TIME_SLOTS.forEach(slot => {
      const inSlot = readings.filter(r => isHourInSlot(new Date(r.time).getHours(), slot.start, slot.end));
      if (inSlot.length === 0) return;
      const avg = inSlot.reduce((sum, r) => sum + r.value, 0) / inSlot.length;
      bySlot[slot.label] = Number(avg.toFixed(3));
    });
    if (Object.keys(bySlot).length > 0) {
      climate[role] = bySlot;
      usedRoles.add(role);
    }
  });

  let radiationSumJcm2: number | null = null;
  for (const [metricKey, readings] of byMetricKey) {
    if (roleByMetricKey.get(metricKey) === "radiation_sum") {
      const sorted = [...readings].sort((a, b) => a.time - b.time);
      radiationSumJcm2 = Math.round(sorted[sorted.length - 1].value);
      break;
    }
  }

  let actualGain: number | null = null;
  // Prefer a sensor explicitly tagged "gain_cumule" if one exists (lets a custom/renamed scale
  // sensor be recognized the same way radiation_sum works), falling back to the two fixed
  // PLOTTABLE_METRICS keys this app ships with by default.
  const gainRoleKey = [...byMetricKey.keys()].find(k => roleByMetricKey.get(k) === "gain_cumule");
  const gainReadings = (gainRoleKey && byMetricKey.get(gainRoleKey))
    || byMetricKey.get("plant_weight_gain")
    || byMetricKey.get("plant_weight_7");
  if (gainReadings && gainReadings.length > 0) {
    const sorted = [...gainReadings].sort((a, b) => a.time - b.time);
    actualGain = Number(((sorted[sorted.length - 1].value - sorted[0].value) * 1000).toFixed(1));
  }

  const growthEfficiency = (radiationSumJcm2 !== null && radiationSumJcm2 > 0 && actualGain !== null && actualGain > 0)
    ? actualGain / radiationSumJcm2
    : null;

  // Greenhouse-wide technical parameters (culture, typology, glass translucidity) have no
  // browser to read from at 3am - greenhouse_settings is their single source of truth, shared
  // with the dashboard's own read/write of the same row via /api/greenhouse-settings.
  const { data: settings } = await supabase
    .from("agro_greenhouse_settings")
    .select("culture, culture_typology, glass_translucidity_percent")
    .eq("id", 1)
    .maybeSingle();

  const { error: upsertError } = await supabase.from("agro_daily_summary").upsert({
    date: dateStr,
    actual_gain: actualGain,
    radiation_sum_jcm2: radiationSumJcm2,
    growth_efficiency: growthEfficiency,
    climate,
    drops: [],
    rule_based_findings: [],
    culture: settings?.culture ?? null,
    culture_typology: settings?.culture_typology ?? null,
    glass_translucidity_percent: settings?.glass_translucidity_percent ?? null,
    updated_at: new Date().toISOString()
  }, { onConflict: "date" });
  if (upsertError) throw upsertError;

  return { skipped: false, actualGain, radiationSumJcm2, growthEfficiency, climateFieldsCount: Object.keys(climate).length };
}

// daysAgo=1 (the Vercel cron's default) means "yesterday". Generalized so a manual backfill can
// target any earlier day via ?daysAgo=N - each call still covers exactly one calendar day, which
// keeps every Aranet request small enough to stay clear of the API's ~10000-reading-per-request
// cap (see the "metric" param fix below) even when backfilling many days at once.
function getDayBounds(daysAgo: number) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); // today 00:00 local
  end.setDate(end.getDate() - (daysAgo - 1));
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  return { start, end, dateStr: start.toISOString().split("T")[0] };
}

export async function GET(req: NextRequest) {
  // Vercel Cron sends this header automatically; also allow a manual Bearer token for testing.
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const daysAgoParam = parseInt(req.nextUrl.searchParams.get("daysAgo") || "1", 10);
    const daysAgo = Number.isFinite(daysAgoParam) && daysAgoParam >= 1 ? daysAgoParam : 1;
    const { start, end, dateStr } = getDayBounds(daysAgo);

    // Every Aranet sensor in the catalog is archived unconditionally every night, not only
    // whichever ones a user happened to have checked in the dashboard - "toutes les données".
    // aranet_selected_sensors still exists (still mirrored from the client) but no longer gates
    // what the cron archives.
    const metricKeys = Object.keys(ARANET_SENSOR_CATALOG);

    // Loaded once up front (not per-loop/per-summary) so every archived row - Aranet or Priva -
    // can be tagged with its resolved agro_role at write time, homogenizing the raw archive
    // itself instead of only resolving roles later at read time.
    const { data: roleRows, error: rolesError } = await supabase
      .from("aranet_metric_roles")
      .select("metric_key, agro_role");
    if (rolesError) throw rolesError;
    const roleByMetricKey = new Map((roleRows || []).map(r => [r.metric_key, r.agro_role]));

    let totalArchived = 0;
    const errors: string[] = [];

    for (const metricKey of metricKeys) {
      const { sensorId, metricId, defaultUnit } = ARANET_SENSOR_CATALOG[metricKey];
      try {
        // "metric" scopes the request to this one channel - without it, the Aranet API's
        // ~10000-reading cap is shared across every metric of the sensor (temp, VWC, EC...),
        // silently dropping whichever metrics are returned last once the window is wide enough
        // (same bug found and fixed in app/api/aranet/route.ts's live history endpoint).
        // "days" must reach back far enough to cover the target day, not just yesterday.
        const params = new URLSearchParams({ sensor: sensorId, metric: metricId, days: String(daysAgo + 1), unit: defaultUnit });
        const res = await fetch(`${BASE_URL}/measurements/history?${params.toString()}`, { headers });
        if (!res.ok) throw new Error(`Aranet API ${res.status}`);
        const data = await res.json();
        const readings: any[] = (data.readings || []).filter((r: any) => r.metric === metricId);

        // Bin to one value per minute, keep only yesterday's window.
        const perMinute = new Map<number, number>();
        readings.forEach(r => {
          const t = new Date(r.time);
          if (t < start || t >= end) return;
          t.setSeconds(0, 0);
          perMinute.set(t.getTime(), Number(r.value));
        });

        if (perMinute.size === 0) continue;

        const rows = Array.from(perMinute.entries()).map(([timeMs, value]) => ({
          metric_key: metricKey,
          reading_time: new Date(timeMs).toISOString(),
          value,
          unit: defaultUnit,
          archived_for_date: dateStr,
          agro_role: roleByMetricKey.get(metricKey) || null,
          compartment: resolveCompartment(metricKey, roleByMetricKey.get(metricKey) || null)
        }));

        // Chunk inserts to stay well under request size limits.
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error: insertError } = await supabase
            .from("aranet_daily_archive")
            .upsert(chunk, { onConflict: "metric_key,reading_time" });
          if (insertError) throw insertError;
          totalArchived += chunk.length;
        }
      } catch (err: any) {
        errors.push(`${metricKey}: ${err.message}`);
      }
    }

    let privaResult: any = null;
    try {
      privaResult = await archivePrivaForDay(supabase, start, end, dateStr, daysAgo, roleByMetricKey);
    } catch (err: any) {
      console.error("Priva archive error:", err);
      privaResult = { skipped: true, reason: err.message || "Erreur d'archivage Priva." };
    }

    let agroSummary: any = null;
    try {
      agroSummary = await computeAndUpsertAgroSummary(supabase, dateStr, roleByMetricKey);
    } catch (err: any) {
      console.error("agro_daily_summary computation error:", err);
      agroSummary = { error: err.message || "Erreur de calcul du résumé agronomique." };
    }

    return NextResponse.json({
      success: true,
      archivedForDate: dateStr,
      archived: totalArchived,
      sensorsProcessed: metricKeys.length,
      errors: errors.length > 0 ? errors : undefined,
      priva: privaResult,
      agroSummary
    });
  } catch (error: any) {
    console.error("Archive daily error:", error);
    return NextResponse.json({ error: error.message || "Erreur d'archivage." }, { status: 500 });
  }
}
