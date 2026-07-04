-- Courses catalog
create table if not exists courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  description  text not null,
  category     text not null,     -- 'anxiety' | 'sleep' | 'stress' | 'mindfulness' | 'confidence' | 'relationships' | 'focus'
  level        text not null,     -- 'beginner' | 'intermediate' | 'advanced'
  duration_min int  not null,     -- total estimated minutes
  lesson_count int  not null,
  emoji        text not null,
  color        text not null,     -- tailwind color name for theming
  tags         text[] default '{}',
  created_at   timestamptz default now()
);

-- Lessons (content AI-generated on first open, cached here)
create table if not exists course_lessons (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references courses(id) on delete cascade,
  order_index  int  not null,
  title        text not null,
  content      text,              -- AI-generated markdown content (null until generated)
  duration_min int  not null default 5,
  lesson_type  text not null default 'read', -- 'read' | 'exercise' | 'reflection' | 'audio'
  created_at   timestamptz default now()
);

-- User progress per lesson
create table if not exists user_course_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  course_id    uuid references courses(id) on delete cascade,
  lesson_id    uuid references course_lessons(id) on delete cascade,
  completed    boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  unique(user_id, lesson_id)
);

create index if not exists idx_user_course_progress_user on user_course_progress(user_id);
create index if not exists idx_course_lessons_course on course_lessons(course_id, order_index);

-- RLS
alter table courses enable row level security;
alter table course_lessons enable row level security;
alter table user_course_progress enable row level security;

create policy "courses_public_read" on courses for select using (true);
create policy "lessons_public_read" on course_lessons for select using (true);
create policy "lessons_service_write" on course_lessons for all using (true);

create policy "progress_own" on user_course_progress for all using (auth.uid() = user_id);

-- Seed courses
insert into courses (slug, title, description, category, level, duration_min, lesson_count, emoji, color, tags) values
  ('anxiety-toolkit', 'Anxiety Toolkit', 'Evidence-based techniques to understand, reduce, and manage anxiety in daily life.', 'anxiety', 'beginner', 40, 6, '🌊', 'lavender', array['CBT','breathing','grounding']),
  ('sleep-reset', 'Sleep Reset', 'Rebuild healthy sleep habits and wake up feeling truly rested.', 'sleep', 'beginner', 35, 5, '🌙', 'indigo', array['sleep hygiene','circadian rhythm','CBT-I']),
  ('stress-less', 'Stress Less', 'Practical stress management strategies for modern life.', 'stress', 'intermediate', 45, 7, '🌿', 'sage', array['mindfulness','boundaries','HRV']),
  ('mindfulness-starter', 'Mindfulness 101', 'A beginner-friendly intro to mindfulness meditation and present-moment awareness.', 'mindfulness', 'beginner', 30, 5, '🧘', 'teal', array['meditation','awareness','MBSR']),
  ('confidence-builder', 'Confidence Builder', 'Science-backed methods to build authentic self-confidence and inner resilience.', 'confidence', 'intermediate', 50, 8, '⭐', 'amber', array['self-esteem','CBT','positive psychology']),
  ('deep-focus', 'Deep Focus', 'Train your attention and enter flow states more consistently.', 'focus', 'intermediate', 40, 6, '🎯', 'cyan', array['attention','pomodoro','neuroscience']),
  ('relationship-skills', 'Relationship Skills', 'Build deeper connections and communicate more authentically.', 'relationships', 'intermediate', 55, 8, '🤝', 'coral', array['communication','empathy','boundaries']),
  ('emotional-resilience', 'Emotional Resilience', 'Bounce back faster from setbacks and build lasting mental strength.', 'resilience', 'advanced', 60, 9, '💪', 'rose', array['DBT','ACT','growth mindset'])
on conflict (slug) do nothing;

-- Seed lesson titles (content will be AI-generated on first open)
-- Anxiety Toolkit lessons
with c as (select id from courses where slug = 'anxiety-toolkit')
insert into course_lessons (course_id, order_index, title, duration_min, lesson_type) values
  ((select id from c), 1, 'Understanding What Anxiety Actually Is', 5, 'read'),
  ((select id from c), 2, 'The Anxiety Cycle and How to Break It', 7, 'read'),
  ((select id from c), 3, 'Breathing Techniques That Actually Work', 8, 'exercise'),
  ((select id from c), 4, 'Grounding: The 5-4-3-2-1 Method', 6, 'exercise'),
  ((select id from c), 5, 'Cognitive Reframing for Anxious Thoughts', 8, 'reflection'),
  ((select id from c), 6, 'Building Your Personal Anxiety Toolkit', 6, 'reflection')
