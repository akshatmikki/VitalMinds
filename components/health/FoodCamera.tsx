'use client'
import { useState, useRef, useEffect } from 'react'
import { Loader2, Utensils, Trash2, Camera as CameraIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type NutritionEntry = {
  meal: string
  calories: number
  protein: number
  carbs: number
  fat: number
  logged_at: string
  photo_path?: string | null
}

type Props = {
  userId: string
  entries: NutritionEntry[]
  onLogged: (entry: NutritionEntry) => void
  onDelete?: (index: number) => void
}

const MACRO_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 }
const PHOTO_BUCKET = 'meal-photos'

type RingVariant = 'protein' | 'carbs' | 'fat'

const RING_CLASSES: Record<RingVariant, string> = {
  protein: 'nutrition-ring-protein',
  carbs:   'nutrition-ring-carbs',
  fat:     'nutrition-ring-fat',
}

const MACRO_TEXT_CLASSES: Record<RingVariant, string> = {
  protein: 'text-sage-500',
  carbs:   'text-amber-500',
  fat:     'text-orange-500',
}

function MacroRing({
  value, max, variant, label, unit,
}: { value: number; max: number; variant: RingVariant; label: string; unit: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[60px] h-[60px]">
        <svg className="w-[60px] h-[60px] -rotate-90" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r={r} fill="none" stroke="#F0ECE6" strokeWidth="5" />
          <circle
            cx="30" cy="30" r={r} fill="none" strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn('nutrition-ring-fill', RING_CLASSES[variant])}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold text-warm-800 leading-none">{value}</span>
          <span className="text-[8px] text-warm-400 leading-none mt-0.5">{unit}</span>
        </div>
      </div>
      <span className="text-[9px] font-bold text-warm-400 uppercase tracking-wider">{label}</span>
      <span className="text-[8px] text-warm-300">{pct}%</span>
    </div>
  )
}

// Meal thumbnail — bucket is private, so each entry's signed URL is fetched
// lazily and cached in local state rather than stored (signed URLs expire).
function MealThumbnail({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    createClient().storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled && data) setUrl(data.signedUrl)
    })
    return () => { cancelled = true }
  }, [path])

  if (!url) {
    return (
      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
        <Utensils className="w-3.5 h-3.5 text-amber-500" />
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
}

export default function FoodCamera({ userId, entries, onLogged, onDelete }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const inputRef   = useRef<HTMLInputElement>(null)
  const calTrackRef = useRef<HTMLDivElement>(null)

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein:  acc.protein  + (e.protein  || 0),
      carbs:    acc.carbs    + (e.carbs    || 0),
      fat:      acc.fat      + (e.fat      || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const calPct      = Math.min(100, Math.round((totals.calories / MACRO_GOALS.calories) * 100))
  const calBarColor = calPct >= 100 ? 'bg-red-400' : calPct >= 75 ? 'bg-amber-400' : 'bg-sage-400'

  useEffect(() => {
    calTrackRef.current?.style.setProperty('--cal-pct', `${calPct}%`)
  }, [calPct])

  async function capture() {
    setError('')
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) {
      inputRef.current?.click()
      return
    }
    setLoading(true)
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        quality: 80,
      })
      if (!photo.base64String) throw new Error('No photo data')
      await processPhoto(photo.base64String, `image/${photo.format || 'jpeg'}`)
    } catch (err: any) {
      // User cancelling the native camera sheet throws too — don't show an error for that.
      if (err?.message !== 'User cancelled photos app') {
        setError('Could not capture photo. Try again.')
      }
      setLoading(false)
    }
  }

  async function handleFile(file: File) {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const base64 = await toBase64(file)
      await processPhoto(base64, file.type)
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function processPhoto(base64: string, mimeType: string) {
    try {
      const [nutritionRes, photoPath] = await Promise.all([
        fetch('/api/nutrition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        }).then(res => {
          if (!res.ok) throw new Error('Analysis failed')
          return res.json()
        }),
        uploadPhoto(base64, mimeType),
      ])
      onLogged({ ...nutritionRes, photo_path: photoPath })
    } catch {
      setError('Could not analyse the photo. Try a clearer image.')
    } finally {
      setLoading(false)
    }
  }

  async function uploadPhoto(base64: string, mimeType: string): Promise<string | null> {
    try {
      const ext = mimeType.split('/')[1] || 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${ext}`
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
      const { error: uploadError } = await createClient().storage
        .from(PHOTO_BUCKET)
        .upload(path, bytes, { contentType: mimeType })
      return uploadError ? null : path
    } catch {
      return null // AI macros still get logged even if the photo upload fails
    }
  }

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleDelete(index: number) {
    const entry = entries[index]
    if (entry?.photo_path) {
      await createClient().storage.from(PHOTO_BUCKET).remove([entry.photo_path])
    }
    onDelete?.(index)
  }

  return (
    <div className="space-y-4">
      {/* Web fallback — triggered by capture() when not running natively */}
      <label className="sr-only" htmlFor="meal-photo-input">Upload meal photo for nutrition analysis</label>
      <input
        id="meal-photo-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Daily summary */}
      {entries.length > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4 space-y-4">
          {/* Calorie progress */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-warm-800">{totals.calories}</span>
                <span className="text-xs text-warm-400">kcal today</span>
              </div>
              <span className="text-[10px] font-semibold text-warm-400">
                {Math.max(0, MACRO_GOALS.calories - totals.calories)} left
              </span>
            </div>
            <div ref={calTrackRef} className="h-2.5 bg-warm-100 rounded-full overflow-hidden">
              <div className={cn('nutrition-cal-bar-fill', calBarColor)} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-warm-300">0</span>
              <span className="text-[9px] text-warm-300">{MACRO_GOALS.calories} kcal goal</span>
            </div>
          </div>

          {/* Macro rings */}
          <div className="flex justify-around">
            <MacroRing value={totals.protein} max={MACRO_GOALS.protein} variant="protein" label="Protein" unit="g" />
            <MacroRing value={totals.carbs}   max={MACRO_GOALS.carbs}   variant="carbs"   label="Carbs"   unit="g" />
            <MacroRing value={totals.fat}     max={MACRO_GOALS.fat}     variant="fat"     label="Fat"     unit="g" />
          </div>
        </div>
      )}

      {/* Meal list */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">
            {entries.length} meal{entries.length !== 1 ? 's' : ''} logged
          </p>
          {entries.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-warm-100 group hover:border-amber-200 transition-colors"
            >
              {e.photo_path
                ? <MealThumbnail path={e.photo_path} />
                : (
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Utensils className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-warm-800 capitalize truncate">{e.meal}</p>
                <div className="flex gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-medium text-warm-500">{e.calories} kcal</span>
                  <span className={cn('text-[10px] font-semibold', MACRO_TEXT_CLASSES.protein)}>P {e.protein}g</span>
                  <span className={cn('text-[10px] font-semibold', MACRO_TEXT_CLASSES.carbs)}>C {e.carbs}g</span>
                  <span className={cn('text-[10px] font-semibold', MACRO_TEXT_CLASSES.fat)}>F {e.fat}g</span>
                </div>
              </div>
              <span className="text-[9px] text-warm-300 shrink-0">
                {new Date(e.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-warm-200 hover:text-red-400 transition-all ml-1"
                  aria-label="Remove meal"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Log button */}
      <button
        type="button"
        onClick={capture}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 border-dashed border-amber-200 text-amber-600 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 transition-colors disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <CameraIcon className="w-4 h-4" />
        }
        {loading ? 'Analysing photo…' : entries.length === 0 ? 'Log first meal from photo' : 'Add another meal'}
      </button>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
