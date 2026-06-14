import type { SupabaseClient } from '@supabase/supabase-js'

export const XP_VALUES = {
  mood_log:      10,
  habit_complete: 20,
  journal_entry: 30,
  chat_session:  50,
  health_log:    15,
} as const

export type XPAction = keyof typeof XP_VALUES

export const LEVELS = [
  { level: 1, name: 'Seedling',  minXP: 0    },
  { level: 2, name: 'Sprout',    minXP: 100  },
  { level: 3, name: 'Blooming',  minXP: 300  },
  { level: 4, name: 'Thriving',  minXP: 600  },
  { level: 5, name: 'Radiant',   minXP: 1000 },
]

export function getLevelInfo(totalXP: number) {
  let current = LEVELS[0]
  let next = LEVELS[1]
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) { current = LEVELS[i]; next = LEVELS[i + 1] ?? null; break }
  }
  const xpIntoLevel = totalXP - current.minXP
  const xpNeeded = next ? next.minXP - current.minXP : 0
  const progress = next ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)) : 100
  return { current, next, progress, xpIntoLevel, xpNeeded }
}

export async function awardXP(userId: string, action: XPAction, supabase: SupabaseClient) {
  const xp = XP_VALUES[action]
  const { data: existing } = await supabase
    .from('user_xp').select('total_xp').eq('user_id', userId).single()

  const newTotal = (existing?.total_xp ?? 0) + xp
  const newLevel = LEVELS.reduce((acc, l) => newTotal >= l.minXP ? l.level : acc, 1)

  await supabase.from('user_xp').upsert({
    user_id: userId,
    total_xp: newTotal,
    level: newLevel,
    updated_at: new Date().toISOString(),
  })

  return { newTotal, newLevel, xpEarned: xp }
}

export async function updateStreak(userId: string, supabase: SupabaseClient) {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('wellness_streaks').select('*').eq('user_id', userId).single()

  const last = data?.last_active_date
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]

  let newStreak = 1
  if (last === yesterday) newStreak = (data.current_streak ?? 0) + 1
  else if (last === today) newStreak = data.current_streak ?? 1

  const longest = Math.max(newStreak, data?.longest_streak ?? 0)

  await supabase.from('wellness_streaks').upsert({
    user_id: userId,
    current_streak: newStreak,
    longest_streak: longest,
    last_active_date: today,
    updated_at: new Date().toISOString(),
  })

  return newStreak
}

export async function checkAndAwardBadges(
  userId: string,
  supabase: SupabaseClient,
  context: {
    moodCount?: number
    journalCount?: number
    habitStreak?: number
    communityMessages?: number
    wellnessScore?: number
    chatCount?: number
    sleepStreak?: number
    moodStreak?: number
  }
): Promise<string[]> {
  const { data: earned } = await supabase
    .from('user_badges').select('badge_id').eq('user_id', userId)
  const earnedIds = new Set((earned ?? []).map((b: any) => b.badge_id))
  const toAward: string[] = []

  const check = (badgeId: string, condition: boolean) => {
    if (condition && !earnedIds.has(badgeId)) toAward.push(badgeId)
  }

  check('mood_starter',     (context.moodCount ?? 0) >= 1)
  check('mood_week',        (context.moodStreak ?? 0) >= 7)
  check('mood_master',      (context.moodCount ?? 0) >= 30)
  check('journal_starter',  (context.journalCount ?? 0) >= 1)
  check('habit_starter',    (context.habitStreak ?? 0) >= 1)
  check('habit_week',       (context.habitStreak ?? 0) >= 7)
  check('sleep_champ',      (context.sleepStreak ?? 0) >= 5)
  check('community_helper', (context.communityMessages ?? 0) >= 10)
  check('chat_opener',      (context.chatCount ?? 0) >= 1)
  check('wellness_50',      (context.wellnessScore ?? 0) >= 50)
  check('wellness_80',      (context.wellnessScore ?? 0) >= 80)

  if (toAward.length > 0) {
    await supabase.from('user_badges').upsert(
      toAward.map(badge_id => ({ user_id: userId, badge_id })),
      { onConflict: 'user_id,badge_id' }
    )
  }

  return toAward
}
