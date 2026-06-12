import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getMoodEmoji, getMoodLabel, formatDate } from '@/lib/utils'
import { MessageCircle, TrendingUp, BookOpen, Users, Plus, Zap } from 'lucide-react'
import MoodChart from '@/components/mood/MoodChart'
import QuickMoodLog from '@/components/mood/QuickMoodLog'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: moodLogs }, { data: habits }, { data: habitLogs }, { data: recentJournal }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
      supabase.from('mood_logs').select('*').eq('user_id', user!.id).order('logged_at', { ascending: false }).limit(14),
      supabase.from('habits').select('*').eq('user_id', user!.id).eq('is_active', true),
      supabase.from('habit_logs').select('*').eq('user_id', user!.id)
        .gte('logged_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
      supabase.from('journal_entries').select('id,title,created_at,mood_score').eq('user_id', user!.id)
        .order('created_at', { ascending: false }).limit(3),
    ])

  const latestMood = moodLogs?.[0]
  const today = new Date().toISOString().split('T')[0]
  const todayHabitLogs = habitLogs?.filter(l => l.logged_date === today) || []
  const habitCompletionToday = habits?.length
    ? Math.round((todayHabitLogs.length / habits.length) * 100) : 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-500 mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Quick mood log */}
      <QuickMoodLog userId={user!.id} latestMood={latestMood} />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          {
            label: 'Current mood',
            value: latestMood ? `${getMoodEmoji(latestMood.score)} ${getMoodLabel(latestMood.score)}` : 'Not logged',
            sub: latestMood ? `${latestMood.score}/10` : 'Log how you feel',
            color: 'green',
          },
          {
            label: 'Habits today',
            value: `${todayHabitLogs.length}/${habits?.length || 0}`,
            sub: `${habitCompletionToday}% complete`,
            color: 'blue',
          },
          {
            label: 'Journal entries',
            value: recentJournal?.length || 0,
            sub: 'This week',
            color: 'purple',
          },
          {
            label: 'Mood trend',
            value: moodLogs && moodLogs.length >= 2
              ? moodLogs[0].score > moodLogs[1].score ? '📈 Improving' : moodLogs[0].score < moodLogs[1].score ? '📉 Declining' : '➡️ Stable'
              : '—',
            sub: 'vs yesterday',
            color: 'amber',
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Mood chart */}
      {moodLogs && moodLogs.length > 1 && (
        <div className="mt-6 bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Mood over time</h2>
          <MoodChart data={moodLogs.slice().reverse()} />
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/chat"
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white hover:from-green-600 hover:to-green-700 transition-all">
          <MessageCircle className="w-6 h-6 mb-3 opacity-90" />
          <p className="font-semibold">Talk to Mind</p>
          <p className="text-green-100 text-sm mt-1">Your AI companion is here</p>
        </Link>
        <Link href="/journal"
          className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
          <BookOpen className="w-6 h-6 mb-3 text-purple-500" />
          <p className="font-semibold text-gray-900">Write in journal</p>
          <p className="text-gray-400 text-sm mt-1">Reflect on your day</p>
        </Link>
        <Link href="/community"
          className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
          <Users className="w-6 h-6 mb-3 text-blue-500" />
          <p className="font-semibold text-gray-900">Join community</p>
          <p className="text-gray-400 text-sm mt-1">You are not alone</p>
        </Link>
      </div>

      {/* Recent journal */}
      {recentJournal && recentJournal.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Recent journal entries</h2>
            <Link href="/journal" className="text-xs text-green-600 hover:text-green-700">View all</Link>
          </div>
          {recentJournal.map(entry => (
            <Link key={entry.id} href={`/journal/${entry.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{entry.title || 'Untitled entry'}</p>
                <p className="text-xs text-gray-400">{formatDate(entry.created_at)}</p>
              </div>
              {entry.mood_score && <span className="text-lg">{getMoodEmoji(entry.mood_score)}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
