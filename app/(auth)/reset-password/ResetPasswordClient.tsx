'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Heart, KeyRound, Leaf, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordClient() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [linkError, setLinkError] = useState('')

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const errorDescription = searchParams.get('error_description')

    if (errorDescription) {
      setLinkError(decodeURIComponent(errorDescription).replace(/\+/g, ' '))
      return
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setLinkError('This reset link is invalid or has already been used.')
          return
        }

        setSessionReady(true)
      })
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true)
        return
      }

      setLinkError('No valid reset link found. Please request a new one.')
    })
  }, [searchParams, supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setMessage('Password updated! Redirecting...')
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1800)
    setLoading(false)
  }

  return (
    <div className="login-page flex items-center justify-center p-4 relative overflow-hidden">
      <div className="login-orb-1 float" />
      <div className="login-orb-2 float" />
      <div className="login-orb-3" />

      <div className="w-full max-w-md relative z-10">
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

        <div className="glass rounded-2xl p-8 card-in stagger-1">
          {linkError ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-coral-50 border border-coral-200 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-coral-500" />
              </div>
              <h2 className="text-xl font-bold text-warm-900 mb-2">Link expired</h2>
              <p className="text-sm text-warm-400 mb-6 leading-relaxed">{linkError}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold mood-submit-btn"
              >
                Request a new link
              </Link>
            </div>
          ) : sessionReady ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-sage-50 border border-sage-200 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-sage-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-warm-900">New password</h2>
                  <p className="text-xs text-warm-400 mt-0.5">Choose something strong</p>
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
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      placeholder="........"
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 text-sm mood-note-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-500 uppercase tracking-widest mb-2">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                    <input
                      type="password"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      required
                      placeholder="........"
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 text-sm mood-note-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || Boolean(message)}
                  className="w-full py-2.5 mood-submit-btn disabled:opacity-60"
                >
                  {loading ? 'Updating...' : message ? 'Done' : 'Update password'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-full border-2 border-sage-400 border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-sm text-warm-400">Verifying your reset link...</p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-warm-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-warm-400 hover:text-warm-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-warm-400 mt-6 flex items-center justify-center gap-1.5">
          <Heart className="w-3 h-3 text-coral-400" />
          Your mental health matters. We&apos;re here for you.
        </p>
      </div>
    </div>
  )
}
