-- CineMatch Milestone 5 — Initial schema
-- Apply with: supabase db push

-- ── favorites ───────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  movie_id    integer     not null,
  title       text        not null,
  poster_path text,
  added_at    timestamptz default now(),
  primary key (user_id, movie_id)
);

-- ── search_history ──────────────────────────────────────────────────────────
create table if not exists public.search_history (
  id          bigserial   primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  query       text        not null check (length(query) <= 200),
  searched_at timestamptz default now()
);

-- ── movie_cache ─────────────────────────────────────────────────────────────
-- Shared TMDB metadata cache; public read, service-role write only.
create table if not exists public.movie_cache (
  movie_id    integer     primary key,
  payload     jsonb       not null,
  fetched_at  timestamptz default now()
);

-- ── Enable RLS ───────────────────────────────────────────────────────────────
alter table public.favorites      enable row level security;
alter table public.search_history enable row level security;
alter table public.movie_cache    enable row level security;

-- ── favorites policies ───────────────────────────────────────────────────────
create policy "favorites: select own" on public.favorites
  for select using (auth.uid() = user_id);

create policy "favorites: insert own" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "favorites: delete own" on public.favorites
  for delete using (auth.uid() = user_id);

-- ── search_history policies ──────────────────────────────────────────────────
create policy "history: select own" on public.search_history
  for select using (auth.uid() = user_id);

create policy "history: insert own" on public.search_history
  for insert with check (auth.uid() = user_id);

-- ── movie_cache policies ─────────────────────────────────────────────────────
-- Read-only for all authenticated and anonymous users.
-- Writes require service_role (bypasses RLS — no insert policy needed).
create policy "cache: read all" on public.movie_cache
  for select using (true);

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists favorites_user_id_idx   on public.favorites (user_id);
create index if not exists search_history_user_idx on public.search_history (user_id);
create index if not exists search_history_time_idx on public.search_history (searched_at desc);
