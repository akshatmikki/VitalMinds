-- XP & levels
CREATE TABLE IF NOT EXISTS user_xp (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own xp" ON user_xp FOR ALL USING (auth.uid() = user_id);

-- Badge definitions (static seed)
CREATE TABLE IF NOT EXISTS badge_definitions (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL,
  category text NOT NULL
);
INSERT INTO badge_definitions VALUES
  ('mood_starter',    'Mood Tracker',       'Log your first mood',              '😊', 'mood'),
  ('mood_week',       'Mood Consistent',    '7 days of mood logs in a row',     '🌟', 'mood'),
  ('mood_master',     'Mood Master',        '30 mood logs total',               '🏆', 'mood'),
  ('journal_starter', 'First Entry',        'Write your first journal entry',   '📝', 'journal'),
  ('journal_week',    '7-Day Journaler',    'Journal 7 days in a row',          '📖', 'journal'),
  ('habit_starter',   'Habit Builder',      'Complete your first habit',        '✅', 'habits'),
  ('habit_week',      'Habit Streak',       'Complete habits 7 days in a row',  '🔥', 'habits'),
  ('sleep_champ',     'Sleep Champion',     'Log 7h+ sleep 5 days in a row',    '😴', 'health'),
  ('community_helper','Community Helper',   'Send 10 messages in community',    '🤝', 'community'),
  ('chat_opener',     'Conversation Starter','Start your first AI chat',        '💬', 'chat'),
  ('wellness_50',     'Wellness Seeker',    'Reach a wellness score of 50+',    '🌿', 'wellness'),
  ('wellness_80',     'Thriving',           'Reach a wellness score of 80+',    '✨', 'wellness')
ON CONFLICT DO NOTHING;

-- Earned badges per user
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  badge_id text REFERENCES badge_definitions(id) NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own badges" ON user_badges FOR ALL USING (auth.uid() = user_id);

-- Streak tracking
CREATE TABLE IF NOT EXISTS wellness_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE wellness_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own streaks" ON wellness_streaks FOR ALL USING (auth.uid() = user_id);
