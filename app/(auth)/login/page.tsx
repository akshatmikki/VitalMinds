'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Leaf, Mail, Lock, Heart, KeyRound, ArrowLeft } from 'lucide-react'

type Mode = 'signin' | 'signup' | 'forgot'

export default function LoginPage() {
  const [mode, setMode]         = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')
  const [error, setError]       = useState('')
  const supabase = createClient()
  const router   = useRouter()

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setMessage('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setMessage('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` }
        })
        if (error) throw error
        setMessage('Check your email to confirm your account!')
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMessage('Reset link sent! Check your inbox.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard'); router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const isForgot = mode === 'forgot'
  const isSignUp = mode === 'signup'

  return (
    <div className="login-page flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient orbs */}
      <div className="login-orb-1 float" />
      <div className="login-orb-2 float" />
      <div className="login-orb-3" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8 card-in">
          <div className="relative inline-block mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto login-logo-icon">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <div className="login-logo-blur" />
          </div>
          <h1 className="text-3xl font-bold grad-white-cyan">VitalMind</h1>
          <p className="text-warm-400 mt-1.5 text-sm">Your wellness companion, always here</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 card-in stagger-1">

          {/* ── Forgot password view ── */}
          {isForgot ? (
            <>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="flex items-center gap-1.5 text-xs text-warm-400 hover:text-warm-600 transition-colors mb-5 -mt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-warm-900">Reset password</h2>
                  <p className="text-xs text-warm-400 mt-0.5">We&apos;ll email you a secure link</p>
                </div>
              </div>

              {message && (
                <div className="mb-4 p-3 rounded-xl text-sm font-medium glass-green text-sage-700">
                  {message}
                </div>
              )}
              {error && <div className="login-error mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-warm-500 uppercase tracking-widest mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm mood-note-input"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading || !!message} className="w-full py-2.5 mood-submit-btn disabled:opacity-60">
                  {loading ? 'Sending…' : message ? 'Link sent ✓' : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* ── Sign in / Sign up view ── */}
              <h2 className="text-xl font-bold text-warm-900 mb-6">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>

              {message && (
                <div className="mb-4 p-3 rounded-xl text-sm font-medium glass-green text-sage-700">
                  {message}
                </div>
              )}
              {error && <div className="login-error mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-warm-500 uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm mood-note-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-warm-500 uppercase tracking-widest">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-[11px] text-sage-600 hover:text-sage-700 font-semibold transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 text-sm mood-note-input"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-2.5 mood-submit-btn">
                  {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-warm-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="login-divider-text">or</span>
                </div>
              </div>

              <button type="button" onClick={handleGoogle} className="login-google-btn">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <p className="mt-5 text-center text-sm text-warm-400">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
                  className="text-sage-600 hover:text-sage-700 font-semibold transition-colors"
                >
                  {isSignUp ? 'Sign in' : 'Sign up free'}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-warm-400 mt-6 flex items-center justify-center gap-1.5">
          <Heart className="w-3 h-3 text-coral-400" />
          Your mental health matters. We&apos;re here for you.
        </p>
      </div>
    </div>
  )
}
