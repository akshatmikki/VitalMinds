'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Plus, Sparkles, Dumbbell, BookOpen, Clock, X, Zap, Mic, MicOff, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import CrisisOverlay from '@/components/chat/CrisisOverlay'

type Message = {
  role: 'user' | 'assistant'
  content: string
  quickReplies?: string[]
}
type SessionType = 'companion' | 'coach' | 'journal'

type ChatSession = {
  id: string
  title: string
  session_type: SessionType
  created_at: string
  updated_at: string
}

const SESSION_TYPES = [
  { id: 'companion' as SessionType, label: 'Mind',    icon: Sparkles, desc: 'Talk, vent, get support'  },
  { id: 'coach'     as SessionType, label: 'Coach',   icon: Dumbbell, desc: 'Fitness & wellness tips'  },
  { id: 'journal'   as SessionType, label: 'Journal', icon: BookOpen, desc: 'Guided self-reflection'   },
]

const STARTERS: Record<SessionType, string[]> = {
  companion: ["I'm feeling overwhelmed today", "I've been feeling lonely lately", "Help me calm down", "I can't sleep"],
  coach:     ["Create a workout plan for me", "Help me eat healthier", "How do I build better sleep habits?", "I want to start meditating"],
  journal:   ["Help me reflect on my week", "I want to process some feelings", "Guide me through gratitude journaling", "What should I journal about?"],
}

const TYPE_EMOJI: Record<SessionType, string> = {
  companion: '✨',
  coach:     '💪',
  journal:   '📖',
}

function parseQuickReplies(content: string): { text: string; quickReplies: string[] } {
  const match = content.match(/\n*QUICK_REPLIES:\s*([^\n]+)$/)
  if (match) {
    const replies = match[1].split('|').map((r: string) => r.trim()).filter(Boolean).slice(0, 3)
    const text = content.replace(/\n*QUICK_REPLIES:\s*[^\n]+$/, '').trimEnd()
    return { text, quickReplies: replies }
  }
  return { text: content, quickReplies: [] }
}

function displayContent(content: string): string {
  return content.replace(/\n*QUICK_REPLIES:\s*[^\n]*$/, '').trimEnd()
}

type CrisisInfo = { crisis: boolean; severity: 'low' | 'medium' | 'high'; message: string }

