import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import { formatDate, getMoodEmoji } from '@/lib/utils'
import NewJournalEntry from '@/components/journal/NewJournalEntry'
import { BookOpen, Sparkles, PenLine } from 'lucide-react'

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
  const user = await getUser()
  const supabase = createClient()
  const { data: entries } = await supabase.from('journal_entries')
    .select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20)

  const todayPrompt = PROMPTS[new Date().getDay() % PROMPTS.length]

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6 card-in">
        <p className="text-[10px] font-bold tracking-[0.2em] text-lavender-600 uppercase mb-1">Private Space</p>
        <h1 className="text-2xl font-bold text-warm-900">Journal</h1>
        <p className="text-warm-400 text-sm mt-0.5">Your thoughts, safely held</p>
      </div>

      {/* New entry */}
      <div className="card-in stagger-1">
        <NewJournalEntry userId={user!.id} suggestedPrompt={todayPrompt} />
      </div>

      {/* Past entries */}
      {entries && entries.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <PenLine className="w-3.5 h-3.5 text-lavender-500" />
            <h2 className="text-[11px] font-bold text-warm-400 uppercase tracking-widest">Past entries</h2>
          </div>

          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`journal-entry-card glass rounded-2xl p-5 shimmer card-in stagger-${Math.min(i + 2, 6)} transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-warm-800 truncate">{entry.title || 'Untitled entry'}</p>
                    <p className="text-xs text-warm-400 mt-0.5">{formatDate(entry.created_at)}</p>
                  </div>
                  {entry.mood_score && (
                    <span className="text-xl shrink-0">{getMoodEmoji(entry.mood_score)}</span>
                  )}
                </div>

                <p className="text-sm text-warm-500 line-clamp-2 leading-relaxed">{entry.content}</p>

                {entry.ai_reflection && (
                  <div className="mt-3 p-3 rounded-xl glass-purple">
                    <p className="text-[10px] font-bold text-lavender-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Mind&apos;s reflection
                    </p>
                    <p className="text-xs text-lavender-700 leading-relaxed">{entry.ai_reflection}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {entries?.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-warm-300" />
          <p className="font-medium text-warm-500">No entries yet</p>
          <p className="text-sm mt-1 text-warm-400">Start writing above — even a few sentences helps</p>
        </div>
      )}
    </div>
  )
}
