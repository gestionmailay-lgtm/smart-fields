-- Run this once (or via direct Postgres access, see AGENTS.md session history) for the
-- Smart Fields project.
-- Purpose: tag each archived reading with its compartment number (1-6), not just its
-- agronomic role - two sensors in different compartments can share the same role (e.g. two
-- "temp_serre" sensors, one per Priva compartment) and were not distinguishable in the raw
-- archive before this. Foundation for a future per-compartment breakdown; existing aggregations
-- (correlations, target ranges) stay serre-wide for now (see plan).

alter table aranet_daily_archive add column if not exists compartment text;
create index if not exists idx_aranet_daily_archive_role_compartment
  on aranet_daily_archive (agro_role, compartment, archived_for_date);
