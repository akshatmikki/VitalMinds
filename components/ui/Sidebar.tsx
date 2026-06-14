'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Leaf, MessageCircle, LayoutDashboard, BookOpen,
  CheckSquare, Activity, Users, LogOut, User, BarChart2
} from 'lucide-react'
import NotificationBell from '@/components/ui/NotificationBell'
import XPBar from '@/components/ui/XPBar'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview',     icon: LayoutDashboard, accent: 'sage'     },
  { href: '/chat',      label: 'AI Companion', icon: MessageCircle,   accent: 'lavender' },
  { href: '/journal',   label: 'Journal',      icon: BookOpen,        accent: 'lavender' },
  { href: '/habits',    label: 'Habits',       icon: CheckSquare,     accent: 'sage'     },
  { href: '/health',    label: 'Health',       icon: Activity,        accent: 'sage'     },
  { href: '/community', label: 'Community',    icon: Users,           accent: 'coral'    },
  { href: '/reports',   label: 'Reports',      icon: BarChart2,       accent: 'lavender' },
]

const ACCENT = {
  sage: {
    text:   'text-sage-400',
    bg:     'bg-sage-500/[.15]',
    border: 'border-sage-500/[.30]',
    bar:    'bg-sage-400',
    shadow: 'shadow-sage',
  },
  lavender: {
    text:   'text-lavender-400',
    bg:     'bg-lavender-500/[.15]',
    border: 'border-lavender-500/[.30]',
    bar:    'bg-lavender-400',
    shadow: 'shadow-lavender',
  },
  coral: {
    text:   'text-coral-400',
    bg:     'bg-coral-500/[.15]',
    border: 'border-coral-500/[.30]',
    bar:    'bg-coral-400',
    shadow: 'shadow-coral',
  },
}

export default function Sidebar({ profile, totalXP = 0 }: { profile: any; totalXP?: number }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar hidden md:flex w-60 flex-col h-full shrink-0">

      {/* Logo */}
      <div className="p-5 border-b border-white/[.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="sidebar-logo-icon w-9 h-9 rounded-xl flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div className="sidebar-logo-blur absolute -inset-1 rounded-xl opacity-15 blur-sm" />
            </div>
            <span className="font-bold text-white tracking-wide text-[15px]">VitalMind</span>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* XP progress bar */}
      <XPBar totalXP={totalXP} />

      {/* User chip — click to open profile */}
      <Link
        href="/profile"
        className={cn(
          'px-4 py-3.5 border-b border-white/[.08] flex items-center gap-3 transition-all duration-200 group hover:bg-white/[.05]',
          pathname === '/profile' && 'bg-white/[.06]'
        )}
      >
        <div className="relative shrink-0">
          <div className="sidebar-avatar w-9 h-9 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-sage-400" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-sage-400 rounded-full border-2 border-[#111827]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate group-hover:text-sage-300 transition-colors">
            {profile?.full_name || 'You'}
          </p>
          <p className="text-[11px] text-sage-400 tracking-wide font-medium uppercase">View profile</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const colors = ACCENT[accent as keyof typeof ACCENT]

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border',
                active
                  ? cn(colors.bg, colors.border, colors.text, colors.shadow)
                  : 'text-white/60 hover:text-white hover:bg-white/[.08] border-transparent'
              )}
            >
              {active && (
                <span className={cn('absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full', colors.bar)} />
              )}
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors duration-200',
                  active ? colors.text : 'text-white/40 group-hover:text-white/70'
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-white/[.08]">
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-coral-400 hover:bg-coral-500/[.10] border border-transparent hover:border-coral-500/[.30] transition-all duration-200 w-full group"
        >
          <LogOut className="w-4 h-4 group-hover:text-coral-400 transition-colors" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
