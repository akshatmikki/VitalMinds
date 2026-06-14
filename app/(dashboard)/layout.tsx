import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/supabase/cached'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/ui/Sidebar'
import MobileNav from '@/components/ui/MobileNav'
import MobileHeader from '@/components/ui/MobileHeader'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)

  if (profile && !profile.onboarding_done) redirect('/onboarding')

  const supabase = createClient()
  const { data: xpData } = await supabase
    .from('user_xp').select('total_xp').eq('user_id', user.id).single()

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      <Sidebar profile={profile} totalXP={xpData?.total_xp ?? 0} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader profile={profile} />
        <main className="flex-1 overflow-y-auto cyber-grid pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
