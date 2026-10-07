// Automatic tracking from the phone itself, inside the native app only:
//  - Health Connect (Android) / Apple Health (iOS) via @capgo/capacitor-health:
//    steps, walking distance, active calories, sleep, heart rate, weight.
//  - Android only: sleep estimated from screen on/off history (the native
//    PhoneUsage plugin in android/.../PhoneUsagePlugin.java) for people with
//    no sleep tracker writing to Health Connect.
// Everything is written into health_metrics, one row per local calendar day,
// so the dashboard, wellness score and AI companion all pick it up for free.
// All entry points no-op on the regular web app.
import { Capacitor, registerPlugin } from '@capacitor/core'
import type { SupabaseClient } from '@supabase/supabase-js'

type ScreenEvent = { t: number; on: boolean }
type PhoneUsagePlugin = {
  checkAccess(): Promise<{ supported: boolean; granted: boolean }>
  openAccessSettings(): Promise<void>
  getScreenEvents(opts: { startMs: number; endMs: number }): Promise<{ events: ScreenEvent[] }>
}
const PhoneUsage = registerPlugin<PhoneUsagePlugin>('PhoneUsage')

const READ_TYPES = ['steps', 'distance', 'calories', 'sleep', 'heartRate', 'weight'] as const

const KEY_HEALTH_ON = 'vm.phoneHealth.enabled'
const KEY_USAGE_SLEEP_ON = 'vm.phoneUsageSleep.enabled'
const KEY_LAST_SYNC = 'vm.phoneHealth.lastSync'

const AUTO_SYNC_INTERVAL_MS = 15 * 60_000
const SYNC_DAYS = 7

// Screen-usage sleep heuristic: within each night window, the longest
// stretch with the screen off, treating quick checks (< 5 min on) as still
// asleep. Anything shorter than 3h is too short to call a night's sleep.
const NIGHT_START_HOUR = 20   // previous evening
const NIGHT_END_HOUR = 12     // noon on the wake-up day
const MAX_BLIP_MS = 5 * 60_000
const MIN_SLEEP_MS = 3 * 3_600_000

// ── tiny storage helpers (localStorage can throw in some WebViews) ─────────
function getFlag(key: string) {
  try { return localStorage.getItem(key) === '1' } catch { return false }
}
function setFlag(key: string, on: boolean) {
  try { on ? localStorage.setItem(key, '1') : localStorage.removeItem(key) } catch {}
}
export function getLastSync(): number | null {
  try { return Number(localStorage.getItem(KEY_LAST_SYNC)) || null } catch { return null }
}

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}
export function nativePlatform(): 'android' | 'ios' | null {
  if (!Capacitor.isNativePlatform()) return null
  const p = Capacitor.getPlatform()
  return p === 'android' || p === 'ios' ? p : null
}
export function healthStoreName() {
  return nativePlatform() === 'ios' ? 'Apple Health' : 'Health Connect'
}

export function isPhoneHealthEnabled() { return getFlag(KEY_HEALTH_ON) }
export function isUsageSleepEnabled() { return getFlag(KEY_USAGE_SLEEP_ON) }

/** Local-calendar YYYY-MM-DD (not UTC — a 1am walk belongs to that local day). */
export function localDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfLocalDay(daysAgo: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d
}

// ── Health Connect / Apple Health ──────────────────────────────────────────
export async function checkHealthAvailability(): Promise<{ available: boolean; reason?: string }> {
  if (!nativePlatform()) return { available: false, reason: 'Only available in the VitalMind phone app.' }
  try {
    const { Health } = await import('@capgo/capacitor-health')
    const res = await Health.isAvailable()
    return { available: res.available, reason: res.reason }
  } catch (e: any) {
    return { available: false, reason: e?.message ?? 'Health data is not available on this device.' }
  }
}

/** Shows the OS permission sheet. Returns true if at least one type was granted (Android) or the sheet completed (iOS hides read status). */
export async function connectPhoneHealth(): Promise<boolean> {
  const { Health } = await import('@capgo/capacitor-health')
  const status = await Health.requestAuthorization({ read: [...READ_TYPES], write: [] })
  const ok = nativePlatform() === 'ios' || status.readAuthorized.length > 0
  setFlag(KEY_HEALTH_ON, ok)
  return ok
}

export function disconnectPhoneHealth() {
  setFlag(KEY_HEALTH_ON, false)
}

export async function openHealthSettings() {
  const { Health } = await import('@capgo/capacitor-health')
  await Health.openHealthConnectSettings().catch(() => {})
}

type DayMetrics = {
  steps?: number
  distance_m?: number
  active_calories?: number
  heart_rate_avg?: number
  weight_kg?: number
  sleep_hours?: number
  sleep_source?: 'health' | 'phone_usage'
}

