-- YouRanking — v1 schema
-- Run this in the Supabase SQL editor.
-- Solo build: keep it simple. Add per-user columns + RLS when you go public.

create extension if not exists "pgcrypto";

-- Idea Bank: capture from Title Lab now, from the extension later.
create table if not exists ideas (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  note        text,
  source_url  text,
  created_at  timestamptz not null default now()
);

-- Saved title sets (Packaging Lab history) — ready for when you wire it.
create table if not exists title_sets (
  id          uuid primary key default gen_random_uuid(),
  topic       text not null,
  titles      jsonb not null,        -- [{title,score,reason,length}]
  created_at  timestamptz not null default now()
);

-- Keyword lists (Keyword Research workspace) — ready for v1.x.
create table if not exists keyword_lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  keywords    jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- ── GOING PUBLIC LATER ──────────────────────────────────────────
-- 1. add  user_id uuid references auth.users  to every table
-- 2. enable RLS:        alter table ideas enable row level security;
-- 3. add policy:        create policy own_rows on ideas
--                         using (user_id = auth.uid());
-- Until then, the service role key handles access server-side.

-- Settings: provider API keys managed from the Settings page.
-- Stored server-side; the app only ever returns a masked preview.
-- (Supabase's own creds stay in env — can't store them in here.)
create table if not exists settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

-- View-velocity tracking: snapshot a video's views over time.
create table if not exists tracked_videos (
  id          text primary key,        -- youtube video id
  title       text,
  channel     text,
  thumb       text,
  added_at    timestamptz not null default now()
);
create table if not exists video_snapshots (
  id          uuid primary key default gen_random_uuid(),
  video_id    text not null references tracked_videos(id) on delete cascade,
  views       bigint not null,
  taken_at    timestamptz not null default now()
);
create index if not exists idx_snap_video on video_snapshots(video_id, taken_at);
