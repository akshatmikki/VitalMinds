import { cache } from 'react'
import { createClient } from './server'

export const getUser = cache(async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getProfile = cache(async (userId: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, goals, timezone, height_cm, onboarding_done, avatar_url, bio')
    .eq('id', userId)
    .single()
  return data
})

export const getMoodLogs = cache(async (userId: string, days: number = 7) => {
  const supabase = createClient()
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const { data } = await supabase
    .from('mood_logs')
    .select('score, energy, anxiety, note, logged_at')
    .eq('user_id', userId)
    .gte('logged_at', since)
    .order('logged_at', { ascending: false })
  return data ?? []
})

export const getHealthMetrics = cache(async (userId: string, days: number = 7) => {
  const supabase = createClient()
  const since = new Date(Date.now() - days * 86_400_000).toISOString().split('T')[0]
  const { data } = await supabase
    .from('health_metrics')
    .select('date, sleep_hours, sleep_quality, steps, water_ml, weight_kg')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: false })
  return data ?? []
})

export const getTodaysHealthMetrics = cache(async (userId: string) => {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('health_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()
  return data
})

export const getActiveHabits = cache(async (userId: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from('habits')
    .select('id, name, category, icon')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at')
  return data ?? []
})

export const getHabitLogs = cache(async (userId: string, date: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from('habit_logs')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('logged_date', date)
  return data ?? []
})

export const getChatSessions = cache(async (userId: string, limit: number = 20) => {
  const supabase = createClient()
  const { data } = await supabase
    .from('chat_sessions')
    .select('id, title, session_type, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)
  return data ?? []
})
