import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePersonalInsights } from '@/lib/ai/groq'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check cache (refresh every 24h)
  const { data: cached } = await supabase
    .from('user_insights')
    .select('insights, generated_at')
    .eq('user_id', user.id)
    .single()

  if (cached && cached.generated_at) {
    const age = Date.now() - new Date(cached.generated_at).getTime()
    if (age < 24 * 60 * 60 * 1000) return NextResponse.json({ insights: cached.insights })
  }

  const [{ data: moods }, { data: sleep }, { data: habitLogs }, { data: habits }] = await Promise.all([
    supabase.from('mood_logs').select('score, logged_at, emotion_tags').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(30),
    supabase.from('health_metrics').select('date, sleep_hours').eq('user_id', user.id).order('date', { ascending: false }).limit(14),
    supabase.from('habit_logs').select('logged_date').eq('user_id', user.id).gte('logged_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
    supabase.from('habits').select('name').eq('user_id', user.id).eq('active', true),
  ])

  if (!moods || moods.length < 5) return NextResponse.json({ insights: [] })

  const insights = await generatePersonalInsights({
    moodLogs: moods,
    sleepData: sleep ?? [],
    habitLogs: habitLogs ?? [],
    habits: habits ?? [],
  })

  // Cache the result
  await supabase.from('user_insights').upsert(
    { user_id: user.id, insights, generated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ insights })
}