export default function ChatPage() {
  const [messages, setMessages]                 = useState<Message[]>([])
  const [input, setInput]                       = useState('')
  const [loading, setLoading]                   = useState(false)
  const [sessionType, setSessionType]           = useState<SessionType>('companion')
  const [currentSessionId, setCurrentSessionId] = useState(() => crypto.randomUUID())
  const [sessions, setSessions]                 = useState<ChatSession[]>([])
  const [loadingSessions, setLoadingSessions]   = useState(false)
  const [historyOpen, setHistoryOpen]           = useState(false)
  const [crisis, setCrisis]                     = useState<CrisisInfo | null>(null)
  const [isListening, setIsListening]           = useState(false)
  const [voiceSupported, setVoiceSupported]     = useState(false)
  const recognitionRef = useRef<any>(null)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SpeechRecognition)
  }, [])

  function toggleVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.start()
    setIsListening(true)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const supabase = createClient()
    setLoadingSessions(true)
    supabase
      .from('chat_sessions')
      .select('id, title, session_type, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setSessions((data as ChatSession[]) ?? [])
        setLoadingSessions(false)
      })
  }, [])

  function startNewSession() {
    setCurrentSessionId(crypto.randomUUID())
    setMessages([])
    setHistoryOpen(false)
  }

  async function loadSession(session: ChatSession) {
    const supabase = createClient()
    const { data } = await supabase
      .from('chat_sessions')
      .select('messages')
      .eq('id', session.id)
      .single()
    if (data?.messages) {
      const parsed = (data.messages as Message[]).map(m => {
        if (m.role === 'assistant') {
          const { text, quickReplies } = parseQuickReplies(m.content)
          return { ...m, content: text, quickReplies }
        }
        return m
      })
      setMessages(parsed)
      setSessionType(session.session_type)
      setCurrentSessionId(session.id)
      setHistoryOpen(false)
    }
  }

  function refreshSessions() {
    const supabase = createClient()
    supabase
      .from('chat_sessions')
      .select('id, title, session_type, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setSessions((data as ChatSession[]) ?? []))
  }

  async function sendMessage(text?: string) {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content }
    // Strip quick replies from history before sending to API
    const apiMessages = [
      ...messages.map(m => ({ role: m.role, content: m.role === 'assistant' ? parseQuickReplies(m.content).text : m.content })),
      { role: 'user' as const, content },
    ]

    setMessages(prev => [...prev.map(m => ({ ...m, quickReplies: [] })), userMsg])
    setLoading(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, sessionType, sessionId: currentSessionId }),
      })
      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''

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
            const parsed = JSON.parse(data)
            // Handle crisis signal
            if (parsed.crisis?.crisis) {
              setCrisis(parsed.crisis)
              continue
            }
            const chunk = parsed.text
            if (!chunk) continue
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + chunk,
              }
              return updated
            })
          } catch {}
        }
      }

      // Parse quick replies from completed AI message
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.role === 'assistant') {
          const { text, quickReplies } = parseQuickReplies(last.content)
          updated[updated.length - 1] = { ...last, content: text, quickReplies }
        }
        return updated
      })

      refreshSessions()
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1].content = 'Something went wrong. Please try again.'
        return updated
      })
    } finally { setLoading(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const currentSession = SESSION_TYPES.find(s => s.id === sessionType)!

  return (
    <div className="chat-page-with-history">

      {/* Overlay for mobile history panel */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setHistoryOpen(false)} />
      )}

      {/* ── History sidebar ─────────────────────────── */}
      <aside className={cn('chat-history-panel', historyOpen ? 'chat-history-open' : '')}>
        <div className="flex items-center justify-between px-3 py-3 border-b border-warm-100">
          <p className="text-[10px] font-bold tracking-widest text-warm-400 uppercase">History</p>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={startNewSession}
              className="flex items-center gap-1 text-xs text-sage-600 font-semibold hover:text-sage-700 transition-colors px-2 py-1 rounded-lg hover:bg-sage-50">
              <Plus className="w-3 h-3" /> New
            </button>
            <button type="button" onClick={() => setHistoryOpen(false)}
              title="Close history"
              className="md:hidden p-1 text-warm-400 hover:text-warm-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-hide">
          {loadingSessions && <p className="text-xs text-warm-400 p-4">Loading…</p>}
          {!loadingSessions && sessions.length === 0 && (
            <p className="text-xs text-warm-400 p-4 text-center">No past conversations yet</p>
          )}
          {sessions.map(s => (
            <button key={s.id} type="button" onClick={() => loadSession(s)}
              className={cn('w-full text-left px-3 py-2.5 border-b border-warm-100 hover:bg-warm-50 transition-colors',
                s.id === currentSessionId && 'bg-sage-50 border-l-2 border-l-sage-400')}>
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5 shrink-0">{TYPE_EMOJI[s.session_type]}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-warm-700 truncate leading-tight">{s.title}</p>
                  <p className="text-[10px] text-warm-400 mt-0.5">
                    {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main chat ───────────────────────────────── */}
      <div className="chat-main">
        <div className="chat-futuristic">

          {/* Header */}
          <header className="chat-futuristic-header">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setHistoryOpen(v => !v)}
                title="Chat history"
                className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors border border-transparent md:hidden">
                <Clock className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="chat-fx-avatar-sm">
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">AI Wellness</p>
                  <h1 className="font-bold text-white text-sm leading-tight">AI Companion</h1>
                </div>
                <span className="chat-online-dot" />
              </div>
            </div>

            <div className="flex items-center gap-1 flex-wrap justify-end">
              {SESSION_TYPES.map(s => (
                <button key={s.id} type="button"
                  onClick={() => { setSessionType(s.id); setMessages([]) }}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                    sessionType === s.id
                      ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                      : 'text-white/35 border-transparent hover:text-white/60 hover:bg-white/5')}>
                  <s.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
              <button type="button" onClick={startNewSession}
                className="p-1.5 rounded-lg text-white/35 hover:text-white/60 hover:bg-white/5 transition-colors border border-transparent ml-0.5"
                title="New chat">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="chat-futuristic-messages">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10">
                <div className="chat-fx-avatar-lg mb-5">
                  <currentSession.icon className="w-8 h-8 text-teal-300" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{currentSession.label}</h2>
                <p className="text-white/35 text-sm max-w-xs">{currentSession.desc}. I&apos;m here for you.</p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {STARTERS[sessionType].map(starter => (
                    <button key={starter} type="button" onClick={() => sendMessage(starter)}
                      className="chat-starter-chip text-left">
                      <Zap className="w-3 h-3 shrink-0 text-teal-400 mt-0.5" />
                      <span>{starter}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const isLast    = i === messages.length - 1
              const isTyping  = msg.role === 'assistant' && !msg.content && loading && isLast
              const bodyText  = msg.role === 'assistant' ? displayContent(msg.content) : msg.content
              const showChips = msg.role === 'assistant' && !loading && (msg.quickReplies?.length ?? 0) > 0

              return (
                <div key={i} className={cn('flex gap-2.5 message-in', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="chat-fx-avatar-msg shrink-0">M</div>
                  )}

                  <div className={cn('flex flex-col gap-2', msg.role === 'user' ? 'items-end' : 'items-start', 'max-w-[80%] sm:max-w-[72%]')}>
                    <div className={cn(
                      'px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user' ? 'chat-fx-user-bubble' : 'chat-fx-ai-bubble'
                    )}>
                      {isTyping
                        ? <span className="flex gap-1.5 py-0.5 items-center">
                            {[0,1,2].map(d => <span key={d} className="fx-typing-dot w-2 h-2 rounded-full" />)}
                          </span>
                        : bodyText
                      }
                    </div>

                    {showChips && (
                      <div className="flex flex-wrap gap-1.5">
                        {(msg.quickReplies ?? []).map((reply, ri) => (
                          <button key={ri} type="button" onClick={() => sendMessage(reply)}
                            className="chat-quick-reply">
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Crisis overlay */}
          {crisis && <CrisisOverlay crisis={crisis} onDismiss={() => setCrisis(null)} />}

          {/* Input */}
          <div className="chat-futuristic-input-bar">
            <div className="chat-fx-input-wrap">
              {voiceSupported && (
                <button
                  type="button"
                  aria-label={isListening ? 'Stop listening' : 'Voice input'}
                  onClick={toggleVoice}
                  className={cn(
                    'p-2 rounded-lg transition-all border shrink-0',
                    isListening
                      ? 'text-red-400 border-red-500/30 bg-red-500/10 animate-pulse'
                      : 'text-white/30 border-transparent hover:text-white/60 hover:bg-white/5'
                  )}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening…' : 'Type or speak a message…'}
                rows={1}
                className="chat-fx-textarea"
              />
              <button type="button" aria-label="Send message" onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="chat-fx-send">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-white/18 mt-2.5">
              Mind is AI, not a therapist. Crisis? Call iCall: 9152987821
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
