import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const MIN_SAMPLE_SIZE = 10;
const MIN_FACTOR_SAMPLE_SIZE = 5;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

// Fields excluded from correlation against actual_gain because they're derived from it
// (growth_efficiency = actual_gain / radiation_sum_jcm2) - correlating them would be circular,
// not a genuine finding about what drives growth.
const EXCLUDED_FACTORS = new Set(["growth_efficiency", "actual_gain"]);

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denomX = 0, denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  if (denomX === 0 || denomY === 0) return null;
  return num / Math.sqrt(denomX * denomY);
}

async function recompute(supabase: ReturnType<typeof createAdminClient>) {
  const { data: rows, error } = await supabase
    .from("agro_daily_summary")
    .select("date, actual_gain, radiation_sum_jcm2, climate")
    .order("date", { ascending: true });
  if (error) throw error;
  if (!rows || rows.length < MIN_SAMPLE_SIZE) {
    return { insufficient: true, sampleSize: rows?.length || 0 };
  }

  const byDate = new Map(rows.map(r => [r.date as string, r]));

  // Union of every numeric factor key ever seen, across the top-level radiation_sum_jcm2 field
  // and every key inside the `climate` jsonb blob (tempAvg, vpdAvg, wcAvg, ecAvg, co2Avg, ...).
  const factorKeys = new Set<string>(["radiation_sum_jcm2"]);
  rows.forEach(r => {
    const climate = (r.climate || {}) as Record<string, any>;
    Object.entries(climate).forEach(([k, v]) => {
      if (typeof v === "number" && !EXCLUDED_FACTORS.has(k)) factorKeys.add(k);
    });
  });

  const results: { factor_key: string; target: string; method: string; coefficient: number; sample_size: number }[] = [];

  const getFactorValue = (row: any, key: string): number | null => {
    if (key === "radiation_sum_jcm2") return typeof row.radiation_sum_jcm2 === "number" ? row.radiation_sum_jcm2 : null;
    const v = (row.climate || {})[key];
    return typeof v === "number" ? v : null;
  };

  factorKeys.forEach(key => {
    // Same-day: factor and actual_gain on the same date.
    const sameDayXs: number[] = [];
    const sameDayYs: number[] = [];
    // Lag-1: factor from date D paired with actual_gain from date D+1 (yesterday's conditions
    // vs. today's growth), only when D+1 actually exists in the dataset.
    const lagXs: number[] = [];
    const lagYs: number[] = [];

    rows.forEach(row => {
      const factorVal = getFactorValue(row, key);
      const gain = typeof row.actual_gain === "number" ? row.actual_gain : null;
      if (factorVal !== null && gain !== null) {
        sameDayXs.push(factorVal);
        sameDayYs.push(gain);
      }
      if (factorVal !== null) {
        const d = new Date(row.date as string);
        d.setDate(d.getDate() + 1);
        const nextDateStr = d.toISOString().slice(0, 10);
        const nextRow = byDate.get(nextDateStr);
        const nextGain = nextRow && typeof nextRow.actual_gain === "number" ? nextRow.actual_gain : null;
        if (nextGain !== null) {
          lagXs.push(factorVal);
          lagYs.push(nextGain);
        }
      }
    });

    if (sameDayXs.length >= MIN_FACTOR_SAMPLE_SIZE) {
      const r = pearson(sameDayXs, sameDayYs);
      if (r !== null) results.push({ factor_key: key, target: "actual_gain", method: "pearson", coefficient: r, sample_size: sameDayXs.length });
    }
    if (lagXs.length >= MIN_FACTOR_SAMPLE_SIZE) {
      const r = pearson(lagXs, lagYs);
      if (r !== null) results.push({ factor_key: `${key}_lag1`, target: "actual_gain", method: "pearson", coefficient: r, sample_size: lagXs.length });
    }
  });

  if (results.length > 0) {
    const { error: upsertError } = await supabase
      .from("agro_correlations")
      .upsert(results.map(r => ({ ...r, computed_at: new Date().toISOString() })), { onConflict: "factor_key,target,method" });
    if (upsertError) throw upsertError;
  }

  return { insufficient: false, sampleSize: rows.length };
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: latest } = await supabase
      .from("agro_correlations")
      .select("computed_at")
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isStale = !latest || (Date.now() - new Date(latest.computed_at).getTime()) > STALE_AFTER_MS;

    let recomputeResult: { insufficient: boolean; sampleSize: number } | null = null;
    if (isStale) {
      recomputeResult = await recompute(supabase);
    }

    const { data: correlations, error } = await supabase
      .from("agro_correlations")
      .select("factor_key, target, method, coefficient, sample_size, computed_at")
      .order("coefficient", { ascending: false });
    if (error) throw error;

    const sorted = (correlations || []).slice().sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

    return NextResponse.json({
      correlations: sorted,
      insufficientData: recomputeResult?.insufficient ?? (correlations || []).length === 0,
      sampleSize: recomputeResult?.sampleSize ?? null
    });
  } catch (error: any) {
    console.error("agro-correlations error:", error);
    return NextResponse.json({ error: error.message || "Erreur de calcul des corrélations." }, { status: 500 });
  }
}
