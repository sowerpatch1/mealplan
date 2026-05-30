-- Run this in: https://app.supabase.com → Your Project → SQL Editor → New query

-- ── recipes table ──────────────────────────────────────────────────────────────
create table if not exists recipes (
  id                   text primary key,
  title                text not null,
  url                  text,
  meal                 text[] not null default '{}',
  notes                text,
  ingredients          jsonb default '[]',
  steps                jsonb default '[]',
  nutrition_per_serving jsonb,
  status               text not null default 'published'
                         check (status in ('published', 'pending')),
  submitted_by         uuid references auth.users(id),
  created_at           timestamptz default now()
);

-- ── daily_log table ─────────────────────────────────────────────────────────────
create table if not exists daily_log (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) not null,
  date        date not null,
  slot        text not null,
  recipe_id   text references recipes(id) on delete set null,
  created_at  timestamptz default now(),
  constraint  daily_log_user_date_slot_key unique (user_id, date, slot)
);

-- ── Row Level Security ──────────────────────────────────────────────────────────
alter table recipes   enable row level security;
alter table daily_log enable row level security;

-- Published recipes are readable by everyone (including anonymous visitors)
create policy "published recipes are public"
  on recipes for select
  using (status = 'published');

-- Authenticated users can see their own pending submissions
create policy "users see their own pending submissions"
  on recipes for select
  using (status = 'pending' and auth.uid() = submitted_by);

-- Authenticated users can submit new pending recipes
create policy "users can submit recipes"
  on recipes for insert
  with check (auth.uid() is not null and status = 'pending' and submitted_by = auth.uid());

-- Users can fully manage their own daily log rows
create policy "users manage own daily log"
  on daily_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
