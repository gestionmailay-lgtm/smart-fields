-- Run this once in the Supabase SQL editor (Project > SQL Editor) for the Rawwin project.
-- Purpose: mirrors the currently-selected Priva sensors (fixed or custom catalog points) into
-- Supabase, so the daily archive cron - which has no access to browser state - knows which
-- variableId/deviceId to query on Priva's API and archive into aranet_daily_archive, the same
-- way aranet_selected_sensors already does for Aranet.

create table if not exists priva_selected_points (
  metric_key text primary key,
  variable_id text not null,
  device_id text not null,
  device_group_id text,
  updated_at timestamptz not null default now()
);

-- RLS: same single-tenant convention as the other archive/sync tables - only server-side code
-- with the service role key can read/write this table.
alter table priva_selected_points enable row level security;
