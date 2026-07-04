import { NextResponse } from 'next/server'

const CHALLENGES = [
  { challenge: 'Take a 10-minute walk outside and notice 3 things you find beautiful.', category: 'physical' },
  { challenge: 'Write down 3 things you are grateful for right now.', category: 'mental' },
  { challenge: 'Send a kind message to someone you haven\'t talked to in a while.', category: 'social' },
  { challenge: 'Do 5 minutes of stretching or yoga.', category: 'physical' },
  { challenge: 'Spend 10 minutes away from all screens — just breathe and be present.', category: 'mental' },
  { challenge: 'Drink an extra glass of water before your next meal.', category: 'physical' },
  { challenge: 'Call or video-chat someone you care about.', category: 'social' },
  { challenge: 'Write one page of stream-of-consciousness thoughts — don\'t overthink it.', category: 'mental' },
  { challenge: 'Do a random act of kindness today — hold a door, pay a compliment, help someone.', category: 'social' },
  { challenge: 'Put on your favourite song and let yourself fully enjoy it — no multitasking.', category: 'mental' },
  { challenge: 'Cook or prepare a meal from scratch, even a simple one.', category: 'physical' },
  { challenge: 'Reach out to someone and ask "how are you really doing?"', category: 'social' },
  { challenge: 'Take a 5-minute breathing break every 2 hours today.', category: 'mental' },
  { challenge: 'Go to bed 30 minutes earlier tonight.', category: 'physical' },
  { challenge: 'Share something you\'re proud of in the VitalMind community.', category: 'social' },
]

export async function GET() {
  const day = Math.floor(Date.now() / 86400000)
  const item = CHALLENGES[day % CHALLENGES.length]
  return NextResponse.json({ ...item, xp: 50 })
}

export async function POST() {
  // Return a random challenge different from today's
  const day = Math.floor(Date.now() / 86400000)
  const skip = day % CHALLENGES.length
  const pool = CHALLENGES.filter((_, i) => i !== skip)
  const item = pool[Math.floor(Math.random() * pool.length)]
  return NextResponse.json({ ...item, xp: 50 })
}
