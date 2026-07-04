import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PlanDetailClient from '@/components/plans/PlanDetailClient'

export default async function PlanDetailPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  const supabase = createClient()

  const [{ data: plan }, { data: tasks }] = await Promise.all([
    supabase.from('wellness_plans').select('*').eq('id', params.id).eq('user_id', user!.id).single(),
    supabase.from('plan_tasks').select('*').eq('plan_id', params.id).order('day_number').order('time_of_day'),
  ])

  if (!plan) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/plans" className="inline-flex items-center gap-1.5 text-sm text-warm-400 hover:text-warm-700 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Plans
      </Link>

      <div className="glass rounded-2xl p-6 mb-6 card-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">🗺️</div>
          <div>
            <h1 className="text-xl font-bold text-warm-900">{plan.title}</h1>
            <p className="text-sm text-warm-500 mt-0.5">{plan.description}</p>
            {plan.week_theme && (
              <p className="text-xs text-lavender-600 font-semibold mt-1 italic">✦ {plan.week_theme}</p>
            )}
            {plan.weekly_tip && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-0.5">This week's tip</p>
                <p className="text-xs text-amber-700">{plan.weekly_tip}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PlanDetailClient planId={plan.id} tasks={tasks ?? []} durationDays={plan.duration_days} startDate={plan.start_date} />
    </div>
  )
}
