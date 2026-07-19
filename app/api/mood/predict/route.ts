import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { predictTomorrowMood } from '@/lib/ai/groq'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: moods }, { data: health }, { data: habits }, { data: habitLogs }] = await Promise.all([
    supabase.from('mood_logs').select('score, logged_at, emotion_tags').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(21),
    supabase.from('health_metrics').select('sleep_hours').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
    supabase.from('habits').select('id').eq('user_id', user.id).eq('active', true),
    supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).gte('logged_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
  ])

  if (!moods || moods.length < 3) return NextResponse.json({ error: 'Not enough data' }, { status: 400 })

  const avgSleep = health?.filter(h => h.sleep_hours).length
    ? health.filter(h => h.sleep_hours).reduce((s, h) => s + (h.sleep_hours ?? 0), 0) / health.filter(h => h.sleep_hours).length
    : 7
  const habitCompletion = habits?.length
    ? Math.round(new Set(habitLogs?.map(l => l.habit_id) ?? []).size / habits.length * 100)
    : 50

  const tomorrow = new Date(Date.now() + 86400000)
  const dayOfWeek = tomorrow.toLocaleDateString('en-US', { weekday: 'long' })

  const prediction = await predictTomorrowMood({
    recentMoods: moods.map(m => ({ score: m.score, date: m.logged_at.split('T')[0], emotion_tags: m.emotion_tags })),
    avgSleep: Math.round(avgSleep * 10) / 10,
    habitCompletion,
    dayOfWeek,
  })

  return NextResponse.json({ ...prediction, dayOfWeek })
}
