import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Single source of truth for greenhouse-wide technical parameters (culture in place, its
// typology, glass translucidity) - read by both the dashboard (app/dashboard/aranet/page.tsx,
// "Paramètres Techniques de la Serre" card) and the unattended nightly cron
// (app/api/aranet/archive-daily/route.ts), which has no access to browser state. Always exactly
// one row (id=1, enforced by a check constraint - see supabase_migrations/007_greenhouse_settings.sql).

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agro_greenhouse_settings")
      .select("culture, culture_typology, culture_variety, glass_translucidity_percent")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      const { data: created, error: insertError } = await supabase
        .from("agro_greenhouse_settings")
        .insert({ id: 1 })
        .select("culture, culture_typology, culture_variety, glass_translucidity_percent")
        .single();
      if (insertError) throw insertError;
      return NextResponse.json({ settings: created });
    }

    return NextResponse.json({ settings: data });
  } catch (error: any) {
    console.error("greenhouse-settings GET error:", error);
    return NextResponse.json({ error: error.message || "Erreur de chargement des paramètres." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const update: { culture?: string | null; culture_typology?: string | null; culture_variety?: string | null; glass_translucidity_percent?: number | null } = {};
    if ("culture" in body) update.culture = body.culture ?? null;
    if ("cultureTypology" in body) update.culture_typology = body.cultureTypology ?? null;
    if ("cultureVariety" in body) update.culture_variety = body.cultureVariety ?? null;
    if ("glassTranslucidityPercent" in body) {
      const v = body.glassTranslucidityPercent;
      update.glass_translucidity_percent = (v === null || v === undefined || v === "") ? null : Number(v);
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agro_greenhouse_settings")
      .upsert({ id: 1, ...update, updated_at: new Date().toISOString() }, { onConflict: "id" })
      .select("culture, culture_typology, culture_variety, glass_translucidity_percent")
      .single();
    if (error) throw error;

    return NextResponse.json({ settings: data });
  } catch (error: any) {
    console.error("greenhouse-settings PATCH error:", error);
    return NextResponse.json({ error: error.message || "Erreur de mise à jour des paramètres." }, { status: 500 });
  }
}
