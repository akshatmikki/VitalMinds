import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, MessageCircle, Globe } from 'lucide-react'

export default async function CommunityPage() {
  const supabase = createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_private', false)
    .order('member_count', { ascending: false })

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6 card-in">
        <p className="text-[10px] font-bold tracking-[0.2em] text-coral-500 uppercase mb-1">Safe Space</p>
        <h1 className="text-2xl font-bold text-warm-900">Community</h1>
        <p className="text-warm-400 text-sm mt-0.5">You are not alone. Connect with others on the same journey.</p>
      </div>

      {/* Stats bar */}
      <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-4 card-in stagger-1">
        <Globe className="w-4 h-4 text-sage-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-warm-600">
            <span className="neon-cyan">{rooms?.length || 0}</span> rooms open now
          </p>
          <p className="text-[10px] text-warm-400">Anonymous posting available in all rooms</p>
        </div>
        <div className="w-2 h-2 bg-sage-400 rounded-full shrink-0" />
      </div>

      {/* Rooms grid */}
      {rooms && rooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map((room, i) => {
            const idx = i % 4
            return (
              <Link
                key={room.id}
                href={`/community/${room.id}`}
                className={`community-room-card community-room-card-${idx} shimmer card-in stagger-${Math.min(i + 2, 6)}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`community-room-icon-${idx} w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                    {room.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-warm-800 leading-snug">{room.name}</p>
                    <p className="text-xs text-warm-400 mt-0.5 line-clamp-2 leading-relaxed">{room.description}</p>
                  </div>
                </div>

                <div className={`community-room-badge-${idx} flex items-center gap-3 text-[10px] font-bold`}>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {room.member_count || 0} members
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Join →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Globe className="w-10 h-10 mx-auto mb-3 text-warm-300" />
          <p className="text-warm-500 font-medium">No rooms yet</p>
          <p className="text-sm text-warm-400 mt-1">Community rooms will appear here</p>
        </div>
      )}
    </div>
  )
}
