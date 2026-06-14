-- Emotion tags on mood_logs and journal_entries
ALTER TABLE mood_logs ADD COLUMN IF NOT EXISTS emotion_tags jsonb DEFAULT '[]';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS emotion_tags jsonb DEFAULT '[]';
