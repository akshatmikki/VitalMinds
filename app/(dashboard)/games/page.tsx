import BubbleBurst from '@/components/games/BubbleBurst'
import MemoryBloom from '@/components/games/MemoryBloom'
import FocusDots from '@/components/games/FocusDots'
import WorryReframe from '@/components/games/WorryReframe'
import MoodSortGame from '@/components/games/MoodSortGame'
import { Gamepad2, Brain, Heart, Zap, Wind, Smile } from 'lucide-react'

const BENEFITS = [
  { icon: Brain,   color: 'text-lavender-500', label: 'Trains focus & attention'      },
  { icon: Wind,    color: 'text-teal-500',      label: 'Reduces stress & anxiety'      },
  { icon: Heart,   color: 'text-rose-500',      label: 'Builds emotional vocabulary'   },
  { icon: Smile,   color: 'text-amber-500',     label: 'Rewires negative thought loops' },
  { icon: Zap,     color: 'text-sage-500',      label: 'Boosts mood in under 5 min'    },
]

export default function GamesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8 card-in">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-sage-500 uppercase mb-2">Therapeutic Play</p>
        <h1 className="text-3xl font-bold grad-white-cyan">Wellness Games</h1>
        <p className="text-warm-400 mt-1 text-sm">
          Evidence-based mini-games designed to reduce anxiety, build focus, and grow emotional awareness.
        </p>
      </div>

      {/* Benefits row */}
      <div className="flex flex-wrap gap-2 mb-8">
        {BENEFITS.map(({ icon: Icon, color, label }) => (
          <div key={label} className="flex items-center gap-1.5 glass rounded-xl px-3 py-1.5">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="text-xs text-warm-600">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-6">

        {/* Row 1: Bubble Burst — full width (interactive canvas) */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Stress Relief</span>
          </div>
          <BubbleBurst />
        </section>

        {/* Row 2: Focus Dots + Worry Reframer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section>
            <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest block mb-2">Attention Training</span>
            <FocusDots />
          </section>
          <section>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-2">CBT Reframing</span>
            <WorryReframe />
          </section>
        </div>

        {/* Row 3: Memory Bloom + Mood Sorter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block mb-2">Mindfulness Memory</span>
            <MemoryBloom />
          </section>
          <section>
            <span className="text-[10px] font-bold text-lavender-500 uppercase tracking-widest block mb-2">Emotional Literacy</span>
            <MoodSortGame />
          </section>
        </div>

      </div>

      {/* Science note */}
      <div className="mt-8 glass rounded-2xl p-5 flex items-start gap-3 card-in">
        <Gamepad2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warm-800">Why games for mental health?</p>
          <p className="text-xs text-warm-500 mt-0.5 leading-relaxed">
            Research shows brief game-based interventions reduce cortisol (stress hormone), improve sustained attention, and help break negative thought cycles more effectively than passive reading. Each game here targets a specific wellness outcome.
          </p>
        </div>
      </div>
    </div>
  )
}
