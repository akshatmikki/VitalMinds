'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'

type Insight = { insight: string; type: 'pattern' | 'win' | 'nudge'; icon: string }

const TYPE_STYLE = {
  pattern: { bg: 'bg-lavender-50', border: 'border-lavender-200', label: 'Pattern', labelColor: 'text-lavender-600' },
  win:     { bg: 'bg-sage-50',     border: 'border-sage-200',     label: 'Win 🎉',  labelColor: 'text-sage-600'     },
  nudge:   { bg: 'bg-amber-50',    border: 'border-amber-200',    label: 'Nudge',   labelColor: 'text-amber-600'    },
}

export default function SmartInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [idx, setIdx]           = useState(0)
  const [dir, setDir]           = useState(1)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(force = false) {
    force ? setRefreshing(true) : setLoading(true)
    try {
      const url = force ? '/api/insights?refresh=1' : '/api/insights'
      const res = await fetch(url)
      const data = await res.json()
      if (data.insights?.length) { setInsights(data.insights); setIdx(0) }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="glass rounded-2xl p-5 flex items-center gap-2 text-warm-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Analysing your patterns…</span>
    </div>
  )
  if (!insights.length) return null

  const ins = insights[idx]
  const s   = TYPE_STYLE[ins.type]

  function prev() { setDir(-1); setIdx(i => (i - 1 + insights.length) % insights.length) }
  function next() { setDir(1);  setIdx(i => (i + 1) % insights.length) }

  return (
    <div className="glass rounded-2xl p-5 card-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-lavender-500" />
          <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Smart Insights</p>
        </div>
        <button onClick={() => load(true)} className="text-warm-300 hover:text-warm-600 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className={`rounded-xl p-4 border ${s.bg} ${s.border} min-h-[80px] relative overflow-hidden`}>
        <span className={`text-[10px] font-bold uppercase tracking-wide ${s.labelColor} mb-2 block`}>{s.label}</span>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={idx}
            custom={dir}
            initial={{ x: dir * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dir * 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2"
          >
            <span className="text-xl shrink-0">{ins.icon}</span>
            <p className="text-sm text-warm-700 leading-relaxed">{ins.insight}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-3">
        <button onClick={prev} className="p-1.5 rounded-lg bg-warm-100 text-warm-400 hover:bg-warm-200 transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex gap-1">
          {insights.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === idx ? 'w-4 h-1.5 bg-lavender-400' : 'w-1.5 h-1.5 bg-warm-200'}`} />
          ))}
        </div>
        <button onClick={next} className="p-1.5 rounded-lg bg-warm-100 text-warm-400 hover:bg-warm-200 transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
