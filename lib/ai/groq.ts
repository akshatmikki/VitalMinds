import Groq from 'groq-sdk'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const MODEL = 'llama-3.1-8b-instant'

export function buildSystemPrompt(profile: {
  full_name?: string
  goals?: string[]
}, recentMoods?: { score: number; note?: string }[], sessionType = 'companion') {
  const name = profile?.full_name || 'friend'
  const goals = profile?.goals?.join(', ') || 'general wellness'
  const moodSummary = recentMoods?.length
    ? `Recent mood scores: ${recentMoods.map(m => m.score).join(', ')}/10.`
    : ''

  const personas: Record<string, string> = {
    companion: `You are Mind, a warm and empathetic AI wellness companion inside the VitalMind app.
You help with mental health, loneliness, emotional support, and general life advice.
You are NOT a replacement for professional therapy. If someone is in crisis, gently refer them to iCall India (9152987821) or Vandrevala Foundation (1860-2662-345).
Be concise, warm, non-judgmental. Use simple language. Ask one follow-up question at a time.`,

    coach: `You are Mind, an encouraging health and fitness coach inside the VitalMind app.
Give practical, actionable advice on physical health, exercise, sleep, nutrition, and habits.
Be motivating but realistic. Personalize advice based on the user's goals and data.`,

    journal: `You are Mind, a reflective journaling guide inside the VitalMind app.
Help the user explore their thoughts and feelings through guided questions.
After they write, offer a brief compassionate reflection (2-3 sentences). Don't over-analyze.`,
  }

  return `${personas[sessionType] || personas.companion}

User's name: ${name}
User's wellness goals: ${goals}
${moodSummary}

Today's date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
Always respond in English unless the user writes in another language.`
}

export async function generateWellnessPlan(profile: {
  full_name?: string
  goals?: string[]
}, recentData: { avgMood: number; avgSleep: number; habitCompletion: number }) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: 'system',
        content: `You are a wellness plan generator. Return ONLY valid JSON, no markdown, no explanation.
Generate a 7-day wellness plan as JSON with this shape:
{
  "week_theme": "string",
  "days": [
    {
      "day": "Monday",
      "tasks": [
        { "time": "Morning", "task": "string", "category": "physical|mental|social", "duration": "string" }
      ]
    }
  ],
  "weekly_tip": "string"
}`
      },
      {
        role: 'user',
        content: `Create a personalized 7-day wellness plan for ${profile.full_name || 'this user'}.
Goals: ${profile.goals?.join(', ') || 'general wellness'}.
Current stats: avg mood ${recentData.avgMood}/10, avg sleep ${recentData.avgSleep}h, habit completion ${recentData.habitCompletion}%.
Make it achievable and balanced across physical, mental, and social wellness.`
      }
    ]
  })

  try {
    const text = response.choices[0].message.content || '{}'
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function generateJournalReflection(entry: string) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content: 'You are a compassionate journaling companion. Write a brief, warm reflection (2-3 sentences) on the journal entry. Be empathetic, non-judgmental. Do not give advice unless asked.'
      },
      { role: 'user', content: entry }
    ]
  })
  return response.choices[0].message.content || ''
}
