-- Run this once (or via direct Postgres access, see AGENTS.md session history) for the
-- Smart Fields project.
-- Purpose: a single source of truth for greenhouse-wide technical parameters (which crop is in
-- place, its typology, glass translucidity) that both the browser dashboard and the unattended
-- nightly cron (app/api/aranet/archive-daily/route.ts) need to read - the cron has no access to
-- browser state, so these can't just live in client-side localStorage the way plantsOnScale/
-- densityPerM2 do today.
--
-- Named agro_greenhouse_settings (not greenhouse_settings) because a table of that name already
-- exists for the unrelated Serres gas-market/cost module (per-user, user_id-keyed) - kept
-- separate rather than reusing/renaming it.

create table if not exists agro_greenhouse_settings (
  id smallint primary key default 1 check (id = 1),
  culture text,
  culture_typology text,
  glass_translucidity_percent numeric,
  updated_at timestamptz not null default now()
);

insert into agro_greenhouse_settings (id) values (1) on conflict (id) do nothing;

alter table agro_greenhouse_settings enable row level security;

-- Historized alongside the rest of the day's summary (climate, actual_gain, etc.) so a
-- correlation/analysis pass can see what crop/typology/translucidity was in place that day.
alter table agro_daily_summary add column if not exists culture text;
alter table agro_daily_summary add column if not exists culture_typology text;
alter table agro_daily_summary add column if not exists glass_translucidity_percent numeric;
