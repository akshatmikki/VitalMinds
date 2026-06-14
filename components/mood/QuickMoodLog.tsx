'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMoodEmoji } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

const MOODS = [
  { score: 2,  emoji: '😢', label: 'Awful' },
  { score: 4,  emoji: '😔', label: 'Low'   },
  { score: 6,  emoji: '😐', label: 'Okay'  },
  { score: 8,  emoji: '😊', label: 'Good'  },
  { score: 10, emoji: '🌟', label: 'Great' },
]

export default function QuickMoodLog({ userId, latestMood }: { userId: string; latestMood?: any }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  const alreadyLoggedToday = latestMood &&
    new Date(latestMood.logged_at).toDateString() === new Date().toDateString()

  if (alreadyLoggedToday && !done) {
    return (
      <div className="mood-logged-card">
        <span className="text-3xl float">{getMoodEmoji(latestMood.score)}</span>
        <div>
          <p className="text-sm font-semibold text-warm-700">
            Today&apos;s mood — <span className="neon-cyan">{latestMood.score}/10</span>
          </p>
          <p className="text-xs text-warm-400 mt-0.5">{latestMood.note || 'No note added'}</p>
        </div>
      </div>
    )
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    await supabase.from('mood_logs').insert({ user_id: userId, score: selected, note: note || null })
    setDone(true)
    setSaving(false)
    router.refresh()
  }

  if (done) return (
    <div className="mood-done-card">
      <p className="text-sage-700 font-semibold text-sm">
        Mood logged! {getMoodEmoji(selected || 5)}
      </p>
    </div>
  )

  return (
    <div className="mood-form-card">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-3.5 h-3.5 text-sage-500" />
        <p className="text-[11px] font-bold text-warm-400 uppercase tracking-widest">
          How are you feeling right now?
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {MOODS.map(m => (
          <button
            key={m.score}
            type="button"
            onClick={() => setSelected(m.score)}
            className={`flex-1 flex flex-col items-center py-3 ${selected === m.score ? 'mood-btn-active' : 'mood-btn'}`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className={`text-[10px] font-medium mt-1 ${selected === m.score ? 'text-sage-600' : 'text-warm-400'}`}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex gap-2 animate-fade-in">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="flex-1 text-sm px-3 py-2.5 mood-note-input"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 mood-submit-btn"
          >
            {saving ? '...' : 'Log'}
          </button>
        </div>
      )}
    </div>
  )
}
