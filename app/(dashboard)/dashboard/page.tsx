import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Load, Truck } from '@/types'

export const dynamic = 'force-dynamic'

const RATING_COLORS: Record<string, string> = {
  EXCELLENT: 'text-[#00ff88] bg-[#00ff88]/10',
  GOOD: 'text-[#5fd0a8] bg-[#5fd0a8]/10',
  AVERAGE: 'text-[#ffd000] bg-[#ffd000]/10',
  POOR: 'text-[#ff4d4d] bg-[#ff4d4d]/10',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: loads }, { data: trucks }] = await Promise.all([
    supabase
      .from('loads')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('trucks')
      .select('*')
      .eq('user_id', user!.id),
  ])

  const typedLoads = (loads || []) as Load[]
  const typedTrucks = (trucks || []) as Truck[]

  const totalLoads = typedLoads.length
  const avgProfitPerMile = typedLoads.length
    ? typedLoads.reduce((sum, l) => sum + (l.profit_per_mile || 0), 0) / typedLoads.length
    : 0
  const totalProfit = typedLoads.reduce((sum, l) => sum + (l.net_profit || 0), 0)
  const availableTrucks = typedTrucks.filter(t => t.status === 'available').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Welcome back. Here&apos;s your fleet overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Loads Analyzed" value={totalLoads.toString()} />
        <StatCard label="Avg Profit/Mile" value={`$${avgProfitPerMile.toFixed(2)}`} />
        <StatCard label="Total Net Profit" value={`$${totalProfit.toFixed(0)}`} />
        <StatCard label="Trucks Available" value={`${availableTrucks} / ${typedTrucks.length}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Loads */}
        <div className="bg-[#121212] border border-[#242424] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Recent Loads</h2>
            <Link href="/loads" className="text-[#5fd0a8] text-sm hover:underline">View all</Link>
          </div>

          {typedLoads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm mb-3">No loads analyzed yet</p>
              <Link href="/loads/new" className="text-[#5fd0a8] text-sm hover:underline">
                Analyze your first load →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {typedLoads.map(load => (
                <div key={load.id} className="flex items-center justify-between py-2 border-b border-[#1e1e1e] last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {load.origin && load.destination
                        ? `${load.origin} → ${load.destination}`
                        : `Load #${load.id.slice(0, 6)}`}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      ${load.revenue.toFixed(0)} · {load.loaded_miles.toFixed(0)} mi
                    </p>
                  </div>
                  {load.ai_rating && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${RATING_COLORS[load.ai_rating] || ''}`}>
                      {load.ai_rating}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fleet Status */}
        <div className="bg-[#121212] border border-[#242424] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Fleet Status</h2>
            <Link href="/fleet" className="text-[#5fd0a8] text-sm hover:underline">Manage</Link>
          </div>

          {typedTrucks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm mb-3">No trucks added yet</p>
              <Link href="/fleet/trucks/new" className="text-[#5fd0a8] text-sm hover:underline">
                Add your first truck →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {typedTrucks.map(truck => (
                <div key={truck.id} className="flex items-center justify-between py-2 border-b border-[#1e1e1e] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{truck.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {truck.year} {truck.make} {truck.model} · {truck.mpg} MPG
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    truck.status === 'available' ? 'text-[#00ff88] bg-[#00ff88]/10'
                    : truck.status === 'on_load' ? 'text-[#ffd000] bg-[#ffd000]/10'
                    : 'text-[#ff4d4d] bg-[#ff4d4d]/10'
                  }`}>
                    {truck.status === 'on_load' ? 'On Load' : truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/loads/new"
          className="bg-[#5fd0a8]/10 border border-[#5fd0a8]/20 hover:bg-[#5fd0a8]/15 rounded-2xl p-5 transition-colors group"
        >
          <div className="text-2xl mb-2">📷</div>
          <h3 className="font-bold text-[#5fd0a8]">Analyze a Load</h3>
          <p className="text-sm text-zinc-500 mt-1">Upload a screenshot or enter load details for AI profitability analysis</p>
        </Link>
        <Link
          href="/fleet/trucks/new"
          className="bg-[#121212] border border-[#242424] hover:border-[#5fd0a8]/30 rounded-2xl p-5 transition-colors"
        >
          <div className="text-2xl mb-2">🚚</div>
          <h3 className="font-bold">Add a Truck</h3>
          <p className="text-sm text-zinc-500 mt-1">Create a truck profile to auto-populate MPG and maintenance costs in load calculations</p>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#121212] border border-[#242424] rounded-2xl p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
