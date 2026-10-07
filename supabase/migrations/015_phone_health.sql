-- Extra daily metrics synced from the phone (Health Connect / Apple Health,
-- and Android screen-usage sleep estimates). See lib/health/phone-health.ts.
ALTER TABLE public.health_metrics
  ADD COLUMN IF NOT EXISTS distance_m      int,
  ADD COLUMN IF NOT EXISTS active_calories int,
  ADD COLUMN IF NOT EXISTS heart_rate_avg  int,
  -- 'health' = phone health store, 'phone_usage' = screen-off estimate, null = typed in by the user
  ADD COLUMN IF NOT EXISTS sleep_source    text,
  ADD COLUMN IF NOT EXISTS synced_at       timestamptz;
