'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ChevronDown, Loader2, BookOpen, Dumbbell, Brain, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'

type Lesson = {
  id: string
  order_index: number
  title: string
  content: string | null
  duration_min: number
  lesson_type: string
}

type Props = {
  courseId: string
  lessons: Lesson[]
  completedLessonIds: string[]
  userId: string
}

const TYPE_ICON = {
  read:       { Icon: BookOpen,  label: 'Read',      color: 'text-lavender-500' },
  exercise:   { Icon: Dumbbell,  label: 'Exercise',  color: 'text-sage-500'     },
  reflection: { Icon: Brain,     label: 'Reflect',   color: 'text-amber-500'    },
}

export default function CourseDetailClient({ courseId, lessons, completedLessonIds: init, userId }: Props) {
  const [completed, setCompleted] = useState(new Set(init))
  const [open, setOpen]           = useState<string | null>(null)
  const [content, setContent]     = useState<Record<string, string>>({})
  const [loading, setLoading]     = useState<string | null>(null)

  const totalDone = completed.size
  const pct = lessons.length > 0 ? Math.round((totalDone / lessons.length) * 100) : 0

  async function openLesson(lesson: Lesson) {
    if (open === lesson.id) { setOpen(null); return }
    setOpen(lesson.id)

    // Already have content
    if (lesson.content || content[lesson.id]) return

    setLoading(lesson.id)
    try {
      const res = await fetch(`/api/courses/${courseId}/lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      })
      const data = await res.json()
      if (data.content) setContent(prev => ({ ...prev, [lesson.id]: data.content }))
    } finally {
      setLoading(null)
    }
  }

  async function markComplete(lessonId: string) {
    const supabase = createClient()
    const nowDone = !completed.has(lessonId)

    setCompleted(prev => {
      const next = new Set(prev)
      nowDone ? next.add(lessonId) : next.delete(lessonId)
      return next
    })

    await supabase.from('user_course_progress').upsert({
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      completed: nowDone,
      completed_at: nowDone ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,lesson_id' })
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="glass rounded-xl p-4 mb-2">
        <div className="flex justify-between text-xs text-warm-500 mb-2">
          <span>{totalDone} / {lessons.length} lessons completed</span>
          <span className="font-bold">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-warm-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-sage-400"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {pct === 100 && (
          <p className="text-xs text-sage-600 font-semibold mt-2 text-center">🎉 Course complete! You earned a badge.</p>
        )}
      </div>

      {lessons.map((lesson, i) => {
        const isDone    = completed.has(lesson.id)
        const isOpen    = open === lesson.id
        const isLoading = loading === lesson.id
        const body      = lesson.content || content[lesson.id]
        const typeInfo  = TYPE_ICON[lesson.lesson_type as keyof typeof TYPE_ICON] ?? TYPE_ICON.read

        return (
          <div key={lesson.id} className={`glass rounded-2xl overflow-hidden card-in stagger-${Math.min(i + 1, 6)} transition-all`}>
            {/* Lesson header */}
            <button
              onClick={() => openLesson(lesson)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-warm-50/50 transition-colors"
            >
              <button
                onClick={e => { e.stopPropagation(); markComplete(lesson.id) }}
                className="shrink-0 transition-all hover:scale-110"
              >
                {isDone
                  ? <CheckCircle2 className="w-5 h-5 text-sage-500" />
                  : <Circle className="w-5 h-5 text-warm-300" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-warm-300">L{lesson.order_index}</span>
                  <typeInfo.Icon className={`w-3 h-3 ${typeInfo.color}`} />
                  <span className={`text-[10px] font-bold ${typeInfo.color}`}>{typeInfo.label}</span>
                  <span className="text-[10px] text-warm-300">{lesson.duration_min} min</span>
                </div>
                <p className={`text-sm font-semibold ${isDone ? 'text-warm-400 line-through' : 'text-warm-800'}`}>
                  {lesson.title}
                </p>
              </div>

              <ChevronDown className={`w-4 h-4 text-warm-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Lesson content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-warm-100"
                >
                  <div className="p-5">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-warm-400 py-4 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating lesson with AI…</span>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </div>
                    ) : body ? (
                      <>
                        <div className="prose prose-sm max-w-none text-warm-700 leading-relaxed
                          prose-headings:text-warm-900 prose-headings:font-bold
                          prose-h2:text-base prose-h3:text-sm
                          prose-strong:text-warm-800
                          prose-li:text-warm-600
                          prose-p:text-warm-600">
                          <ReactMarkdown>{body}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() => markComplete(lesson.id)}
                          className={`mt-5 w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] ${
                            isDone
                              ? 'bg-warm-100 text-warm-400'
                              : 'bg-sage-500 text-white hover:bg-sage-600'
                          }`}
                        >
                          {isDone ? '✓ Marked as complete' : 'Mark as complete'}
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-warm-400 text-center py-4">Failed to load content. Try again.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
