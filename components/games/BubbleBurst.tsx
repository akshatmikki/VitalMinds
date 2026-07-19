'use client'
// Stress Relief — pop floating worry bubbles to release tension
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WORRY_WORDS = [
  'Stress', 'Worry', 'Anxiety', 'Fear', 'Doubt',
  'Overthink', 'Pressure', 'Tension', 'Panic', 'Rush',
  'Overwhelm', 'Dread', 'Unease', 'Fret', 'Burden',
]

type Bubble = { id: number; word: string; x: number; size: number; speed: number; color: string }

const COLORS = [
  'from-lavender-300 to-purple-300',
  'from-blue-300 to-cyan-300',
  'from-rose-300 to-pink-300',
  'from-amber-300 to-orange-300',
  'from-teal-300 to-sage-300',
]

let _id = 0

export default function BubbleBurst() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [popped, setPopped]   = useState(0)
  const [active, setActive]   = useState(false)
  const [sparks, setSparks]   = useState<{ id: number; x: number; y: number }[]>([])

  const spawn = useCallback(() => {
    setBubbles(prev => {
      if (prev.length >= 8) return prev
      return [...prev, {
        id:    ++_id,
        word:  WORRY_WORDS[Math.floor(Math.random() * WORRY_WORDS.length)],
        x:     10 + Math.random() * 80,
        size:  56 + Math.random() * 36,
        speed: 6 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }]
    })
  }, [])

  useEffect(() => {
    if (!active) return
    spawn()
    const iv = setInterval(spawn, 1800)
    return () => clearInterval(iv)
  }, [active, spawn])

  function pop(id: number, e: React.MouseEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setSparks(s => [...s, { id: Date.now(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }])
    setTimeout(() => setSparks(s => s.filter(sp => sp.id !== _id)), 600)
    setBubbles(b => b.filter(b => b.id !== id))
    setPopped(p => p + 1)
  }

  function start() { setActive(true); setPopped(0); setBubbles([]) }
  function stop()  { setActive(false); setBubbles([]) }

  return (
    <div className="relative bg-gradient-to-b from-indigo-50 to-blue-100 rounded-2xl overflow-hidden" style={{ height: 340 }}>
      {/* Header */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
        <div>
          <p className="text-xs font-bold text-indigo-700">💭 Bubble Burst</p>
          <p className="text-[10px] text-indigo-400">Tap worries to pop them away</p>
        </div>
        <div className="flex items-center gap-2">
          {active && <span className="text-sm font-black text-indigo-700">{popped} popped</span>}
          <button
            onClick={active ? stop : start}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${active ? 'bg-rose-100 text-rose-600' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
          >
            {active ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {/* Bubbles */}
      <AnimatePresence>
        {bubbles.map(b => (
          <motion.button
            key={b.id}
            initial={{ y: '110%', opacity: 0.9, scale: 0.8 }}
            animate={{ y: '-120%', opacity: 1, scale: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: b.speed, ease: 'linear' }}
            onClick={e => pop(b.id, e)}
            className={`absolute bottom-0 rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer
              bg-gradient-to-br ${b.color} border-2 border-white/40 select-none
              hover:scale-110 active:scale-95 transition-transform`}
            style={{ left: `${b.x}%`, width: b.size, height: b.size, fontSize: b.size * 0.18 }}
          >
            {b.word}
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Spark effects */}
      <AnimatePresence>
        {sparks.map(sp => (
          <motion.div
            key={sp.id}
            initial={{ opacity: 1, scale: 0 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed pointer-events-none z-50 text-2xl"
            style={{ left: sp.x - 16, top: sp.y - 16 }}
          >
            ✨
          </motion.div>
        ))}
      </AnimatePresence>

      {!active && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl mb-2">💭</p>
            <p className="text-sm font-semibold text-indigo-700">Pop your worries away</p>
            <p className="text-xs text-indigo-400 mt-1">Each bubble = a worry released</p>
          </div>
        </div>
      )}

      {active && popped > 0 && popped % 10 === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <p className="text-2xl font-black text-indigo-700 bg-white/80 px-4 py-2 rounded-2xl shadow">
            {popped} worries released! 🎉
          </p>
        </motion.div>
      )}
    </div>
  )
}
