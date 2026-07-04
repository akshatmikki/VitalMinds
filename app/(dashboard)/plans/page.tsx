import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import GeneratePlanModal from '@/components/plans/GeneratePlanModal'
import PlanCard from '@/components/plans/PlanCard'
import { Map, Sparkles, Zap, Calendar, CheckCircle2 } from 'lucide-react'

export default async function PlansPage() {
  const user = await getUser()
  const supabase = createClient()

  const { data: plans } = await supabase
    .from('wellness_plans')
    .select('*, plan_tasks(id, completed)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const enriched = (plans ?? []).map(p => ({
    ...p,
    totalTasks:     (p.plan_tasks ?? []).length,
    completedTasks: (p.plan_tasks ?? []).filter((t: any) => t.completed).length,
  }))

  const activePlan  = enriched.find(p => p.status === 'active')
  const otherPlans  = enriched.filter(p => p.status !== 'active')

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-8 card-in">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-sage-500 uppercase mb-2">Personalized AI</p>
          <h1 className="text-3xl font-bold grad-white-cyan">Wellness Plans</h1>
          <p className="text-warm-400 mt-1 text-sm">
            AI builds a day-by-day plan based on your mood, sleep &amp; goals.
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <GeneratePlanModal />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-4 card-in text-center">
          <p className="text-2xl font-black text-warm-900">{enriched.length}</p>
          <p className="text-xs text-warm-400 mt-0.5">Total Plans</p>
        </div>
        <div className="glass rounded-2xl p-4 card-in text-center">
          <p className="text-2xl font-black text-amber-600">{enriched.filter(p => p.status === 'active').length}</p>
          <p className="text-xs text-warm-400 mt-0.5">Active</p>
        </div>
        <div className="glass rounded-2xl p-4 card-in text-center">
          <p className="text-2xl font-black text-sage-600">
            {enriched.length > 0
              ? Math.round(enriched.reduce((s, p) => s + (p.totalTasks > 0 ? p.completedTasks / p.totalTasks : 0), 0) / enriched.length * 100)
              : 0}%
          </p>
          <p className="text-xs text-warm-400 mt-0.5">Avg Progress</p>
        </div>
      </div>

      {enriched.length === 0 ? (
        /* ── Empty state ─────────────────────────── */
        <div className="glass rounded-3xl p-12 text-center card-in border border-dashed border-warm-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <Map className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="font-bold text-warm-800 text-lg mb-1">No plans yet</h3>
          <p className="text-sm text-warm-400 mb-6 max-w-xs mx-auto">
            Generate your first AI-powered wellness plan. It takes about 10 seconds.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
            {[
              { icon: Sparkles, text: 'Personalised to your mood & sleep data', color: 'text-amber-500' },
              { icon: Calendar, text: 'Day-by-day tasks across morning, afternoon & evening', color: 'text-lavender-500' },
              { icon: CheckCircle2, text: 'Tap tasks to mark complete as you go', color: 'text-sage-500' },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-warm-50">
                <Icon className={`w-5 h-5 ${color}`} />
                <p className="text-xs text-warm-500 text-center leading-snug">{text}</p>
              </div>
            ))}
          </div>

          <GeneratePlanModal />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active plan first */}
          {activePlan && (
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Current Plan
              </p>
              <PlanCard plan={activePlan} index={0} />
            </div>
          )}

          {/* Older plans */}
          {otherPlans.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-2">Past Plans</p>
              <div className="space-y-3">
                {otherPlans.map((plan, i) => (
                  <PlanCard key={plan.id} plan={plan} index={i + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      <div className="mt-8 glass rounded-2xl p-5 card-in flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warm-800">How AI generates your plan</p>
          <p className="text-xs text-warm-500 mt-0.5 leading-relaxed">
            The AI reads your last 14 days of mood logs, sleep data, and habit completion rate to calibrate difficulty and focus areas — then builds a realistic, progressive day-by-day schedule across Morning, Afternoon, and Evening.
          </p>
        </div>
      </div>
    </div>
  )
}
