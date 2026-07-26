import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { AGRO_TIME_SLOTS, isHourInSlot } from "@/lib/agroRoleMapping";

// Turns the raw Pearson coefficients from /api/agro-correlations into something a crop manager
// can actually act on: for each factor AND each of the 5 agronomic time-of-day windows, the
// value range observed on this greenhouse's own best days (by growth efficiency) DURING that
// specific window - not a single 24h-average range applied uniformly to every slot. Light,
// temperature and substrate demand genuinely differ between Nuit/Matin/Midi/Après-midi/Soir, so
// "good EC at midday" and "good EC at night" are different targets.
const MIN_SAMPLE_SIZE = 10;
const MIN_FACTOR_SAMPLE_SIZE = 3;
const TOP_SHARE = 0.4;
const ARCHIVE_PAGE_SIZE = 1000;

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

async function fetchArchiveForDate(supabase: ReturnType<typeof createAdminClient>, dateStr: string) {
  // Same pagination fix as app/api/aranet/archive-daily/route.ts's computeAndUpsertAgroSummary -
  // a single day easily has 10000+ archived readings, well past PostgREST's default row cap.
  // Filters to agro_role is not null at the query level - archive-daily now tags every row with
  // its resolved role at write time, so there's no need to separately load aranet_metric_roles
  // and cross-reference metric_key -> role in memory here anymore.
  const rows: { reading_time: string; value: number; agro_role: string }[] = [];
  for (let from = 0; ; from += ARCHIVE_PAGE_SIZE) {
    const { data: page, error } = await supabase
      .from("aranet_daily_archive")
      .select("reading_time, value, agro_role")
      .eq("archived_for_date", dateStr)
      .not("agro_role", "is", null)
      .range(from, from + ARCHIVE_PAGE_SIZE - 1);
    if (error) throw error;
    if (!page || page.length === 0) break;
    rows.push(...(page as any));
    if (page.length < ARCHIVE_PAGE_SIZE) break;
  }
  return rows;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: summaryRows, error: summaryError } = await supabase
      .from("agro_daily_summary")
      .select("date, actual_gain, growth_efficiency");
    if (summaryError) throw summaryError;

    if (!summaryRows || summaryRows.length < MIN_SAMPLE_SIZE) {
      return NextResponse.json({ ranges: {}, insufficientData: true, sampleSize: summaryRows?.length || 0 });
    }

    const ranked = summaryRows
      .map(r => ({ date: r.date as string, rankValue: typeof r.growth_efficiency === "number" ? r.growth_efficiency : (typeof r.actual_gain === "number" ? r.actual_gain : null) }))
      .filter(r => r.rankValue !== null)
      .sort((a, b) => (b.rankValue as number) - (a.rankValue as number));

    const topCount = Math.max(3, Math.round(ranked.length * TOP_SHARE));
    const topDates = ranked.slice(0, topCount).map(r => r.date);

    // slotValues[role][slotLabel] = one averaged value per top day that had readings for that
    // role during that slot - the population the IQR target range is drawn from.
    const slotValues: { [role: string]: { [slotLabel: string]: number[] } } = {};

    for (const dateStr of topDates) {
      const archiveRows = await fetchArchiveForDate(supabase, dateStr);
      if (archiveRows.length === 0) continue;

      const byRole = new Map<string, { hour: number; value: number }[]>();
      archiveRows.forEach(r => {
        if (!byRole.has(r.agro_role)) byRole.set(r.agro_role, []);
        // Local hour, not UTC - matches getStatsForTimeRange's semantics client-side
        // (app/dashboard/aranet/page.tsx) and getDayBounds' local-time day boundaries in
        // app/api/aranet/archive-daily/route.ts, both of which treat the server/browser's local
        // timezone as the greenhouse's timezone.
        byRole.get(r.agro_role)!.push({ hour: new Date(r.reading_time).getHours(), value: Number(r.value) });
      });

      byRole.forEach((readings, role) => {
        AGRO_TIME_SLOTS.forEach(slot => {
          const inSlot = readings.filter(r => isHourInSlot(r.hour, slot.start, slot.end));
          if (inSlot.length === 0) return;
          const avg = inSlot.reduce((s, r) => s + r.value, 0) / inSlot.length;
          if (!slotValues[role]) slotValues[role] = {};
          if (!slotValues[role][slot.label]) slotValues[role][slot.label] = [];
          slotValues[role][slot.label].push(avg);
        });
      });
    }

    const ranges: { [field: string]: { [slotLabel: string]: { min: number; max: number; sampleSize: number } } } = {};
    Object.entries(slotValues).forEach(([field, bySlot]) => {
      Object.entries(bySlot).forEach(([slotLabel, values]) => {
        if (values.length < MIN_FACTOR_SAMPLE_SIZE) return;
        const sorted = [...values].sort((a, b) => a - b);
        if (!ranges[field]) ranges[field] = {};
        ranges[field][slotLabel] = {
          min: Number(quantile(sorted, 0.25).toFixed(3)),
          max: Number(quantile(sorted, 0.75).toFixed(3)),
          sampleSize: values.length
        };
      });
    });

    return NextResponse.json({ ranges, insufficientData: false, sampleSize: summaryRows.length, topDaysCount: topDates.length });
  } catch (error: any) {
    console.error("agro-target-ranges error:", error);
    return NextResponse.json({ error: error.message || "Erreur de calcul des plages cibles." }, { status: 500 });
  }
}
