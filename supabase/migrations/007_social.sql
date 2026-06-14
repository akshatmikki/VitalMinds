-- Buddy system for peer matching
CREATE TABLE IF NOT EXISTS buddy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  shared_goals text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);
ALTER TABLE buddy_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own buddy requests" ON buddy_requests FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Social prescription challenges
CREATE TABLE IF NOT EXISTS social_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  challenge text NOT NULL,
  week_start date NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE social_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social challenges" ON social_challenges FOR ALL USING (auth.uid() = user_id);
