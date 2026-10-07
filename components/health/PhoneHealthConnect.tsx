'use client'
// "Track automatically from this phone" card on the Health page. In the
// native app it connects Health Connect / Apple Health and (Android) the
// screen-usage sleep estimate; on the web it renders `fallback` instead
// (the Google Fit card — Google blocks its OAuth sign-in inside app WebViews,
// so that path is web-only).
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Smartphone, RefreshCw, CheckCircle2, Loader2, Moon, Settings2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HEALTH_SYNCED_EVENT } from '@/components/health/PhoneHealthAutoSync'
import type * as PhoneHealth from '@/lib/health/phone-health'

type Props = {
  userId: string
  todayMetrics: any
  fallback: ReactNode
}

export default function PhoneHealthConnect({ userId, todayMetrics, fallback }: Props) {
  const router = useRouter()
  const [ph, setPh] = useState<typeof PhoneHealth | null>(null)
  const [platform, setPlatform] = useState<'android' | 'ios' | null | undefined>(undefined)
  const [available, setAvailable] = useState<{ available: boolean; reason?: string } | null>(null)
  const [healthOn, setHealthOn] = useState(false)
  const [usage, setUsage] = useState({ supported: false, granted: false, enabled: false })
  const [busy, setBusy] = useState<'connect' | 'sync' | null>(null)
  const [error, setError] = useState('')
  const [lastSync, setLastSync] = useState<number | null>(null)

  const refreshState = useCallback(async (mod: typeof PhoneHealth) => {
    setHealthOn(mod.isPhoneHealthEnabled())
    setLastSync(mod.getLastSync())
    const access = await mod.checkUsageAccess()
    // Access granted in Settings while the toggle was pending → switch it on.
    if (access.granted && localStorageGet('vm.phoneUsageSleep.pending')) {
      mod.setUsageSleepEnabled(true)
      localStorageSet('vm.phoneUsageSleep.pending', false)
    }
    setUsage({ ...access, enabled: access.granted && mod.isUsageSleepEnabled() })
  }, [])

  useEffect(() => {
    let cancelled = false
    import('@/lib/health/phone-health').then(async mod => {
      if (cancelled) return
      setPh(mod)
      const p = mod.nativePlatform()
      setPlatform(p)
      if (!p) return
      setAvailable(await mod.checkHealthAvailability())
      await refreshState(mod)
    })
    return () => { cancelled = true }
  }, [refreshState])

  // Coming back from Health Connect / Usage access settings.
  useEffect(() => {
    if (!ph || !platform) return
    const onVisible = () => { if (document.visibilityState === 'visible') refreshState(ph) }
    const onSynced = () => setLastSync(ph.getLastSync())
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener(HEALTH_SYNCED_EVENT, onSynced)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(HEALTH_SYNCED_EVENT, onSynced)
    }
  }, [ph, platform, refreshState])

  async function sync(mod = ph) {
    if (!mod) return
    setBusy('sync'); setError('')
    try {
      await mod.syncPhoneHealth(createClient(), userId)
      setLastSync(mod.getLastSync())
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Sync failed')
    } finally {
      setBusy(null)
    }
  }

  async function connect() {
    if (!ph) return
    setBusy('connect'); setError('')
    try {
      const ok = await ph.connectPhoneHealth()
      setHealthOn(ok)
      if (!ok) {
        setError(`No permissions were granted. You can allow them in ${ph.healthStoreName()} settings.`)
        setBusy(null)
        return
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not open the permission screen')
      setBusy(null)
      return
    }
    await sync()
  }

  async function toggleUsageSleep() {
    if (!ph) return
    if (usage.enabled) {
      ph.setUsageSleepEnabled(false)
      setUsage(u => ({ ...u, enabled: false }))
      return
    }
    if (!usage.granted) {
      localStorageSet('vm.phoneUsageSleep.pending', true)
      await ph.openUsageAccessSettings()
      return
    }
    ph.setUsageSleepEnabled(true)
    setUsage(u => ({ ...u, enabled: true }))
    await sync()
  }

  if (platform === undefined) return null
  if (platform === null) return <>{fallback}</>

  const store = ph?.healthStoreName() ?? 'Health'
  const tiles = [
    { label: 'Steps',    value: todayMetrics?.steps != null ? Number(todayMetrics.steps).toLocaleString() : '—' },
    { label: 'Distance', value: todayMetrics?.distance_m != null ? `${(todayMetrics.distance_m / 1000).toFixed(2)} km` : '—' },
    { label: 'Sleep',    value: todayMetrics?.sleep_hours != null ? `${todayMetrics.sleep_hours} h` : '—' },
    { label: 'Heart',    value: todayMetrics?.heart_rate_avg != null ? `${todayMetrics.heart_rate_avg} bpm` : '—' },
    { label: 'Active',   value: todayMetrics?.active_calories != null ? `${todayMetrics.active_calories} kcal` : '—' },
  ]

  return (
    <div className="glass rounded-2xl p-5 card-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-sage-500" />
          <h2 className="text-[11px] font-bold text-warm-500 uppercase tracking-widest">Phone tracking</h2>
        </div>
        {healthOn || usage.enabled ? (
          <button
            type="button"
            onClick={() => sync()}
            disabled={busy !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100 transition-colors disabled:opacity-50"
          >
            {busy === 'sync' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {busy === 'sync' ? 'Syncing…' : 'Sync now'}
          </button>
        ) : null}
      </div>

      {/* Health store */}
      {available && !available.available ? (
        <div className="text-xs text-warm-500 leading-relaxed mb-4">
          <p className="mb-2">
            {store} isn&apos;t available on this phone{available.reason ? ` (${available.reason})` : ''}.
            {platform === 'android' && ' On Android 13 or older, install “Health Connect” from the Play Store, then come back.'}
          </p>
          {platform === 'android' && (
            <button type="button" onClick={() => ph?.openHealthSettings()}
              className="text-sage-600 font-semibold underline">Open Health Connect</button>
          )}
        </div>
      ) : healthOn ? (
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-warm-800">Connected to {store}</p>
            <p className="text-[10px] text-warm-400">
              {lastSync ? `Updated ${formatDistanceToNow(new Date(lastSync), { addSuffix: true })} · ` : ''}syncs automatically when you open the app
            </p>
          </div>
          {platform === 'android' && (
            <button type="button" title="Health Connect permissions" onClick={() => ph?.openHealthSettings()}
              className="ml-auto p-1.5 text-warm-400 hover:text-warm-600">
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-xs text-warm-400 mb-3 leading-relaxed">
            Count steps, walking distance, sleep and heart rate automatically — from your phone&apos;s
            motion sensors and any watch or app that saves to {store}.
          </p>
          <button
            type="button"
            onClick={connect}
            disabled={busy !== null || !available}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-sage-600 hover:bg-sage-700 text-white transition-colors disabled:opacity-50"
          >
            {busy === 'connect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
            Connect {store}
          </button>
        </div>
      )}

      {/* Sleep from screen usage (Android) */}
      {platform === 'android' && usage.supported && (
        <div className="flex items-start gap-3 py-3 border-t border-warm-100">
          <Moon className="w-4 h-4 text-lavender-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-warm-800">Sleep from phone usage</p>
            <p className="text-[11px] text-warm-400 leading-relaxed">
              Estimates sleep from the longest overnight stretch your screen stayed off. Used when no
              sleep tracker has data.{!usage.granted && ' Needs “Usage access” — tap to allow VitalMind in the list.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={usage.enabled}
            aria-label="Sleep from phone usage"
            onClick={toggleUsageSleep}
            className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${usage.enabled ? 'bg-sage-500' : 'bg-warm-200'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${usage.enabled ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
      )}

      {(healthOn || usage.enabled) && (
        <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-warm-100">
          {tiles.map(t => (
            <div key={t.label} className="text-center min-w-0">
              <p className="text-[9px] font-bold text-warm-400 uppercase tracking-wider">{t.label}</p>
              <p className="text-xs font-semibold text-warm-800 truncate">{t.value}</p>
            </div>
          ))}
        </div>
      )}
      {todayMetrics?.sleep_source === 'phone_usage' && (
        <p className="text-[10px] text-warm-400 mt-2">Sleep estimated from screen usage.</p>
      )}

      {error && <p className="text-xs text-coral-600 mt-3">{error}</p>}
    </div>
  )
}

function localStorageGet(key: string) {
  try { return localStorage.getItem(key) === '1' } catch { return false }
}
function localStorageSet(key: string, on: boolean) {
  try { on ? localStorage.setItem(key, '1') : localStorage.removeItem(key) } catch {}
}
