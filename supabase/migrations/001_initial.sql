create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 18),
  skin text not null default 'classic' check (skin in ('classic','mint','berry')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create table public.runs (
  id bigint generated always as identity primary key,
  name text not null,
  course text not null check (course in ('lagoon','rapids','moonlight')),
  time double precision not null check (time > 0),
  date timestamptz not null default now()
);
create index runs_course_time on public.runs (course,time);
alter table public.runs enable row level security;
-- Runs are read and written only by the server service role, through /api/leaderboard.
