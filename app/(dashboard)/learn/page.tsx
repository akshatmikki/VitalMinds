import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import Link from 'next/link'
import { BookOpen, Clock, Zap, ChevronRight } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  anxiety: 'Anxiety',
  sleep: 'Sleep',
  stress: 'Stress',
  mindfulness: 'Mindfulness',
  confidence: 'Confidence',
  focus: 'Focus',
  relationships: 'Relationships',
  resilience: 'Resilience',
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  lavender: { bg: 'bg-lavender-50', border: 'border-lavender-200', text: 'text-lavender-700', badge: 'bg-lavender-100 text-lavender-600' },
  indigo:   { bg: 'bg-indigo-50',   border: 'border-indigo-200',   text: 'text-indigo-700',   badge: 'bg-indigo-100 text-indigo-600'   },
  sage:     { bg: 'bg-sage-50',     border: 'border-sage-200',     text: 'text-sage-700',     badge: 'bg-sage-100 text-sage-600'       },
  teal:     { bg: 'bg-teal-50',     border: 'border-teal-200',     text: 'text-teal-700',     badge: 'bg-teal-100 text-teal-600'       },
  amber:    { bg: 'bg-amber-50',    border: 'border-amber-200',    text: 'text-amber-700',    badge: 'bg-amber-100 text-amber-600'     },
  cyan:     { bg: 'bg-cyan-50',     border: 'border-cyan-200',     text: 'text-cyan-700',     badge: 'bg-cyan-100 text-cyan-600'       },
  coral:    { bg: 'bg-coral-50',    border: 'border-coral-200',    text: 'text-coral-700',    badge: 'bg-coral-100 text-coral-600'     },
  rose:     { bg: 'bg-rose-50',     border: 'border-rose-200',     text: 'text-rose-700',     badge: 'bg-rose-100 text-rose-600'       },
}

const LEVEL_BADGE: Record<string, string> = {
  beginner:     'bg-sage-100 text-sage-600',
  intermediate: 'bg-amber-100 text-amber-600',
  advanced:     'bg-rose-100 text-rose-600',
}

export default async function LearnPage() {
  const user = await getUser()
  const supabase = createClient()

  const [{ data: courses }, { data: progress }] = await Promise.all([
    supabase.from('courses').select('*').order('created_at'),
    supabase.from('user_course_progress')
      .select('course_id, completed')
      .eq('user_id', user!.id),
  ])

  // Build progress map: course_id -> completed count
  const progressMap: Record<string, number> = {}
  progress?.forEach(p => {
    if (p.completed) progressMap[p.course_id] = (progressMap[p.course_id] ?? 0) + 1
  })

  const startedCount = Object.keys(progressMap).length
  const completedCourses = courses?.filter(c => (progressMap[c.id] ?? 0) >= c.lesson_count).length ?? 0

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8 card-in">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-sage-500 uppercase mb-2">AI-Powered Learning</p>
        <h1 className="text-3xl font-bold grad-white-cyan">Wellness Courses</h1>
        <p className="text-warm-400 mt-1 text-sm">Evidence-based courses with AI-generated lesson content, tailored for you.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-4 card-in text-center">
          <p className="text-2xl font-black text-warm-900">{courses?.length ?? 0}</p>
          <p className="text-xs text-warm-400 mt-0.5">Courses</p>
        </div>
        <div className="glass rounded-2xl p-4 card-in text-center">
          <p className="text-2xl font-black text-lavender-700">{startedCount}</p>
          <p className="text-xs text-warm-400 mt-0.5">In Progress</p>
        </div>
        <div className="glass rounded-2xl p-4 card-in text-center">
          <p className="text-2xl font-black text-sage-700">{completedCourses}</p>
          <p className="text-xs text-warm-400 mt-0.5">Completed</p>
        </div>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(courses ?? []).map((course, i) => {
          const c = COLOR_MAP[course.color] ?? COLOR_MAP.lavender
          const done = progressMap[course.id] ?? 0
          const pct = course.lesson_count > 0 ? Math.round((done / course.lesson_count) * 100) : 0
          const started = done > 0

          return (
            <Link
              key={course.id}
              href={`/learn/${course.slug}`}
              className={`group rounded-2xl p-5 border ${c.bg} ${c.border} card-in stagger-${Math.min(i + 1, 6)} transition-all duration-200 hover:scale-[1.02] hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{course.emoji}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_BADGE[course.level]}`}>
                    {course.level}
                  </span>
                  {started && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                      {pct === 100 ? '✓ Done' : `${pct}%`}
                    </span>
                  )}
                </div>
              </div>

              <h3 className={`font-bold text-base ${c.text} mb-1 group-hover:underline underline-offset-2`}>
                {course.title}
              </h3>
              <p className="text-xs text-warm-500 leading-relaxed mb-3">{course.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {(course.tags ?? []).slice(0, 3).map((tag: string) => (
                  <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.badge} border border-current border-opacity-20`}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-warm-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {course.lesson_count} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.duration_min} min
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 ${c.text} opacity-50 group-hover:opacity-100 transition-opacity`} />
              </div>

              {/* Progress bar */}
              {started && (
                <div className="mt-3 h-1 rounded-full bg-white/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${c.text.replace('text-', 'bg-')}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* AI note */}
      <div className="mt-8 glass rounded-2xl p-5 card-in flex items-start gap-3">
        <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warm-800">AI-generated lesson content</p>
          <p className="text-xs text-warm-500 mt-0.5">
            Each lesson is written on-demand by our AI, tailored to your wellness context.
            Content is cached after the first generation so it loads instantly on return visits.
          </p>
        </div>
      </div>
    </div>
  )
}
