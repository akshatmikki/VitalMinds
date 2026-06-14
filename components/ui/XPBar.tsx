'use client'
import { getLevelInfo } from '@/lib/gamification'
import { Zap } from 'lucide-react'

export default function XPBar({ totalXP }: { totalXP: number }) {
  const { current, next, progress } = getLevelInfo(totalXP)

  return (
    <div className="px-4 py-3 border-b border-white/[.08]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] font-bold text-amber-400">{current.name}</span>
        </div>
        <span className="text-[10px] text-white/30">{totalXP} XP</span>
      </div>
      <div className="h-1 rounded-full bg-white/[.08] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      {next && (
        <p className="text-[9px] text-white/20 mt-1 text-right">{next.name} at {next.minXP} XP</p>
      )}
    </div>
  )
}
