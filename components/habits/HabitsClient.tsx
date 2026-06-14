'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Check, Trash2, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'physical', label: 'Physical', emoji: '💪', accent: 'sage'     },
  { id: 'mental',   label: 'Mental',   emoji: '🧠', accent: 'lavender' },
  { id: 'social',   label: 'Social',   emoji: '🤝', accent: 'coral'    },
  { id: 'general',  label: 'General',  emoji: '✨', accent: 'amber'    },
]

const CAT_PILL = {
  sage:     'bg-sage-50 border-sage-200 text-sage-700',
  lavender: 'bg-lavender-50 border-lavender-200 text-lavender-700',
  coral:    'bg-coral-50 border-coral-200 text-coral-600',
  amber:    'bg-amber-50 border-amber-200 text-amber-700',
}
const CAT_LABEL = {
  sage:     'text-sage-500',
  lavender: 'text-lavender-500',
  coral:    'text-coral-500',
  amber:    'text-amber-600',
}

const ICONS = ['💪', '🧘', '📖', '🌱', '💧', '🏃', '😴', '🥗', '✍️', '🎵', '🌞', '🤝', '📝', '🧘‍♀️', '🚴']

export default function HabitsClient({ userId, habits, todayLogs }: {
  userId: string; habits: any[]; todayLogs: any[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName]         = useState('')
  const [category, setCategory] = useState('general')
  const [icon, setIcon]         = useState('✨')
  const [saving, setSaving]     = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  const completedIds = new Set(todayLogs.map(l => l.habit_id))

  async function toggleHabit(habit: any) {
    if (completedIds.has(habit.id)) {
      await supabase.from('habit_logs').delete()
        .eq('habit_id', habit.id).eq('user_id', userId).eq('logged_date', new Date().toISOString().split('T')[0])
    } else {
      await supabase.from('habit_logs').insert({ habit_id: habit.id, user_id: userId })
    }
    router.refresh()
  }

  async function addHabit() {
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('habits').insert({ user_id: userId, name: name.trim(), category, icon })
    setName(''); setShowForm(false); setSaving(false); router.refresh()
  }

  async function deleteHabit(id: string) {
    await supabase.from('habits').update({ is_active: false }).eq('id', id)
    router.refresh()
  }

  const completionRate = habits.length ? Math.round((completedIds.size / habits.length) * 100) : 0

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="card-in">
          <p className="text-[10px] font-bold tracking-[0.2em] text-sage-500 uppercase mb-1">Daily Routine</p>
          <h1 className="text-2xl font-bold text-warm-900">Habits</h1>
          <p className="text-warm-400 text-sm mt-0.5">
            {completedIds.size}/{habits.length} done · {completionRate}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mood-submit-btn flex items-center gap-2 px-4 py-2.5 shrink-0 mt-1"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Progress bar */}
      {habits.length > 0 && (
        <div className="glass rounded-2xl p-4 mb-6 card-in stagger-1">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sage-500" />
              <span className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Today&apos;s progress</span>
            </div>
            <span className="text-sm font-bold text-sage-600">{completionRate}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden habit-progress-track">
            <div
              className={cn('habit-progress-fill', completionRate === 100 && 'habit-progress-fill-done')}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && !showForm && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-40">✅</div>
          <p className="font-medium text-warm-600">No habits yet</p>
          <p className="text-sm mt-1 text-warm-400">Add habits to track your daily wellness routine</p>
        </div>
      )}

      {/* Habits by category */}
      <div className="space-y-1">
        {CATEGORIES.map(cat => {
          const catHabits = habits.filter(h => h.category === cat.id)
          if (!catHabits.length) return null
          const labelColor = CAT_LABEL[cat.accent as keyof typeof CAT_LABEL]

          return (
            <div key={cat.id} className="mb-4">
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 mt-4 flex items-center gap-1.5 ${labelColor}`}>
                <span>{cat.emoji}</span> {cat.label}
              </p>

              <div className="space-y-2">
                {catHabits.map(habit => {
                  const done = completedIds.has(habit.id)
                  return (
                    <div
                      key={habit.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 shimmer',
                        done ? 'glass-green' : 'glass hover:border-warm-300'
                      )}
                    >
                      <button
                        type="button"
                        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                        onClick={() => toggleHabit(habit)}
                        className={cn(
                          'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                          done
                            ? 'border-sage-400 bg-sage-400 text-white shadow-sage'
                            : 'border-warm-300 hover:border-sage-400'
                        )}
                      >
                        {done && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <span className="text-xl shrink-0">{habit.icon}</span>

                      <span className={cn(
                        'flex-1 text-sm font-medium transition-all',
                        done ? 'text-sage-600/70 line-through' : 'text-warm-700'
                      )}>
                        {habit.name}
                      </span>

                      <button
                        type="button"
                        aria-label="Delete habit"
                        onClick={() => deleteHabit(habit.id)}
                        className="p-1 text-warm-300 hover:text-coral-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add habit form */}
      {showForm && (
        <div className="mt-4 glass rounded-2xl p-5 card-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-warm-800">New habit</p>
            <button
              type="button"
              aria-label="Close form"
              onClick={() => setShowForm(false)}
              className="p-1 text-warm-300 hover:text-warm-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Habit name (e.g. Morning walk)"
              className="w-full px-3 py-2.5 text-sm mood-note-input"
            />

            <div>
              <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-2">Category</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      'py-2 rounded-lg text-xs font-semibold border transition-all',
                      category === c.id
                        ? CAT_PILL[c.accent as keyof typeof CAT_PILL]
                        : 'text-warm-400 border-warm-200 hover:border-warm-300'
                    )}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-2">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    aria-label={`Select icon ${ic}`}
                    onClick={() => setIcon(ic)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                      icon === ic ? 'glass-cyan scale-110' : 'hover:bg-warm-100'
                    )}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={addHabit}
              disabled={!name.trim() || saving}
              className="w-full py-2.5 mood-submit-btn"
            >
              {saving ? 'Adding…' : 'Add habit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
