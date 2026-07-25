// Synthesized UI sound effects via Web Audio API — no audio assets to ship/license.
let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  // Browsers suspend AudioContext until a user gesture; playSound is always
  // called from a click/tap/drag handler so this resumes it in place.
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(
  audio: AudioContext,
  { freq, duration, delay = 0, type = 'sine', peakGain = 0.15 }:
  { freq: number; duration: number; delay?: number; type?: OscillatorType; peakGain?: number }
) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  const start = audio.currentTime + delay
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export type SoundName = 'pop' | 'success' | 'whoosh' | 'error'

export function playSound(name: SoundName) {
  const audio = getContext()
  if (!audio) return

  switch (name) {
    case 'pop':
      tone(audio, { freq: 620, duration: 0.12, type: 'sine', peakGain: 0.18 })
      tone(audio, { freq: 900, duration: 0.08, delay: 0.02, type: 'sine', peakGain: 0.1 })
      break
    case 'success':
      tone(audio, { freq: 523.25, duration: 0.14, type: 'sine' })
      tone(audio, { freq: 659.25, duration: 0.14, delay: 0.08, type: 'sine' })
      tone(audio, { freq: 783.99, duration: 0.22, delay: 0.16, type: 'sine' })
      break
    case 'whoosh':
      tone(audio, { freq: 300, duration: 0.18, type: 'sawtooth', peakGain: 0.05 })
      break
    case 'error':
      tone(audio, { freq: 220, duration: 0.18, type: 'triangle', peakGain: 0.12 })
      tone(audio, { freq: 180, duration: 0.22, delay: 0.05, type: 'triangle', peakGain: 0.1 })
      break
  }
}
