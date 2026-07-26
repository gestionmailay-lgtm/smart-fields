-- Run this once in the Supabase SQL editor (Project > SQL Editor) for the Smart Fields project.
-- Purpose: (1) a canonical, admin-editable catalog of agronomic roles (replaces the hardcoded
-- <option> list in app/dashboard/aranet/page.tsx's "Rôle Agronomique" dropdown), and (2) tags
-- each archived reading with its resolved role at write time, so the raw archive is directly
-- interpretable without cross-referencing aranet_metric_roles - the foundation for a future
-- cross-grower model where sensor names differ per installation but roles don't.

create table if not exists agro_roles (
  role_key text primary key,
  label text not null,
  category text not null,
  created_at timestamptz not null default now()
);

alter table agro_roles enable row level security;

alter table aranet_daily_archive add column if not exists agro_role text;
create index if not exists idx_aranet_daily_archive_role on aranet_daily_archive (agro_role, archived_for_date);

insert into agro_roles (role_key, label, category) values
  ('co2', 'CO2', 'Climat / Croissance'),
  ('forecast', 'Forecas', 'Climat / Croissance'),
  ('gros_tuyau', 'Gros tuyau', 'Climat / Croissance'),
  ('hr_exterieure', 'HR extérieure', 'Climat / Croissance'),
  ('hr_serre', 'HR serre', 'Climat / Croissance'),
  ('pluie', 'Pluie', 'Climat / Croissance'),
  ('position_chassis_abrite', 'Position chassis abrité', 'Climat / Croissance'),
  ('position_chassis_expose', 'Position chassis exposé', 'Climat / Croissance'),
  ('radiation_instantanee', 'Radiation instantannée', 'Climat / Croissance'),
  ('radiation_sum', 'Somme de radiation', 'Climat / Croissance'),
  ('temp_exterieure', 'T°C extérieure', 'Climat / Croissance'),
  ('temp_serre', 'T°C serre', 'Climat / Croissance'),
  ('vitesse_vent', 'Vitesse du vent', 'Climat / Croissance'),
  ('vpd_haut', 'VPD Haut', 'Climat / Croissance'),
  ('gain_cumule', 'Gain cumulé', 'Physiologie'),
  ('poids_total_plante', 'Poids total de plante', 'Physiologie'),
  ('ec_pain', 'EC pain', 'Ferti Irrigation'),
  ('poids_pain', 'Poids du pain', 'Ferti Irrigation'),
  ('consommation_eau', 'Consommation d''eau', 'Ferti Irrigation'),
  ('temp_pain', 'T°C pain', 'Ferti Irrigation'),
  ('humidite_pain', 'Humidité du pain', 'Ferti Irrigation')
on conflict (role_key) do nothing;
