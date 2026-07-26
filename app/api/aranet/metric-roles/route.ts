import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Mirrors the browser-only "Rôle Agronomique" tags (metricConfigs[key].agroRole in
// app/dashboard/aranet/page.tsx) into Supabase, so the daily archive cron job - which has no
// access to localStorage/React state - knows which archived sensor plays which role
// (temp_serre, radiation_sum, etc.) when computing agro_daily_summary automatically.
export async function POST(req: NextRequest) {
  try {
    const { roles } = await req.json();
    if (!Array.isArray(roles)) {
      return NextResponse.json({ error: "roles must be an array." }, { status: 400 });
    }

    const rows = roles
      .filter((r: any) => r && typeof r.metricKey === "string" && typeof r.agroRole === "string" && r.agroRole !== "none")
      .map((r: any) => ({ metric_key: r.metricKey, agro_role: r.agroRole, updated_at: new Date().toISOString() }));

    const supabase = createAdminClient();

    // Replace the full set (delete-then-insert), same pattern as
    // app/api/aranet/selected-sensors/route.ts - keeps stale tags from lingering after a sensor
    // is retagged or reset to "Aucun (Auto)".
    const { error: deleteError } = await supabase.from("aranet_metric_roles").delete().neq("metric_key", "");
    if (deleteError) throw deleteError;

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("aranet_metric_roles").insert(rows);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    console.error("metric-roles sync error:", error);
    return NextResponse.json({ error: error.message || "Erreur de synchronisation." }, { status: 500 });
  }
}
