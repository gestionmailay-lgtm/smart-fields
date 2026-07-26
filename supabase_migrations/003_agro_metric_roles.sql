-- Run this once in the Supabase SQL editor (Project > SQL Editor) for the Rawwin project.
-- Purpose: mirrors each Aranet sensor's "Rôle Agronomique" tag (metricConfigs[key].agroRole in
-- app/dashboard/aranet/page.tsx) into Supabase, so the daily archive cron job - which has no
-- access to browser state - knows which archived sensor is "temperature serre", "radiation
-- cumulée", etc. and can compute agro_daily_summary automatically every night instead of only
-- when a human opens the Analyseur Agronomique tab.

create table if not exists aranet_metric_roles (
  metric_key text primary key,
  agro_role text not null,
  updated_at timestamptz not null default now()
);

-- RLS: same single-tenant convention as aranet_selected_sensors - only server-side code with
-- the service role key can read/write this table.
alter table aranet_metric_roles enable row level security;
