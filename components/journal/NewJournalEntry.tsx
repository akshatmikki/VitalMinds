'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

const MOOD_OPTIONS = [
  { score: 2,  emoji: '😢' },
  { score: 4,  emoji: '😔' },
  { score: 6,  emoji: '😐' },
  { score: 8,  emoji: '😊' },
  { score: 10, emoji: '🌟' },
]

export default function NewJournalEntry({ userId, suggestedPrompt }: { userId: string; suggestedPrompt: string }) {
  const [content, setContent]       = useState('')
  const [moodScore, setMoodScore]   = useState<number | null>(null)
  const [usePrompt, setUsePrompt]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [reflection, setReflection] = useState('')
  const [saved, setSaved]           = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  async function save() {
    if (!content.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const { reflection: aiReflection } = await res.json()
      const title = content.split('\n')[0].slice(0, 60) || 'Journal entry'

      await supabase.from('journal_entries').insert({
        user_id:       userId,
        content:       content.trim(),
        prompt:        usePrompt ? suggestedPrompt : null,
        ai_reflection: aiReflection || null,
        mood_score:    moodScore,
        title,
      })

      setReflection(aiReflection || '')
      setSaved(true)
      setTimeout(() => {
        setContent(''); setMoodScore(null); setSaved(false); setReflection('')
        router.refresh()
      }, 4000)
    } finally { setSaving(false) }
  }

  if (saved) return (
    <div className="glass-green rounded-2xl p-6 text-center animate-fade-in">
      <p className="text-sage-700 font-semibold mb-2">Entry saved ✓</p>
      {reflection && (
        <div className="text-left mt-4 glass-purple rounded-xl p-4">
          <p className="text-[10px] font-bold text-lavender-600 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Mind&apos;s reflection
          </p>
          <p className="text-sm text-lavender-700 leading-relaxed">{reflection}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="glass rounded-2xl p-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-warm-400 uppercase tracking-widest">New Entry</p>
        <button
          type="button"
          onClick={() => setUsePrompt(!usePrompt)}
          className="text-xs text-lavender-600 hover:text-lavender-700 flex items-center gap-1 font-medium transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          {usePrompt ? 'Hide prompt' : 'Use a prompt'}
        </button>
      </div>

      {/* Prompt */}
      {usePrompt && (
        <div className="mb-4 p-3 glass-purple rounded-xl">
          <p className="text-sm text-lavender-700 italic">&ldquo;{suggestedPrompt}&rdquo;</p>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={usePrompt ? suggestedPrompt : "What's on your mind? Write freely…"}
        rows={5}
        className="journal-textarea"
      />

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-warm-100 pt-3 gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-warm-400 font-semibold uppercase tracking-wider mr-1">Mood</span>
          {MOOD_OPTIONS.map(m => (
            <button
              key={m.score}
              type="button"
              onClick={() => setMoodScore(m.score === moodScore ? null : m.score)}
              className={`text-lg transition-all duration-150 ${moodScore === m.score ? 'scale-125' : 'opacity-35 hover:opacity-70'}`}
            >
              {m.emoji}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!content.trim() || saving}
          className="mood-submit-btn px-4 py-2 shrink-0 flex items-center gap-2"
        >
          {saving ? <><span className="animate-spin">⟳</span> Reflecting…</> : 'Save entry'}
        </button>
      </div>
    </div>
  )
}
