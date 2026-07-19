'use client'
// Emotional Literacy — sort emotion words into Positive / Neutral / Challenging buckets
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, RefreshCw } from 'lucide-react'

type Emotion = { word: string; correct: 'positive' | 'neutral' | 'challenging' }

const ALL_EMOTIONS: Emotion[] = [
  { word: 'Joy',       correct: 'positive'    },
  { word: 'Anxious',   correct: 'challenging' },
  { word: 'Content',   correct: 'positive'    },
  { word: 'Bored',     correct: 'neutral'     },
  { word: 'Grateful',  correct: 'positive'    },
  { word: 'Frustrated',correct: 'challenging' },
  { word: 'Curious',   correct: 'neutral'     },
  { word: 'Hopeful',   correct: 'positive'    },
  { word: 'Lonely',    correct: 'challenging' },
  { word: 'Calm',      correct: 'positive'    },
  { word: 'Indifferent',correct:'neutral'     },
  { word: 'Angry',     correct: 'challenging' },
  { word: 'Excited',   correct: 'positive'    },
  { word: 'Confused',  correct: 'neutral'     },
  { word: 'Sad',       correct: 'challenging' },
  { word: 'Peaceful',  correct: 'positive'    },
]

type Bucket = 'positive' | 'neutral' | 'challenging'

const BUCKET = {
  positive:    { label: '✨ Positive',    bg: 'bg-sage-50 border-sage-300',     drop: 'hover:border-sage-400',    text: 'text-sage-700'    },
  neutral:     { label: '〰️ Neutral',     bg: 'bg-warm-50 border-warm-300',     drop: 'hover:border-warm-400',    text: 'text-warm-600'    },
  challenging: { label: '🌊 Challenging', bg: 'bg-lavender-50 border-lavender-300', drop: 'hover:border-lavender-400', text: 'text-lavender-700' },
}

function shuffle<T>(a: T[]) { return [...a].sort(() => Math.random() - 0.5) }

export default function MoodSortGame() {
  const [emotions, setEmotions] = useState(() => shuffle(ALL_EMOTIONS.slice(0, 10)))
  const [current, setCurrent]   = useState(0)
  const [score, setScore]       = useState(0)
  const [feedback, setFeedback] = useState<{ correct: boolean; bucket: Bucket } | null>(null)
  const [done, setDone]         = useState(false)

  function guess(bucket: Bucket) {
    if (feedback) return
    const correct = emotions[current].correct === bucket
    setFeedback({ correct, bucket })
    if (correct) setScore(s => s + 1)
    setTimeout(() => {
      setFeedback(null)
      if (current + 1 >= emotions.length) { setDone(true) }
      else setCurrent(c => c + 1)
    }, 900)
  }

  function restart() {
    setEmotions(shuffle(ALL_EMOTIONS.slice(0, 10)))
    setCurrent(0); setScore(0); setFeedback(null); setDone(false)
  }

  const emotion = emotions[current]
  const pct = Math.round((current / emotions.length) * 100)

  return (
    <div className="bg-gradient-to-b from-purple-50 to-lavender-50 rounded-2xl p-4 border border-lavender-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-lavender-700">🎭 Emotion Sorter</p>
          <p className="text-[10px] text-lavender-400">Build emotional vocabulary</p>
        </div>
        <button onClick={restart} className="p-1.5 rounded-lg bg-lavender-100 text-lavender-500 hover:bg-lavender-200 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-lavender-100 mb-4 overflow-hidden">
        <motion.div className="h-full rounded-full bg-lavender-400" animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
      </div>

      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
          <CheckCircle2 className="w-8 h-8 text-sage-500 mx-auto mb-2" />
          <p className="font-bold text-lavender-700 text-lg">{score}/{emotions.length} correct</p>
          <p className="text-xs text-lavender-500 mt-1">
            {score >= 8 ? 'Excellent emotional awareness!' : score >= 5 ? 'Good — keep exploring emotions!' : 'Every feeling is valid — keep learning!'}
          </p>
          <button onClick={restart} className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-lavender-500 text-white hover:bg-lavender-600 transition-all">
            Play again
          </button>
        </motion.div>
      ) : (
        <>
          {/* Emotion word */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center mb-4"
            >
              <p className="text-[10px] text-lavender-400 mb-1">{current + 1} of {emotions.length}</p>
              <p className="text-2xl font-black text-lavender-800">{emotion?.word}</p>
              {feedback && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-xs font-bold mt-1 ${feedback.correct ? 'text-sage-600' : 'text-rose-500'}`}
                >
                  {feedback.correct ? '✓ Correct!' : `Not quite — it\'s ${emotion?.correct}`}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Buckets */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(BUCKET) as Bucket[]).map(b => {
              const style = BUCKET[b]
              const selected = feedback?.bucket === b
              return (
                <motion.button
                  key={b}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => guess(b)}
                  className={`p-2.5 rounded-xl text-center border-2 transition-all text-[10px] font-bold ${style.bg} ${style.text} ${style.drop} ${
                    selected
                      ? feedback?.correct ? 'ring-2 ring-sage-400' : 'ring-2 ring-rose-400'
                      : ''
                  }`}
                >
                  {style.label}
                </motion.button>
              )
            })}
          </div>
          <p className="text-[10px] text-lavender-400 text-center mt-2">Score: {score}</p>
        </>
      )}
    </div>
  )
}
