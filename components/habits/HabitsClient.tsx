'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Check, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'physical', label: 'Physical', emoji: '💪', color: 'blue' },
  { id: 'mental', label: 'Mental', emoji: '🧠', color: 'purple' },
  { id: 'social', label: 'Social', emoji: '🤝', color: 'green' },
  { id: 'general', label: 'General', emoji: '✨', color: 'amber' },
]
const ICONS = ['💪', '🧘', '📖', '🌱', '💧', '🏃', '😴', '🥗', '✍️', '🎵', '🌞', '🤝', '📝', '🧘‍♀️', '🚴']

export default function HabitsClient({ userId, habits, todayLogs }: {
  userId: string; habits: any[]; todayLogs: any[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('general')
  const [icon, setIcon] = useState('✨')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Habits</h1>
          <p className="text-gray-400 text-sm mt-0.5">{completedIds.size}/{habits.length} done today · {completionRate}%</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add habit
        </button>
      </div>

      {/* Progress bar */}
      {habits.length > 0 && (
        <div className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Today&apos;s progress</span><span>{completionRate}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      )}

      {/* Habits list */}
      <div className="space-y-2">
        {habits.length === 0 && !showForm && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-medium">No habits yet</p>
            <p className="text-sm mt-1">Add habits to track your daily wellness routine</p>
          </div>
        )}

        {CATEGORIES.map(cat => {
          const catHabits = habits.filter(h => h.category === cat.id)
          if (!catHabits.length) return null
          return (
            <div key={cat.id}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 mt-4">{cat.emoji} {cat.label}</p>
              {catHabits.map(habit => {
                const done = completedIds.has(habit.id)
                return (
                  <div key={habit.id}
                    className={cn('flex items-center gap-3 p-4 rounded-xl border transition-all mb-2',
                      done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-gray-200')}>
                    <button onClick={() => toggleHabit(habit)}
                      className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                        done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400')}>
                      {done && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xl">{habit.icon}</span>
                    <span className={cn('flex-1 text-sm font-medium', done ? 'text-green-700 line-through opacity-70' : 'text-gray-900')}>
                      {habit.name}
                    </span>
                    <button onClick={() => deleteHabit(habit.id)}
                      className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">New habit</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Habit name (e.g. Morning walk)"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div>
              <p className="text-xs text-gray-500 mb-2">Category</p>
              <div className="flex gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)}
                    className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      category === c.id ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 text-gray-600')}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setIcon(ic)}
                    className={cn('w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors',
                      icon === ic ? 'bg-green-100 ring-2 ring-green-500' : 'hover:bg-gray-100')}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={addHabit} disabled={!name.trim() || saving}
              className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Adding...' : 'Add habit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
