import { createClient } from '@/lib/supabase/server'
import { getUser, getProfile, getActiveHabits, getHabitLogs } from '@/lib/supabase/cached'
import { calcWellnessScore, calcBMI } from '@/lib/health/calculations'
import HealthClient from '@/components/health/HealthClient'

export default async function HealthPage() {
  const user = await getUser()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: todayMetrics }, { data: history }, habits, habitLogs, profile] = await Promise.all([
    supabase.from('health_metrics').select('*').eq('user_id', user!.id).eq('date', today).single(),
    supabase.from('health_metrics').select('*').eq('user_id', user!.id)
      .order('date', { ascending: false }).limit(14),
    getActiveHabits(user!.id),
    getHabitLogs(user!.id, today),
    getProfile(user!.id),
  ])

  const completedHabitIds = habitLogs.map((l: any) => l.habit_id)

  const wellnessScore = calcWellnessScore({
    todayMetrics: todayMetrics ?? null,
    habits,
    completedHabitIds,
    recentMoods: [],
    sevenDayMetrics: (history ?? []).slice(0, 7),
  })

  const bmi = calcBMI(todayMetrics?.weight_kg, profile?.height_cm)

  return (
    <HealthClient
      userId={user!.id}
      todayMetrics={todayMetrics}
      history={history || []}
      wellnessScore={wellnessScore}
      bmi={bmi}
      currentHeight={profile?.height_cm ?? null}
    />
  )
}
