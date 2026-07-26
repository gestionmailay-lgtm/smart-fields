import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Canonical, admin-editable catalog of agronomic roles - the source of truth for the "Rôle
// Agronomique" dropdown in app/dashboard/aranet/page.tsx (Sélection des données) and for
// display labels across the agent (formatAgroFactorLabel, lib/agroFactorLabels.ts). Distinct
// from aranet_metric_roles, which is the assignment of a role to a specific sensor - this table
// is just the list of roles that exist at all.
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agro_roles")
      .select("role_key, label, category")
      .order("category", { ascending: true })
      .order("label", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ roles: data || [] });
  } catch (error: any) {
    console.error("agro-roles GET error:", error);
    return NextResponse.json({ error: error.message || "Erreur de chargement des rôles." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { roleKey, label, category } = await req.json();
    if (!roleKey || !label || !category) {
      return NextResponse.json({ error: "roleKey, label et category sont requis." }, { status: 400 });
    }
    // Same slug convention as the existing hardcoded roles (snake_case).
    const normalizedKey = String(roleKey).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!normalizedKey) {
      return NextResponse.json({ error: "roleKey invalide." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agro_roles")
      .insert({ role_key: normalizedKey, label, category })
      .select("role_key, label, category")
      .single();
    if (error) throw error;
    return NextResponse.json({ role: data });
  } catch (error: any) {
    console.error("agro-roles POST error:", error);
    return NextResponse.json({ error: error.message || "Erreur de création du rôle." }, { status: 500 });
  }
}
