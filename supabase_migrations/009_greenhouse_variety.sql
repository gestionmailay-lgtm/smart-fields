-- Run this once (see AGENTS.md session history) - adds the crop variety alongside the existing
-- culture/culture_typology in agro_greenhouse_settings, needed to eventually fit the VPD growth
-- sensitivity regression (Efficience Photosynthétique tab) per variety rather than per greenhouse.

alter table agro_greenhouse_settings add column if not exists culture_variety text;

alter table agro_daily_summary add column if not exists culture_variety text;
