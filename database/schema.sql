-- ============================================================================
-- EchoChaos — database schema
--
-- IMPORTANT: This schema intentionally holds only persistent GAME
-- CONFIGURATION (categories, challenges, default settings). It never stores
-- user accounts, emails, passwords, or player recordings. Live game/room
-- state (players, scores, round progress) lives only in the Node server's
-- memory — see server/src/rooms/RoomManager.ts — and disappears when a room
-- ends. This is by design (see README "No Account Database").
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists categories (
  id text primary key,              -- e.g. 'animals'
  label text not null,               -- e.g. 'Animals'
  sort_order int not null default 0
);

create table if not exists challenges (
  id text primary key,               -- e.g. 'an-cat'
  name text not null,
  category_id text not null references categories(id) on delete cascade,
  difficulty smallint not null check (difficulty between 1 and 3),
  audio_path text not null,          -- path within the Supabase Storage bucket, e.g. 'animals/cat.mp3'
  duration_seconds numeric not null,
  tags text[] not null default '{}',
  emoji text not null default '❓',
  created_at timestamptz not null default now()
);

create index if not exists idx_challenges_category on challenges(category_id);

-- Optional: named settings presets a host could pick from (not required by
-- the v1 game, which stores per-room settings in memory only).
create table if not exists settings_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rounds smallint not null default 10,
  difficulty text not null default 'mixed' check (difficulty in ('easy', 'mixed', 'hard')),
  round_timer_seconds smallint not null default 10,
  random_events boolean not null default true,
  created_at timestamptz not null default now()
);

-- Row Level Security: this data is public read-only game content, never
-- user-specific, so anonymous read access is safe. Writes should only ever
-- happen via the service-role key (e.g. an admin seeding script), never from
-- the browser.
alter table categories enable row level security;
alter table challenges enable row level security;
alter table settings_presets enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read challenges" on challenges for select using (true);
create policy "public read settings_presets" on settings_presets for select using (true);
-- No insert/update/delete policies are defined for the anon role, so those
-- operations are only possible with the service_role key from the server.
