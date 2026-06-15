-- Google Fit OAuth tokens per user
CREATE TABLE IF NOT EXISTS wearable_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'google_fit',
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text,
  connected_at timestamptz DEFAULT now(),
  last_synced_at timestamptz,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wearable connections" ON wearable_connections
  FOR ALL USING (auth.uid() = user_id);
