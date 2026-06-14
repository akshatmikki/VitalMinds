import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import { getMoodEmoji } from '@/lib/utils'
import { TrendingUp, Sparkles, RefreshCw } from 'lucide-react'

export default async function ReportsPage() {
  const user = await getUser()
  const supabase = createClient()

  const { data: reports } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('user_id', user!.id)
    .order('week_start', { ascending: false })
    .limit(12)

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-warm-900">Weekly Reports</h1>
          <p className="text-sm text-warm-400 mt-0.5">Your AI-generated wellness summaries</p>
        </div>
        <form action="/api/weekly-report" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-lavender-50 text-lavender-700 border border-lavender-200 hover:bg-lavender-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generate this week
          </button>
        </form>
      </div>

      {!reports || reports.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Sparkles className="w-8 h-8 text-lavender-400 mx-auto mb-3" />
          <p className="text-warm-500 font-medium">No reports yet</p>
          <p className="text-sm text-warm-300 mt-1">Generate your first weekly report after a few days of logging.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report: any) => (
            <div key={report.id} className="glass rounded-2xl p-5 card-in">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">
                    Week of {new Date(report.week_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {report.avg_mood && (
                      <span className="text-sm font-semibold text-warm-700">
                        {getMoodEmoji(report.avg_mood)} {report.avg_mood?.toFixed(1)}/10
                      </span>
                    )}
                    {report.wellness_score && (
                      <span className="flex items-center gap-1 text-xs text-sage-600">
                        <TrendingUp className="w-3 h-3" />
                        {report.wellness_score}/100 wellness
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-warm-700 leading-relaxed mb-3">{report.narrative}</p>

              {report.highlights?.length > 0 && (
                <ul className="space-y-1.5">
                  {report.highlights.map((h: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-warm-500">
                      <span className="text-sage-400 mt-0.5 shrink-0">•</span>
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
