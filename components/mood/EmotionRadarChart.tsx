'use client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const EMOTION_COLORS: Record<string, string> = {
  joy:         '#2B9E8A',
  calm:        '#7C6FCD',
  hope:        '#F59E0B',
  gratitude:   '#10B981',
  love:        '#EC4899',
  excitement:  '#F97316',
  sadness:     '#6B7280',
  anxiety:     '#EF4444',
  anger:       '#DC2626',
  fear:        '#7C3AED',
  loneliness:  '#8B5CF6',
  frustration: '#D97706',
}

const ALL_EMOTIONS = Object.keys(EMOTION_COLORS)

export default function EmotionRadarChart({ emotionCounts }: { emotionCounts: Record<string, number> }) {
  const data = ALL_EMOTIONS.map(emotion => ({
    emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    value: emotionCounts[emotion] ?? 0,
  })).filter(d => {
    // only show emotions that appeared or are neighbours of appeared emotions
    const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0)
    return total === 0 || d.value > 0 || true // show all so radar stays full
  })

  const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-warm-300 text-sm">
        Log moods or journal to see your emotion map
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid stroke="#E8E4DF" />
        <PolarAngleAxis
          dataKey="emotion"
          tick={{ fontSize: 9, fill: '#B5AEA6' }}
        />
        <Radar
          name="Emotions"
          dataKey="value"
          stroke="#7C6FCD"
          fill="#7C6FCD"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: '#FFFFFF',
            border: '1px solid #E8E4DF',
            borderRadius: 10,
            fontSize: 12,
          }}
          formatter={(v: any) => [v, 'times']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
