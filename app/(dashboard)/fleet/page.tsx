import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import type { Truck } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  available: 'text-[#00ff88] bg-[#00ff88]/10',
  on_load: 'text-[#ffd000] bg-[#ffd000]/10',
  maintenance: 'text-[#ff4d4d] bg-[#ff4d4d]/10',
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  on_load: 'On Load',
  maintenance: 'Maintenance',
}

export default async function FleetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trucks } = await supabase
    .from('trucks')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const typedTrucks = (trucks || []) as Truck[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet</h1>
          <p className="text-zinc-500 mt-1">{typedTrucks.length} truck{typedTrucks.length !== 1 ? 's' : ''} in your fleet</p>
        </div>
        <Link
          href="/fleet/trucks/new"
          className="bg-[#5fd0a8] hover:bg-[#46b891] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Add Truck
        </Link>
      </div>

      {typedTrucks.length === 0 ? (
        <div className="bg-[#121212] border border-[#242424] rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">🚚</div>
          <h2 className="font-bold text-lg mb-2">No trucks yet</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Add your truck profile to auto-populate MPG and maintenance costs when analyzing loads.
          </p>
          <Link href="/fleet/trucks/new" className="bg-[#5fd0a8] hover:bg-[#46b891] text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors inline-block">
            Add Your First Truck
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {typedTrucks.map(truck => (
            <div key={truck.id} className="bg-[#121212] border border-[#242424] rounded-2xl p-5 hover:border-[#333] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-base">{truck.name}</h3>
                  <p className="text-zinc-400 text-sm mt-0.5">{truck.year} {truck.make} {truck.model}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STYLES[truck.status] || ''}`}>
                  {STATUS_LABELS[truck.status] || truck.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#0e0e0e] rounded-xl p-3">
                  <p className="text-xs text-zinc-500">MPG</p>
                  <p className="text-lg font-bold mt-0.5">{truck.mpg}</p>
                </div>
                <div className="bg-[#0e0e0e] rounded-xl p-3">
                  <p className="text-xs text-zinc-500">Maint. $/mi</p>
                  <p className="text-lg font-bold mt-0.5">${truck.maintenance_cost_per_mile}</p>
                </div>
              </div>

              {truck.vin && (
                <p className="text-xs text-zinc-600 mt-3">VIN: {truck.vin}</p>
              )}
              {truck.notes && (
                <p className="text-xs text-zinc-500 mt-2 italic">{truck.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
