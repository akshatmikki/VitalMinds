'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

type Notification = {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
    setUnread((data ?? []).filter((n: Notification) => !n.is_read).length)
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  async function dismiss(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnread(prev => Math.max(0, prev - 1))
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); if (!open && unread > 0) markAllRead() }}
        className="relative p-2 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/[.08] transition-all"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 bg-[#1a1f2e] border border-white/[.10] rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[.08]">
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Notifications</p>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-teal-400 hover:text-teal-300 transition-colors">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-white/30 text-xs py-6">All caught up ✓</p>
            ) : notifications.map(n => (
              <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-white/[.05] hover:bg-white/[.03] transition-colors ${!n.is_read ? 'bg-teal-500/[.05]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/80 leading-tight">{n.title}</p>
                  <p className="text-[11px] text-white/45 mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-[10px] text-white/25 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <button onClick={() => dismiss(n.id)} className="text-white/20 hover:text-white/50 transition-colors shrink-0 p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
