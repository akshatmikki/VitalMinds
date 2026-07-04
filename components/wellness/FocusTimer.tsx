'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react'

type Mode = 'focus' | 'break'

const MODES = {
  focus: { label: 'Focus',      minutes: 25, color: '#7C6FCD', icon: Brain  },
  break: { label: 'Short Break', minutes: 5,  color: '#2B9E8A', icon: Coffee },
}

export default function FocusTimer() {
  const [mode, setMode]       = useState<Mode>('focus')
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(MODES.focus.minutes * 60)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const m = MODES[mode]
  const total    = m.minutes * 60
  const progress = 1 - seconds / total
  const R        = 52
  const circ     = 2 * Math.PI * R
  const offset   = circ * (1 - progress)

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  function start() {
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          if (mode === 'focus') setSessions(n => n + 1)
          // Auto-switch mode
          const next: Mode = mode === 'focus' ? 'break' : 'focus'
          setMode(next)
          setSeconds(MODES[next].minutes * 60)
          return MODES[next].minutes * 60
        }
        return s - 1
      })
    }, 1000)
  }

  function pause() {
    clearInterval(intervalRef.current!)
    setRunning(false)
  }

  function reset() {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setSeconds(m.minutes * 60)
  }

  function switchMode(next: Mode) {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setMode(next)
    setSeconds(MODES[next].minutes * 60)
  }

  useEffect(() => () => clearInterval(intervalRef.current!), [])

  return (
    <div className="glass rounded-2xl p-5 card-in">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Focus Timer</p>
        {sessions > 0 && (
          <span className="text-xs font-semibold text-lavender-600 bg-lavender-50 px-2 py-0.5 rounded-full border border-lavender-100">
            {sessions} session{sessions !== 1 ? 's' : ''} today
          </span>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-5">
        {(Object.keys(MODES) as Mode[]).map(k => {
          const md = MODES[k]
          return (
            <button
              key={k}
              onClick={() => switchMode(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === k ? 'text-white' : 'bg-warm-100 text-warm-400 hover:bg-warm-200'
              }`}
              style={mode === k ? { backgroundColor: md.color } : {}}
            >
              <md.icon className="w-3 h-3" />
              {md.label}
            </button>
          )
        })}
      </div>

      {/* Ring timer */}
      <div className="flex items-center justify-center mb-5">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-36 h-36 -rotate-90 absolute" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#F0ECE6" strokeWidth="8" />
            <motion.circle
              cx="60" cy="60" r={R}
              fill="none" strokeWidth="8"
              stroke={m.color}
              strokeLinecap="round"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="relative text-center">
            <p className="text-3xl font-black text-warm-900 tabular-nums">{mm}:{ss}</p>
            <p className="text-[10px] text-warm-400 font-semibold uppercase tracking-wider mt-0.5">{m.label}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={running ? pause : start}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-md"
          style={{ backgroundColor: m.color }}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} className="p-2.5 rounded-xl bg-warm-100 text-warm-400 hover:bg-warm-200 transition-all hover:scale-105">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
