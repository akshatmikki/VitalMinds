'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMoodEmoji, formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const MOODS = [
  { score: 2, emoji: '😢', label: 'Awful' },
  { score: 4, emoji: '😔', label: 'Low' },
  { score: 6, emoji: '😐', label: 'Okay' },
  { score: 8, emoji: '😊', label: 'Good' },
  { score: 10, emoji: '🌟', label: 'Great' },
]

export default function QuickMoodLog({ userId, latestMood }: { userId: string; latestMood?: any }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const alreadyLoggedToday = latestMood &&
    new Date(latestMood.logged_at).toDateString() === new Date().toDateString()

  if (alreadyLoggedToday && !done) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
        <span className="text-2xl">{getMoodEmoji(latestMood.score)}</span>
        <div>
          <p className="text-sm font-medium text-gray-900">Today&apos;s mood logged — {latestMood.score}/10</p>
          <p className="text-xs text-gray-400">{latestMood.note || 'No note added'}</p>
        </div>
      </div>
    )
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    await supabase.from('mood_logs').insert({ user_id: userId, score: selected, note: note || null })
    setDone(true); setSaving(false); router.refresh()
  }

  if (done) return (
    <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
      <p className="text-green-700 font-medium text-sm">Mood logged! {getMoodEmoji(selected || 5)}</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <p className="text-sm font-medium text-gray-700 mb-3">How are you feeling right now?</p>
      <div className="flex gap-2 mb-3">
        {MOODS.map(m => (
          <button key={m.score} onClick={() => setSelected(m.score)}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-lg border transition-all ${
              selected === m.score ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'
            }`}>
            <span className="text-xl">{m.emoji}</span>
            <span className="text-xs text-gray-500 mt-1">{m.label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="flex gap-2 animate-fade-in">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)"
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button onClick={save} disabled={saving}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {saving ? '...' : 'Log'}
          </button>
        </div>
      )}
    </div>
  )
}
