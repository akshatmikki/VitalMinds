'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { formatTime } from '@/lib/utils'

export default function RoomChat({ room, initialMessages, userId, userName }: any) {
  const [messages, setMessages]   = useState(initialMessages)
  const [input, setInput]         = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [sending, setSending]     = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const supabase                  = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`room:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'room_messages',
        filter: `room_id=eq.${room.id}`,
      }, async (payload) => {
        const { data: msg } = await supabase
          .from('room_messages')
          .select('*, profiles(full_name,avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (msg) setMessages((prev: any[]) => [...prev, msg])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room.id, supabase])

  async function sendMessage() {
    if (!input.trim() || sending) return
    setSending(true)
    await supabase.from('room_messages').insert({
      room_id: room.id, user_id: userId,
      content: input.trim(), is_anonymous: anonymous,
    })
    setInput(''); setSending(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="chat-page">

      {/* Header */}
      <header className="chat-header gap-3">
        <Link
          href="/community"
          className="p-1.5 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors shrink-0"
          aria-label="Back to community"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 glass-cyan">
          {room.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-warm-900 text-sm leading-tight truncate">{room.name}</p>
          <p className="text-[10px] text-warm-400 truncate">{room.description}</p>
        </div>

        <button
          type="button"
          onClick={() => setAnonymous(!anonymous)}
          className={`roomchat-anon-btn shrink-0 ${anonymous ? 'roomchat-anon-btn-on' : 'roomchat-anon-btn-off'}`}
        >
          {anonymous ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          <span className="hidden sm:inline">{anonymous ? 'Anon' : 'Named'}</span>
        </button>
      </header>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
            <span className="text-5xl mb-3 float">{room.emoji}</span>
            <p className="font-semibold text-warm-600 text-lg">{room.name}</p>
            <p className="text-sm text-warm-400 mt-1">Be the first to say something</p>
            <p className="text-xs text-warm-300 mt-0.5">This is a safe, supportive space</p>
          </div>
        )}

        {messages.map((msg: any) => {
          const isMe        = msg.user_id === userId
          const initials    = msg.is_anonymous ? '?' : (msg.profiles?.full_name?.[0] || '?')
          const displayName = msg.is_anonymous ? 'Anonymous' : (isMe ? 'You' : msg.profiles?.full_name)

          return (
            <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${
                isMe ? 'roomchat-avatar-me' : 'roomchat-avatar-other'
              }`}>
                {initials}
              </div>

              <div className={`max-w-[78%] sm:max-w-[68%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <p className={`text-[10px] text-warm-400 mb-1 font-medium ${isMe ? 'text-right' : ''}`}>
                  {displayName} · {formatTime(msg.created_at)}
                </p>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe ? 'chat-user-bubble' : 'glass text-warm-700 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Share something…"
            rows={1}
            className="flex-1 resize-none text-sm text-warm-700 placeholder-warm-400 max-h-24 overflow-y-auto outline-none mood-note-input px-4 py-3"
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="chat-send-btn shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-center text-warm-400 mt-2">
          Be kind · Be supportive · You are not alone
        </p>
      </div>
    </div>
  )
}
