import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, BookOpen } from 'lucide-react'
import CourseDetailClient from '@/components/learn/CourseDetailClient'

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const user = await getUser()
  const supabase = createClient()

  const [{ data: course }, { data: progress }] = await Promise.all([
    supabase.from('courses').select('*, course_lessons(*)').eq('slug', params.slug).single(),
    supabase.from('user_course_progress')
      .select('lesson_id, completed')
      .eq('user_id', user!.id),
  ])

  if (!course) notFound()

  const lessons = ((course.course_lessons as any[]) ?? []).sort((a: any, b: any) => a.order_index - b.order_index)
  const completedLessonIds = new Set(progress?.filter(p => p.completed).map(p => p.lesson_id) ?? [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm text-warm-400 hover:text-warm-700 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      <div className="glass rounded-2xl p-6 mb-6 card-in">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{course.emoji}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-warm-900">{course.title}</h1>
            <p className="text-warm-500 text-sm mt-1">{course.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-warm-400">
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{lessons.length} lessons</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_min} min total</span>
              <span className="capitalize font-medium text-warm-500">{course.level}</span>
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(course.tags ?? []).map((tag: string) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-warm-100 text-warm-500">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CourseDetailClient
        courseId={course.id}
        lessons={lessons}
        completedLessonIds={Array.from(completedLessonIds)}
        userId={user!.id}
      />
    </div>
  )
}
