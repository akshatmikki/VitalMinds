'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import AffirmationCard from './AffirmationCard'
import WaterTracker from './WaterTracker'
import FocusTimer from './FocusTimer'
import DailyChallenge from './DailyChallenge'
import BreathingExercise from './BreathingExercise'

type Props = { userId: string; today: string; waterMl: number }

type ChallengeData = { challenge: string; category: 'physical' | 'mental' | 'social'; xp: number }

export default function WellnessPanel({ userId, today, waterMl }: Props) {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null)

  useEffect(() => {
    fetch('/api/daily-challenge').then(r => r.json()).then(setChallenge).catch(() => {})
  }, [])

  return (
    <div className="mt-6 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-warm-400 uppercase tracking-widest">Today's Wellness Tools</h2>
        <BreathingExercise />
      </div>

      {/* Affirmation */}
      <AffirmationCard />

      {/* Water + Focus in 2-col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WaterTracker userId={userId} initialMl={waterMl} date={today} />
        <FocusTimer />
      </div>

      {/* Daily challenge */}
      {challenge && (
        <DailyChallenge
          challenge={challenge.challenge}
          category={challenge.category}
          xp={challenge.xp}
          userId={userId}
          completed={false}
        />
      )}
    </div>
  )
}
