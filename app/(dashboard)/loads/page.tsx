import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Load } from '@/types'

export const dynamic = 'force-dynamic'

const RATING_COLORS: Record<string, string> = {
  EXCELLENT: 'text-[#00ff88] bg-[#00ff88]/10',
  GOOD: 'text-[#5fd0a8] bg-[#5fd0a8]/10',
  AVERAGE: 'text-[#ffd000] bg-[#ffd000]/10',
  POOR: 'text-[#ff4d4d] bg-[#ff4d4d]/10',
}

export default async function LoadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: loads } = await supabase
    .from('loads')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const typedLoads = (loads || []) as Load[]
  const totalRevenue = typedLoads.reduce((s, l) => s + l.revenue, 0)
  const totalProfit = typedLoads.reduce((s, l) => s + (l.net_profit || 0), 0)
  const avgPpm = typedLoads.length
    ? typedLoads.reduce((s, l) => s + (l.profit_per_mile || 0), 0) / typedLoads.length
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Load History</h1>
          <p className="text-zinc-500 mt-1">{typedLoads.length} load{typedLoads.length !== 1 ? 's' : ''} analyzed</p>
        </div>
        <Link href="/loads/new" className="bg-[#5fd0a8] hover:bg-[#46b891] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          + Analyze Load
        </Link>
      </div>

      {typedLoads.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#121212] border border-[#242424] rounded-2xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Revenue</p>
            <p className="text-xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-[#121212] border border-[#242424] rounded-2xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Net Profit</p>
            <p className="text-xl font-bold mt-1">${totalProfit.toLocaleString()}</p>
          </div>
          <div className="bg-[#121212] border border-[#242424] rounded-2xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Avg Profit/Mile</p>
            <p className="text-xl font-bold mt-1">${avgPpm.toFixed(2)}</p>
          </div>
        </div>
      )}

      {typedLoads.length === 0 ? (
        <div className="bg-[#121212] border border-[#242424] rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="font-bold text-lg mb-2">No loads yet</h2>
          <p className="text-zinc-500 text-sm mb-6">Analyze your first load to see profitability, cost breakdown, and AI recommendations.</p>
          <Link href="/loads/new" className="bg-[#5fd0a8] hover:bg-[#46b891] text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors inline-block">
            Analyze Your First Load
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {typedLoads.map(load => (
            <div key={load.id} className="bg-[#121212] border border-[#242424] hover:border-[#333] rounded-2xl p-5 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold">
                      {load.origin && load.destination ? `${load.origin} → ${load.destination}` : 'Load Analysis'}
                    </p>
                    {load.ai_rating && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${RATING_COLORS[load.ai_rating] || ''}`}>
                        {load.ai_rating}
                      </span>
                    )}
                  </div>
                  {load.commodity && <p className="text-sm text-zinc-500 mt-1">{load.commodity}</p>}
                  <p className="text-xs text-zinc-600 mt-1">
                    {new Date(load.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg">${load.net_profit?.toFixed(0) ?? '—'}</p>
                  <p className="text-xs text-zinc-500">net profit</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#1e1e1e]">
                <div>
                  <p className="text-xs text-zinc-500">Revenue</p>
                  <p className="text-sm font-semibold mt-0.5">${load.revenue.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Miles</p>
                  <p className="text-sm font-semibold mt-0.5">{load.loaded_miles.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Fuel Cost</p>
                  <p className="text-sm font-semibold mt-0.5">${load.fuel_cost?.toFixed(0) ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">$/Mile</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {load.profit_per_mile ? `$${load.profit_per_mile.toFixed(2)}` : '—'}
                  </p>
                </div>
              </div>

              {load.ai_recommendation && (
                <p className="text-xs text-zinc-500 mt-3 italic line-clamp-2">{load.ai_recommendation}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
