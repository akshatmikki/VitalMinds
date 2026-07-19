'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scan, X, Play, Pause, ChevronRight } from 'lucide-react'
import Portal from '@/components/ui/Portal'

const STEPS = [
  { region: 'Head & Face',      prompt: "Relax your forehead, jaw, and eyes. Let go of any tension you're holding in your face.",    duration: 20, y: 8  },
  { region: 'Neck & Shoulders', prompt: 'Notice any tightness in your neck or shoulders. With each exhale, let it soften.',         duration: 20, y: 18 },
  { region: 'Chest & Heart',    prompt: 'Place awareness on your chest. Feel it rise and fall. Let your heart rate slow naturally.', duration: 20, y: 32 },
  { region: 'Belly & Core',     prompt: 'Breathe deeply into your belly. Let it expand fully on each inhale, release on exhale.',   duration: 20, y: 46 },
  { region: 'Arms & Hands',     prompt: 'Soften your arms and open your hands. Feel warmth flowing to your fingertips.',            duration: 15, y: 54 },
  { region: 'Hips & Pelvis',    prompt: 'Let the weight of your hips sink. Release any holding here — this is where we store stress.', duration: 20, y: 62 },
  { region: 'Legs & Knees',     prompt: 'Scan down through your thighs, knees, and calves. Let them be heavy and relaxed.',         duration: 15, y: 76 },
  { region: 'Feet & Toes',      prompt: 'Feel the ground beneath you. Wiggle your toes. You are fully here, fully present.',        duration: 15, y: 90 },
]

export default function BodyScan() {
  const [open, setOpen]       = useState(false)
  const [step, setStep]       = useState(0)
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(STEPS[0].duration)
  const [done, setDone]       = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function startTimer() {
    setRunning(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (step < STEPS.length - 1) {
            const next = step + 1
            setStep(next)
            setTimeLeft(STEPS[next].duration)
            // auto continue
            setTimeout(() => startTimer(), 800)
          } else {
            setDone(true)
            setRunning(false)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  function pause() {
    clearInterval(timerRef.current!)
    setRunning(false)
  }

  function reset() {
    clearInterval(timerRef.current!)
    setRunning(false)
    setStep(0)
    setTimeLeft(STEPS[0].duration)
    setDone(false)
  }

  function close() {
    reset()
    setOpen(false)
  }

  useEffect(() => () => { clearInterval(timerRef.current!) }, [])

  const s = STEPS[step]
  const pct = ((s.duration - timeLeft) / s.duration) * 100

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-all hover:scale-105 active:scale-95"
      >
        <Scan className="w-4 h-4" />
        Body Scan
      </button>

      <AnimatePresence>
        {open && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={e => { if (e.target === e.currentTarget) close() }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-gradient-to-b from-teal-50 to-indigo-50 rounded-3xl p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-teal-600" />
                    <h2 className="font-bold text-warm-800">Body Scan</h2>
                  </div>
                  <button onClick={close} className="text-warm-300 hover:text-warm-600"><X className="w-5 h-5" /></button>
                </div>

                {done ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
                    <div className="text-5xl mb-4">✨</div>
                    <p className="text-lg font-bold text-teal-700 mb-2">Scan Complete</p>
                    <p className="text-sm text-warm-500 mb-6">You have fully arrived in your body. Carry this presence with you.</p>
                    <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-600 transition-all">
                      Start Again
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* Body figure with highlight */}
                    <div className="flex justify-center mb-5">
                      <div className="relative">
                        <svg viewBox="0 0 60 120" width="80" height="160">
                          {/* Simple body silhouette */}
                          <ellipse cx="30" cy="12" rx="10" ry="10" fill="#CBD5E1" />
                          <rect x="18" y="22" width="24" height="35" rx="4" fill="#CBD5E1" />
                          <rect x="4"  cy="24" width="14" height="30" rx="5" transform="rotate(-5 4 24)" fill="#CBD5E1" />
                          <rect x="42" cy="24" width="14" height="30" rx="5" transform="rotate(5 42 24)" fill="#CBD5E1" />
                          <rect x="20" y="57" width="9"  height="38" rx="4" fill="#CBD5E1" />
                          <rect x="31" y="57" width="9"  height="38" rx="4" fill="#CBD5E1" />
                          <rect x="20" y="93" width="9"  height="14" rx="3" fill="#CBD5E1" />
                          <rect x="31" y="93" width="9"  height="14" rx="3" fill="#CBD5E1" />

                          {/* Highlight pulse */}
                          <motion.ellipse
                            cx="30"
                            cy={s.y * 1.2}
                            rx="16"
                            ry="8"
                            fill="#2B9E8A"
                            fillOpacity="0.35"
                            animate={{ ry: [7, 10, 7], fillOpacity: [0.25, 0.45, 0.25] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Step progress dots */}
                    <div className="flex justify-center gap-1 mb-4">
                      {STEPS.map((_, i) => (
                        <div key={i} className={`rounded-full transition-all ${
                          i < step ? 'w-2 h-2 bg-teal-400' : i === step ? 'w-4 h-2 bg-teal-500' : 'w-2 h-2 bg-warm-200'
                        }`} />
                      ))}
                    </div>

                    <div className="text-center mb-4">
                      <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <p className="font-bold text-teal-700 mb-1">{s.region}</p>
                          <p className="text-xs text-warm-600 leading-relaxed">{s.prompt}</p>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Timer ring */}
                    <div className="flex justify-center mb-5">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="absolute -rotate-90" width="64" height="64" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="26" fill="none" stroke="#E2E8F0" strokeWidth="5" />
                          <motion.circle
                            cx="32" cy="32" r="26"
                            fill="none" strokeWidth="5"
                            stroke="#2B9E8A" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 26}`}
                            animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - pct / 100) }}
                            transition={{ duration: 0.5 }}
                          />
                        </svg>
                        <span className="text-lg font-black text-teal-700 tabular-nums">{timeLeft}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={running ? pause : startTimer}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 transition-all hover:scale-105"
                      >
                        {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {running ? 'Pause' : 'Start'}
                      </button>
                      {!running && step < STEPS.length - 1 && (
                        <button
                          onClick={() => { const n = step + 1; setStep(n); setTimeLeft(STEPS[n].duration) }}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 transition-all"
                        >
                          Skip <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  )
}
