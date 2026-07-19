import { NextRequest, NextResponse } from 'next/server'
import { groq, MODEL } from '@/lib/ai/groq'

export async function POST(req: NextRequest) {
  const { worry } = await req.json()
  if (!worry?.trim()) return NextResponse.json({ error: 'No worry provided' }, { status: 400 })

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are a compassionate CBT therapist giving a brief cognitive reframe.
In 2-3 sentences: acknowledge the feeling, offer a balanced perspective, and end with a small empowering thought.
Be warm, not dismissive. Never say "just" or "simply". No bullet points.`,
        },
        { role: 'user', content: `My worry: "${worry.trim()}"` },
      ],
    })
    return NextResponse.json({ reframe: res.choices[0].message.content })
  } catch {
    return NextResponse.json({ reframe: `It makes sense that "${worry}" feels heavy. Most worries feel bigger in our minds than they turn out to be in reality. You have navigated hard things before — this is one more you can work through.` })
  }
}
