-- Run this in Supabase SQL Editor if 012_plans.sql was not yet applied

-- Wellness Plans table
create table if not exists wellness_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  title        text not null,
  description  text not null,
  duration_days int not null,
  focus_areas  text[] default '{}',
  week_theme   text,
  weekly_tip   text,
  status       text not null default 'active',
  start_date   date not null default current_date,
  created_at   timestamptz default now()
);

-- If the table already existed without 'status', add it safely:
alter table wellness_plans add column if not exists status text not null default 'active';
alter table wellness_plans add column if not exists week_theme text;
alter table wellness_plans add column if not exists weekly_tip text;
alter table wellness_plans add column if not exists focus_areas text[] default '{}';

-- Plan tasks table
create table if not exists plan_tasks (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid references wellness_plans(id) on delete cascade,
  day_number   int  not null,
  day_label    text not null,
  time_of_day  text not null,
  task         text not null,
  category     text not null,
  duration_min int  not null default 10,
  completed    boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now()
);

create index if not exists idx_plan_tasks_plan on plan_tasks(plan_id, day_number);
create index if not exists idx_wellness_plans_user on wellness_plans(user_id, status);

alter table wellness_plans enable row level security;
alter table plan_tasks enable row level security;

drop policy if exists "plans_own" on wellness_plans;
drop policy if exists "plan_tasks_own" on plan_tasks;

create policy "plans_own" on wellness_plans for all using (auth.uid() = user_id);
create policy "plan_tasks_own" on plan_tasks for all using (
  plan_id in (select id from wellness_plans where user_id = auth.uid())
);