on conflict do nothing;

-- Sleep Reset lessons
with c as (select id from courses where slug = 'sleep-reset')
insert into course_lessons (course_id, order_index, title, duration_min, lesson_type) values
  ((select id from c), 1, 'Why You Can''t Sleep (The Science)', 6, 'read'),
  ((select id from c), 2, 'Sleep Hygiene Habits That Move the Needle', 7, 'read'),
  ((select id from c), 3, 'The Wind-Down Ritual', 8, 'exercise'),
  ((select id from c), 4, 'Handling Night-Time Overthinking', 7, 'exercise'),
  ((select id from c), 5, 'Fixing Your Sleep Schedule Permanently', 7, 'reflection')
on conflict do nothing;

-- Mindfulness 101 lessons
with c as (select id from courses where slug = 'mindfulness-starter')
insert into course_lessons (course_id, order_index, title, duration_min, lesson_type) values
  ((select id from c), 1, 'What Mindfulness Is (and Isn''t)', 5, 'read'),
  ((select id from c), 2, 'Your First 5-Minute Meditation', 6, 'exercise'),
  ((select id from c), 3, 'Mindful Breathing Throughout Your Day', 6, 'exercise'),
  ((select id from c), 4, 'Body Scan for Stress Relief', 7, 'exercise'),
  ((select id from c), 5, 'Making Mindfulness a Daily Habit', 6, 'reflection')
on conflict do nothing;

-- Stress Less lessons
with c as (select id from courses where slug = 'stress-less')
insert into course_lessons (course_id, order_index, title, duration_min, lesson_type) values
  ((select id from c), 1, 'The Biology of Stress', 5, 'read'),
  ((select id from c), 2, 'Identifying Your Personal Stress Triggers', 6, 'reflection'),
  ((select id from c), 3, 'Progressive Muscle Relaxation', 8, 'exercise'),
  ((select id from c), 4, 'Setting Boundaries Without Guilt', 7, 'read'),
  ((select id from c), 5, 'Time Management for Less Overwhelm', 7, 'read'),
  ((select id from c), 6, 'Building a Stress Recovery Toolkit', 6, 'exercise'),
  ((select id from c), 7, 'The Long Game: Chronic Stress Prevention', 6, 'reflection')
on conflict do nothing;

-- Confidence Builder lessons
with c as (select id from courses where slug = 'confidence-builder')
insert into course_lessons (course_id, order_index, title, duration_min, lesson_type) values
  ((select id from c), 1, 'The Real Source of Confidence', 5, 'read'),
  ((select id from c), 2, 'The Inner Critic: Recognise and Disarm It', 7, 'reflection'),
  ((select id from c), 3, 'Small Wins and the Confidence Spiral', 6, 'read'),
  ((select id from c), 4, 'Body Language and Self-Perception', 6, 'exercise'),
  ((select id from c), 5, 'Handling Failure Without It Defining You', 7, 'reflection'),
  ((select id from c), 6, 'Assertiveness Without Aggression', 8, 'exercise'),
  ((select id from c), 7, 'Comparison and How to Stop It', 6, 'read'),
  ((select id from c), 8, 'Your Confidence Action Plan', 5, 'reflection')
on conflict do nothing;

-- Deep Focus lessons
with c as (select id from courses where slug = 'deep-focus')
insert into course_lessons (course_id, order_index, title, duration_min, lesson_type) values
  ((select id from c), 1, 'How Attention Actually Works', 5, 'read'),
  ((select id from c), 2, 'Designing a Distraction-Free Environment', 7, 'read'),
  ((select id from c), 3, 'The Pomodoro Method Done Right', 6, 'exercise'),
  ((select id from c), 4, 'Single-Tasking in a Multi-Tasking World', 7, 'reflection'),
  ((select id from c), 5, 'Energy Management vs Time Management', 7, 'read'),
  ((select id from c), 6, 'Flow State: How to Enter It More Often', 8, 'exercise')
on conflict do nothing;
