'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Plus, Sparkles, Dumbbell, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = { role: 'user' | 'assistant'; content: string }
type SessionType = 'companion' | 'coach' | 'journal'

const SESSION_TYPES = [
  { id: 'companion' as SessionType, label: 'Mind companion', icon: Sparkles, desc: 'Talk, vent, get support' },
  { id: 'coach' as SessionType, label: 'Health coach', icon: Dumbbell, desc: 'Fitness & wellness tips' },
  { id: 'journal' as SessionType, label: 'Journal guide', icon: BookOpen, desc: 'Guided self-reflection' },
]

const STARTERS = {
  companion: ["I'm feeling overwhelmed today", "I've been feeling lonely lately", "Help me calm down", "I can't sleep"],
  coach: ["Create a workout plan for me", "Help me eat healthier", "How do I build better sleep habits?", "I want to start meditating"],
  journal: ["Help me reflect on my week", "I want to process some feelings", "Guide me through gratitude journaling", "What should I journal about?"],
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionType, setSessionType] = useState<SessionType>('companion')
  const [sessionId] = useState(() => crypto.randomUUID())
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text?: string) {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, sessionType, sessionId }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const { text } = JSON.parse(data)
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + text
              }
              return updated
            })
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1].content = 'Sorry, something went wrong. Please try again.'
        return updated
      })
    } finally { setLoading(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function newChat() { setMessages([]) }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-gray-900">AI Companion</h1>
          <p className="text-xs text-gray-400">Mind — your wellness guide</p>
        </div>
        <div className="flex items-center gap-2">
          {SESSION_TYPES.map(s => (
            <button key={s.id} onClick={() => { setSessionType(s.id); setMessages([]) }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                sessionType === s.id ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50')}>
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
          <button onClick={newChat}
            className="ml-2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              {(() => { const S = SESSION_TYPES.find(s => s.id === sessionType)!; return <S.icon className="w-8 h-8 text-green-600" /> })()}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {SESSION_TYPES.find(s => s.id === sessionType)?.label}
            </h2>
            <p className="text-gray-400 mt-1 text-sm max-w-sm">
              {SESSION_TYPES.find(s => s.id === sessionType)?.desc}. I&apos;m here for you.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 max-w-md">
              {STARTERS[sessionType].map(starter => (
                <button key={starter} onClick={() => sendMessage(starter)}
                  className="text-left px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 hover:border-green-200 hover:text-green-700 hover:bg-green-50 transition-all">
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3 message-in', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold">M</div>
            )}
            <div className={cn('max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
              msg.role === 'user'
                ? 'bg-green-500 text-white rounded-tr-sm'
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm')}>
              {msg.content || (msg.role === 'assistant' && loading && i === messages.length - 1 ? (
                <span className="flex gap-1 py-1">
                  {[0,1,2].map(d => <span key={d} className={`typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full`} />)}
                </span>
              ) : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-32 overflow-y-auto"
            style={{ height: 'auto' }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="w-10 h-10 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-center text-gray-300 mt-2">
          Mind is an AI, not a therapist. In a crisis, call iCall: 9152987821
        </p>
      </div>
    </div>
  )
}
