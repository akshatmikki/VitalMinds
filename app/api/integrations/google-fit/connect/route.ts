import { createClient } from '@/lib/supabase/server'
import { getGoogleAuthUrl } from '@/lib/integrations/google-fit'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // State = user ID so we can match it in callback
  const url = getGoogleAuthUrl(user.id)
  return Response.redirect(url)
}
