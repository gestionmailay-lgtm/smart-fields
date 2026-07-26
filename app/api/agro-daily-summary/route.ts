import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Mirrors the day-by-day summaries already computed client-side in
// app/dashboard/aranet/page.tsx (agronomicDataWithBenchmark / dynamicAgronomicData's aiContext)
// into Supabase, one row per calendar date. Nothing is recomputed here - the browser is still
// the only place that knows how to derive a day's actualGain/climate averages from raw sensor
// data, this route just lets that history accumulate across sessions so /api/agro-correlations
// has something to learn from instead of every visit starting from zero.

// dateStr comes from getStableDateStr() (page.tsx) as "DD/MM/YYYY" - that format is used
// pervasively client-side as an object key/id, but Postgres' `date` column needs ISO
// (YYYY-MM-DD), or it either misreads "18/07/2026" as month 18 (out of range) or silently
// swaps day/month depending on server datestyle.
function toIsoDate(dateStr: string): string | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest) {
  try {
    const { days } = await req.json();
    if (!Array.isArray(days) || days.length === 0) {
      return NextResponse.json({ error: "days must be a non-empty array." }, { status: 400 });
    }

    const rows = days
      .filter((d: any) => d && typeof d.dateStr === "string" && toIsoDate(d.dateStr))
      .map((d: any) => ({
        date: toIsoDate(d.dateStr),
        actual_gain: d.actualGain ?? null,
        radiation_sum_jcm2: d.radiationSumJcm2 ?? null,
        growth_efficiency: d.growthEfficiency ?? null,
        climate: d.climate ?? {},
        drops: d.drops ?? [],
        rule_based_findings: d.ruleBasedFindings ?? [],
        updated_at: new Date().toISOString()
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid day rows in payload." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("agro_daily_summary").upsert(rows, { onConflict: "date" });
    if (error) throw error;

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    console.error("agro-daily-summary sync error:", error);
    return NextResponse.json({ error: error.message || "Erreur de synchronisation." }, { status: 500 });
  }
}
