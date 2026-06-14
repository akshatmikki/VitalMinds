-- Weekly AI-generated insight reports
CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  narrative text NOT NULL,
  highlights jsonb DEFAULT '[]',
  avg_mood numeric,
  avg_sleep numeric,
  habits_completed integer DEFAULT 0,
  wellness_score integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own reports" ON weekly_reports FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS weekly_reports_user_week_idx ON weekly_reports(user_id, week_start DESC);
