import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Lets the browser pull already-archived readings (aranet_daily_archive, written nightly by
// /api/aranet/archive-daily) for whichever metric keys and date range it needs - used by the
// Analyseur Agronomique tab to backfill Priva-sourced sensors past Priva's ~5-day live rolling
// window, which fetchDataForRange (page.tsx) can't reach directly. RLS on aranet_daily_archive
// has no public policy (see supabase_migrations/001_aranet_archive.sql), so this route runs with
// the service role client on the browser's behalf rather than exposing the table directly.
export async function GET(req: NextRequest) {
  try {
    const metricKeysParam = req.nextUrl.searchParams.get("metricKeys");
    const startDate = req.nextUrl.searchParams.get("startDate");
    const endDate = req.nextUrl.searchParams.get("endDate");
    if (!metricKeysParam || !startDate || !endDate) {
      return NextResponse.json({ error: "metricKeys, startDate et endDate sont requis." }, { status: 400 });
    }

    const metricKeys = metricKeysParam.split(",").map(k => k.trim()).filter(Boolean);
    const byKey: { [key: string]: { time: string; value: number }[] } = {};
    metricKeys.forEach(k => { byKey[k] = []; });
    if (metricKeys.length === 0) {
      return NextResponse.json({ success: true, data: byKey });
    }

    const supabase = createAdminClient();

    // PostgREST caps rows per request (1000 by default) - a multi-week, multi-sensor range can
    // easily exceed that, same pagination pattern as computeAndUpsertAgroSummary in archive-daily.
    const PAGE_SIZE = 1000;
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page, error } = await supabase
        .from("aranet_daily_archive")
        .select("metric_key, reading_time, value")
        .in("metric_key", metricKeys)
        .gte("archived_for_date", startDate)
        .lte("archived_for_date", endDate)
        .order("reading_time", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!page || page.length === 0) break;
      page.forEach(row => {
        (byKey[row.metric_key] ||= []).push({ time: row.reading_time, value: Number(row.value) });
      });
      if (page.length < PAGE_SIZE) break;
    }

    return NextResponse.json({ success: true, data: byKey });
  } catch (error: any) {
    console.error("archive-read error:", error);
    return NextResponse.json({ error: error.message || "Erreur de lecture d'archive." }, { status: 500 });
  }
}
