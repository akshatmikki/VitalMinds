'use client'
// Stress Relief — pop floating worry bubbles to release tension
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { playSound } from '@/lib/sound'
import { hapticTap, hapticSuccess } from '@/lib/haptics'

const WORRY_WORDS = [
  'Stress', 'Worry', 'Anxiety', 'Fear', 'Doubt',
  'Overthink', 'Pressure', 'Tension', 'Panic', 'Rush',
  'Overwhelm', 'Dread', 'Unease', 'Fret', 'Burden',
]

type Bubble = {
  id: number
  word: string
  x: number       // left offset, %
  size: number
  speed: number    // seconds to float from bottom to top
  color: string
  wobble: number    // px, horizontal sway amplitude while floating
  rotDir: 1 | -1
}

const COLORS = [
  'from-lavender-300 to-purple-300',
  'from-blue-300 to-cyan-300',
  'from-rose-300 to-pink-300',
  'from-amber-300 to-orange-300',
  'from-teal-300 to-sage-300',
]

let _id = 0
let _sparkId = 0

export default function BubbleBurst() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [popped, setPopped]   = useState(0)
  const [active, setActive]   = useState(false)
  const [sparks, setSparks]   = useState<{ id: number; x: number; y: number }[]>([])

  const containerRef   = useRef<HTMLDivElement>(null)
  const despawnTimers  = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  const spawn = useCallback(() => {
    setBubbles(prev => {
      if (prev.length >= 8) return prev
      const id    = ++_id
      const speed = 6 + Math.random() * 8
      const bubble: Bubble = {
        id,
        word:   WORRY_WORDS[Math.floor(Math.random() * WORRY_WORDS.length)],
        x:      10 + Math.random() * 80,
        size:   56 + Math.random() * 36,
        speed,
        color:  COLORS[Math.floor(Math.random() * COLORS.length)],
        wobble: 10 + Math.random() * 16,
        rotDir: Math.random() < 0.5 ? 1 : -1,
      }
      // Bubbles that drift off the top unpopped despawn on their own,
      // so the 8-bubble cap never gets stuck full of stale ones.
      despawnTimers.current[id] = setTimeout(() => {
        delete despawnTimers.current[id]
        setBubbles(p => p.filter(b => b.id !== id))
      }, speed * 1000 + 150)
      return [...prev, bubble]
    })
  }, [])

  useEffect(() => {
    if (!active) return
    spawn()
    const iv = setInterval(spawn, 1800)
    return () => clearInterval(iv)
  }, [active, spawn])

  function pop(b: Bubble, point?: { x: number; y: number }) {
    if (despawnTimers.current[b.id]) {
      clearTimeout(despawnTimers.current[b.id])
      delete despawnTimers.current[b.id]
    }
    if (point) {
      const id = ++_sparkId
      setSparks(s => [...s, { id, x: point.x, y: point.y }])
      setTimeout(() => setSparks(s => s.filter(sp => sp.id !== id)), 600)
    }
    setBubbles(prev => prev.filter(x => x.id !== b.id))
    setPopped(p => {
      const next = p + 1
      if (next % 10 === 0) { playSound('success'); hapticSuccess() }
      else { playSound('pop'); hapticTap() }
      return next
    })
  }

  function start() {
    setActive(true); setPopped(0); setBubbles([])
    Object.values(despawnTimers.current).forEach(clearTimeout)
    despawnTimers.current = {}
  }
  function stop() {
    setActive(false); setBubbles([])
    Object.values(despawnTimers.current).forEach(clearTimeout)
    despawnTimers.current = {}
  }

  return (
    <div ref={containerRef} className="relative bg-gradient-to-b from-indigo-50 to-blue-100 rounded-2xl overflow-hidden" style={{ height: 340 }}>
      {/* Header */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
        <div>
          <p className="text-xs font-bold text-indigo-700">💭 Bubble Burst</p>
          <p className="text-[10px] text-indigo-400">Tap or drag worries to pop them away</p>
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

      {/* Bubbles — no exit animation: a bubble is removed from state the
          instant it's popped or despawns, and vanishes immediately. Using
          AnimatePresence's `exit` here previously caused removed bubbles to
          linger as invisible, un-unmounted DOM nodes (the exit animation's
          completion promise never reliably resolved for these elements),
          leaking DOM nodes forever during a session. The spark burst at the
          pop location gives the "poof" feedback instead. */}
      {bubbles.map(b => (
        <motion.button
          key={b.id}
          drag
          dragConstraints={containerRef}
          dragElastic={0.2}
          dragMomentum={false}
          whileDrag={{ scale: 1.15, zIndex: 20 }}
          onDragEnd={(_e, info: PanInfo) => pop(b, info.point)}
          onClick={(e: React.MouseEvent) => pop(b, { x: e.clientX, y: e.clientY })}
          initial={{ y: '110%', opacity: 0.9, scale: 0.8, x: 0, rotate: 0 }}
          animate={{
            y: '-130%',
            opacity: 1,
            scale: 1,
            x: [0, b.wobble, -b.wobble, b.wobble * 0.6, -b.wobble * 0.6, b.wobble * 0.3, 0],
            rotate: [0, b.rotDir * 6, -b.rotDir * 6, b.rotDir * 4, -b.rotDir * 4, b.rotDir * 2, 0],
          }}
          transition={{
            y:       { duration: b.speed, ease: 'linear' },
            x:       { duration: b.speed, ease: 'easeInOut' },
            rotate:  { duration: b.speed, ease: 'easeInOut' },
            opacity: { duration: 0.2 },
            scale:   { duration: 0.2 },
          }}
          className={`absolute bottom-0 rounded-full flex items-center justify-center text-white font-bold shadow-lg
            bg-gradient-to-br ${b.color} border-2 border-white/40 select-none touch-none
            cursor-grab active:cursor-grabbing`}
          style={{ left: `${b.x}%`, width: b.size, height: b.size, fontSize: b.size * 0.18 }}
        >
          {b.word}
        </motion.button>
      ))}

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
            <p className="text-xs text-indigo-400 mt-1">Tap, or drag a bubble to release it</p>
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
