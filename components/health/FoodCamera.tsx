'use client'
import { useState, useRef } from 'react'
import { Camera, Loader2, CheckCircle2, UtensilsCrossed } from 'lucide-react'

type NutritionEntry = {
  meal: string
  calories: number
  protein: number
  carbs: number
  fat: number
  logged_at: string
}

export default function FoodCamera({ onLogged }: { onLogged: (entry: NutritionEntry) => void }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NutritionEntry | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const base64 = await toBase64(file)
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setResult(data)
      onLogged(data)
    } catch {
      setError('Could not analyse the photo. Try a clearer image.')
    } finally {
      setLoading(false)
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

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100 transition-colors disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Camera className="w-4 h-4" />
        }
        {loading ? 'Analysing…' : 'Log meal from photo'}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="glass rounded-xl p-3 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-warm-800 capitalize">{result.meal}</p>
            <div className="flex gap-3 mt-1 text-xs text-warm-500">
              <span>{result.calories} kcal</span>
              <span>P: {result.protein}g</span>
              <span>C: {result.carbs}g</span>
              <span>F: {result.fat}g</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
