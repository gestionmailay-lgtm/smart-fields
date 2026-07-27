import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Automatic server-side backup of the "Sélection des données" configuration (selected
// sensors, agro roles/axis/color/smoothing per sensor, custom Priva points, physiological
// parameters) - see supabase_migrations/008_dashboard_config_backup.sql. Always exactly one
// row (id=1). The browser is still the primary, instant source of truth via localStorage; this
// is only consulted when a browser has none (fresh browser, cleared cache, private window), so
// that configuration doesn't have to be redone by hand there.

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("aranet_dashboard_config")
      .select("config")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ config: data?.config || null });
  } catch (error: any) {
    console.error("dashboard-config GET error:", error);
    return NextResponse.json({ error: error.message || "Erreur de chargement de la sauvegarde." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { config } = await req.json();
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      return NextResponse.json({ error: "config must be an object." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("aranet_dashboard_config")
      .upsert({ id: 1, config, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("dashboard-config PUT error:", error);
    return NextResponse.json({ error: error.message || "Erreur de sauvegarde." }, { status: 500 });
  }
}
