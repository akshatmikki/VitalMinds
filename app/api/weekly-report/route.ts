import { createClient } from '@/lib/supabase/server'
import { generateWeeklyInsight } from '@/lib/ai/groq'
import { getUser } from '@/lib/supabase/cached'
import { calcWellnessScore } from '@/lib/health/calculations'

export async function POST(_req: Request) {
  try {
    const supabase = createClient()
    const user = await getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Check if report already exists for this week
    const { data: existing } = await supabase
      .from('weekly_reports').select('id').eq('user_id', user.id).eq('week_start', weekStartStr).single()
    if (existing) return Response.json({ cached: true, weekStart: weekStartStr })

    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]

    const [
      { data: profile },
      { data: moodLogs },
      { data: healthMetrics },
      { data: habits },
      { data: habitLogs },
      { count: journalCount },
    ] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('mood_logs').select('score, emotion_tags, logged_at').eq('user_id', user.id).gte('logged_at', sevenDaysAgo),
      supabase.from('health_metrics').select('*').eq('user_id', user.id).gte('date', sevenDaysAgo),
      supabase.from('habits').select('id, name').eq('user_id', user.id).eq('is_active', true),
      supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).gte('logged_date', sevenDaysAgo).eq('completed', true),
      supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', sevenDaysAgo),
    ])

    const avgMood = moodLogs?.length
      ? moodLogs.reduce((s, l) => s + l.score, 0) / moodLogs.length
      : null

    const avgSleep = healthMetrics?.length
      ? healthMetrics.filter(m => m.sleep_hours).reduce((s, m) => s + (m.sleep_hours ?? 0), 0) / healthMetrics.filter(m => m.sleep_hours).length
      : null

    // Count emotion frequencies
    const emotionFreq: Record<string, number> = {}
    moodLogs?.forEach(l => {
      const tags: string[] = l.emotion_tags ?? []
      tags.forEach(t => { emotionFreq[t] = (emotionFreq[t] ?? 0) + 1 })
    })
    const topEmotions = Object.entries(emotionFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e]) => e)

    // Mood trend
    const firstHalf = moodLogs?.slice(0, Math.floor((moodLogs?.length ?? 0) / 2)) ?? []
    const secondHalf = moodLogs?.slice(Math.floor((moodLogs?.length ?? 0) / 2)) ?? []
    const f = firstHalf.length ? firstHalf.reduce((s, l) => s + l.score, 0) / firstHalf.length : 5
    const s = secondHalf.length ? secondHalf.reduce((s, l) => s + l.score, 0) / secondHalf.length : 5
    const moodTrend: 'up' | 'down' | 'stable' = f > s + 0.5 ? 'up' : f < s - 0.5 ? 'down' : 'stable'

    const wellnessScore = calcWellnessScore({
      todayMetrics: healthMetrics?.[0] ?? null,
      habits: habits ?? [],
      completedHabitIds: (habitLogs ?? []).map((l: any) => l.habit_id),
      recentMoods: moodLogs ?? [],
      sevenDayMetrics: healthMetrics ?? [],
    })

    const insight = await generateWeeklyInsight({
      userName: profile?.full_name || 'friend',
      avgMood,
      avgSleep,
      habitsCompleted: habitLogs?.length ?? 0,
      totalHabits: habits?.length ?? 0,
      journalCount: journalCount ?? 0,
      wellnessScore: wellnessScore.overall,
      topEmotions,
      moodTrend,
    })

    await supabase.from('weekly_reports').upsert({
      user_id: user.id,
      week_start: weekStartStr,
      narrative: insight.narrative,
      highlights: insight.highlights,
      avg_mood: avgMood,
      avg_sleep: avgSleep,
      habits_completed: habitLogs?.length ?? 0,
      wellness_score: wellnessScore.overall,
    })

    return Response.json({ narrative: insight.narrative, highlights: insight.highlights, weekStart: weekStartStr })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
