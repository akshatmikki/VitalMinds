'use client'
import { motion } from 'framer-motion'

type Props = { avgScore: number; trend: string }

const WEATHER = [
  { min: 8.5, label: 'Radiant',    emoji: '☀️',  desc: 'You\'re glowing',      bg: 'from-amber-50 to-yellow-50',  border: 'border-amber-200',  text: 'text-amber-700'    },
  { min: 7,   label: 'Mostly Sunny', emoji: '⛅', desc: 'Feeling good',         bg: 'from-amber-50 to-sage-50',    border: 'border-sage-200',   text: 'text-sage-700'     },
  { min: 5.5, label: 'Partly Cloudy', emoji: '🌤', desc: 'Mixed feelings',       bg: 'from-warm-50 to-slate-50',    border: 'border-warm-200',   text: 'text-warm-600'     },
  { min: 4,   label: 'Overcast',    emoji: '☁️',  desc: 'A bit heavy',          bg: 'from-slate-50 to-blue-50',    border: 'border-slate-200',  text: 'text-slate-600'    },
  { min: 0,   label: 'Stormy',      emoji: '⛈',  desc: 'Rough patch — you\'ll weather it', bg: 'from-indigo-50 to-purple-50', border: 'border-lavender-200', text: 'text-lavender-700' },
]

const TREND_LABEL: Record<string, string> = { up: '↑ Improving', down: '↓ Declining', stable: '→ Steady', insufficient: '— Collecting data', insufficient_data: '— Collecting data' }

export default function EmotionalWeather({ avgScore, trend }: Props) {
  const w = WEATHER.find(w => avgScore >= w.min) ?? WEATHER[WEATHER.length - 1]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl p-5 bg-gradient-to-br ${w.bg} border ${w.border} card-in`}
    >
      <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-3">Emotional Weather</p>
      <div className="flex items-center gap-3">
        <motion.span
          className="text-4xl"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {w.emoji}
        </motion.span>
        <div>
          <p className={`text-lg font-black ${w.text}`}>{w.label}</p>
          <p className="text-xs text-warm-500">{w.desc}</p>
        </div>
        <div className="ml-auto text-right">
          <p className={`text-2xl font-black ${w.text}`}>{avgScore.toFixed(1)}</p>
          <p className={`text-[10px] font-semibold ${w.text} opacity-70`}>{TREND_LABEL[trend]}</p>
        </div>
      </div>
    </motion.div>
  )
}
