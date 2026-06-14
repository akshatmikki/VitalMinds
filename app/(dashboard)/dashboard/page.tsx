import { getUser, getProfile, getMoodLogs, getActiveHabits, getHabitLogs, getHealthMetrics } from '@/lib/supabase/cached'
import { createClient } from '@/lib/supabase/server'
import { calcWellnessScore } from '@/lib/health/calculations'
import Link from 'next/link'
import { getMoodEmoji, getMoodLabel, formatDate } from '@/lib/utils'
import { MessageCircle, BookOpen, Heart, Activity, TrendingUp } from 'lucide-react'

import MoodChart from '@/components/mood/MoodChart'
import QuickMoodLog from '@/components/mood/QuickMoodLog'
import EmotionRadarChart from '@/components/mood/EmotionRadarChart'

export default async function DashboardPage() {
  const user = await getUser()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [profile, moodLogs, habits, habitLogs, healthMetrics, { data: recentJournal }, { data: streakData }] = await Promise.all([
    getProfile(user!.id),
    getMoodLogs(user!.id, 14),
    getActiveHabits(user!.id),
    getHabitLogs(user!.id, today),
    getHealthMetrics(user!.id, 7),
    supabase.from('journal_entries').select('id, title, created_at, mood_score')
      .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('wellness_streaks').select('current_streak, longest_streak').eq('user_id', user!.id).single(),
  ])

  // Build emotion frequency map from recent mood logs
  const emotionCounts: Record<string, number> = {}
  ;(moodLogs as any[] ?? []).forEach((l: any) => {
    const tags: string[] = l.emotion_tags ?? []
    tags.forEach(t => { emotionCounts[t] = (emotionCounts[t] ?? 0) + 1 })
  })

  const latestMood = moodLogs?.[0]
  const todayHabitLogs = habitLogs ?? []
  const completedHabitIds = todayHabitLogs.map((l: any) => l.habit_id)
  const habitCompletionToday = habits.length
    ? Math.round((todayHabitLogs.length / habits.length) * 100) : 0

  const wellnessScore = calcWellnessScore({
    todayMetrics: healthMetrics[0] ?? null,
    habits,
    completedHabitIds,
    recentMoods: (moodLogs ?? []).slice(0, 7),
    sevenDayMetrics: healthMetrics,
  })

  const trendLabel =
    wellnessScore.trend === 'up' ? '↑ Trending up'
    : wellnessScore.trend === 'down' ? '↓ Needs attention'
    : wellnessScore.trend === 'stable' ? '→ Steady'
    : 'Log more to track'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const STATS = [
    {
      label: 'Current Mood',
      value: latestMood ? `${getMoodEmoji(latestMood.score)} ${getMoodLabel(latestMood.score)}` : '—',
      sub: latestMood ? `${latestMood.score}/10` : 'Not logged yet',
      glass: 'glass-cyan',
      val: 'text-sage-700',
    },
    {
      label: 'Habits Today',
      value: `${todayHabitLogs.length} / ${habits.length || 0}`,
      sub: `${habitCompletionToday}% complete`,
      glass: 'glass-green',
      val: 'text-sage-600',
    },
    {
      label: 'Wellness Score',
      value: `${wellnessScore.overall}`,
      sub: trendLabel,
      glass: 'glass-amber',
      val: 'text-amber-700',
    },
    {
      label: 'Mood Trend',
      value: moodLogs && moodLogs.length >= 2
        ? moodLogs[0].score > moodLogs[1].score ? '📈 Rising'
          : moodLogs[0].score < moodLogs[1].score ? '📉 Falling' : '➡️ Stable'
        : '—',
      sub: 'vs yesterday',
      glass: 'glass-purple',
      val: 'text-lavender-700',
    },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Header ───────────────────────────────── */}
      <div className="mb-8 card-in">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-sage-500 uppercase mb-2">
          Your Wellness Journey
        </p>
        <h1 className="text-3xl font-bold grad-white-cyan">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-warm-400 mt-1 text-sm">{formatDate(new Date())}</p>
      </div>

      {/* ── Quick mood log ────────────────────────── */}
      <div className="card-in stagger-1">
        <QuickMoodLog userId={user!.id} latestMood={latestMood} />
      </div>

      {/* ── Stats row ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {STATS.map((stat, i) => (
          <div
            key={i}
            className={`relative rounded-2xl p-5 overflow-hidden shimmer card-in stagger-${i + 2} ${stat.glass}`}
          >
            <div className="relative">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-warm-400 uppercase mb-2.5">
                {stat.label}
              </p>
              <p className={`text-xl font-bold ${stat.val}`}>{stat.value}</p>
              <p className="text-[11px] text-warm-400 mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mood chart ────────────────────────────── */}
      {moodLogs && moodLogs.length > 1 && (
        <div className="mt-6 glass rounded-2xl p-5 card-in stagger-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-sage-500" />
            <h2 className="text-[11px] font-semibold text-warm-500 tracking-wide uppercase">
              Mood over time
            </h2>
          </div>
          <MoodChart data={moodLogs.slice().reverse()} />
        </div>
      )}

      {/* ── Emotion radar + streak ─────────────────── */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 card-in stagger-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-lavender-500" />
            <h2 className="text-[11px] font-semibold text-warm-500 tracking-wide uppercase">Emotion Map</h2>
          </div>
          <EmotionRadarChart emotionCounts={emotionCounts} />
        </div>

        <div className="glass rounded-2xl p-5 card-in stagger-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-amber-500" />
            <h2 className="text-[11px] font-semibold text-warm-500 tracking-wide uppercase">Wellness Streak</h2>
          </div>
          <div className="text-center py-4">
            <p className="text-6xl font-black text-warm-900">{streakData?.current_streak ?? 0}</p>
            <p className="text-sm text-warm-500 mt-1">day{(streakData?.current_streak ?? 0) !== 1 ? 's' : ''} in a row</p>
            {(streakData?.longest_streak ?? 0) > 0 && (
              <p className="text-xs text-warm-300 mt-2">Best: {streakData?.longest_streak} days</p>
            )}
          </div>
          <p className="text-xs text-warm-400 text-center">Log a mood, habit, or chat today to keep your streak alive 🔥</p>
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

        <Link
          href="/chat"
          className="group relative rounded-2xl p-6 overflow-hidden shimmer card-in stagger-4 transition-all duration-300 hover:scale-[1.02] glass-cyan hover:shadow-sage"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-sage-100 border border-sage-200">
              <MessageCircle className="w-5 h-5 text-sage-600" />
            </div>
            <p className="font-bold text-warm-900">Talk to Mind</p>
            <p className="text-sage-600/80 text-sm mt-1">Your AI companion is here</p>
          </div>
          <div className="absolute bottom-4 right-5 text-sage-200 text-5xl font-black select-none">AI</div>
        </Link>

        <Link
          href="/journal"
          className="group relative rounded-2xl p-6 overflow-hidden shimmer card-in stagger-5 transition-all duration-300 hover:scale-[1.02] glass-purple hover:shadow-lavender"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-lavender-100 border border-lavender-200">
              <BookOpen className="w-5 h-5 text-lavender-600" />
            </div>
            <p className="font-bold text-warm-900">Write in Journal</p>
            <p className="text-lavender-600/80 text-sm mt-1">Reflect on your day</p>
          </div>
          <div className="absolute bottom-4 right-5 text-lavender-200 text-5xl font-black select-none">✍</div>
        </Link>

        <Link
          href="/community"
          className="group relative rounded-2xl p-6 overflow-hidden shimmer card-in stagger-6 transition-all duration-300 hover:scale-[1.02] glass-green hover:shadow-sage"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-sage-100 border border-sage-200">
              <Heart className="w-5 h-5 text-sage-600" />
            </div>
            <p className="font-bold text-warm-900">Join Community</p>
            <p className="text-sage-600/80 text-sm mt-1">You are not alone</p>
          </div>
          <div className="absolute bottom-4 right-5 text-sage-200 text-5xl font-black select-none">🌿</div>
        </Link>
      </div>

      {/* ── Recent journal ───────────────────────── */}
      {recentJournal && recentJournal.length > 0 && (
        <div className="mt-6 glass rounded-2xl overflow-hidden card-in stagger-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-lavender-500" />
              <h2 className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest">
                Recent Journal Entries
              </h2>
            </div>
            <Link href="/journal" className="text-xs text-sage-600 hover:text-sage-700 transition-colors font-medium">
              View all →
            </Link>
          </div>

          {recentJournal.map((entry: any) => (
            <Link
              key={entry.id}
              href={`/journal/${entry.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-warm-50 border-b border-warm-100 last:border-0 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-warm-700 group-hover:text-warm-900 transition-colors">
                  {entry.title || 'Untitled entry'}
                </p>
                <p className="text-xs text-warm-400 mt-0.5">{formatDate(entry.created_at)}</p>
              </div>
              {entry.mood_score && (
                <span className="text-xl">{getMoodEmoji(entry.mood_score)}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
