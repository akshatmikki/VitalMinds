'use client'
// Walking distance — GPS-tracked walk sessions. @capacitor/geolocation ships
// its own web implementation (navigator.geolocation under the hood), so this
// works the same in a regular browser and inside the native app — no
// separate web/native branching needed.
import { useEffect, useRef, useState } from 'react'
import { Play, Square, Footprints, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { haversineMeters, formatKm, formatPaceMinPerKm, formatDuration, type GeoPoint } from '@/lib/health/distance'

export type WalkSession = {
  id: string
  started_at: string
  ended_at: string
  distance_m: number
  duration_s: number
}

type Props = {
  userId: string
  sessions: WalkSession[]
  onSaved: (session: WalkSession) => void
}

// Ignore GPS fixes worse than this (meters) — cuts down on jitter-driven
// distance inflation while standing still.
const MIN_ACCURACY_M = 30
// Ignore any single fix-to-fix jump bigger than this (meters) — a ~7 m/s cap
// (~25 km/h), well above walking pace, to reject GPS glitches/teleports.
const MAX_JUMP_M = 50
// Below this, a "walk" is almost certainly an accidental start/stop.
const MIN_SAVE_DISTANCE_M = 10

export default function WalkTracker({ userId, sessions, onSaved }: Props) {
  const [tracking, setTracking] = useState(false)
  const [distanceM, setDistanceM] = useState(0)
  const [elapsedS, setElapsedS] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const watchIdRef   = useRef<string | null>(null)
  const lastPointRef = useRef<GeoPoint | null>(null)
  const startedAtRef = useRef<string | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Safety net if the user navigates away mid-walk.
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (watchIdRef.current) {
        import('@capacitor/geolocation').then(({ Geolocation }) =>
          Geolocation.clearWatch({ id: watchIdRef.current! })
        )
      }
    }
  }, [])

  async function start() {
    setError('')
    const { Capacitor } = await import('@capacitor/core')
    const { Geolocation } = await import('@capacitor/geolocation')

    // requestPermissions() is a native-only concept — on web the browser
    // requests permission implicitly on the first watchPosition() call, and
    // @capacitor/geolocation's web implementation deliberately throws
    // "not implemented" if you call requestPermissions() there.
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await Geolocation.requestPermissions()
        if (perm.location === 'denied') {
          setError('Location permission denied — enable it in your device settings to track walks.')
          return
        }
      } catch {
        setError('Could not request location permission.')
        return
      }
    }

    setDistanceM(0)
    setElapsedS(0)
    lastPointRef.current = null
    startedAtRef.current = new Date().toISOString()
    setTracking(true)
    timerRef.current = setInterval(() => setElapsedS(s => s + 1), 1000)

    try {
      watchIdRef.current = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (position, err) => {
          if (err) {
            setError('Could not access your location — check that location access is allowed for this app.')
            return
          }
          if (!position) return
          if (position.coords.accuracy != null && position.coords.accuracy > MIN_ACCURACY_M) return
          const point: GeoPoint = { lat: position.coords.latitude, lng: position.coords.longitude }
          if (lastPointRef.current) {
            const delta = haversineMeters(lastPointRef.current, point)
            if (delta < MAX_JUMP_M) setDistanceM(d => d + delta)
          }
          lastPointRef.current = point
        }
      )
    } catch {
      setError('Could not start GPS tracking.')
      setTracking(false)
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }

  async function stop() {
    setTracking(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    const { Geolocation } = await import('@capacitor/geolocation')
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current })
      watchIdRef.current = null
    }

    if (distanceM < MIN_SAVE_DISTANCE_M) return

    setSaving(true)
    const supabase = createClient()
    const { data, error: dbError } = await supabase
      .from('walk_sessions')
      .insert({
        user_id: userId,
        started_at: startedAtRef.current ?? new Date().toISOString(),
        ended_at: new Date().toISOString(),
        distance_m: Math.round(distanceM * 10) / 10,
        duration_s: elapsedS,
      })
      .select()
      .single()
    setSaving(false)
    if (!dbError && data) onSaved(data as WalkSession)
  }

  const todayTotalM = sessions.reduce((sum, s) => sum + s.distance_m, 0)

  return (
    <div className="glass rounded-2xl p-5 card-in">
      <div className="flex items-center gap-2 mb-3">
        <Footprints className="w-4 h-4 text-teal-500" />
        <h2 className="text-[11px] font-bold text-warm-500 uppercase tracking-widest">Walk Tracker</h2>
      </div>

      {tracking ? (
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-warm-900">
            {formatKm(distanceM)} <span className="text-sm font-medium text-warm-400">km</span>
          </p>
          <div className="flex justify-center gap-4 mt-2 text-xs text-warm-400">
            <span>{formatDuration(elapsedS)}</span>
            <span>{formatPaceMinPerKm(distanceM, elapsedS)}</span>
          </div>
          <button
            type="button"
            onClick={stop}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
          >
            <Square className="w-3.5 h-3.5" /> Stop walk
          </button>
          <p className="text-[10px] text-warm-300 mt-3">
            Keep VitalMind open while walking — tracking pauses if the app is backgrounded.
          </p>
        </div>
      ) : (
        <div className="text-center py-2">
          {sessions.length > 0 && (
            <p className="text-xs text-warm-400 mb-3">
              {(todayTotalM / 1000).toFixed(2)} km today across {sessions.length} walk{sessions.length !== 1 ? 's' : ''}
            </p>
          )}
          <button
            type="button"
            onClick={start}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-500 hover:bg-teal-600 text-white transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Start walk'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 text-center mt-3">{error}</p>}

      {sessions.length > 0 && !tracking && (
        <div className="mt-4 space-y-1.5 pt-3 border-t border-warm-100">
          {sessions.slice(0, 5).map(s => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className="text-warm-500">
                {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="font-semibold text-warm-700">{(s.distance_m / 1000).toFixed(2)} km</span>
              <span className="text-warm-400">{formatDuration(s.duration_s)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
