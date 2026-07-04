'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wind, X, Play, Pause, RotateCcw } from 'lucide-react'
import Portal from '@/components/ui/Portal'

type Pattern = {
  name: string
  desc: string
  inhale: number
  hold1: number
  exhale: number
  hold2: number
  color: string
  bg: string
}

const PATTERNS: Pattern[] = [
  { name: '4-7-8',     desc: 'Calm anxiety fast',   inhale: 4, hold1: 7, exhale: 8, hold2: 0, color: '#7C6FCD', bg: 'from-lavender-50 to-purple-50'   },
  { name: 'Box',       desc: 'Focus & ground',      inhale: 4, hold1: 4, exhale: 4, hold2: 4, color: '#2B9E8A', bg: 'from-sage-50 to-teal-50'         },
  { name: '5-5',       desc: 'Everyday calm',       inhale: 5, hold1: 0, exhale: 5, hold2: 0, color: '#F59E0B', bg: 'from-amber-50 to-yellow-50'      },
]

type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'idle'

const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Breathe in…',
  hold1:  'Hold…',
  exhale: 'Breathe out…',
  hold2:  'Hold…',
  idle:   'Ready',
}

export default function BreathingExercise() {
  const [open, setOpen]             = useState(false)
  const [patternIdx, setPatternIdx] = useState(0)
  const [running, setRunning]       = useState(false)
  const [phase, setPhase]           = useState<Phase>('idle')
  const [timeLeft, setTimeLeft]     = useState(0)
  const [cycles, setCycles]         = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const phaseRef = useRef<Phase>('idle')

  const p = PATTERNS[patternIdx]

  function getPhaseSequence(): { phase: Phase; duration: number }[] {
    const seq: { phase: Phase; duration: number }[] = [
      { phase: 'inhale', duration: p.inhale },
    ]
    if (p.hold1 > 0) seq.push({ phase: 'hold1', duration: p.hold1 })
    seq.push({ phase: 'exhale', duration: p.exhale })
    if (p.hold2 > 0) seq.push({ phase: 'hold2', duration: p.hold2 })
    return seq
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setPhase('idle')
    setTimeLeft(0)
    phaseRef.current = 'idle'
  }

  function start() {
    const seq = getPhaseSequence()
    let seqIdx = 0
    let remaining = seq[0].duration

    setPhase(seq[0].phase)
    setTimeLeft(remaining)
    phaseRef.current = seq[0].phase
    setRunning(true)

    timerRef.current = setInterval(() => {
      remaining -= 1
      setTimeLeft(remaining)

      if (remaining <= 0) {
        seqIdx = (seqIdx + 1) % seq.length
        if (seqIdx === 0) setCycles(c => c + 1)
        remaining = seq[seqIdx].duration
        setPhase(seq[seqIdx].phase)
        phaseRef.current = seq[seqIdx].phase
        setTimeLeft(remaining)
      }
    }, 1000)
  }

  function toggle() {
    if (running) { stop() } else { start() }
  }

  function reset() {
    stop()
    setCycles(0)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // Circle scale: inhale=big, exhale=small, hold=maintain
  const circleScale = phase === 'inhale' ? 1.6 : phase === 'hold1' ? 1.6 : phase === 'exhale' ? 0.8 : 0.8
  const cycleDuration = phase === 'inhale' ? p.inhale : phase === 'exhale' ? p.exhale : 0.3

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-lavender-50 text-lavender-700 border border-lavender-200 hover:bg-lavender-100 transition-all hover:scale-105 active:scale-95"
      >
        <Wind className="w-4 h-4" />
        Breathe
      </button>

      <AnimatePresence>
        {open && (
          <Portal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) { stop(); setOpen(false) } }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-sm bg-gradient-to-br ${p.bg} rounded-3xl p-8 shadow-2xl`}
            >
              {/* Close */}
              <button onClick={() => { stop(); setOpen(false) }} className="absolute top-4 right-4 text-warm-400 hover:text-warm-600 transition-colors">
                <X className="w-5 h-5" />
              </button>

              {/* Pattern selector */}
              <div className="flex gap-2 mb-8 justify-center">
                {PATTERNS.map((pt, i) => (
                  <button
                    key={pt.name}
                    onClick={() => { reset(); setPatternIdx(i) }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      i === patternIdx
                        ? 'text-white shadow-md'
                        : 'bg-white/60 text-warm-500 hover:bg-white/80'
                    }`}
                    style={i === patternIdx ? { backgroundColor: pt.color } : {}}
                  >
                    {pt.name}
                  </button>
                ))}
              </div>

              {/* Animated circle */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  {/* Outer pulse ring */}
                  {running && (
                    <motion.div
                      className="absolute inset-0 rounded-full opacity-20"
                      style={{ backgroundColor: p.color }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  {/* Main circle */}
                  <motion.div
                    className="w-32 h-32 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: p.color }}
                    animate={{ scale: circleScale }}
                    transition={{ duration: cycleDuration, ease: 'easeInOut' }}
                  >
                    <div className="text-center text-white">
                      <p className="text-2xl font-black">{running && phase !== 'idle' ? timeLeft : '✦'}</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Phase label */}
              <div className="text-center mb-6">
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-bold text-warm-800"
                >
                  {PHASE_LABELS[phase]}
                </motion.p>
                <p className="text-sm text-warm-400 mt-1">{p.desc}</p>
                {cycles > 0 && (
                  <p className="text-xs text-warm-400 mt-1">{cycles} cycle{cycles !== 1 ? 's' : ''} completed</p>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={toggle}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-md"
                  style={{ backgroundColor: p.color }}
                >
                  {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {running ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={reset}
                  className="p-3 rounded-xl bg-white/60 text-warm-500 hover:bg-white/80 transition-all hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  )
}
