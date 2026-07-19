'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Lightbulb, Loader2 } from 'lucide-react'

type Prediction = {
  score: number
  confidence: 'low' | 'medium' | 'high'
  reason: string
  tip: string
  dayOfWeek: string
}

const CONFIDENCE_COLOR = {
  high:   'text-sage-600 bg-sage-50 border-sage-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low:    'text-warm-400 bg-warm-50 border-warm-200',
}

function ScoreArc({ score }: { score: number }) {
  const pct   = (score - 1) / 9
  const R     = 40
  const circ  = Math.PI * R  // half-circle
  const fill  = circ * pct
  const color = score >= 7 ? '#2B9E8A' : score >= 5 ? '#F5A623' : '#E85D6B'

  return (
    <svg width="100" height="60" viewBox="0 0 100 60">
      {/* Track */}
      <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#F0ECE6" strokeWidth="8" strokeLinecap="round" />
      {/* Fill */}
      <motion.path
        d="M 10 55 A 40 40 0 0 1 90 55"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - fill }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      />
      <text x="50" y="52" textAnchor="middle" fontSize="20" fontWeight="900" fill={color}>
        {score}
      </text>
    </svg>
  )
}

export default function MoodPrediction() {
  const [data, setData]     = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    fetch('/api/mood/predict')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (error) return null
  if (loading) return (
    <div className="glass rounded-2xl p-5 flex items-center gap-2 text-warm-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Predicting tomorrow…</span>
    </div>
  )
  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 card-in"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-lavender-500" />
        <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">AI Mood Forecast</p>
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${CONFIDENCE_COLOR[data.confidence]}`}>
          {data.confidence} confidence
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <ScoreArc score={data.score} />
          <p className="text-[10px] text-warm-400 text-center -mt-1">{data.dayOfWeek}</p>
        </div>
        <div className="flex-1">
          <div className="flex items-start gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-lavender-400 shrink-0 mt-0.5" />
            <p className="text-xs text-warm-600 leading-relaxed">{data.reason}</p>
          </div>
          <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">{data.tip}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
