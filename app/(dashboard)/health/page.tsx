import { createClient } from '@/lib/supabase/server'
import HealthClient from '@/components/health/HealthClient'

export default async function HealthPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: todayMetrics }, { data: history }] = await Promise.all([
    supabase.from('health_metrics').select('*').eq('user_id', user!.id).eq('date', today).single(),
    supabase.from('health_metrics').select('*').eq('user_id', user!.id)
      .order('date', { ascending: false }).limit(14),
  ])

  return <HealthClient userId={user!.id} todayMetrics={todayMetrics} history={history || []} />
}
