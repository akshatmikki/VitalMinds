import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import { notFound } from 'next/navigation'
import RoomChat from '@/components/community/RoomChat'

export default async function RoomPage({ params }: { params: { roomId: string } }) {
  const user = await getUser()
  const supabase = createClient()

  const [{ data: room }, { data: messages }, { data: profile }] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', params.roomId).single(),
    supabase.from('room_messages').select('*, profiles(full_name,avatar_url)')
      .eq('room_id', params.roomId).order('created_at', { ascending: true }).limit(50),
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
  ])

  if (!room) notFound()

  return <RoomChat room={room} initialMessages={messages || []} userId={user!.id} userName={profile?.full_name || 'Anonymous'} />
}
