"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, RefreshCw, Tag } from "lucide-react";

interface AgroRole {
  role_key: string;
  label: string;
  category: string;
}

// Admin screen for the agronomic role catalog (agro_roles) - deliberately a separate page, not
// a tab in the main dashboard, same reasoning as pulling the Compartiment selector out of the
// tab group: this is a configuration screen, not a data view, and shouldn't read as "one more
// tab" among Climat/Croissance, Ferti Irrigation, etc. Every role defined here becomes an option
// in the "Rôle Agronomique" dropdown (Sélection des données) and the key used to homogenize
// archived data (aranet_daily_archive.agro_role) and the agent's analysis vocabulary.
export default function AgroRolesAdminPage() {
  const [roles, setRoles] = useState<AgroRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ [roleKey: string]: { label: string; category: string } }>({});
  const [saving, setSaving] = useState<{ [roleKey: string]: boolean }>({});

  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRoleKey, setNewRoleKey] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agro-roles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement.");
      setRoles(data.roles || []);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreate = async () => {
    if (!newLabel.trim() || !newCategory.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/agro-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey: newRoleKey || newLabel, label: newLabel, category: newCategory })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de création.");
      setNewLabel("");
      setNewCategory("");
      setNewRoleKey("");
      await fetchRoles();
    } catch (e: any) {
      setError(e.message || "Erreur de création.");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (roleKey: string) => {
    const draft = editing[roleKey];
    if (!draft) return;
    setSaving(prev => ({ ...prev, [roleKey]: true }));
    setError(null);
    try {
      const res = await fetch(`/api/agro-roles/${encodeURIComponent(roleKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: draft.label, category: draft.category })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour.");
      setEditing(prev => {
        const next = { ...prev };
        delete next[roleKey];
        return next;
      });
      await fetchRoles();
    } catch (e: any) {
      setError(e.message || "Erreur de mise à jour.");
    } finally {
      setSaving(prev => ({ ...prev, [roleKey]: false }));
    }
  };

  const handleDelete = async (roleKey: string) => {
    setSaving(prev => ({ ...prev, [roleKey]: true }));
    setError(null);
    try {
      const res = await fetch(`/api/agro-roles/${encodeURIComponent(roleKey)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de suppression.");
      await fetchRoles();
    } catch (e: any) {
      setError(e.message || "Erreur de suppression.");
    } finally {
      setSaving(prev => ({ ...prev, [roleKey]: false }));
    }
  };

  const grouped: { [category: string]: AgroRole[] } = {};
  roles.forEach(r => {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/10">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background px-4 shadow-sm shrink-0">
        <Link href="/dashboard/aranet" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <ArrowLeft className="h-4.5 w-4.5 text-primary" />
          </div>
        </Link>
        <span className="text-xs text-muted-foreground">/</span>
        <h1 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
          <Tag className="h-4.5 w-4.5 text-primary" /> Rôles Agronomiques
        </h1>
        <Button variant="ghost" size="icon" onClick={fetchRoles} disabled={loading} className="h-8 w-8 ml-auto">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <p className="text-xs text-muted-foreground">
          Cette liste alimente le menu déroulant &quot;Rôle Agronomique&quot; (onglet Sélection des données) et sert de vocabulaire commun à toute l&apos;analyse - archive, corrélations, plages cibles, conseils IA.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
            {error}
          </div>
        )}

        <Card className="border border-muted-foreground/15 shadow-sm rounded-2xl">
          <CardHeader className="p-4 pb-2 border-b bg-muted/5">
            <CardTitle className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" /> Ajouter un rôle
            </CardTitle>
            <CardDescription className="text-[10px]">La clé technique est dérivée automatiquement du libellé si vous ne la précisez pas.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Libellé (ex: EC pain)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="border rounded-xl px-3 py-1.5 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-9"
            />
            <input
              type="text"
              placeholder="Catégorie (ex: Ferti Irrigation)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="border rounded-xl px-3 py-1.5 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-9"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="clé_technique (optionnel)"
                value={newRoleKey}
                onChange={(e) => setNewRoleKey(e.target.value)}
                className="border rounded-xl px-3 py-1.5 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-9 flex-1 min-w-0"
              />
              <Button
                size="sm"
                disabled={creating || !newLabel.trim() || !newCategory.trim()}
                onClick={handleCreate}
                className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase h-9 px-3 rounded-xl shadow-sm shrink-0"
              >
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-10 text-xs text-muted-foreground font-semibold">Chargement...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground font-semibold">Aucun rôle défini.</div>
        ) : (
          Object.entries(grouped).map(([category, categoryRoles]) => (
            <Card key={category} className="border border-muted-foreground/15 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b bg-muted/5">
                <CardTitle className="text-xs font-black uppercase tracking-tight text-primary">{category}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {categoryRoles.map(role => {
                  const draft = editing[role.role_key];
                  const isSaving = !!saving[role.role_key];
                  return (
                    <div key={role.role_key} className="flex items-center gap-2 p-3 border-b last:border-0 border-muted/20">
                      <input
                        type="text"
                        value={draft ? draft.label : role.label}
                        onChange={(e) => setEditing(prev => ({ ...prev, [role.role_key]: { label: e.target.value, category: prev[role.role_key]?.category ?? role.category } }))}
                        className="flex-1 min-w-0 border rounded-lg px-2.5 py-1 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                      />
                      <input
                        type="text"
                        value={draft ? draft.category : role.category}
                        onChange={(e) => setEditing(prev => ({ ...prev, [role.role_key]: { label: prev[role.role_key]?.label ?? role.label, category: e.target.value } }))}
                        className="w-40 shrink-0 border rounded-lg px-2.5 py-1 text-[10px] font-semibold text-muted-foreground bg-background focus:outline-none focus:ring-1 focus:ring-primary h-8"
                      />
                      <span className="text-[9px] font-mono text-muted-foreground/70 shrink-0 hidden sm:inline">{role.role_key}</span>
                      {draft && (
                        <Button
                          size="xs"
                          disabled={isSaving}
                          onClick={() => handleSave(role.role_key)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase h-8 px-2.5 rounded-lg shrink-0"
                        >
                          Sauver
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isSaving}
                        onClick={() => handleDelete(role.role_key)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
