'use client'
// Mindfulness Memory — flip cards to find matching affirmations (focus + positive reinforcement)
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PAIRS = [
  { emoji: '🌱', label: 'Growth'    },
  { emoji: '💙', label: 'Peace'     },
  { emoji: '✨', label: 'Joy'       },
  { emoji: '🌊', label: 'Calm'      },
  { emoji: '🦋', label: 'Change'    },
  { emoji: '🌸', label: 'Kindness'  },
]

type Card = { id: number; emoji: string; label: string; flipped: boolean; matched: boolean }

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function makeCards(): Card[] {
  return shuffle([...PAIRS, ...PAIRS].map((p, i) => ({ ...p, id: i, flipped: false, matched: false })))
}

export default function MemoryBloom() {
  const [cards, setCards]   = useState<Card[]>(makeCards)
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves]   = useState(0)
  const [won, setWon]       = useState(false)
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    if (flipped.length !== 2) return
    setMoves(m => m + 1)
    const [a, b] = flipped.map(id => cards.find(c => c.id === id)!)
    if (a.emoji === b.emoji) {
      setCards(cs => cs.map(c => flipped.includes(c.id) ? { ...c, matched: true } : c))
      setFlipped([])
    } else {
      setBlocking(true)
      setTimeout(() => {
        setCards(cs => cs.map(c => flipped.includes(c.id) ? { ...c, flipped: false } : c))
        setFlipped([])
        setBlocking(false)
      }, 900)
    }
  }, [flipped])

  useEffect(() => {
    if (cards.length && cards.every(c => c.matched)) setWon(true)
  }, [cards])

  function flip(id: number) {
    if (blocking || flipped.length >= 2) return
    const card = cards.find(c => c.id === id)!
    if (card.flipped || card.matched) return
    setCards(cs => cs.map(c => c.id === id ? { ...c, flipped: true } : c))
    setFlipped(f => [...f, id])
  }

  function reset() {
    setCards(makeCards())
    setFlipped([])
    setMoves(0)
    setWon(false)
  }

  return (
    <div className="bg-gradient-to-b from-rose-50 to-pink-50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-rose-700">🌸 Memory Bloom</p>
          <p className="text-[10px] text-rose-400">Match wellness pairs to unlock affirmations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-rose-600">{moves} moves</span>
          <button onClick={reset} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-600 hover:bg-rose-200 transition-all">
            Reset
          </button>
        </div>
      </div>

      {won ? (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-rose-700">Bloomed in {moves} moves!</p>
          <p className="text-xs text-rose-500 mt-1">Your mind is sharp and focused.</p>
          <button onClick={reset} className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-400 text-white hover:bg-rose-500 transition-all">
            Play again
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {cards.map(card => (
            <motion.button
              key={card.id}
              onClick={() => flip(card.id)}
              whileTap={{ scale: 0.92 }}
              className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all border-2 ${
                card.matched
                  ? 'bg-rose-100 border-rose-200 opacity-60'
                  : card.flipped
                  ? 'bg-white border-rose-300 shadow-sm'
                  : 'bg-rose-200 border-rose-200 hover:bg-rose-300'
              }`}
            >
              <AnimatePresence mode="wait">
                {card.flipped || card.matched ? (
                  <motion.span key="face" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className="flex flex-col items-center">
                    <span>{card.emoji}</span>
                    <span className="text-[8px] font-bold text-rose-600 mt-0.5">{card.label}</span>
                  </motion.span>
                ) : (
                  <motion.span key="back" className="text-rose-400 font-black text-lg">?</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
