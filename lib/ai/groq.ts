import Groq from 'groq-sdk'
import { calcWellnessScore, calcBMI } from '@/lib/health/calculations'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const MODEL = 'llama-3.1-8b-instant'

type HealthContext = {
  healthMetrics: Array<{
    date: string
    sleep_hours?: number | null
    steps?: number | null
    water_ml?: number | null
    weight_kg?: number | null
  }>
  habits: Array<{ id: string; name: string }>
  completedHabitIds: string[]
}

export function buildSystemPrompt(
  profile: { full_name?: string; goals?: string[]; height_cm?: number | null },
  recentMoods?: { score: number; note?: string | null }[],
  sessionType = 'companion',
  healthContext?: HealthContext
) {
  const name = profile?.full_name || 'friend'
  const goals = profile?.goals?.join(', ') || 'general wellness'
  const moodSummary = recentMoods?.length
    ? `Recent mood scores: ${recentMoods.map(m => m.score).join(', ')}/10.`
    : ''

  const personas: Record<string, string> = {
    companion: `You are Mind, a warm and empathetic AI wellness companion inside the VitalMind app.
You help with mental health, loneliness, emotional support, and general life advice.
You are NOT a replacement for professional therapy. If someone is in crisis, gently refer them to iCall India (8445680090).
Be conversational and genuinely curious. Ask ONE focused follow-up question per message to dig deeper into what the user is experiencing.
Use their health data to ask targeted, personal questions (e.g. "I noticed your sleep has been off lately — could that be connected to how you're feeling?").
Keep responses concise (3-5 sentences), warm, and non-judgmental.
When it helps guide the conversation, end your response on a new line with exactly: QUICK_REPLIES: option1 | option2 | option3
Each option must be under 6 words and feel like something the user would naturally say. Only include QUICK_REPLIES when they'd genuinely help — not every message.`,

    coach: `You are Mind, an encouraging health and fitness coach inside the VitalMind app.
Start conversations by asking 1-2 clarifying questions to understand the user's fitness level, schedule, and constraints before giving advice.
Reference their actual tracked data (steps, sleep, water, habits) to make feedback personal and specific.
Give one clear, actionable tip or ask one targeted question per message — never overwhelm.
Be motivating but realistic. Celebrate small wins, call out patterns, and hold them accountable gently.
When offering choices or next steps, end your response on a new line with exactly: QUICK_REPLIES: option1 | option2 | option3
Each option under 6 words.`,

    journal: `You are Mind, a reflective journaling guide inside the VitalMind app.
Guide users through deep self-reflection with thoughtful, open-ended questions.
After they share something, reflect back what you heard in 1-2 sentences, then ask ONE deeper follow-up question to help them go further.
Explore themes: what does this mean to them? what patterns do they notice? what would they tell a friend in this situation?
Keep it gentle, spacious, non-directive. Don't rush to solutions.
When it helps exploration, end your response on a new line with exactly: QUICK_REPLIES: option1 | option2 | option3
Each option under 6 words.`,
  }

  let healthSummary = ''
  if (healthContext && healthContext.healthMetrics.length > 0) {
    const todayMetrics = healthContext.healthMetrics[0]
    const scores = calcWellnessScore({
      todayMetrics,
      habits: healthContext.habits,
      completedHabitIds: healthContext.completedHabitIds,
      recentMoods: recentMoods ?? [],
      sevenDayMetrics: healthContext.healthMetrics,
    })

    const bmi = calcBMI(todayMetrics.weight_kg, profile.height_cm)
    const completedCount = healthContext.completedHabitIds.length
    const totalHabits = healthContext.habits.length
    const completedNames = healthContext.habits
      .filter(h => healthContext.completedHabitIds.includes(h.id))
      .map(h => h.name)

    healthSummary = `
Recent health data (last 7 days):
- Wellness score: ${scores.overall}/100 (sleep ${scores.sleep}, steps ${scores.steps}, hydration ${scores.hydration}, habits ${scores.habits}, mood ${scores.mood})
- Trend: ${scores.trend}
- Most recent sleep: ${todayMetrics.sleep_hours != null ? `${todayMetrics.sleep_hours}h` : 'not logged'}
- Most recent steps: ${todayMetrics.steps != null ? todayMetrics.steps.toLocaleString() : 'not logged'}
- Most recent water: ${todayMetrics.water_ml != null ? `${todayMetrics.water_ml}ml` : 'not logged'}
- Habits today: ${completedCount}/${totalHabits} completed${completedNames.length ? ` (${completedNames.join(', ')})` : ''}${bmi != null ? `\n- BMI: ${bmi}` : ''}`
  }

  return `${personas[sessionType] || personas.companion}

User's name: ${name}
User's wellness goals: ${goals}
${moodSummary}
${healthSummary}
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

// Returns emotion tags array, e.g. ["joy","anxiety","loneliness"]
export async function analyzeEmotion(text: string): Promise<string[]> {
  if (!text || text.length < 10) return []
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 60,
      messages: [
        {
          role: 'system',
          content: 'You are an emotion classifier. Return ONLY a JSON array of emotion strings from this list: joy, sadness, anger, fear, anxiety, loneliness, gratitude, hope, frustration, calm, love, excitement. Maximum 3 emotions. No explanation, just the JSON array.'
        },
        { role: 'user', content: text.slice(0, 500) }
      ]
    })
    const raw = response.choices[0].message.content?.trim() || '[]'
    return JSON.parse(raw)
  } catch {
    return []
  }
}

// Returns { crisis: boolean, severity: 'low'|'medium'|'high', message: string }
export async function detectCrisisSignals(text: string): Promise<{ crisis: boolean; severity: 'low' | 'medium' | 'high'; message: string }> {
  const NO_CRISIS = { crisis: false, severity: 'low' as const, message: '' }
  if (!text || text.length < 5) return NO_CRISIS

  // Fast keyword pre-screen before calling API
  const lower = text.toLowerCase()
  const crisisKeywords = ['suicid', 'kill myself', 'end my life', 'self harm', 'hurt myself', 'don\'t want to live', 'no reason to live', 'better off dead', 'want to die']
  const hasCrisisKeyword = crisisKeywords.some(kw => lower.includes(kw))
  if (!hasCrisisKeyword) return NO_CRISIS

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 80,
      messages: [
        {
          role: 'system',
          content: 'You are a mental health safety classifier. Return ONLY JSON: {"crisis": boolean, "severity": "low"|"medium"|"high"}. crisis=true means the text contains expressions of suicidal ideation, self-harm intent, or immediate danger. Be conservative — only flag genuine crisis signals, not sadness or frustration.'
        },
        { role: 'user', content: text.slice(0, 400) }
      ]
    })
    const raw = response.choices[0].message.content?.trim() || '{}'
    const result = JSON.parse(raw)
    if (!result.crisis) return NO_CRISIS
    return {
      crisis: true,
      severity: result.severity || 'medium',
      message: result.severity === 'high'
        ? 'Please reach out to a crisis line right now — iCall: 9152987821 (India) | 988 (US)'
        : 'It sounds like you\'re going through something really hard. You don\'t have to face this alone.'
    }
  } catch {
    return NO_CRISIS
  }
}

export async function generateWeeklyInsight(data: {
  userName: string
  avgMood: number | null
  avgSleep: number | null
  habitsCompleted: number
  totalHabits: number
  journalCount: number
  wellnessScore: number
  topEmotions: string[]
  moodTrend: 'up' | 'down' | 'stable'
}): Promise<{ narrative: string; highlights: string[] }> {
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are VitalMind's weekly insight writer. Write a warm, personal "Your Week in Review" summary.
Return ONLY JSON: { "narrative": "2-3 sentence personal narrative", "highlights": ["3 short bullet highlights, each under 12 words"] }
Be specific with the numbers. Celebrate wins. One gentle nudge if something needs attention. Warm, human, never clinical.`
        },
        {
          role: 'user',
          content: `Name: ${data.userName}
Avg mood: ${data.avgMood?.toFixed(1) ?? 'not logged'}/10 (trend: ${data.moodTrend})
Avg sleep: ${data.avgSleep?.toFixed(1) ?? 'not logged'}h
Habits: ${data.habitsCompleted}/${data.totalHabits} completed
Journal entries: ${data.journalCount}
Wellness score: ${data.wellnessScore}/100
Top emotions this week: ${data.topEmotions.join(', ') || 'not detected'}`
        }
      ]
    })
    const raw = response.choices[0].message.content?.trim() || '{}'
    return JSON.parse(raw)
  } catch {
    return { narrative: 'Keep going — every small step counts.', highlights: [] }
  }
}
