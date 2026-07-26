import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ roleKey: string }> }) {
  try {
    const { roleKey } = await params;
    const { label, category } = await req.json();
    if (!label && !category) {
      return NextResponse.json({ error: "label ou category requis." }, { status: 400 });
    }

    const updates: { label?: string; category?: string } = {};
    if (label) updates.label = label;
    if (category) updates.category = category;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agro_roles")
      .update(updates)
      .eq("role_key", roleKey)
      .select("role_key, label, category")
      .single();
    if (error) throw error;
    return NextResponse.json({ role: data });
  } catch (error: any) {
    console.error("agro-roles PATCH error:", error);
    return NextResponse.json({ error: error.message || "Erreur de mise à jour du rôle." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ roleKey: string }> }) {
  try {
    const { roleKey } = await params;
    const supabase = createAdminClient();
    // Deleting a role from the catalog doesn't touch aranet_metric_roles - a sensor still tagged
    // with a since-deleted role just stops appearing nicely labeled/selectable; nothing breaks
    // (see plan: no referential integrity enforced here, this is an internal admin tool).
    const { error } = await supabase.from("agro_roles").delete().eq("role_key", roleKey);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("agro-roles DELETE error:", error);
    return NextResponse.json({ error: error.message || "Erreur de suppression du rôle." }, { status: 500 });
  }
}
