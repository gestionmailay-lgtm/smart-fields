import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Mirrors the browser-only selectedKeys (Climat/Croissance) and fertiSelectedKeys (Ferti
// Irrigation) into Supabase, so the daily archive cron job - which has no access to
// localStorage - knows which Aranet sensors to fetch and save for the current selection.
export async function POST(req: NextRequest) {
  try {
    const { scope, metricKeys } = await req.json();
    if (scope !== "climat_croissance" && scope !== "ferti_irrigation") {
      return NextResponse.json({ error: "Invalid scope." }, { status: 400 });
    }
    if (!Array.isArray(metricKeys)) {
      return NextResponse.json({ error: "metricKeys must be an array." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Same protection as app/api/aranet/metric-roles/route.ts and
    // app/api/priva/selected-points/route.ts: an empty metricKeys[] almost always means the
    // sending browser/session hadn't loaded its selection yet, not that the user genuinely
    // deselected every sensor for this scope - treat it as a no-op instead of wiping the scope.
    if (metricKeys.length === 0) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Replace this scope's full selection (delete-then-insert keeps it simple and avoids
    // stale sensors lingering after the user deselects them).
    const { error: deleteError } = await supabase
      .from("aranet_selected_sensors")
      .delete()
      .eq("scope", scope);
    if (deleteError) throw deleteError;

    const rows = metricKeys.map((metric_key: string) => ({ scope, metric_key, updated_at: new Date().toISOString() }));
    const { error: insertError } = await supabase.from("aranet_selected_sensors").insert(rows);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("selected-sensors sync error:", error);
    return NextResponse.json({ error: error.message || "Erreur de synchronisation." }, { status: 500 });
  }
}
