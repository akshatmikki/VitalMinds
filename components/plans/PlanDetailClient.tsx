'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ChevronDown, Clock, Sun, Coffee, Moon } from 'lucide-react'

type Task = {
  id: string
  day_number: number
  day_label: string
  time_of_day: string
  task: string
  category: string
  duration_min: number
  completed: boolean
}

type Props = {
  planId: string
  tasks: Task[]
  durationDays: number
  startDate: string
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  physical:    { bg: 'bg-sage-100',     text: 'text-sage-600'     },
  mental:      { bg: 'bg-lavender-100', text: 'text-lavender-600' },
  social:      { bg: 'bg-coral-100',    text: 'text-coral-600'    },
  sleep:       { bg: 'bg-indigo-100',   text: 'text-indigo-600'   },
  nutrition:   { bg: 'bg-amber-100',    text: 'text-amber-600'    },
  productivity:{ bg: 'bg-cyan-100',     text: 'text-cyan-600'     },
}

const TIME_ICON: Record<string, { Icon: any; color: string }> = {
  Morning:   { Icon: Sun,    color: 'text-amber-500'    },
  Afternoon: { Icon: Coffee, color: 'text-coral-500'    },
  Evening:   { Icon: Moon,   color: 'text-lavender-500' },
}

export default function PlanDetailClient({ planId, tasks: initTasks, durationDays, startDate }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initTasks)
  const [openDay, setOpenDay] = useState<number>(() => {
    // Default open today's day
    const start = new Date(startDate)
    const today = new Date()
    const diffMs = today.getTime() - start.getTime()
    const dayNum = Math.min(Math.max(1, Math.ceil(diffMs / 86400000)), durationDays)
    return dayNum
  })

  const dayNums = Array.from(new Set(tasks.map(t => t.day_number))).sort((a, b) => a - b)

  async function toggleTask(taskId: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const newCompleted = !task.completed

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t))

    await fetch(`/api/plans/${planId}/task`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, completed: newCompleted }),
    })
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div>
      {/* Overall progress */}
      <div className="glass rounded-2xl p-4 mb-5">
        <div className="flex justify-between text-xs text-warm-500 mb-2">
          <span>{completedTasks} / {totalTasks} tasks done</span>
          <span className="font-bold">{pct}% complete</span>
        </div>
        <div className="h-2 rounded-full bg-warm-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-amber-400"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Day accordion */}
      <div className="space-y-2">
        {dayNums.map(dayNum => {
          const dayTasks = tasks.filter(t => t.day_number === dayNum)
          const dayLabel = dayTasks[0]?.day_label ?? `Day ${dayNum}`
          const dayDone  = dayTasks.filter(t => t.completed).length
          const isOpen   = openDay === dayNum
          const isToday  = (() => {
            const start = new Date(startDate)
            const today = new Date()
            const diffMs = today.getTime() - start.getTime()
            return Math.ceil(diffMs / 86400000) === dayNum
          })()

          return (
            <div key={dayNum} className={`glass rounded-2xl overflow-hidden border ${isToday ? 'border-amber-200' : 'border-warm-100'}`}>
              <button
                onClick={() => setOpenDay(isOpen ? 0 : dayNum)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-warm-50/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  dayDone === dayTasks.length && dayTasks.length > 0
                    ? 'bg-sage-500 text-white'
                    : isToday
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : 'bg-warm-100 text-warm-500'
                }`}>
                  {dayDone === dayTasks.length && dayTasks.length > 0 ? '✓' : dayNum}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-warm-800">{dayLabel}</span>
                    {isToday && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">Today</span>}
                  </div>
                  <span className="text-xs text-warm-400">{dayDone}/{dayTasks.length} tasks</span>
                </div>

                {/* Mini progress dots */}
                <div className="flex items-center gap-1">
                  {dayTasks.map(t => (
                    <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${t.completed ? 'bg-sage-400' : 'bg-warm-200'}`} />
                  ))}
                </div>

                <ChevronDown className={`w-4 h-4 text-warm-300 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-warm-100"
                  >
                    <div className="p-4 space-y-2">
                      {['Morning', 'Afternoon', 'Evening'].map(timeSlot => {
                        const slotTasks = dayTasks.filter(t => t.time_of_day === timeSlot)
                        if (slotTasks.length === 0) return null
                        const { Icon, color } = TIME_ICON[timeSlot] ?? TIME_ICON.Morning

                        return (
                          <div key={timeSlot}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Icon className={`w-3 h-3 ${color}`} />
                              <span className={`text-[10px] font-bold uppercase tracking-wide ${color}`}>{timeSlot}</span>
                            </div>
                            <div className="space-y-1.5 ml-4">
                              {slotTasks.map(task => {
                                const cat = CATEGORY_STYLE[task.category] ?? { bg: 'bg-warm-100', text: 'text-warm-500' }
                                return (
                                  <motion.div
                                    key={task.id}
                                    layout
                                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                                      task.completed ? 'bg-warm-50 border-warm-100 opacity-60' : 'bg-white border-warm-100 hover:border-warm-200'
                                    }`}
                                  >
                                    <button onClick={() => toggleTask(task.id)} className="shrink-0 mt-0.5 hover:scale-110 transition-transform">
                                      {task.completed
                                        ? <CheckCircle2 className="w-4 h-4 text-sage-500" />
                                        : <Circle className="w-4 h-4 text-warm-300" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-warm-400' : 'text-warm-800'}`}>
                                        {task.task}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${cat.bg} ${cat.text}`}>
                                          {task.category}
                                        </span>
                                        <span className="flex items-center gap-0.5 text-[10px] text-warm-300">
                                          <Clock className="w-2.5 h-2.5" />
                                          {task.duration_min} min
                                        </span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
