import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePersonalizedPlan } from '@/lib/ai/groq'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { focusAreas, durationDays } = await req.json() as {
    focusAreas: string[]
    durationDays: 7 | 14 | 21
  }

  // Fetch user context
  const [{ data: profile }, { data: moods }, { data: healthMetrics }, { data: habits }, { data: habitLogs }] = await Promise.all([
    supabase.from('profiles').select('full_name, goals').eq('id', user.id).single(),
    supabase.from('mood_logs').select('score').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(14),
    supabase.from('health_metrics').select('sleep_hours').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
    supabase.from('habits').select('id').eq('user_id', user.id).eq('active', true),
    supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).gte('logged_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
  ])

  const avgMood = moods?.length
    ? Math.round((moods.reduce((s, m) => s + m.score, 0) / moods.length) * 10) / 10
    : 5
  const avgSleep = healthMetrics?.filter(m => m.sleep_hours).length
    ? Math.round((healthMetrics.filter(m => m.sleep_hours).reduce((s, m) => s + (m.sleep_hours ?? 0), 0) / healthMetrics.filter(m => m.sleep_hours).length) * 10) / 10
    : 7
  const habitCompletion = habits?.length
    ? Math.round((new Set(habitLogs?.map(l => l.habit_id) ?? []).size / habits.length) * 100)
    : 50

  const planData = await generatePersonalizedPlan({
    name: profile?.full_name ?? 'You',
    goals: profile?.goals ?? [],
    focusAreas,
    durationDays,
    avgMood,
    avgSleep,
    habitCompletion,
  })

  if (!planData) return NextResponse.json({ error: 'Generation failed' }, { status: 500 })

  // Save plan
  const { data: plan, error: planErr } = await supabase
    .from('wellness_plans')
    .insert({
      user_id: user.id,
      title: planData.title,
      description: planData.description,
      duration_days: durationDays,
      focus_areas: focusAreas,
      week_theme: planData.week_theme,
      weekly_tip: planData.weekly_tip,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (planErr || !plan) return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })

  // Save tasks
  const tasks = planData.days.flatMap(day =>
    day.tasks.map(t => ({
      plan_id: plan.id,
      day_number: day.day_number,
      day_label: day.day_label,
      time_of_day: t.time_of_day,
      task: t.task,
      category: t.category,
      duration_min: t.duration_min,
    }))
  )

  await supabase.from('plan_tasks').insert(tasks)

  return NextResponse.json({ planId: plan.id })
}
