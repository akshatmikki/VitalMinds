'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { formatTime } from '@/lib/utils'

export default function RoomChat({ room, initialMessages, userId, userName }: any) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase.channel(`room:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'room_messages',
        filter: `room_id=eq.${room.id}`
      }, async (payload) => {
        const { data: msg } = await supabase.from('room_messages')
          .select('*, profiles(full_name,avatar_url)').eq('id', payload.new.id).single()
        if (msg) setMessages((prev: any[]) => [...prev, msg])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room.id])

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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/community" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center text-xl">{room.emoji}</div>
        <div>
          <p className="font-semibold text-gray-900">{room.name}</p>
          <p className="text-xs text-gray-400">{room.description}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            <p className="text-3xl mb-2">{room.emoji}</p>
            <p className="font-medium">Be the first to say something</p>
            <p className="text-sm mt-1">This is a safe, supportive space</p>
          </div>
        )}
        {messages.map((msg: any) => {
          const isMe = msg.user_id === userId
          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isMe ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {msg.is_anonymous ? '?' : (msg.profiles?.full_name?.[0] || '?')}
              </div>
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <p className={`text-xs text-gray-400 mb-1 ${isMe ? 'text-right' : ''}`}>
                  {msg.is_anonymous ? 'Anonymous' : (isMe ? 'You' : msg.profiles?.full_name)}
                  · {formatTime(msg.created_at)}
                </p>
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMe ? 'bg-green-500 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setAnonymous(!anonymous)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              anonymous ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-gray-200 text-gray-500'
            }`}>
            {anonymous ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {anonymous ? 'Posting anonymously' : 'Post as ' + userName}
          </button>
        </div>
        <div className="flex items-end gap-3">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Share something..." rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 max-h-24" />
          <button onClick={sendMessage} disabled={!input.trim() || sending}
            className="w-10 h-10 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
