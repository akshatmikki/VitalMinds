'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

const GLASS_ML = 250
const GOAL_ML  = 2000
const MAX_GLASSES = GOAL_ML / GLASS_ML // 8

type Props = { userId: string; initialMl: number; date: string }

export default function WaterTracker({ userId, initialMl, date }: Props) {
  const [ml, setMl] = useState(initialMl)
  const [saving, setSaving] = useState(false)
  const [lastTapped, setLastTapped] = useState<number | null>(null)

  const glasses    = Math.round(ml / GLASS_ML)
  const pct        = Math.min(100, Math.round((ml / GOAL_ML) * 100))
  const goalMet    = ml >= GOAL_ML

  async function setGlasses(n: number) {
    const newMl = n * GLASS_ML
    setMl(newMl)
    setLastTapped(n)
    setSaving(true)
    const supabase = createClient()
    await supabase.from('health_metrics').upsert(
      { user_id: userId, date, water_ml: newMl },
      { onConflict: 'user_id,date' }
    )
    setSaving(false)
    setTimeout(() => setLastTapped(null), 600)
  }

  return (
    <div className="glass rounded-2xl p-5 card-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Daily Water</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-warm-900">{ml}</span>
            <span className="text-sm text-warm-400">ml</span>
            {goalMet && <span className="text-sm">🎉</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-warm-400">{pct}% of goal</p>
          <p className="text-[10px] text-warm-300">{GOAL_ML - Math.min(ml, GOAL_ML)} ml left</p>
        </div>
      </div>

      {/* Glass grid — tap to set */}
      <div className="grid grid-cols-8 gap-1.5 mb-3">
        {Array.from({ length: MAX_GLASSES }, (_, i) => {
          const filled  = i < glasses
          const isLast  = lastTapped !== null && i === lastTapped - 1
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => setGlasses(filled && i === glasses - 1 ? i : i + 1)}
              whileTap={{ scale: 0.85 }}
              animate={isLast && lastTapped !== null ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`aspect-square rounded-lg flex items-center justify-center text-base transition-all ${
                filled
                  ? 'bg-cyan-400 shadow-sm'
                  : 'bg-warm-100 hover:bg-cyan-100'
              }`}
              title={`${(i + 1) * GLASS_ML} ml`}
            >
              {filled ? '💧' : <span className="text-warm-200 text-xs">○</span>}
            </motion.button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-warm-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-cyan-400"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-warm-300 mt-1.5 text-center">
        Tap a glass to log · {glasses}/{MAX_GLASSES} glasses
        {saving && ' · saving…'}
      </p>
    </div>
  )
}
