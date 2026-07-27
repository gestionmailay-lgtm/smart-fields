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

    // An empty payload here almost never means "the user untagged every single sensor" - far
    // more likely it means metricConfigs hadn't loaded yet in whatever browser/session sent it
    // (fresh browser, cleared cache, private window with no localStorage). A blind
    // delete-then-insert would wipe every previously saved role tag in that case - which is
    // exactly what happened once already (aranet_metric_roles found empty in production despite
    // roles having been configured). So an empty roles[] is now a no-op: nothing is deleted,
    // nothing is inserted. Removing a role tag one at a time still works fine, since that only
    // shrinks the array - it doesn't require going through empty.
    if (rows.length === 0) {
      return NextResponse.json({ success: true, count: 0, skipped: true });
    }

    // Replace the full set (delete-then-insert), same pattern as
    // app/api/aranet/selected-sensors/route.ts - keeps stale tags from lingering after a sensor
    // is retagged or reset to "Aucun (Auto)".
    const { error: deleteError } = await supabase.from("aranet_metric_roles").delete().neq("metric_key", "");
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase.from("aranet_metric_roles").insert(rows);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    console.error("metric-roles sync error:", error);
    return NextResponse.json({ error: error.message || "Erreur de synchronisation." }, { status: 500 });
  }
}
