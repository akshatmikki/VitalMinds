'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Leaf, ChevronRight } from 'lucide-react'

const GOALS = [
  { id: 'mental_health', label: 'Improve mental health', emoji: '🧠' },
  { id: 'reduce_anxiety', label: 'Reduce anxiety & stress', emoji: '😌' },
  { id: 'beat_loneliness', label: 'Feel less lonely', emoji: '🤝' },
  { id: 'fitness', label: 'Get more active', emoji: '💪' },
  { id: 'better_sleep', label: 'Sleep better', emoji: '😴' },
  { id: 'mindfulness', label: 'Practice mindfulness', emoji: '🧘' },
  { id: 'healthy_eating', label: 'Eat healthier', emoji: '🥗' },
  { id: 'build_habits', label: 'Build positive habits', emoji: '✅' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

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
      id: user.id,
      full_name: name,
      goals: selectedGoals,
      onboarding_done: true,
    })
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-xl mb-3">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {[1,2].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-green-500' : s < step ? 'w-4 bg-green-300' : 'w-4 bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-1">What should we call you?</h2>
              <p className="text-gray-500 text-sm mb-6">Your AI companion will use this name</p>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" />
              <button onClick={() => setStep(2)} disabled={!name.trim()}
                className="mt-6 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-1">What are your goals?</h2>
              <p className="text-gray-500 text-sm mb-5">Pick everything that applies — your AI companion will personalize for you</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {GOALS.map(goal => (
                  <button key={goal.id} onClick={() => toggleGoal(goal.id)}
                    className={`p-3 rounded-lg border text-left transition-all text-sm ${
                      selectedGoals.includes(goal.id)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}>
                    <span className="text-lg block mb-1">{goal.emoji}</span>
                    {goal.label}
                  </button>
                ))}
              </div>
              <button onClick={handleFinish} disabled={loading || selectedGoals.length === 0}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-40">
                {loading ? 'Setting up...' : "Let's go! 🚀"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
