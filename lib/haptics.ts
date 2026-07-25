// Haptic feedback helper backed by @capacitor/haptics. Its web implementation
// falls back to the standard Vibration API automatically, and upgrades to a
// real taptic engine for free once wrapped in the native Capacitor shell —
// callers never need to know which one is active.
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export function hapticTap() {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}

export function hapticSuccess() {
  Haptics.notification({ type: NotificationType.Success }).catch(() => {})
}
