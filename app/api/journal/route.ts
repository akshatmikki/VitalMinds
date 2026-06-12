import { generateJournalReflection } from '@/lib/ai/groq'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { content } = await req.json()
  const reflection = await generateJournalReflection(content)
  return Response.json({ reflection })
}
