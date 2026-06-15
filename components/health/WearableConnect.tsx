'use client'
import { useState } from 'react'
import { Watch, RefreshCw, CheckCircle2, Unplug, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Props = {
  connected: boolean
  lastSynced: string | null
  onSynced: () => void
}

const SUPPORTED_WATCHES = [
  { name: 'OnePlus Watch',    emoji: '⌚', note: 'via Google Fit' },
  { name: 'Pixel Watch',      emoji: '⌚', note: 'via Google Fit' },
  { name: 'Samsung Galaxy',   emoji: '⌚', note: 'via Google Fit' },
  { name: 'Fossil / TicWatch',emoji: '⌚', note: 'via Google Fit' },
  { name: 'Fitbit',           emoji: '⌚', note: 'via Google Fit' },
  { name: 'Garmin',           emoji: '⌚', note: 'via Google Fit' },
  { name: 'Xiaomi Mi Band',   emoji: '⌚', note: 'via Google Fit' },
  { name: 'Amazfit',          emoji: '⌚', note: 'via Google Fit' },
]

export default function WearableConnect({ connected, lastSynced, onSynced }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)
  const [showDevices, setShowDevices] = useState(false)

  async function syncNow() {
    setSyncing(true)
    try {
      const res = await fetch('/api/integrations/google-fit/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      })
      if (res.ok) {
        setJustSynced(true)
        onSynced()
        setTimeout(() => setJustSynced(false), 3000)
      }
    } finally {
      setSyncing(false)
    }
  }

  if (!connected) {
    return (
      <div className="glass rounded-2xl p-5 card-in">
        <div className="flex items-center gap-2 mb-3">
          <Watch className="w-4 h-4 text-lavender-500" />
          <h2 className="text-[11px] font-bold text-warm-500 uppercase tracking-widest">Connect Your Watch</h2>
        </div>

        <p className="text-xs text-warm-400 mb-4 leading-relaxed">
          Sync steps, sleep, and heart rate automatically from your smartwatch — no manual logging needed.
        </p>

        {/* Supported device chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SUPPORTED_WATCHES.map(w => (
            <span key={w.name} className="text-[10px] font-medium px-2 py-1 rounded-full bg-lavender-50 text-lavender-700 border border-lavender-100">
              {w.name}
            </span>
          ))}
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-warm-50 text-warm-400 border border-warm-100">
            + many more
          </span>
        </div>

        <a
          href="/api/integrations/google-fit/connect"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-lavender-600 hover:bg-lavender-700 text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connect via Google Fit
        </a>

        <p className="text-[10px] text-warm-300 text-center mt-2">
          Works with any watch that syncs to Google Fit
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-5 card-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-sage-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-warm-800">Google Fit Connected</p>
            {lastSynced && (
              <p className="text-[10px] text-warm-400">
                Last synced {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={syncNow}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100 transition-colors disabled:opacity-50"
        >
          {syncing
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : justSynced
            ? <CheckCircle2 className="w-3 h-3" />
            : <RefreshCw className="w-3 h-3" />
          }
          {syncing ? 'Syncing…' : justSynced ? 'Synced!' : 'Sync now'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-warm-100">
        <span className="text-[10px] px-2 py-1 rounded-full bg-sage-50 text-sage-600 border border-sage-100">✓ Steps</span>
        <span className="text-[10px] px-2 py-1 rounded-full bg-sage-50 text-sage-600 border border-sage-100">✓ Sleep</span>
        <span className="text-[10px] px-2 py-1 rounded-full bg-sage-50 text-sage-600 border border-sage-100">✓ Heart Rate</span>
        <span className="text-[10px] px-2 py-1 rounded-full bg-sage-50 text-sage-600 border border-sage-100">✓ Weight</span>
      </div>
    </div>
  )
}
