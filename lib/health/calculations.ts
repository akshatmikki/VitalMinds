export type HealthMetricRow = {
  sleep_hours?: number | null
  sleep_quality?: number | null
  steps?: number | null
  water_ml?: number | null
  weight_kg?: number | null
}

export type MoodLogRow = { score: number }

export type WellnessInputs = {
  todayMetrics: HealthMetricRow | null
  habits: { id: string }[]
  completedHabitIds: string[]
  recentMoods: MoodLogRow[]
  sevenDayMetrics: HealthMetricRow[]
}

export type WellnessScoreBreakdown = {
  overall: number
  sleep: number
  steps: number
  hydration: number
  habits: number
  mood: number
  trend: 'up' | 'down' | 'stable' | 'insufficient_data'
}

export function calcSleepScore(hours: number | null | undefined): number {
  if (hours == null) return 0
  if (hours >= 7 && hours <= 9) return 100
  if (hours >= 6 && hours < 7) return Math.round(70 + (hours - 6) * 30)
  if (hours > 9 && hours <= 10) return Math.round(100 - (hours - 9) * 50)
  if (hours < 6) return Math.max(20, Math.round(70 * (hours / 6)))
  return Math.max(20, Math.round(50 - (hours - 10) * 15))
}

export function calcStepScore(steps: number | null | undefined): number {
  if (steps == null) return 0
  return Math.min(100, Math.round((steps / 10_000) * 100))
}

export function calcHydrationScore(water_ml: number | null | undefined): number {
  if (water_ml == null) return 0
  return Math.min(100, Math.round((water_ml / 2_000) * 100))
}

export function calcHabitScore(completed: number, total: number): number {
  if (total === 0) return 100
  return Math.round((completed / total) * 100)
}

export function calcMoodScore(score: number | null | undefined): number {
  if (score == null) return 0
  return Math.round((score / 10) * 100)
}

export function calcBMI(
  weight_kg: number | null | undefined,
  height_cm: number | null | undefined
): number | null {
  if (!weight_kg || !height_cm) return null
  const h = height_cm / 100
  return Math.round((weight_kg / (h * h)) * 10) / 10
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Healthy'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

function calcTrend(sevenDayMetrics: HealthMetricRow[]): WellnessScoreBreakdown['trend'] {
  const metricsWithSleep = sevenDayMetrics.filter(m => m.sleep_hours != null)
  if (metricsWithSleep.length < 3) return 'insufficient_data'

  const recent = metricsWithSleep.slice(0, Math.ceil(metricsWithSleep.length / 2))
  const older = metricsWithSleep.slice(Math.ceil(metricsWithSleep.length / 2))

  if (older.length === 0) return 'insufficient_data'

  const recentAvg = recent.reduce((s, m) => s + (m.sleep_hours ?? 0), 0) / recent.length
  const olderAvg = older.reduce((s, m) => s + (m.sleep_hours ?? 0), 0) / older.length
  const delta = recentAvg - olderAvg

  if (Math.abs(delta) < 0.3) return 'stable'
  return delta > 0 ? 'up' : 'down'
}

export function calcConnectionScore(inputs: {
  communityMessagesSent: number
  buddyConversations: number
  journalSocialMentions: number
  moodTrend: 'up' | 'down' | 'stable' | 'insufficient_data'
}): number {
  const messageScore  = Math.min(40, inputs.communityMessagesSent * 4)
  const buddyScore    = Math.min(30, inputs.buddyConversations * 10)
  const journalScore  = Math.min(20, inputs.journalSocialMentions * 5)
  const moodBonus     = inputs.moodTrend === 'up' ? 10 : inputs.moodTrend === 'down' ? -10 : 0
  return Math.max(0, Math.min(100, messageScore + buddyScore + journalScore + moodBonus))
}

export function calcWellnessScore(inputs: WellnessInputs): WellnessScoreBreakdown {
  const { todayMetrics, habits, completedHabitIds, recentMoods, sevenDayMetrics } = inputs

  const sleep = calcSleepScore(todayMetrics?.sleep_hours)
  const steps = calcStepScore(todayMetrics?.steps)
  const hydration = calcHydrationScore(todayMetrics?.water_ml)
  const habitPct = calcHabitScore(completedHabitIds.length, habits.length)
  const mood = calcMoodScore(recentMoods[0]?.score)

  const overall = Math.round(
    sleep * 0.25 + steps * 0.20 + hydration * 0.20 + habitPct * 0.20 + mood * 0.15
  )

  return {
    overall,
    sleep,
    steps,
    hydration,
    habits: habitPct,
    mood,
    trend: calcTrend(sevenDayMetrics),
  }
}
