'use client'
// Attention Training — tap appearing dots in sequence to build sustained focus
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Dot = { id: number; x: number; y: number; color: string }

const COLORS = ['#2B9E8A', '#7C6FCD', '#F5A623', '#E85D6B', '#44BDA6']
const LEVELS = [
  { label: 'Calm',    showMs: 2200, gap: 1200 },
  { label: 'Focus',   showMs: 1600, gap: 900  },
  { label: 'Sharp',   showMs: 1100, gap: 700  },
  { label: 'Flow',    showMs: 800,  gap: 550  },
]

let _dotId = 0

export default function FocusDots() {
  const [running, setRunning] = useState(false)
  const [score, setScore]     = useState(0)
  const [misses, setMisses]   = useState(0)
  const [level, setLevel]     = useState(0)
  const [dot, setDot]         = useState<Dot | null>(null)
  const [streak, setStreak]   = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const gameRef  = useRef<HTMLDivElement>(null)

  const lvl = LEVELS[Math.min(level, LEVELS.length - 1)]

  const spawnDot = useCallback(() => {
    setDot({
      id:    ++_dotId,
      x:     15 + Math.random() * 70,
      y:     20 + Math.random() * 60,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })
    // Auto-miss if not tapped
    timerRef.current = setTimeout(() => {
      setDot(null)
      setMisses(m => { if (m + 1 >= 3) { stop(); return m + 1 } return m + 1 })
      setStreak(0)
      setTimeout(spawnDot, lvl.gap)
    }, lvl.showMs)
  }, [lvl])

  function start() {
    setScore(0); setMisses(0); setLevel(0); setStreak(0)
    setRunning(true)
  }

  useEffect(() => {
    if (running) spawnDot()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [running])

  function stop() {
    setRunning(false)
    setDot(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  function tapDot(e: React.MouseEvent) {
    e.stopPropagation()
    if (!dot) return
    clearTimeout(timerRef.current!)
    const newScore  = score + 1
    const newStreak = streak + 1
    setScore(newScore)
    setStreak(newStreak)
    setBestStreak(s => Math.max(s, newStreak))
    setLevel(Math.floor(newScore / 5))
    setDot(null)
    setTimeout(spawnDot, lvl.gap * 0.7)
  }

  return (
    <div className="bg-gradient-to-b from-cyan-50 to-teal-50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-teal-700">🎯 Focus Dots</p>
          <p className="text-[10px] text-teal-400">Tap dots before they vanish — trains attention</p>
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">{lvl.label}</span>
              <span className="text-[10px] text-red-400">❌ {misses}/3</span>
            </>
          )}
          <button
            onClick={running ? stop : start}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${running ? 'bg-red-100 text-red-600' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
          >
            {running ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      <div
        ref={gameRef}
        className="relative rounded-xl bg-white/60 border border-teal-100"
        style={{ height: 220 }}
        onClick={() => { if (running) { setMisses(m => m); } }}
      >
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <p className="text-3xl">🎯</p>
            <p className="text-xs font-semibold text-teal-700">Tap every dot before it disappears</p>
            <p className="text-[10px] text-teal-400">3 misses = game over · gets faster as you score</p>
            {score > 0 && <p className="text-xs font-bold text-teal-600 mt-1">Last: {score} pts · Best streak: {bestStreak}</p>}
          </div>
        )}

        <AnimatePresence>
          {dot && (
            <motion.button
              key={dot.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={tapDot}
              className="absolute w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
              style={{ left: `${dot.x}%`, top: `${dot.y}%`, backgroundColor: dot.color, transform: 'translate(-50%, -50%)' }}
            >
              •
            </motion.button>
          )}
        </AnimatePresence>

        {running && (
          <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] font-bold text-teal-600">
            <span>Score: {score}</span>
            <span>🔥 Streak: {streak}</span>
          </div>
        )}
      </div>
    </div>
  )
}
