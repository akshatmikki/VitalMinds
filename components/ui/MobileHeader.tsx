'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Leaf, User, LogOut, KeyRound, History, X, ChevronRight, BookOpen, CheckSquare, Activity, Smile } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'

const HISTORY_ITEMS = [
  { label: 'Journal', href: '/journal',   icon: BookOpen,    color: 'text-lavender-400', dot: 'bg-lavender-400' },
  { label: 'Habits',  href: '/habits',    icon: CheckSquare, color: 'text-sage-400',     dot: 'bg-sage-400'     },
  { label: 'Health',  href: '/health',    icon: Activity,    color: 'text-sage-400',     dot: 'bg-sage-400'     },
  { label: 'Moods',   href: '/dashboard', icon: Smile,       color: 'text-coral-400',    dot: 'bg-coral-400'    },
]

export default function MobileHeader({ profile }: { profile: any }) {
  const [open, setOpen]           = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetting, setResetting] = useState(false)
  const router    = useRouter()
  const supabase  = createClient()
  const wrapRef   = useRef<HTMLDivElement>(null)

  const initials = profile?.full_name
    ? profile.full_name.trim().split(/\s+/).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : null

  async function signOut() {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function resetPassword() {
    if (resetSent) return
    setResetting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setResetSent(true)
    }
    setResetting(false)
  }

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  return (
    <header className="mobile-header md:hidden">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center sidebar-logo-icon">
          <Leaf className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-warm-900 text-[15px] tracking-wide">VitalMind</span>
      </Link>

      {/* Profile dropdown */}
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="profile-avatar-bg w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sage active:scale-95 transition-transform"
          aria-label="Open profile menu"
        >
          {initials ?? <User className="w-4 h-4" />}
        </button>

        {open && (
          <>
            {/* Full-screen backdrop */}
            <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />

            {/* Dropdown panel */}
            <div className="profile-dropdown absolute right-0 top-full mt-2 w-64 z-[70]">

              {/* User header */}
              <div className="dropdown-user-header px-3.5 pt-3.5 pb-3 border-b border-white/[.08]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="profile-avatar-bg w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {initials ?? <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate leading-tight">
                        {profile?.full_name || 'You'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage-400 shadow-[0_0_5px_#44BDA6]" />
                        <span className="text-[10px] font-medium text-sage-400 tracking-wide">Online</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/[.06]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* My Profile */}
              <div className="px-2 pt-2">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="dropdown-item flex items-center gap-2.5 px-3 py-2 rounded-xl w-full"
                >
                  <div className="w-7 h-7 rounded-lg bg-sage-500/20 border border-sage-500/20 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-sage-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">My Profile</p>
                    <p className="text-[10px] text-white/40">Stats, goals & activity</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-white/25 shrink-0" />
                </Link>
              </div>

              {/* History */}
              <div className="px-2 pt-2.5 pb-1">
                <div className="flex items-center gap-2 px-2 mb-1.5">
                  <History className="w-3 h-3 text-lavender-400" />
                  <span className="text-[9px] font-bold text-white/35 tracking-[0.12em] uppercase">History</span>
                  <div className="flex-1 h-px dropdown-divider-line" />
                </div>
                <div className="space-y-0.5">
                  {HISTORY_ITEMS.map(({ label, href, icon: Icon, color, dot }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="dropdown-history-item flex items-center gap-2.5 px-3 py-1.5 rounded-lg w-full group"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                      <span className={`text-xs font-medium ${color}`}>{label}</span>
                      <ChevronRight className="w-3 h-3 text-white/15 ml-auto group-hover:text-white/35 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-3.5 my-2 h-px dropdown-divider-line" />

              {/* Reset Password */}
              <div className="px-2">
                <button
                  type="button"
                  onClick={resetPassword}
                  disabled={resetting || resetSent}
                  className="dropdown-item flex items-center gap-2.5 px-3 py-2 rounded-xl w-full disabled:opacity-60"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {resetSent ? 'Email sent!' : resetting ? 'Sending…' : 'Reset Password'}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {resetSent ? 'Check your inbox' : 'Get a link via email'}
                    </p>
                  </div>
                  {resetSent && <span className="text-sage-400 text-xs shrink-0">✓</span>}
                </button>
              </div>

              {/* Sign Out */}
              <div className="px-2 pb-2 mt-0.5">
                <button
                  type="button"
                  onClick={signOut}
                  className="dropdown-item-danger flex items-center gap-2.5 px-3 py-2 rounded-xl w-full"
                >
                  <div className="w-7 h-7 rounded-lg bg-coral-500/20 border border-coral-500/20 flex items-center justify-center shrink-0">
                    <LogOut className="w-3.5 h-3.5 text-coral-400" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-coral-400">Sign Out</p>
                    <p className="text-[10px] text-white/40">End your session</p>
                  </div>
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </header>
  )
}
