import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = '6324b181-76cd-469c-86cd-661158fa37ed'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== ADMIN_USER_ID) redirect('/dashboard')

  // All users with their load stats
  const { data: stats } = await supabase
    .from('loads')
    .select('user_id, revenue, net_profit, profit_per_mile, created_at')
    .order('created_at', { ascending: false })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  // Group loads by user
  const userMap: Record<string, {
    full_name: string
    email: string
    analyses: number
    total_revenue: number
    total_profit: number
    avg_ppm: number
    last_active: string
  }> = {}

  for (const load of stats ?? []) {
    if (!userMap[load.user_id]) {
      const profile = profiles?.find(p => p.id === load.user_id)
      userMap[load.user_id] = {
        full_name: profile?.full_name ?? 'Unknown',
        email: profile?.email ?? load.user_id.slice(0, 8) + '…',
        analyses: 0,
        total_revenue: 0,
        total_profit: 0,
        avg_ppm: 0,
        last_active: load.created_at,
      }
    }
    const u = userMap[load.user_id]
    u.analyses++
    u.total_revenue += load.revenue ?? 0
    u.total_profit += load.net_profit ?? 0
    u.avg_ppm = u.total_profit / (u.analyses || 1)
    if (load.created_at > u.last_active) u.last_active = load.created_at
  }

  const users = Object.values(userMap).sort((a, b) => b.analyses - a.analyses)

  const totalAnalyses = users.reduce((s, u) => s + u.analyses, 0)
  const totalRevenue = users.reduce((s, u) => s + u.total_revenue, 0)
  const totalProfit = users.reduce((s, u) => s + u.total_profit, 0)
  const estimatedCost = totalAnalyses * 0.025

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin — Usage Tracker</h1>
        <p className="text-zinc-500 text-sm mt-1">{users.length} users · {totalAnalyses} total analyses</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Users" value={users.length.toString()} />
        <StatCard label="Total Analyses" value={totalAnalyses.toString()} />
        <StatCard label="Revenue Analyzed" value={`$${(totalRevenue / 1000).toFixed(0)}k`} />
        <StatCard label="Est. API Cost" value={`$${estimatedCost.toFixed(2)}`} dim />
      </div>

      {/* Per-user table */}
      <div className="bg-[#121212] border border-[#242424] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#242424]">
          <h2 className="font-semibold text-sm">Users</h2>
        </div>
        <div className="divide-y divide-[#1e1e1e]">
          {users.length === 0 && (
            <p className="text-zinc-500 text-sm px-5 py-8 text-center">No usage yet.</p>
          )}
          {users.map((u, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{u.full_name}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
              </div>
              <div className="flex gap-6 text-sm shrink-0">
                <div className="text-center">
                  <p className="font-bold">{u.analyses}</p>
                  <p className="text-xs text-zinc-500">analyses</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">${u.total_revenue.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">revenue</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#5fd0a8]">${u.total_profit.toFixed(0)}</p>
                  <p className="text-xs text-zinc-500">profit</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(u.last_active).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-zinc-600">last active</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="bg-[#121212] border border-[#242424] rounded-2xl p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${dim ? 'text-zinc-400' : ''}`}>{value}</p>
    </div>
  )
}
