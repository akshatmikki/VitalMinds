'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { Activity, TrendingUp, Utensils } from 'lucide-react'
import type { WellnessScoreBreakdown } from '@/lib/health/calculations'
import { getBMICategory } from '@/lib/health/calculations'
import FoodCamera from '@/components/health/FoodCamera'
import WearableConnect from '@/components/health/WearableConnect'

const FIELDS = [
  { key: 'sleep_hours',   label: 'Sleep',        unit: 'hrs',   emoji: '😴', step: '0.5', min: '0',  max: '24',     placeholder: '7.5'  },
  { key: 'sleep_quality', label: 'Sleep quality', unit: '/5',    emoji: '⭐', step: '1',   min: '1',  max: '5',      placeholder: '4'    },
  { key: 'steps',         label: 'Steps',         unit: 'steps', emoji: '🚶', step: '100', min: '0',  max: '100000', placeholder: '8000' },
  { key: 'water_ml',      label: 'Water',         unit: 'ml',    emoji: '💧', step: '250', min: '0',  max: '10000',  placeholder: '2000' },
  { key: 'weight_kg',     label: 'Weight',        unit: 'kg',    emoji: '⚖️', step: '0.1', min: '20', max: '300',    placeholder: '65'   },
]

const CHART_COLORS = { sleep: '#7C6FCD', steps: '#2B9E8A', water: '#44BDA6' }

const TOOLTIP_STYLE = {
  background: '#FFFFFF',
  border: '1px solid #E8E4DF',
  borderRadius: 10,
  fontSize: 12,
  color: '#1C1A17',
  boxShadow: '0 4px 12px rgba(0,0,0,.08)',
}

const SCORE_DIMS = [
  { key: 'sleep',     label: 'Sleep',      color: 'bg-lavender-400' },
  { key: 'steps',     label: 'Steps',      color: 'bg-sage-400'     },
  { key: 'hydration', label: 'Hydration',  color: 'bg-cyan-400'     },
  { key: 'habits',    label: 'Habits',     color: 'bg-amber-400'    },
  { key: 'mood',      label: 'Mood',       color: 'bg-coral-400'    },
] as const

type Props = {
  userId: string
  todayMetrics: any
  history: any[]
  wellnessScore: WellnessScoreBreakdown
  bmi: number | null
  currentHeight: number | null
  wearableConnected: boolean
  wearableLastSynced: string | null
}

