import { createClient } from '@/lib/supabase/server'
import { groq, MODEL, buildSystemPrompt, analyzeEmotion, detectCrisisSignals, aiErrorMessage } from '@/lib/ai/groq'
import { awardXP, updateStreak } from '@/lib/gamification'

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
        .select('*')
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

    // Crisis detection on the latest user message (non-blocking)
    const lastUserMsg = messages[messages.length - 1]?.content ?? ''
    const crisisResult = await detectCrisisSignals(lastUserMsg)

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
        // Send crisis signal if detected (before [DONE])
        if (crisisResult.crisis) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ crisis: crisisResult })}\n\n`))
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()

        // Fire-and-forget: emotion analysis + XP + streak (don't await in stream)
        const lastAssistantText = fullText.replace(/\n*QUICK_REPLIES:\s*[^\n]*$/m, '').trimEnd()
        analyzeEmotion(lastUserMsg).then(async (tags) => {
          if (tags.length > 0 && sessionId) {
            // Store emotion tags in the latest mood_log if one exists today
            const today = new Date().toISOString().split('T')[0]
            await supabase.from('mood_logs')
              .update({ emotion_tags: tags })
              .eq('user_id', user.id)
              .gte('logged_at', today)
              .order('logged_at', { ascending: false })
              .limit(1)
          }
        }).catch(() => {})

        // Award XP for chat session (first message of session only)
        if (sessionId && messages.length === 1) {
          awardXP(user.id, 'chat_session', supabase).catch(() => {})
          updateStreak(user.id, supabase).catch(() => {})
        }

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
    return new Response(JSON.stringify({ error: aiErrorMessage(error) }), { status: 500 })
  }
}