async function readHealthStore(days: number): Promise<Record<string, DayMetrics>> {
  const { Health } = await import('@capgo/capacitor-health')
  const start = startOfLocalDay(days - 1)
  const range = { startDate: start.toISOString(), endDate: new Date().toISOString() }
  const out: Record<string, DayMetrics> = {}
  const day = (iso: string) => (out[localDateKey(new Date(iso))] ??= {})

  // Each type is read independently — a denied/unsupported type shouldn't sink the rest.
  const sum = async (dataType: 'steps' | 'distance' | 'calories', field: 'steps' | 'distance_m' | 'active_calories') => {
    try {
      const { samples } = await Health.queryAggregated({ ...range, dataType, bucket: 'day', aggregation: 'sum' })
      for (const s of samples) if (s.value > 0) day(s.startDate)[field] = Math.round(s.value)
    } catch {}
  }
  const avg = async (dataType: 'heartRate' | 'weight', field: 'heart_rate_avg' | 'weight_kg') => {
    try {
      const { samples } = await Health.queryAggregated({ ...range, dataType, bucket: 'day', aggregation: 'average' })
      for (const s of samples) {
        if (s.value > 0) day(s.startDate)[field] = field === 'weight_kg' ? Math.round(s.value * 10) / 10 : Math.round(s.value)
      }
    } catch {}
  }

  await Promise.all([
    sum('steps', 'steps'),
    sum('distance', 'distance_m'),
    sum('calories', 'active_calories'),
    avg('heartRate', 'heart_rate_avg'),
    avg('weight', 'weight_kg'),
  ])

  // Sleep: start the read the evening before the first day so that night counts.
  try {
    const sleepStart = new Date(start.getTime() - (24 - NIGHT_START_HOUR) * 3_600_000)
    const { samples } = await Health.readSamples({
      dataType: 'sleep', startDate: sleepStart.toISOString(), endDate: range.endDate, limit: 500,
    })
    for (const [date, hours] of Object.entries(sleepHoursByWakeDate(samples))) {
      if (hours > 0) Object.assign(day(`${date}T12:00:00`), { sleep_hours: hours, sleep_source: 'health' as const })
    }
  } catch {}

  return out
}

type Interval = [number, number]

function mergeIntervals(intervals: Interval[], gapMs = 0): Interval[] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0])
  const merged: Interval[] = []
  for (const iv of sorted) {
    const last = merged[merged.length - 1]
    if (last && iv[0] <= last[1] + gapMs) last[1] = Math.max(last[1], iv[1])
    else merged.push([...iv])
  }
  return merged
}

/** Total hours asleep per wake-up date. Merges overlaps so a watch + phone recording the same night isn't double counted. */
function sleepHoursByWakeDate(samples: Array<{ startDate: string; endDate: string; sleepState?: string; stages?: Array<{ startDate: string; endDate: string; stage: string }> }>) {
  const asleep: Interval[] = []
  const inBed: Interval[] = []
  for (const s of samples) {
    const segments = s.stages?.length
      ? s.stages.map(st => ({ startDate: st.startDate, endDate: st.endDate, state: st.stage }))
      : [{ startDate: s.startDate, endDate: s.endDate, state: s.sleepState ?? 'asleep' }]
    for (const seg of segments) {
      const iv: Interval = [Date.parse(seg.startDate), Date.parse(seg.endDate)]
      if (!(iv[1] > iv[0])) continue
      if (seg.state === 'awake') continue
      ;(seg.state === 'inBed' ? inBed : asleep).push(iv)
    }
  }
  // iPhone-only users with a Sleep Schedule only get "in bed" records — use those when nothing better exists.
  const intervals = mergeIntervals(asleep.length ? asleep : inBed)
  const byDate: Record<string, number> = {}
  for (const [a, b] of intervals) {
    const key = localDateKey(new Date(b))
    byDate[key] = (byDate[key] ?? 0) + (b - a)
  }
  for (const k of Object.keys(byDate)) byDate[k] = Math.round((byDate[k] / 3_600_000) * 10) / 10
  return byDate
}

// ── Sleep from phone usage (Android) ──────────────────────────────────────
export async function checkUsageAccess(): Promise<{ supported: boolean; granted: boolean }> {
  if (nativePlatform() !== 'android') return { supported: false, granted: false }
  try { return await PhoneUsage.checkAccess() } catch { return { supported: false, granted: false } }
}

export async function openUsageAccessSettings() {
  await PhoneUsage.openAccessSettings()
}

export function setUsageSleepEnabled(on: boolean) {
  setFlag(KEY_USAGE_SLEEP_ON, on)
}

