'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { X, Sparkles, Loader2, Zap } from 'lucide-react'

const FOCUS_OPTIONS = [
  { id: 'anxiety',       label: 'Reduce Anxiety',    emoji: '🌊' },
  { id: 'sleep',         label: 'Better Sleep',       emoji: '🌙' },
  { id: 'stress',        label: 'Manage Stress',      emoji: '🌿' },
  { id: 'fitness',       label: 'Move More',          emoji: '💪' },
  { id: 'mindfulness',   label: 'Mindfulness',        emoji: '🧘' },
  { id: 'nutrition',     label: 'Eat Better',         emoji: '🥗' },
  { id: 'social',        label: 'Connect More',       emoji: '🤝' },
  { id: 'productivity',  label: 'Focus & Productivity', emoji: '🎯' },
]

const DURATIONS = [
  { days: 7,  label: '7 Days',  desc: 'Quick boost' },
  { days: 14, label: '14 Days', desc: 'Solid foundation' },
  { days: 21, label: '21 Days', desc: 'Habit forming' },
]

export default function GeneratePlanModal() {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [selected, setSelected]   = useState<string[]>([])
  const [duration, setDuration]   = useState(7)
  const [generating, setGenerating] = useState(false)
  const [error, setError]         = useState('')

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 4 ? [...s, id] : s)
  }

  async function generate() {
    if (selected.length === 0) { setError('Pick at least one focus area.'); return }
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusAreas: selected, durationDays: duration }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOpen(false)
      router.push(`/plans/${data.planId}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all hover:scale-105 active:scale-95 shadow-md"
      >
        <Sparkles className="w-4 h-4" />
        Generate Plan
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget && !generating) setOpen(false) }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h2 className="font-bold text-warm-900 text-lg">Create Your Plan</h2>
                </div>
                <button onClick={() => { if (!generating) setOpen(false) }} className="text-warm-300 hover:text-warm-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Duration */}
              <div className="mb-5">
                <p className="text-xs font-bold text-warm-400 uppercase tracking-widest mb-3">Duration</p>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.days}
                      onClick={() => setDuration(d.days)}
                      className={`py-3 rounded-xl text-center transition-all border ${
                        duration === d.days
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'border-warm-200 text-warm-500 hover:border-warm-300'
                      }`}
                    >
                      <p className="font-bold text-sm">{d.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-70">{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus areas */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-warm-400 uppercase tracking-widest">Focus Areas</p>
                  <span className="text-[10px] text-warm-300">{selected.length}/4 selected</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_OPTIONS.map(opt => {
                    const isSelected = selected.includes(opt.id)
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggle(opt.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all border ${
                          isSelected
                            ? 'bg-lavender-50 border-lavender-300 text-lavender-700'
                            : 'border-warm-200 text-warm-600 hover:border-warm-300 hover:bg-warm-50'
                        }`}
                      >
                        <span>{opt.emoji}</span>
                        <span className="text-xs font-semibold">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 mb-3">{error}</p>
              )}

              <div className="flex items-center gap-2">
                <div className="flex items-start gap-1.5 flex-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-warm-400 leading-relaxed">
                    AI analyses your mood, sleep & habit data to personalise each day.
                    This takes ~10 seconds.
                  </p>
                </div>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Building…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
