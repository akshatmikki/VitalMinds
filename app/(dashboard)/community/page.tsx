import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, MessageCircle } from 'lucide-react'

export default async function CommunityPage() {
  const supabase = createClient()
  const { data: rooms } = await supabase.from('rooms').select('*').eq('is_private', false).order('member_count', { ascending: false })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community</h1>
        <p className="text-gray-400 text-sm mt-0.5">You are not alone. Connect with others on the same journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms?.map(room => (
          <Link key={room.id} href={`/community/${room.id}`}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-sm transition-all group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                {room.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{room.name}</p>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{room.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {room.member_count || 0} members</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Join conversation</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
