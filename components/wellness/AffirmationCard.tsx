'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronLeft, ChevronRight, Heart } from 'lucide-react'

const AFFIRMATIONS = [
  { text: "I am doing my best, and my best is enough.",              emoji: "🌱" },
  { text: "Every small step I take is progress worth celebrating.",   emoji: "🎯" },
  { text: "My feelings are valid, and I allow myself to feel them.", emoji: "💙" },
  { text: "I choose to focus on what I can control.",                emoji: "🌊" },
  { text: "Rest is not laziness — it is essential for my growth.",   emoji: "🌙" },
  { text: "I am stronger than the challenges I face.",               emoji: "💪" },
  { text: "I deserve kindness, starting with the kindness I show myself.", emoji: "🌸" },
  { text: "Today I will do one thing that brings me joy.",           emoji: "✨" },
  { text: "I am worthy of connection and belonging.",                emoji: "🤝" },
  { text: "Healing is not linear, and that is perfectly okay.",      emoji: "🦋" },
]

function getDailyIndex() {
  const day = Math.floor(Date.now() / 86400000)
  return day % AFFIRMATIONS.length
}

export default function AffirmationCard() {
  const [idx, setIdx]     = useState(getDailyIndex())
  const [dir, setDir]     = useState(1)
  const [liked, setLiked] = useState(false)

  const aff = AFFIRMATIONS[idx]

  function next() {
    setDir(1)
    setLiked(false)
    setIdx(i => (i + 1) % AFFIRMATIONS.length)
  }

  function prev() {
    setDir(-1)
    setLiked(false)
    setIdx(i => (i - 1 + AFFIRMATIONS.length) % AFFIRMATIONS.length)
  }

  return (
    <div className="glass rounded-2xl p-5 card-in overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <p className="text-[10px] font-bold text-warm-500 uppercase tracking-widest">Daily Affirmation</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-warm-300">{idx + 1}/{AFFIRMATIONS.length}</span>
          <motion.button
            onClick={() => setLiked(l => !l)}
            whileTap={{ scale: 1.4 }}
            className="transition-colors"
          >
            <Heart className={`w-4 h-4 transition-colors ${liked ? 'text-red-400 fill-red-400' : 'text-warm-300'}`} />
          </motion.button>
        </div>
      </div>

      <div className="relative min-h-[80px] flex items-center">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={idx}
            custom={dir}
            initial={{ x: dir * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dir * 60, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            <p className="text-3xl mb-3 text-center">{aff.emoji}</p>
            <p className="text-sm font-semibold text-warm-700 leading-relaxed text-center italic">
              &ldquo;{aff.text}&rdquo;
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-3 mt-4">
        <button onClick={prev} className="p-2 rounded-xl bg-warm-100 text-warm-400 hover:bg-warm-200 transition-all hover:scale-105">
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1">
          {AFFIRMATIONS.slice(0, 5).map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === idx % 5 ? 'w-4 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-warm-200'}`} />
          ))}
        </div>

        <button onClick={next} className="p-2 rounded-xl bg-warm-100 text-warm-400 hover:bg-warm-200 transition-all hover:scale-105">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
