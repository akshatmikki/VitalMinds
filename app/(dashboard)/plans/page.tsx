import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import GeneratePlanModal from '@/components/plans/GeneratePlanModal'
import PlanCard from '@/components/plans/PlanCard'
import { Sparkles, Map } from 'lucide-react'

export default async function PlansPage() {
  const user = await getUser()
  const supabase = createClient()

  const { data: plans } = await supabase
    .from('wellness_plans')
    .select('*, plan_tasks(id, completed)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  // Enrich with progress
  const enriched = (plans ?? []).map(p => ({
    ...p,
    totalTasks:     (p.plan_tasks ?? []).length,
    completedTasks: (p.plan_tasks ?? []).filter((t: any) => t.completed).length,
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <div className="mb-8 card-in">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-sage-500 uppercase mb-2">Personalized AI</p>
        <h1 className="text-3xl font-bold grad-white-cyan">Wellness Plans</h1>
        <p className="text-warm-400 mt-1 text-sm">
          AI builds a day-by-day plan based on your mood history, sleep, and goals.
        </p>
      </div>

      {/* Generate CTA */}
      <div className="glass rounded-2xl p-6 mb-6 card-in border border-amber-200 bg-amber-50/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-warm-900">Generate a new plan</h2>
              <p className="text-sm text-warm-500 mt-0.5">
                Choose your focus areas and duration. AI analyses your recent data to create a personalised day-by-day plan.
              </p>
            </div>
          </div>
          <GeneratePlanModal />
        </div>
      </div>

      {/* Plans list */}
      {enriched.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center card-in">
          <Map className="w-10 h-10 text-warm-300 mx-auto mb-3" />
          <p className="text-warm-500 font-medium">No plans yet</p>
          <p className="text-sm text-warm-400 mt-1">Generate your first AI wellness plan above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enriched.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
