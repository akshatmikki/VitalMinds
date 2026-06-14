'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'

export default function MoodChart({ data }: { data: { score: number; logged_at: string }[] }) {
  const chartData = data.map(d => ({
    date:  format(new Date(d.logged_at), 'MMM d'),
    score: d.score,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#B5AEA6' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[1, 10]}
          tick={{ fontSize: 10, fill: '#B5AEA6' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#FFFFFF',
            border: '1px solid #E8E4DF',
            borderRadius: 10,
            fontSize: 12,
            color: '#1C1A17',
            boxShadow: '0 4px 12px rgba(0,0,0,.08)',
          }}
          formatter={(v: any) => [`${v}/10`, 'Mood']}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#2B9E8A"
          strokeWidth={2.5}
          dot={{ fill: '#2B9E8A', strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: '#7C6FCD', stroke: '#2B9E8A', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
