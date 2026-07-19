import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EMOJIS = ['🌸', '🌟', '🦋', '🌈', '🌺', '💫', '🌻', '✨', '🍀', '🌙', '💙', '🌿']

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('gratitude_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ entries: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entry } = await req.json()
  if (!entry?.trim()) return NextResponse.json({ error: 'Empty entry' }, { status: 400 })

  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]

  const { data, error } = await supabase
    .from('gratitude_entries')
    .insert({ user_id: user.id, entry: entry.trim(), emoji })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
