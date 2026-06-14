import { createClient } from '@/lib/supabase/server'
import { groq, MODEL, buildSystemPrompt } from '@/lib/ai/groq'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, sessionType = 'companion', sessionId } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]

    const [
      { data: profile },
      { data: recentMoods },
      { data: healthMetrics },
      { data: habits },
      { data: todayHabitLogs },
    ] = await Promise.all([
      supabase.from('profiles').select('full_name, goals, height_cm').eq('id', user.id).single(),
      supabase.from('mood_logs').select('score, note').eq('user_id', user.id)
        .order('logged_at', { ascending: false }).limit(7),
      supabase.from('health_metrics')
        .select('date, sleep_hours, steps, water_ml, weight_kg')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false }),
      supabase.from('habits').select('id, name').eq('user_id', user.id).eq('is_active', true),
      supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('logged_date', today),
    ])

    const systemPrompt = buildSystemPrompt(
      profile || {},
      recentMoods || [],
      sessionType,
      {
        healthMetrics: healthMetrics || [],
        habits: habits || [],
        completedHabitIds: (todayHabitLogs || []).map((l: any) => l.habit_id),
      }
    )

    const stream = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-20),
      ],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        let fullText = ''
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) {
            fullText += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()

        if (sessionId) {
          const cleanedText = fullText.replace(/\n*QUICK_REPLIES:\s*[^\n]*$/m, '').trimEnd()
          const allMessages = [...messages, { role: 'assistant', content: cleanedText }]
          await supabase.from('chat_sessions').upsert({
            id: sessionId,
            user_id: user.id,
            session_type: sessionType,
            messages: allMessages,
            title: allMessages[0]?.content?.slice(0, 60) || 'New conversation',
            updated_at: new Date().toISOString(),
          })
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
