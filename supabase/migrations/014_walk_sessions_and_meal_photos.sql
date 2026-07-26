-- Walking distance: one row per GPS-tracked walk session
CREATE TABLE IF NOT EXISTS walk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  distance_m numeric(8,1) NOT NULL,
  duration_s int NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE walk_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own walk sessions" ON walk_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ON walk_sessions (user_id, started_at DESC);

-- Meal photos: private bucket, one folder per user
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users manage own meal photos" ON storage.objects
  FOR ALL USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
