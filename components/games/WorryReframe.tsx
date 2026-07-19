'use client'
// CBT Worry Reframer — type a worry, AI gives a balanced perspective (CBT cognitive reframing)
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCw, ArrowRight } from 'lucide-react'

const PROMPTS = [
  "What's been weighing on your mind?",
  "What worry is taking up space today?",
  "What thought keeps coming back?",
  "What are you most anxious about right now?",
]

const REFRAMES = [
  (w: string) => `Instead of "${w.toLowerCase()}", consider: this feeling is temporary and you have handled difficult situations before.`,
  (w: string) => `A balanced view of "${w.toLowerCase()}": What evidence supports it? What evidence doesn't? Often our minds focus on worst cases.`,
  (w: string) => `What would you tell a close friend who said "${w.toLowerCase()}"? That advice is also for you.`,
]

export default function WorryReframe() {
  const [worry, setWorry]     = useState('')
  const [result, setResult]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const prompt = PROMPTS[Math.floor(Date.now() / 86400000) % PROMPTS.length]

  async function reframe() {
    if (!worry.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/worry-reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worry }),
      })
      const data = await res.json()
      setResult(data.reframe || REFRAMES[Math.floor(Math.random() * REFRAMES.length)](worry))
      setDone(true)
    } catch {
      setResult(REFRAMES[Math.floor(Math.random() * REFRAMES.length)](worry))
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  function reset() { setWorry(''); setResult(''); setDone(false) }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-bold text-amber-700">🧠 Worry Reframer</p>
        <span className="text-[10px] text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded-full">CBT</span>
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs text-amber-700 mb-2">{prompt}</p>
            <textarea
              value={worry}
              onChange={e => setWorry(e.target.value)}
              placeholder="Type your worry here…"
              rows={3}
              maxLength={300}
              className="w-full text-sm bg-white/80 border border-amber-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 placeholder:text-amber-300 resize-none transition-all"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-amber-400">{worry.length}/300</span>
              <button
                onClick={reframe}
                disabled={!worry.trim() || loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-all hover:scale-105"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                {loading ? 'Thinking…' : 'Reframe it'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-2">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-1">Your worry</p>
              <p className="text-xs text-amber-800 bg-amber-100 rounded-lg px-3 py-2 italic">"{worry}"</p>
            </div>
            <div className="mb-3">
              <p className="text-[10px] font-bold text-sage-500 uppercase tracking-wide mb-1">Balanced perspective</p>
              <p className="text-xs text-warm-700 bg-white/80 rounded-xl px-3 py-2.5 leading-relaxed border border-amber-100">
                {result}
              </p>
            </div>
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 transition-colors">
              <RefreshCw className="w-3 h-3" /> Reframe another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
