-- Run this once in the Supabase SQL editor (Project > SQL Editor) for the Smart Fields project.
-- Purpose: daily 1-minute-resolution archive of the Aranet sensors currently selected in the
-- Climat/Croissance and Ferti Irrigation tabs, so historical data survives even if Aranet's
-- API rate limits or retention window would otherwise cause it to be lost.

-- 1. Which sensors are currently selected (mirrors the browser's selectedKeys/fertiSelectedKeys,
--    written by the app so the daily cron job - which has no access to browser localStorage -
--    knows what to fetch and archive).
create table if not exists aranet_selected_sensors (
  scope text not null check (scope in ('climat_croissance', 'ferti_irrigation')),
  metric_key text not null,
  updated_at timestamptz not null default now(),
  primary key (scope, metric_key)
);

-- 2. The archived readings themselves, one row per sensor per minute.
create table if not exists aranet_daily_archive (
  id bigint generated always as identity primary key,
  metric_key text not null,
  reading_time timestamptz not null,
  value numeric not null,
  unit text,
  archived_for_date date not null,
  created_at timestamptz not null default now(),
  unique (metric_key, reading_time)
);

create index if not exists idx_aranet_daily_archive_date on aranet_daily_archive (archived_for_date);
create index if not exists idx_aranet_daily_archive_metric on aranet_daily_archive (metric_key, reading_time);

-- RLS: this app is single-tenant (one greenhouse), and the archive/selection tables are only
-- ever written by the server-side cron route (using the service role key, which bypasses RLS)
-- and read by the app's server routes. Enable RLS but do not add a public policy, so anon/authenticated
-- clients cannot read or write these tables directly - only server-side code with the service role key can.
alter table aranet_selected_sensors enable row level security;
alter table aranet_daily_archive enable row level security;
