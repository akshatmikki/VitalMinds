'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react'

type Props = {
  challenge: string
  category: 'physical' | 'mental' | 'social'
  xp: number
  userId: string
  completed: boolean
}

const CATEGORY_STYLE = {
  physical: { bg: 'bg-sage-50',     border: 'border-sage-200',     text: 'text-sage-700',     badge: 'bg-sage-100 text-sage-600',     emoji: '💪' },
  mental:   { bg: 'bg-lavender-50', border: 'border-lavender-200', text: 'text-lavender-700', badge: 'bg-lavender-100 text-lavender-600', emoji: '🧠' },
  social:   { bg: 'bg-coral-50',    border: 'border-coral-200',    text: 'text-coral-700',    badge: 'bg-coral-100 text-coral-600',    emoji: '🤝' },
}

export default function DailyChallenge({ challenge, category, xp, userId, completed: initCompleted }: Props) {
  const [done, setDone]       = useState(initCompleted)
  const [saving, setSaving]   = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [currentChallenge, setCurrentChallenge] = useState(challenge)
  const [currentCat, setCurrentCat] = useState(category)

  const s = CATEGORY_STYLE[currentCat]

  async function complete() {
    setSaving(true)
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('social_challenges').upsert({
        user_id: userId,
        challenge: currentChallenge,
        week_start: today,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,week_start' })
      setDone(true)
    } finally {
      setSaving(false)
    }
  }

  async function skip() {
    setSkipping(true)
    try {
      const res = await fetch('/api/daily-challenge', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setCurrentChallenge(data.challenge)
        setCurrentCat(data.category)
        setDone(false)
      }
    } finally {
      setSkipping(false)
    }
  }

  return (
    <div className={`rounded-2xl p-5 border ${s.bg} ${s.border} card-in`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className={`w-4 h-4 ${s.text}`} />
          <p className="text-[10px] font-bold text-warm-500 uppercase tracking-widest">Daily Challenge</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
            {s.emoji} {currentCat}
          </span>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            +{xp} XP
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={currentChallenge}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`text-sm font-semibold ${s.text} leading-relaxed mb-4`}
        >
          {currentChallenge}
        </motion.p>
      </AnimatePresence>

      <div className="flex gap-2">
        {!done ? (
          <>
            <button
              onClick={complete}
              disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 ${
                currentCat === 'physical' ? 'bg-sage-500' : currentCat === 'mental' ? 'bg-lavender-500' : 'bg-coral-500'
              }`}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              {saving ? 'Saving…' : 'Done it!'}
            </button>
            <button
              onClick={skip}
              disabled={skipping}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-warm-400 bg-white/60 hover:bg-white transition-all"
            >
              {skipping ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Skip
            </button>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 text-sm font-bold text-sage-600"
          >
            <CheckCircle2 className="w-4 h-4" />
            Challenge completed! +{xp} XP earned 🎉
          </motion.div>
        )}
      </div>
    </div>
  )
}
