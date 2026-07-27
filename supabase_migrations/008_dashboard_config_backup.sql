-- Run this once (or via direct Postgres access, see AGENTS.md session history) for the
-- Smart Fields project.
-- Purpose: automatic server-side backup of the "Sélection des données" configuration
-- (selected sensors for Climat/Croissance and Ferti Irrigation, their agro roles/axis/color/
-- smoothing settings, custom Priva points, physiological parameters). Today this configuration
-- lives only in the browser's localStorage - if a user reconfigures everything in one browser
-- and later opens the dashboard from a different browser/session (cleared cache, private
-- window, another machine), it looks entirely wiped even though nothing was actually deleted
-- anywhere - the state simply never existed outside that one browser. A single automatically-
-- maintained backup row lets a fresh browser recover the last known-good configuration instead
-- of falling back to hardcoded factory defaults.

create table if not exists aranet_dashboard_config (
  id smallint primary key default 1 check (id = 1),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into aranet_dashboard_config (id) values (1) on conflict (id) do nothing;

alter table aranet_dashboard_config enable row level security;
