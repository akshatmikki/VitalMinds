import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLessonContent } from '@/lib/ai/groq'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { lessonId } = await req.json()
  const supabase = createClient()

  // Check if already generated
  const { data: lesson } = await supabase
    .from('course_lessons')
    .select('*, courses(title, category)')
    .eq('id', lessonId)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (lesson.content) return NextResponse.json({ content: lesson.content })

  // Count total lessons for context
  const { count } = await supabase
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', params.id)

  const content = await generateLessonContent({
    title: lesson.title,
    courseTitle: (lesson.courses as any)?.title ?? '',
    courseCategory: (lesson.courses as any)?.category ?? '',
    lessonType: lesson.lesson_type,
    orderIndex: lesson.order_index,
    totalLessons: count ?? 0,
  })

  // Cache the generated content
  await supabase
    .from('course_lessons')
    .update({ content })
    .eq('id', lessonId)

  return NextResponse.json({ content })
}
