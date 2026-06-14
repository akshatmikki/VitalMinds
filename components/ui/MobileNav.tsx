'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageCircle, CheckSquare, Activity, Users, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home',    color: 'text-sage-600',     dot: 'bg-sage-500'     },
  { href: '/chat',      icon: MessageCircle,   label: 'Mind',    color: 'text-lavender-600', dot: 'bg-lavender-500' },
  { href: '/habits',    icon: CheckSquare,     label: 'Habits',  color: 'text-sage-600',     dot: 'bg-sage-500'     },
  { href: '/health',    icon: Activity,        label: 'Health',  color: 'text-sage-600',     dot: 'bg-sage-500'     },
  { href: '/community', icon: Users,           label: 'Connect', color: 'text-coral-500',    dot: 'bg-coral-400'    },
  { href: '/reports',   icon: BarChart2,       label: 'Reports', color: 'text-lavender-600', dot: 'bg-lavender-500' },
]

export default function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="mobile-nav md:hidden">
      {NAV_ITEMS.map(({ href, icon: Icon, label, color, dot }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-all duration-200',
              active ? color : 'text-warm-400 hover:text-warm-600'
            )}
          >
            <Icon className="w-[18px] h-[18px]" />
            <span className={cn('text-[9px] font-bold tracking-wide uppercase', active ? '' : 'text-warm-300')}>
              {label}
            </span>
            {active && <span className={cn('w-1 h-1 rounded-full mt-0.5', dot)} />}
          </Link>
        )
      })}
    </nav>
  )
}
