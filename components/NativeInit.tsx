'use client'
// Runs once on mount to configure the native shell (status bar, splash
// screen) when the app is running inside Capacitor. A no-op on the regular
// web app — Capacitor.isNativePlatform() is false there.
import { useEffect } from 'react'

export default function NativeInit() {
  useEffect(() => {
    (async () => {
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) return

      const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
      ])
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#0f1623' }).catch(() => {})
      }
      await SplashScreen.hide().catch(() => {})
    })()
  }, [])

  return null
}
