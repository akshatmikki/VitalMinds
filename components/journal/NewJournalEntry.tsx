'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sparkles, ChevronDown } from 'lucide-react'

const MOOD_OPTIONS = [
  { score: 2, emoji: '😢' }, { score: 4, emoji: '😔' }, { score: 6, emoji: '😐' },
  { score: 8, emoji: '😊' }, { score: 10, emoji: '🌟' },
]

export default function NewJournalEntry({ userId, suggestedPrompt }: { userId: string; suggestedPrompt: string }) {
  const [content, setContent] = useState('')
  const [moodScore, setMoodScore] = useState<number | null>(null)
  const [usePrompt, setUsePrompt] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reflection, setReflection] = useState('')
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function save() {
    if (!content.trim()) return
    setSaving(true)
    try {
      // Get AI reflection
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const { reflection: aiReflection } = await res.json()

      const title = content.split('\n')[0].slice(0, 60) || 'Journal entry'
      await supabase.from('journal_entries').insert({
        user_id: userId,
        content: content.trim(),
        prompt: usePrompt ? suggestedPrompt : null,
        ai_reflection: aiReflection || null,
        mood_score: moodScore,
        title,
      })

      setReflection(aiReflection || '')
      setSaved(true)
      setTimeout(() => { setContent(''); setMoodScore(null); setSaved(false); setReflection(''); router.refresh() }, 4000)
    } finally { setSaving(false) }
  }

  if (saved) return (
    <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center animate-fade-in">
      <p className="text-green-700 font-medium mb-2">Entry saved ✓</p>
      {reflection && (
        <div className="text-left mt-3 p-4 bg-white rounded-lg border border-green-100">
          <p className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Mind&apos;s reflection
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{reflection}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-gray-900">New entry</h2>
        <button onClick={() => setUsePrompt(!usePrompt)}
          className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> {usePrompt ? 'Hide prompt' : 'Use a prompt'}
        </button>
      </div>

      {usePrompt && (
        <div className="mb-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
          <p className="text-sm text-purple-700 italic">&ldquo;{suggestedPrompt}&rdquo;</p>
        </div>
      )}

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={usePrompt ? suggestedPrompt : "What's on your mind? Write freely..."}
        rows={5}
        className="w-full resize-none border-0 outline-none text-gray-800 text-sm leading-relaxed placeholder-gray-300 mb-3"
      />

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 mr-1">Mood:</span>
          {MOOD_OPTIONS.map(m => (
            <button key={m.score} onClick={() => setMoodScore(m.score)}
              className={`text-lg transition-transform ${moodScore === m.score ? 'scale-125' : 'opacity-50 hover:opacity-80'}`}>
              {m.emoji}
            </button>
          ))}
        </div>
        <button onClick={save} disabled={!content.trim() || saving}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 flex items-center gap-2">
          {saving ? <><span className="animate-spin">⟳</span> Getting reflection...</> : 'Save entry'}
        </button>
      </div>
    </div>
  )
}
