'use client'
// Pulls the latest steps / sleep / heart rate from the phone whenever the
// native app is opened or brought back to the foreground (at most every 15
// min), then refreshes server-rendered pages so the new numbers show up.
// Renders nothing; a no-op on the web app or before the user connects.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const HEALTH_SYNCED_EVENT = 'vm:health-synced'

export default function PhoneHealthAutoSync({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    let running = false

    async function maybeSync() {
      if (running || document.visibilityState !== 'visible') return
      const ph = await import('@/lib/health/phone-health')
      if (!ph.nativePlatform() || !ph.isAutoSyncDue()) return
      if (!ph.isPhoneHealthEnabled() && !ph.isUsageSleepEnabled()) return
      running = true
      try {
        const res = await ph.syncPhoneHealth(createClient(), userId)
        if (res.days > 0) {
          window.dispatchEvent(new CustomEvent(HEALTH_SYNCED_EVENT))
          router.refresh()
        }
      } catch {
        // Background sync is best-effort; the Health page shows errors on manual sync.
      } finally {
        running = false
      }
    }

    maybeSync()
    document.addEventListener('visibilitychange', maybeSync)
    return () => document.removeEventListener('visibilitychange', maybeSync)
  }, [userId, router])

  return null
}