export default function HealthClient({ userId, todayMetrics, history, wellnessScore, bmi, currentHeight, wearableConnected, wearableLastSynced }: Props) {
  const [form, setForm] = useState({
    sleep_hours:   todayMetrics?.sleep_hours   || '',
    sleep_quality: todayMetrics?.sleep_quality || '',
    steps:         todayMetrics?.steps         || '',
    water_ml:      todayMetrics?.water_ml      || '',
    weight_kg:     todayMetrics?.weight_kg     || '',
  })
  const [saving, setSaving]           = useState(false)
  const [saved,  setSaved]            = useState(false)
  const [height, setHeight]           = useState(currentHeight ? String(currentHeight) : '')
  const [savingH, setSavingH]         = useState(false)
  const [savedH,  setSavedH]          = useState(false)
  const [nutritionEntries, setNutritionEntries] = useState<any[]>(todayMetrics?.nutrition ?? [])

  const supabase = createClient()
  const router   = useRouter()

  async function save() {
    setSaving(true)
    const data: any = { user_id: userId, date: new Date().toISOString().split('T')[0] }
    if (form.sleep_hours)   data.sleep_hours   = parseFloat(form.sleep_hours)
    if (form.sleep_quality) data.sleep_quality = parseInt(form.sleep_quality)
    if (form.steps)         data.steps         = parseInt(form.steps)
    if (form.water_ml)      data.water_ml      = parseInt(form.water_ml)
    if (form.weight_kg)     data.weight_kg     = parseFloat(form.weight_kg)
    await supabase.from('health_metrics').upsert(data, { onConflict: 'user_id,date' })
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  async function saveHeight() {
    if (!height) return
    setSavingH(true)
    await supabase.from('profiles').update({ height_cm: parseFloat(height) }).eq('id', userId)
    setSavedH(true); setSavingH(false)
    setTimeout(() => setSavedH(false), 2500)
    router.refresh()
  }

  const chartData = history.slice().reverse().map((d: any) => ({
    date:  format(new Date(d.date), 'MMM d'),
    sleep: d.sleep_hours,
    steps: d.steps ? Math.round(d.steps / 1000 * 10) / 10 : null,
    water: d.water_ml ? Math.round(d.water_ml / 100) / 10 : null,
  }))

  const CHARTS = [
    { key: 'sleep', label: '😴  Sleep (hours)',     color: CHART_COLORS.sleep, iconClass: 'text-lavender-500', fmt: (v: any) => [`${v}h`, 'Sleep'] },
    { key: 'steps', label: '🚶  Steps (thousands)', color: CHART_COLORS.steps, iconClass: 'text-sage-500',     fmt: (v: any) => [`${v}k`, 'Steps'] },
    { key: 'water', label: '💧  Water (litres)',     color: CHART_COLORS.water, iconClass: 'text-sage-400',     fmt: (v: any) => [`${v}L`, 'Water'] },
  ]

  const trendEmoji =
    wellnessScore.trend === 'up' ? '↑'
    : wellnessScore.trend === 'down' ? '↓'
    : wellnessScore.trend === 'stable' ? '→' : ''

  const scoreColor =
    wellnessScore.overall >= 75 ? 'text-sage-600'
    : wellnessScore.overall >= 50 ? 'text-amber-600'
    : 'text-coral-600'

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6 card-in">
        <p className="text-[10px] font-bold tracking-[0.2em] text-sage-500 uppercase mb-1">Body Metrics</p>
        <h1 className="text-2xl font-bold text-warm-900">Health Tracking</h1>
        <p className="text-warm-400 text-sm mt-0.5">Log today&apos;s metrics</p>
      </div>

      {/* Wearable connect card */}
      <div className="mb-6">
        <WearableConnect
          connected={wearableConnected}
          lastSynced={wearableLastSynced}
          onSynced={() => window.location.reload()}
        />
      </div>

      {/* Wellness score card */}
      <div className="glass rounded-2xl p-5 mb-6 card-in stagger-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-1">Wellness Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${scoreColor}`}>{wellnessScore.overall}</span>
              <span className="text-warm-400 text-sm">/100</span>
              {trendEmoji && (
                <span className={`text-sm font-semibold ${wellnessScore.trend === 'up' ? 'text-sage-500' : wellnessScore.trend === 'down' ? 'text-coral-500' : 'text-warm-400'}`}>
                  {trendEmoji}
                </span>
              )}
            </div>
          </div>
          {bmi !== null && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-1">BMI</p>
              <p className="text-2xl font-bold text-warm-700">{bmi}</p>
              <p className="text-[11px] text-warm-400">{getBMICategory(bmi)}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {SCORE_DIMS.map(dim => (
            <div key={dim.key} className="flex items-center gap-3">
              <span className="text-[10px] font-medium text-warm-400 w-16 shrink-0">{dim.label}</span>
              <div className="flex-1 bg-warm-100 rounded-full h-1.5 overflow-hidden score-bar-track"
                data-score={wellnessScore[dim.key]}>
                <div
                  className={`h-full rounded-full ${dim.color} transition-all duration-500 score-bar-fill`}
                  ref={(el) => { if (el) el.style.width = `${wellnessScore[dim.key]}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-warm-500 w-8 text-right shrink-0">
                {wellnessScore[dim.key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Log form */}
      <div className="glass rounded-2xl p-5 mb-6 card-in stagger-2">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-3.5 h-3.5 text-sage-500" />
          <h2 className="text-[11px] font-bold text-warm-400 uppercase tracking-widest">Today&apos;s log</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-[10px] font-bold text-warm-400 uppercase tracking-wider mb-1.5">
                {f.emoji} {f.label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  value={(form as any)[f.key]}
                  placeholder={f.placeholder}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full pr-10 px-3 py-2.5 text-sm mood-note-input"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-warm-400 font-medium pointer-events-none">
                  {f.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 mood-submit-btn"
        >
          {saved ? '✓ Saved!' : saving ? 'Saving…' : "Save today's metrics"}
        </button>
      </div>

      {/* Nutrition / food photo logging */}
      <div className="glass rounded-2xl p-5 card-in stagger-3">
        <div className="flex items-center gap-2 mb-3">
          <Utensils className="w-4 h-4 text-amber-500" />
          <h2 className="text-[11px] font-bold text-warm-500 uppercase tracking-widest">Nutrition Log</h2>
        </div>
        <p className="text-xs text-warm-400 mb-3">Snap a photo of your meal — AI estimates calories & macros instantly.</p>
        <FoodCamera
          entries={nutritionEntries}
          onLogged={async (entry) => {
            const updated = [...nutritionEntries, entry]
            setNutritionEntries(updated)
            const supabase = (await import('@/lib/supabase/client')).createClient()
            const today = new Date().toISOString().split('T')[0]
            await supabase.from('health_metrics').upsert(
              { user_id: userId, date: today, nutrition: updated },
              { onConflict: 'user_id,date' },
            )
          }}
          onDelete={async (index) => {
            const updated = nutritionEntries.filter((_, i) => i !== index)
            setNutritionEntries(updated)
            const supabase = (await import('@/lib/supabase/client')).createClient()
            const today = new Date().toISOString().split('T')[0]
            await supabase.from('health_metrics').upsert(
              { user_id: userId, date: today, nutrition: updated },
              { onConflict: 'user_id,date' },
            )
          }}
        />
      </div>

      {/* Charts */}
      {history.length > 1 && (
        <div className="space-y-4">
          {CHARTS.map((chart, i) => (
            <div key={chart.key} className={`glass rounded-2xl p-5 card-in stagger-${i + 3}`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className={`w-3.5 h-3.5 ${chart.iconClass}`} />
                <h2 className="text-[11px] font-bold text-warm-400 uppercase tracking-widest">{chart.label}</h2>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#B5AEA6' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#B5AEA6' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={chart.fmt} />
                  <Bar dataKey={chart.key} fill={chart.color} radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Height / profile setting */}
      <div className="mt-4 glass rounded-2xl p-5 card-in">
        <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-3">Profile</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-warm-400 uppercase tracking-wider mb-1.5">
              📏 Height
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="100"
                max="250"
                value={height}
                placeholder="170"
                onChange={e => setHeight(e.target.value)}
                className="w-full pr-10 px-3 py-2.5 text-sm mood-note-input"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-warm-400 font-medium pointer-events-none">
                cm
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={saveHeight}
            disabled={savingH || !height}
            className="px-4 py-2.5 mood-submit-btn text-sm whitespace-nowrap"
          >
            {savedH ? '✓ Saved!' : savingH ? 'Saving…' : 'Save height'}
          </button>
        </div>
        <p className="text-[10px] text-warm-400 mt-2">Used to calculate your BMI</p>
      </div>
    </div>
  )
}
