import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, getMoodEmoji } from '@/lib/utils'
import NewJournalEntry from '@/components/journal/NewJournalEntry'
import { BookOpen } from 'lucide-react'

const PROMPTS = [
  "What made you smile today, even if it was small?",
  "What's one thing you're grateful for right now?",
  "What's been weighing on your mind lately?",
  "Describe how you're feeling in 3 words and explain each.",
  "What's one thing you're proud of this week?",
  "What would make tomorrow a great day?",
  "Is there something you've been avoiding? Why?",
]

export default async function JournalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: entries } = await supabase.from('journal_entries')
    .select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20)

  const todayPrompt = PROMPTS[new Date().getDay() % PROMPTS.length]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Journal</h1>
        <p className="text-gray-400 text-sm mt-0.5">A private space for your thoughts</p>
      </div>

      <NewJournalEntry userId={user!.id} suggestedPrompt={todayPrompt} />

      {entries && entries.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past entries</h2>
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{entry.title || 'Untitled entry'}</p>
                    <p className="text-xs text-gray-400">{formatDate(entry.created_at)}</p>
                  </div>
                  {entry.mood_score && <span className="text-xl">{getMoodEmoji(entry.mood_score)}</span>}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{entry.content}</p>
                {entry.ai_reflection && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs font-medium text-green-700 mb-1">Mind&apos;s reflection</p>
                    <p className="text-xs text-green-800 leading-relaxed">{entry.ai_reflection}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {entries?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No entries yet</p>
          <p className="text-sm mt-1">Start writing above — even a few sentences helps</p>
        </div>
      )}
    </div>
  )
}
