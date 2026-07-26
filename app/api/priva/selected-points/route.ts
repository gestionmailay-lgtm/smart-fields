import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Mirrors the browser-only selection of Priva sensors (fixed PLOTTABLE_METRICS entries or
// custom catalog points, both carry variableId/deviceId/deviceGroupId in app/dashboard/aranet/
// page.tsx's allMetrics) into Supabase, so the daily archive cron - which has no access to
// localStorage/React state - knows which Priva points to query and archive.
export async function POST(req: NextRequest) {
  try {
    const { points } = await req.json();
    if (!Array.isArray(points)) {
      return NextResponse.json({ error: "points must be an array." }, { status: 400 });
    }

    const rows = points
      .filter((p: any) => p && typeof p.metricKey === "string" && typeof p.variableId === "string" && typeof p.deviceId === "string")
      .map((p: any) => ({
        metric_key: p.metricKey,
        variable_id: p.variableId,
        device_id: p.deviceId,
        device_group_id: p.deviceGroupId || null,
        updated_at: new Date().toISOString()
      }));

    const supabase = createAdminClient();

    // Replace the full set (delete-then-insert), same pattern as
    // app/api/aranet/selected-sensors/route.ts and app/api/aranet/metric-roles/route.ts.
    const { error: deleteError } = await supabase.from("priva_selected_points").delete().neq("metric_key", "");
    if (deleteError) throw deleteError;

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("priva_selected_points").insert(rows);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    console.error("priva selected-points sync error:", error);
    return NextResponse.json({ error: error.message || "Erreur de synchronisation." }, { status: 500 });
  }
}
