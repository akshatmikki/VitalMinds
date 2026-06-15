import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, fetchFitData } from '@/lib/integrations/google-fit'
import { redirect } from 'next/navigation'

export async function GET(req: Request) {
  const url    = new URL(req.url)
  const code   = url.searchParams.get('code')
  const userId = url.searchParams.get('state')
  const error  = url.searchParams.get('error')

  if (error || !code || !userId) {
    return redirect('/health?wearable=error')
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const supabase = createClient()

    // Store tokens
    await supabase.from('wearable_connections').upsert({
      user_id:       userId,
      provider:      'google_fit',
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at:    expiresAt,
      scope:         tokens.scope,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id' })

    // Immediately sync today's data
    const today = new Date().toISOString().split('T')[0]
    try {
      const fitData = await fetchFitData(tokens.access_token, today)
      const updates: Record<string, any> = { user_id: userId, date: today }
      if (fitData.steps       != null) updates.steps       = fitData.steps
      if (fitData.sleep_hours != null) updates.sleep_hours = fitData.sleep_hours
      if (fitData.weight_kg   != null) updates.weight_kg   = fitData.weight_kg

      await supabase.from('health_metrics').upsert(updates, { onConflict: 'user_id,date' })
      await supabase.from('wearable_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', userId)
    } catch {
      // Sync failed but connection saved — not fatal
    }

    return redirect('/health?wearable=connected')
  } catch {
    return redirect('/health?wearable=error')
  }
}
