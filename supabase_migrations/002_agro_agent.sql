-- Run this once in the Supabase SQL editor (Project > SQL Editor) for the Rawwin project.
-- Purpose: persistent backbone for the agronomic AI agent - a growing history of daily
-- growth/climate summaries, statistical correlations computed on that history, and a
-- bibliographic knowledge base (uploaded literature, chunked + embedded) so the agent's
-- explanations are grounded in measured correlations and cited sources instead of only the
-- model's general knowledge.

create extension if not exists vector;

-- 1. One row per calendar date: the same day-summary shape already computed client-side in
--    app/dashboard/aranet/page.tsx (dynamicAgronomicData) - actualGain, radiationSumJcm2,
--    growthEfficiency, and the climate/substrate averages object. Growing this table over time
--    (each time the Analyseur Agronomique tab is opened with data loaded) is what lets the
--    correlation engine "learn" instead of re-analyzing every day from scratch.
create table if not exists agro_daily_summary (
  date date primary key,
  actual_gain numeric,
  radiation_sum_jcm2 numeric,
  growth_efficiency numeric,
  climate jsonb not null default '{}'::jsonb,
  drops jsonb not null default '[]'::jsonb,
  rule_based_findings jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Correlation coefficients between each climate/substrate factor (keys of the `climate`
--    jsonb above, e.g. "radAvg", plus a 1-day-lagged variant "radAvg_lag1") and actual_gain,
--    recomputed periodically from agro_daily_summary. This is what makes the agent's reasoning
--    verifiable ("r=0.62 on 34 days") instead of an LLM guess.
create table if not exists agro_correlations (
  id bigint generated always as identity primary key,
  factor_key text not null,
  target text not null default 'actual_gain',
  method text not null default 'pearson',
  coefficient numeric not null,
  sample_size int not null,
  computed_at timestamptz not null default now(),
  unique (factor_key, target, method)
);

-- 3. Uploaded agronomic literature (greenhouse tomato physiology references etc.) - metadata
--    + ingestion status. Mirrors the greenhouse_imports/greenhouse-docs pattern in
--    app/dashboard/serres/parametrage/page.tsx, but supports many documents instead of one
--    per doc_type, since this is a growing bibliographic corpus, not a fixed set of forms.
create table if not exists agro_literature_docs (
  id bigint generated always as identity primary key,
  file_name text not null,
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'error')),
  error_message text,
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz
);

-- 4. Chunked + embedded literature content for retrieval-augmented grounding. Embedding
--    dimension matches Gemini's text-embedding-004 model (768).
create table if not exists agro_literature_chunks (
  id bigint generated always as identity primary key,
  doc_id bigint not null references agro_literature_docs (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  page_ref int,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists idx_agro_literature_chunks_doc on agro_literature_chunks (doc_id);
create index if not exists idx_agro_literature_chunks_embedding
  on agro_literature_chunks using hnsw (embedding vector_cosine_ops);

-- Vector similarity search isn't expressible through the standard PostgREST filter builder -
-- Supabase clients call this via .rpc('match_agro_literature', ...) instead.
create or replace function match_agro_literature(query_embedding vector(768), match_count int default 6)
returns table (
  id bigint,
  doc_id bigint,
  content text,
  page_ref int,
  file_name text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.doc_id,
    c.content,
    c.page_ref,
    d.file_name,
    1 - (c.embedding <=> query_embedding) as similarity
  from agro_literature_chunks c
  join agro_literature_docs d on d.id = c.doc_id
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- RLS: same single-tenant convention as aranet_daily_archive/aranet_selected_sensors - this
-- app runs one greenhouse. All of these tables are only ever written/read by server-side
-- routes using the service role key (which bypasses RLS); enable RLS but add no public policy
-- so anon/authenticated clients cannot read or write them directly.
alter table agro_daily_summary enable row level security;
alter table agro_correlations enable row level security;
alter table agro_literature_docs enable row level security;
alter table agro_literature_chunks enable row level security;

-- Private storage bucket for uploaded literature PDFs, written only by server-side routes
-- (service role), same access model as the tables above.
insert into storage.buckets (id, name, public)
values ('agro-literature', 'agro-literature', false)
on conflict (id) do nothing;
