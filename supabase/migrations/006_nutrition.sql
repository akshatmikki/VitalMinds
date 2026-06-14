-- Add nutrition JSONB to health_metrics
ALTER TABLE health_metrics ADD COLUMN IF NOT EXISTS nutrition jsonb DEFAULT '[]';
-- nutrition entries: [{ meal: string, calories: number, protein: number, carbs: number, fat: number, logged_at: string }]
