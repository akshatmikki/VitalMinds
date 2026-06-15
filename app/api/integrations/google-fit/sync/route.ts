import { createClient } from '@/lib/supabase/server'
import { fetchFitData, refreshAccessToken } from '@/lib/integrations/google-fit'
import { getUser } from '@/lib/supabase/cached'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const user = await getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { date } = await req.json().catch(() => ({}))
    const targetDate = date ?? new Date().toISOString().split('T')[0]

    // Load connection
    const { data: conn } = await supabase
      .from('wearable_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google_fit')
      .single()

    if (!conn) return new Response(JSON.stringify({ error: 'Not connected' }), { status: 404 })

    // Refresh token if expired
    let accessToken = conn.access_token
    if (new Date(conn.expires_at) <= new Date()) {
      const refreshed = await refreshAccessToken(conn.refresh_token)
      accessToken = refreshed.access_token
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      await supabase.from('wearable_connections').update({
        access_token: accessToken,
        expires_at:   newExpiry,
        updated_at:   new Date().toISOString(),
      }).eq('user_id', user.id)
    }

    const fitData = await fetchFitData(accessToken, targetDate)

    // Merge into health_metrics (only overwrite fields that Google Fit has data for)
    const updates: Record<string, any> = { user_id: user.id, date: targetDate }
    if (fitData.steps       != null) updates.steps       = fitData.steps
    if (fitData.sleep_hours != null) updates.sleep_hours = fitData.sleep_hours
    if (fitData.weight_kg   != null) updates.weight_kg   = fitData.weight_kg

    await supabase.from('health_metrics').upsert(updates, { onConflict: 'user_id,date' })
    await supabase.from('wearable_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return Response.json({ synced: true, data: fitData })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
