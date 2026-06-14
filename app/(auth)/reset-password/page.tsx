import { Suspense } from 'react'
import ResetPasswordClient from './ResetPasswordClient'

function ResetPasswordFallback() {
  return (
    <div className="login-page flex items-center justify-center p-4 relative overflow-hidden">
      <div className="login-orb-1 float" />
      <div className="login-orb-2 float" />
      <div className="login-orb-3" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 card-in">
          <h1 className="text-3xl font-bold grad-white-cyan">VitalMind</h1>
          <p className="text-warm-400 mt-1.5 text-sm">Preparing your password reset...</p>
        </div>

        <div className="glass rounded-2xl p-8 card-in stagger-1">
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full border-2 border-sage-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm text-warm-400">Loading reset form...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordClient />
    </Suspense>
  )
}
