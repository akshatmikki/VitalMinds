'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, Heart } from 'lucide-react'

type Entry = { id: string; entry: string; emoji: string; created_at: string }

export default function GratitudeJar() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [input, setInput]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/gratitude')
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function add() {
    if (!input.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/gratitude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: input.trim() }),
      })
      const data = await res.json()
      if (data.entry) {
        setEntries(prev => [data.entry, ...prev])
        setInput('')
      }
    } finally {
      setSaving(false)
    }
  }

  const jarFill = Math.min(100, (entries.length / 20) * 100)
  const visible  = showAll ? entries : entries.slice(0, 6)

  return (
    <div className="glass rounded-2xl p-5 card-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Gratitude Jar</p>
        </div>
        <span className="text-[10px] text-warm-400">{entries.length} entries</span>
      </div>

      {/* Jar visual */}
      <div className="flex items-end justify-center mb-4">
        <div className="relative w-24 h-28">
          {/* Jar outline */}
          <svg viewBox="0 0 96 112" className="absolute inset-0 w-full h-full">
            {/* Jar body */}
            <path d="M 20 28 Q 16 30 14 40 L 10 95 Q 10 104 48 104 Q 86 104 86 95 L 82 40 Q 80 30 76 28 Z"
              fill="none" stroke="#D4C5B0" strokeWidth="2" />
            {/* Jar lid */}
            <rect x="18" y="20" width="60" height="12" rx="4" fill="none" stroke="#D4C5B0" strokeWidth="2" />
            {/* Fill */}
            <clipPath id="jarClip">
              <path d="M 20 28 Q 16 30 14 40 L 10 95 Q 10 104 48 104 Q 86 104 86 95 L 82 40 Q 80 30 76 28 Z" />
            </clipPath>
            <motion.rect
              x="10" y="104"
              width="76"
              initial={{ height: 0, y: 104 }}
              animate={{ height: jarFill * 0.76, y: 104 - jarFill * 0.76 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              fill="#FDA4AF"
              fillOpacity="0.4"
              clipPath="url(#jarClip)"
            />
          </svg>
          {/* Floating emojis inside jar */}
          <div className="absolute inset-0 flex items-center justify-center flex-wrap gap-0.5 px-4 pt-8">
            {entries.slice(0, 8).map((e, i) => (
              <motion.span
                key={e.id}
                className="text-sm"
                initial={{ scale: 0 }}
                animate={{ scale: 1, y: [0, -2, 0] }}
                transition={{ delay: i * 0.1, y: { duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' } }}
              >
                {e.emoji}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="I'm grateful for…"
          className="flex-1 text-sm bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 placeholder:text-warm-300 transition-all"
          maxLength={200}
        />
        <button
          onClick={add}
          disabled={saving || !input.trim()}
          className="px-3 py-2 rounded-xl bg-rose-400 text-white hover:bg-rose-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Recent entries */}
      {loading ? (
        <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-warm-300" /></div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {visible.map(e => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100"
              >
                <span className="text-base shrink-0">{e.emoji}</span>
                <p className="text-xs text-warm-700 leading-relaxed">{e.entry}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {entries.length > 6 && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="text-xs text-rose-400 hover:text-rose-600 transition-colors w-full text-center py-1"
            >
              {showAll ? 'Show less' : `+${entries.length - 6} more`}
            </button>
          )}
          {entries.length === 0 && (
            <p className="text-xs text-warm-300 text-center py-2">Add your first gratitude to fill the jar ✨</p>
          )}
        </div>
      )}
    </div>
  )
}
