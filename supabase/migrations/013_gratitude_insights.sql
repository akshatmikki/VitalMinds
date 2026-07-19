-- Gratitude jar entries
create table if not exists gratitude_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  entry      text not null,
  emoji      text not null default '🌸',
  created_at timestamptz default now()
);

create index if not exists idx_gratitude_user on gratitude_entries(user_id, created_at desc);
alter table gratitude_entries enable row level security;
create policy "gratitude_own" on gratitude_entries for all using (auth.uid() = user_id);

-- AI-generated personal insights cache
create table if not exists user_insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  insights     jsonb not null default '[]',
  generated_at timestamptz default now(),
  unique(user_id)
);

alter table user_insights enable row level security;
create policy "insights_own" on user_insights for all using (auth.uid() = user_id);

-- Chat session recaps
create table if not exists chat_recaps (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  recap        text not null,
  themes       text[] default '{}',
  mood_shift   text,
  created_at   timestamptz default now()
);

alter table chat_recaps enable row level security;
create policy "recaps_own" on chat_recaps for all using (auth.uid() = user_id);
