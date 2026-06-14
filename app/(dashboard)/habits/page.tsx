import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import HabitsClient from '@/components/habits/HabitsClient'

export default async function HabitsPage() {
  const user = await getUser()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: habits }, { data: todayLogs }] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', user!.id).eq('is_active', true).order('created_at'),
    supabase.from('habit_logs').select('*').eq('user_id', user!.id).eq('logged_date', today),
  ])

  return <HabitsClient userId={user!.id} habits={habits || []} todayLogs={todayLogs || []} />
}
