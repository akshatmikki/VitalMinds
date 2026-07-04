'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Calendar, CheckCircle2 } from 'lucide-react'

const CATEGORY_COLOR: Record<string, string> = {
  physical:    'bg-sage-100 text-sage-600',
  mental:      'bg-lavender-100 text-lavender-600',
  social:      'bg-coral-100 text-coral-600',
  sleep:       'bg-indigo-100 text-indigo-600',
  nutrition:   'bg-amber-100 text-amber-600',
  productivity:'bg-cyan-100 text-cyan-600',
}

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-sage-100 text-sage-600',
  completed: 'bg-amber-100 text-amber-600',
  paused:    'bg-warm-100 text-warm-400',
}

type Props = {
  plan: {
    id: string
    title: string
    description: string
    duration_days: number
    focus_areas: string[]
    week_theme: string | null
    status: string
    start_date: string
    totalTasks: number
    completedTasks: number
  }
  index: number
}

export default function PlanCard({ plan, index }: Props) {
  const pct = plan.totalTasks > 0 ? Math.round((plan.completedTasks / plan.totalTasks) * 100) : 0

  return (
    <Link href={`/plans/${plan.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="glass rounded-2xl p-5 border border-warm-200 hover:border-warm-300 transition-all hover:scale-[1.01] group cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[plan.status]}`}>
                {plan.status}
              </span>
              <span className="text-[10px] text-warm-300">{plan.duration_days}-day plan</span>
            </div>

            <h3 className="font-bold text-warm-900 group-hover:text-sage-700 transition-colors">{plan.title}</h3>
            <p className="text-xs text-warm-500 mt-0.5">{plan.description}</p>

            {plan.week_theme && (
              <p className="text-xs text-lavender-600 font-medium mt-1 italic">✦ {plan.week_theme}</p>
            )}

            {/* Focus area chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              {plan.focus_areas.map(area => (
                <span key={area} className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${CATEGORY_COLOR[area] ?? 'bg-warm-100 text-warm-500'}`}>
                  {area}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-xs text-warm-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{plan.completedTasks}/{plan.totalTasks}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-warm-400">
              <Calendar className="w-3 h-3" />
              <span>{new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-warm-300 group-hover:text-warm-600 transition-colors" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 rounded-full bg-warm-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-sage-400"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, delay: index * 0.05 + 0.2 }}
          />
        </div>
        <p className="text-[10px] text-warm-400 mt-1">{pct}% complete</p>
      </motion.div>
    </Link>
  )
}
