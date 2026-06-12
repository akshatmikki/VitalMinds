import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  })
}

export function getMoodEmoji(score: number) {
  if (score >= 9) return '🌟'
  if (score >= 7) return '😊'
  if (score >= 5) return '😐'
  if (score >= 3) return '😔'
  return '😢'
}

export function getMoodLabel(score: number) {
  if (score >= 9) return 'Excellent'
  if (score >= 7) return 'Good'
  if (score >= 5) return 'Okay'
  if (score >= 3) return 'Low'
  return 'Very Low'
}

export function getMoodColor(score: number) {
  if (score >= 7) return 'text-green-600'
  if (score >= 5) return 'text-yellow-600'
  return 'text-red-500'
}

export function getStreakDays(logs: { logged_date: string }[]) {
  if (!logs.length) return 0
  const sorted = [...logs].sort((a, b) =>
    new Date(b.logged_date).getTime() - new Date(a.logged_date).getTime()
  )
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)
  for (const log of sorted) {
    const logDate = new Date(log.logged_date)
    logDate.setHours(0, 0, 0, 0)
    const diff = (current.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 1) { streak++; current = logDate } else break
  }
  return streak
}