async function estimateSleepFromScreen(days: number): Promise<Record<string, number>> {
  const firstWake = startOfLocalDay(days - 1)
  const rangeStart = firstWake.getTime() - (24 - NIGHT_START_HOUR) * 3_600_000
  const now = Date.now()
  const { events } = await PhoneUsage.getScreenEvents({ startMs: rangeStart, endMs: now })
  if (!events.length) return {}

  // Turn on/off transitions into screen-off intervals. Before the first
  // event, the screen was in the opposite state of that event.
  const off: Interval[] = []
  let offSince: number | null = events[0].on ? rangeStart : null
  for (const e of events) {
    if (e.on && offSince != null) { off.push([offSince, e.t]); offSince = null }
    else if (!e.on && offSince == null) offSince = e.t
  }
  if (offSince != null) off.push([offSince, now])

  // Quick night-time phone checks don't end a night's sleep.
  const merged = mergeIntervals(off, MAX_BLIP_MS)

  const out: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const wakeDay = startOfLocalDay(i)
    const winStart = wakeDay.getTime() - (24 - NIGHT_START_HOUR) * 3_600_000
    const winEnd = Math.min(wakeDay.getTime() + NIGHT_END_HOUR * 3_600_000, now)
    let longest = 0
    let longestEnd = 0
    for (const [a, b] of merged) {
      const len = Math.min(b, winEnd) - Math.max(a, winStart)
      if (len > longest) { longest = len; longestEnd = b }
    }
    // A screen still off "right now" may just mean the phone is on the desk —
    // only count it once the user has picked the phone back up.
    if (longestEnd >= now) continue
    if (longest >= MIN_SLEEP_MS) out[localDateKey(wakeDay)] = Math.round((longest / 3_600_000) * 10) / 10
  }
  return out
}

// ── Sync into Supabase ────────────────────────────────────────────────────
const CORE_FIELDS = ['steps', 'sleep_hours', 'weight_kg'] as const

export type SyncResult = { days: number; today: DayMetrics | null }

export async function syncPhoneHealth(supabase: SupabaseClient, userId: string, days = SYNC_DAYS): Promise<SyncResult> {
  const healthOn = isPhoneHealthEnabled()
  const usageOn = isUsageSleepEnabled() && nativePlatform() === 'android'
  if (!nativePlatform() || (!healthOn && !usageOn)) return { days: 0, today: null }

  const byDate: Record<string, DayMetrics> = healthOn ? await readHealthStore(days) : {}

  if (usageOn) {
    try {
      const estimates = await estimateSleepFromScreen(days)
      for (const [date, hours] of Object.entries(estimates)) {
        const d = (byDate[date] ??= {})
        // A real sleep tracker beats a screen-off guess.
        if (d.sleep_hours == null) Object.assign(d, { sleep_hours: hours, sleep_source: 'phone_usage' as const })
      }
    } catch {}
  }

  const dates = Object.keys(byDate).filter(d => Object.keys(byDate[d]).length)
  if (!dates.length) { markSynced(); return { days: 0, today: null } }

  // Never overwrite sleep the user typed in themselves (sleep_source null).
  const { data: existing } = await supabase
    .from('health_metrics').select('*').eq('user_id', userId).in('date', dates)
  const existingByDate = Object.fromEntries((existing ?? []).map((r: any) => [r.date, r]))

  let extendedColumns = true
  for (const date of dates) {
    const m = { ...byDate[date] }
    const prev = existingByDate[date]
    if (prev?.sleep_hours != null && prev.sleep_source == null) { delete m.sleep_hours; delete m.sleep_source }

    const row: Record<string, any> = { user_id: userId, date, ...m, synced_at: new Date().toISOString() }
    let { error } = await supabase.from('health_metrics').upsert(
      extendedColumns ? row : pick(row), { onConflict: 'user_id,date' })
    // Migration 015 not applied yet — fall back to the original columns.
    if (error && extendedColumns && /column|schema cache/i.test(error.message)) {
      extendedColumns = false
      ;({ error } = await supabase.from('health_metrics').upsert(pick(row), { onConflict: 'user_id,date' }))
    }
    if (error) throw new Error(error.message)
  }

  markSynced()
  return { days: dates.length, today: byDate[localDateKey(new Date())] ?? null }
}

function pick(row: Record<string, any>) {
  const out: Record<string, any> = { user_id: row.user_id, date: row.date }
  for (const f of CORE_FIELDS) if (row[f] != null) out[f] = row[f]
  return out
}

function markSynced() {
  try { localStorage.setItem(KEY_LAST_SYNC, String(Date.now())) } catch {}
}

export function isAutoSyncDue() {
  const last = getLastSync()
  return !last || Date.now() - last > AUTO_SYNC_INTERVAL_MS
}
