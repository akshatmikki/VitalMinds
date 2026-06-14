'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Leaf, ChevronRight, Sparkles } from 'lucide-react'

const GOALS = [
  { id: 'mental_health',   label: 'Improve mental health',   emoji: '🧠', accent: 0 },
  { id: 'reduce_anxiety',  label: 'Reduce anxiety & stress', emoji: '😌', accent: 1 },
  { id: 'beat_loneliness', label: 'Feel less lonely',        emoji: '🤝', accent: 2 },
  { id: 'fitness',         label: 'Get more active',         emoji: '💪', accent: 3 },
  { id: 'better_sleep',    label: 'Sleep better',            emoji: '😴', accent: 0 },
  { id: 'mindfulness',     label: 'Practice mindfulness',    emoji: '🧘', accent: 1 },
  { id: 'healthy_eating',  label: 'Eat healthier',           emoji: '🥗', accent: 2 },
  { id: 'build_habits',    label: 'Build positive habits',   emoji: '✅', accent: 3 },
]

const GOAL_ACTIVE  = [
  'glass-cyan border-sage-300 text-sage-700',
  'glass-purple border-lavender-300 text-lavender-700',
  'glass-green border-sage-300 text-sage-700',
  'glass-amber border-amber-300 text-amber-700',
]
const GOAL_INACTIVE = 'glass border-warm-200 text-warm-500 hover:text-warm-700 hover:border-warm-300'

export default function OnboardingPage() {
  const [step, setStep]                   = useState(1)
  const [name, setName]                   = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [loading, setLoading]             = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  function toggleGoal(id: string) {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  async function handleFinish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({
      id: user.id, full_name: name, goals: selectedGoals, onboarding_done: true,
    })
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="login-page flex items-center justify-center p-4 relative overflow-hidden">

      <div className="login-orb-1 float" />
      <div className="login-orb-2 float" />

      <div className="w-full max-w-lg relative z-10">

        {/* Logo + steps */}
        <div className="text-center mb-8 card-in">
          <div className="relative inline-block mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto login-logo-icon">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div className="login-logo-blur" />
          </div>

          <div className="flex justify-center items-center gap-2 mt-4">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s === step
                    ? 'w-8 bg-sage-400'
                    : s < step
                    ? 'w-4 bg-sage-300'
                    : 'w-4 bg-warm-200'
                }`}
              />
            ))}
          </div>

          <p className="text-[10px] text-warm-400 uppercase tracking-widest mt-3 font-bold">
            Step {step} of 2
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 sm:p-8 card-in stagger-1">

          {/* ── Step 1: Name ───────────────────────── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-warm-900 mb-1">What should we call you?</h2>
                <p className="text-warm-400 text-sm">Your AI companion will use this name</p>
              </div>

              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full px-4 py-3 text-lg mood-note-input mb-6"
              />

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full py-3 mood-submit-btn flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Goals ──────────────────────── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-warm-900 mb-1">What are your goals?</h2>
                <p className="text-warm-400 text-sm">
                  Pick everything that applies — your AI companion will personalise for you
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {GOALS.map(goal => {
                  const isSelected = selectedGoals.includes(goal.id)
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-3 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${
                        isSelected ? GOAL_ACTIVE[goal.accent] : GOAL_INACTIVE
                      }`}
                    >
                      <span className="text-xl block mb-1.5">{goal.emoji}</span>
                      <span className="leading-snug block">{goal.label}</span>
                    </button>
                  )
                })}
              </div>

              {selectedGoals.length > 0 && (
                <p className="text-[10px] text-warm-400 text-center mb-4 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-sage-400" />
                  {selectedGoals.length} goal{selectedGoals.length > 1 ? 's' : ''} selected
                </p>
              )}

              <button
                type="button"
                onClick={handleFinish}
                disabled={loading || selectedGoals.length === 0}
                className="w-full py-3 mood-submit-btn"
              >
                {loading ? 'Setting up your space…' : "Let's go! 🚀"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
