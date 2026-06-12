-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- PROFILES
-- =====================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  bio text,
  goals text[] default '{}',
  onboarding_done boolean default false,
  timezone text default 'Asia/Kolkata',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- MOOD LOGS
-- =====================
create table public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  score int not null check (score between 1 and 10),
  energy int check (energy between 1 and 5),
  anxiety int check (anxiety between 1 and 5),
  note text,
  logged_at timestamptz default now()
);

alter table public.mood_logs enable row level security;
create policy "Users manage own mood logs" on public.mood_logs for all using (auth.uid() = user_id);
create index on public.mood_logs (user_id, logged_at desc);

-- =====================
-- CHAT SESSIONS
-- =====================
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'New conversation',
  session_type text default 'companion' check (session_type in ('companion', 'coach', 'journal')),
  messages jsonb default '[]',
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chat_sessions enable row level security;
create policy "Users manage own chat sessions" on public.chat_sessions for all using (auth.uid() = user_id);
create index on public.chat_sessions (user_id, updated_at desc);

-- =====================
-- HEALTH METRICS
-- =====================
create table public.health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  sleep_hours numeric(4,1),
  sleep_quality int check (sleep_quality between 1 and 5),
  steps int,
  water_ml int,
  weight_kg numeric(5,1),
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.health_metrics enable row level security;
create policy "Users manage own health metrics" on public.health_metrics for all using (auth.uid() = user_id);
create index on public.health_metrics (user_id, date desc);

-- =====================
-- HABITS
-- =====================
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  category text default 'general' check (category in ('physical', 'mental', 'social', 'general')),
  icon text default '✨',
  frequency text default 'daily' check (frequency in ('daily', 'weekly')),
  target_count int default 1,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.habits enable row level security;
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  logged_date date default current_date,
  completed boolean default true,
  note text,
  created_at timestamptz default now(),
  unique(habit_id, logged_date)
);

alter table public.habit_logs enable row level security;
create policy "Users manage own habit logs" on public.habit_logs for all using (auth.uid() = user_id);
create index on public.habit_logs (user_id, logged_date desc);

-- =====================
-- JOURNAL ENTRIES
-- =====================
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  content text not null,
  prompt text,
  ai_reflection text,
  mood_score int check (mood_score between 1 and 10),
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.journal_entries enable row level security;
create policy "Users manage own journal entries" on public.journal_entries for all using (auth.uid() = user_id);
create index on public.journal_entries (user_id, created_at desc);

-- =====================
-- COMMUNITY ROOMS
-- =====================
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  topic text,
  emoji text default '💬',
  is_private boolean default false,
  member_count int default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.rooms enable row level security;
create policy "Anyone can view public rooms" on public.rooms for select using (not is_private);
create policy "Auth users can create rooms" on public.rooms for insert with check (auth.uid() = created_by);

create table public.room_members (
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

alter table public.room_members enable row level security;
create policy "Users manage own memberships" on public.room_members for all using (auth.uid() = user_id);

create table public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

alter table public.room_messages enable row level security;
create policy "Room members can view messages" on public.room_messages for select using (auth.uid() = user_id);
create policy "Auth users can send messages" on public.room_messages for insert with check (auth.uid() = user_id);
alter publication supabase_realtime add table public.room_messages;
create index on public.room_messages (room_id, created_at desc);

-- =====================
-- WELLNESS PLANS
-- =====================
create table public.wellness_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_start date not null,
  week_theme text,
  tasks jsonb default '[]',
  weekly_tip text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.wellness_plans enable row level security;
create policy "Users manage own wellness plans" on public.wellness_plans for all using (auth.uid() = user_id);

-- =====================
-- SEED DEFAULT ROOMS
-- =====================
insert into public.rooms (name, description, topic, emoji) values
  ('Mental Health Support', 'A safe space to talk about anxiety, depression, and emotional struggles', 'mental_health', '💚'),
  ('Fitness & Movement', 'Share workout wins, ask for tips, stay motivated together', 'fitness', '💪'),
  ('Night Owls', 'For those who are up late and need company', 'social', '🌙'),
  ('New in the City', 'Making connections when you''ve just moved somewhere new', 'loneliness', '🏙️'),
  ('Mindfulness & Meditation', 'Daily check-ins, breathing exercises, and calm conversations', 'mindfulness', '🧘'),
  ('Healthy Eating', 'Recipes, nutrition tips, and eating well on a budget', 'nutrition', '🥗');
