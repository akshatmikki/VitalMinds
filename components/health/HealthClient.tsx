'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

export default function HealthClient({ userId, todayMetrics, history }: any) {
  const [form, setForm] = useState({
    sleep_hours: todayMetrics?.sleep_hours || '',
    sleep_quality: todayMetrics?.sleep_quality || '',
    steps: todayMetrics?.steps || '',
    water_ml: todayMetrics?.water_ml || '',
    weight_kg: todayMetrics?.weight_kg || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function save() {
    setSaving(true)
    const data: any = { user_id: userId, date: new Date().toISOString().split('T')[0] }
    if (form.sleep_hours) data.sleep_hours = parseFloat(form.sleep_hours)
    if (form.sleep_quality) data.sleep_quality = parseInt(form.sleep_quality)
    if (form.steps) data.steps = parseInt(form.steps)
    if (form.water_ml) data.water_ml = parseInt(form.water_ml)
    if (form.weight_kg) data.weight_kg = parseFloat(form.weight_kg)
    await supabase.from('health_metrics').upsert(data, { onConflict: 'user_id,date' })
    setSaved(true); setSaving(false); setTimeout(() => setSaved(false), 2000); router.refresh()
  }

  const FIELDS = [
    { key: 'sleep_hours', label: 'Sleep', unit: 'hours', icon: '😴', placeholder: '7.5', type: 'number', step: '0.5', min: '0', max: '24' },
    { key: 'sleep_quality', label: 'Sleep quality', unit: '/5', icon: '⭐', placeholder: '4', type: 'number', step: '1', min: '1', max: '5' },
    { key: 'steps', label: 'Steps', unit: 'steps', icon: '🚶', placeholder: '8000', type: 'number', step: '100', min: '0', max: '100000' },
    { key: 'water_ml', label: 'Water', unit: 'ml', icon: '💧', placeholder: '2000', type: 'number', step: '250', min: '0', max: '10000' },
    { key: 'weight_kg', label: 'Weight', unit: 'kg', icon: '⚖️', placeholder: '65', type: 'number', step: '0.1', min: '20', max: '300' },
  ]

  const chartData = history.slice().reverse().map((d: any) => ({
    date: format(new Date(d.date), 'MMM d'),
    sleep: d.sleep_hours,
    steps: d.steps ? Math.round(d.steps / 1000 * 10) / 10 : null,
    water: d.water_ml ? Math.round(d.water_ml / 100) / 10 : null,
  }))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Health Tracking</h1>
        <p className="text-gray-400 text-sm mt-0.5">Log today&apos;s metrics</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-medium text-gray-900 mb-4">Today&apos;s log</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1">{f.icon} {f.label}</label>
              <div className="relative">
                <input
                  type={f.type} step={f.step} min={f.min} max={f.max}
                  value={(form as any)[f.key]} placeholder={f.placeholder}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-12" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving}
          className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50">
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save today\'s metrics'}
        </button>
      </div>

      {history.length > 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">😴 Sleep (hours)</h2>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => [`${v}h`, 'Sleep']} />
                <Bar dataKey="sleep" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">🚶 Steps (thousands)</h2>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => [`${v}k`, 'Steps']} />
                <Bar dataKey="steps" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
