import { getUser, getProfile, getMoodLogs, getActiveHabits, getHabitLogs, getHealthMetrics } from '@/lib/supabase/cached'
import { createClient } from '@/lib/supabase/server'
import { calcWellnessScore } from '@/lib/health/calculations'
import { getMoodEmoji, getMoodLabel } from '@/lib/utils'
import { User, Target, Calendar, BookOpen, Smile, CheckSquare, Activity, Heart, Zap, TrendingUp } from 'lucide-react'

const GOAL_LABELS: Record<string, string> = {
  stress:       '🧘 Manage Stress',
  sleep:        '😴 Better Sleep',
  mood:         '😊 Improve Mood',
  habits:       '✅ Build Habits',
  fitness:      '💪 Stay Fit',
  mindfulness:  '🌿 Mindfulness',
  social:       '🤝 Social Wellness',
  nutrition:    '🥗 Nutrition',
}

export default async function ProfilePage() {
  const user = await getUser()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    profile,
    moodLogs30,
    habits,
    habitLogs,
    healthMetrics,
    { count: journalCount },
    { count: moodCount },
    { data: recentJournal },
  ] = await Promise.all([
    getProfile(user!.id),
    getMoodLogs(user!.id, 30),
    getActiveHabits(user!.id),
    getHabitLogs(user!.id, today),
    getHealthMetrics(user!.id, 7),
    supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('mood_logs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('journal_entries').select('id, title, created_at, mood_score')
      .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(3),
  ])

  const completedHabitIds = (habitLogs ?? []).map((l: any) => l.habit_id)

  const wellnessScore = calcWellnessScore({
    todayMetrics: healthMetrics[0] ?? null,
    habits,
    completedHabitIds,
    recentMoods: (moodLogs30 ?? []).slice(0, 7),
    sevenDayMetrics: healthMetrics,
  })

  const avgMood = moodLogs30 && moodLogs30.length > 0
    ? moodLogs30.reduce((sum, l) => sum + l.score, 0) / moodLogs30.length
    : null

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  const initials = profile?.full_name
    ? profile.full_name.trim().split(/\s+/).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? '?').toUpperCase()

  const trendLabel =
    wellnessScore.trend === 'up'     ? '↑ Trending up — keep going!'
    : wellnessScore.trend === 'down' ? '↓ Needs attention'
    : wellnessScore.trend === 'stable' ? '→ Holding steady'
    : 'Log more to see your trend'

  const moodTrend7 = moodLogs30?.slice(0, 7)
  const prevMoodAvg = moodLogs30 && moodLogs30.length >= 14
    ? moodLogs30.slice(7, 14).reduce((s, l) => s + l.score, 0) / 7
    : null
  const currMoodAvg = moodTrend7 && moodTrend7.length
    ? moodTrend7.reduce((s, l) => s + l.score, 0) / moodTrend7.length
    : null

  return (
    <div className="p-5 max-w-3xl mx-auto">

      {/* ── Profile hero ─────────────────────────────── */}
      <div className="glass rounded-2xl p-6 mb-5 card-in">
        <div className="flex items-start gap-5">
          {/* Avatar circle */}
          <div className="profile-avatar-bg w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-sage">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-warm-900 leading-tight">
              {profile?.full_name || 'Your Profile'}
            </h1>
            <p className="text-sm text-warm-400 mt-0.5">{user?.email}</p>

            {profile?.bio ? (
              <p className="text-sm text-warm-600 mt-2.5 leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-sm text-warm-300 mt-2.5 italic">No bio added yet</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3">
              {memberSince && (
                <span className="flex items-center gap-1.5 text-xs text-warm-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {memberSince}
                </span>
              )}
              {profile?.timezone && (
                <span className="text-xs text-warm-400">🌍 {profile.timezone}</span>
              )}
              {profile?.height_cm && (
                <span className="text-xs text-warm-400">📏 {profile.height_cm} cm</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: 'Journal Entries',
            value: journalCount ?? 0,
            icon: BookOpen,
            color: 'text-lavender-600',
            bg: 'glass-purple',
            sub: 'total written',
          },
          {
            label: 'Mood Logs',
            value: moodCount ?? 0,
            icon: Smile,
            color: 'text-sage-600',
            bg: 'glass-cyan',
            sub: 'total logged',
          },
          {
            label: 'Active Habits',
            value: habits.length,
            icon: CheckSquare,
            color: 'text-sage-600',
            bg: 'glass-green',
            sub: 'in your routine',
          },
          {
            label: 'Wellness Score',
            value: wellnessScore.overall,
            icon: Activity,
            color: 'text-amber-600',
            bg: 'glass-amber',
            sub: 'out of 100',
          },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-2xl p-4 card-in stagger-${i + 1}`}>
            <stat.icon className={`w-4 h-4 ${stat.color} mb-2.5`} />
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] font-semibold text-warm-500 tracking-wide mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-warm-300 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Mood & wellness detail ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {/* 30-day mood */}
        <div className="glass rounded-2xl p-5 card-in stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-coral-500" />
            <h2 className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest">
              30-Day Mood Overview
            </h2>
          </div>

          {avgMood !== null ? (
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-warm-900">{avgMood.toFixed(1)}</span>
                <span className="text-sm text-warm-400 mb-1">/ 10</span>
                <span className="text-2xl mb-0.5 ml-1">{getMoodEmoji(avgMood)}</span>
              </div>
              <p className="text-sm font-medium text-warm-700">{getMoodLabel(avgMood)}</p>
              <p className="text-xs text-warm-400 mt-1">
                Based on {moodLogs30?.length} mood logs this month
              </p>

              {prevMoodAvg !== null && currMoodAvg !== null && (
                <div className="mt-3 pt-3 border-t border-warm-100">
                  <p className="text-xs text-warm-400">
                    {currMoodAvg > prevMoodAvg
                      ? `↑ Up ${(currMoodAvg - prevMoodAvg).toFixed(1)} pts vs last week`
                      : currMoodAvg < prevMoodAvg
                      ? `↓ Down ${(prevMoodAvg - currMoodAvg).toFixed(1)} pts vs last week`
                      : '→ Same as last week'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-warm-300">No mood data yet — start logging!</p>
          )}
        </div>

        {/* Wellness trend */}
        <div className="glass rounded-2xl p-5 card-in stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-sage-500" />
            <h2 className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest">
              Wellness Breakdown
            </h2>
          </div>

          <div className="flex items-end gap-2 mb-1">
            <span className="text-3xl font-bold text-warm-900">{wellnessScore.overall}</span>
            <span className="text-sm text-warm-400 mb-1">/ 100</span>
          </div>
          <p className="text-xs text-warm-400 mb-4">{trendLabel}</p>

          <div className="space-y-2.5">
            {[
              { label: 'Mood',   value: wellnessScore.mood,   barClass: 'wellness-bar-mood'   },
              { label: 'Habits', value: wellnessScore.habits, barClass: 'wellness-bar-habits' },
              { label: 'Sleep',  value: wellnessScore.sleep,  barClass: 'wellness-bar-sleep'  },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] font-medium text-warm-500">{s.label}</span>
                  <span className="text-[11px] font-semibold text-warm-700">{s.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-warm-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${s.barClass}`}
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Today's habits snapshot ──────────────────── */}
      {habits.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-5 card-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sage-500" />
              <h2 className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest">
                Today's Habits
              </h2>
            </div>
            <span className="text-xs font-semibold text-sage-600">
              {completedHabitIds.length} / {habits.length} done
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {habits.map((habit: any) => {
              const done = completedHabitIds.includes(habit.id)
              return (
                <div
                  key={habit.id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    done
                      ? 'bg-sage-50 border border-sage-200 text-sage-700'
                      : 'bg-warm-50 border border-warm-200 text-warm-400'
                  }`}
                >
                  <span>{habit.icon || '✓'}</span>
                  <span className="truncate font-medium">{habit.name}</span>
                  {done && <span className="ml-auto text-sage-500 text-xs">✓</span>}
                </div>
              )
            })}
          </div>

          {/* progress bar */}
          <div className="mt-4">
            <div className="h-1.5 rounded-full habit-progress-track overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  completedHabitIds.length === habits.length ? 'habit-progress-fill-done' : 'habit-progress-fill'
                }`}
                style={{ width: `${habits.length ? Math.round((completedHabitIds.length / habits.length) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Wellness goals ───────────────────────────── */}
      {profile?.goals && profile.goals.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-5 card-in stagger-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-sage-500" />
            <h2 className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest">
              Wellness Goals
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.goals.map((goal: string) => (
              <span
                key={goal}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-sage-50 text-sage-700 border border-sage-200"
              >
                {GOAL_LABELS[goal] ?? goal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent journal ───────────────────────────── */}
      {recentJournal && recentJournal.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden mb-5 card-in stagger-5">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-warm-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-lavender-500" />
              <h2 className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest">
                Recent Journal
              </h2>
            </div>
            <a href="/journal" className="text-xs text-sage-600 hover:text-sage-700 font-medium transition-colors">
              View all →
            </a>
          </div>
          {recentJournal.map((entry: any) => (
            <a
              key={entry.id}
              href={`/journal/${entry.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-warm-50 border-b border-warm-100 last:border-0 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-warm-700 group-hover:text-warm-900 truncate transition-colors">
                  {entry.title || 'Untitled entry'}
                </p>
                <p className="text-xs text-warm-300 mt-0.5">
                  {new Date(entry.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {entry.mood_score && (
                <span className="text-xl ml-3 shrink-0">{getMoodEmoji(entry.mood_score)}</span>
              )}
            </a>
          ))}
        </div>
      )}

      {/* ── Account details ──────────────────────────── */}
      <div className="glass rounded-2xl p-5 card-in stagger-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-warm-400" />
          <h2 className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest">
            Account Details
          </h2>
        </div>
        <div className="divide-y divide-warm-100">
          <div className="flex justify-between py-2.5">
            <span className="text-sm text-warm-400">Email</span>
            <span className="text-sm font-medium text-warm-700 truncate max-w-[60%] text-right">{user?.email}</span>
          </div>
          {profile?.timezone && (
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-warm-400">Timezone</span>
              <span className="text-sm font-medium text-warm-700">{profile.timezone}</span>
            </div>
          )}
          {profile?.height_cm && (
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-warm-400">Height</span>
              <span className="text-sm font-medium text-warm-700">{profile.height_cm} cm</span>
            </div>
          )}
          <div className="flex justify-between py-2.5">
            <span className="text-sm text-warm-400">Member since</span>
            <span className="text-sm font-medium text-warm-700">{memberSince ?? '—'}</span>
          </div>
        </div>
      </div>

    </div>
  )
}
