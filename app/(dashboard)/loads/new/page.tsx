'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Truck, AIAnalysis } from '@/types'

const RATING_COLORS: Record<string, string> = {
  EXCELLENT: 'border-[#00ff88] bg-[#00ff88]/5',
  GOOD: 'border-[#5fd0a8] bg-[#5fd0a8]/5',
  AVERAGE: 'border-[#ffd000] bg-[#ffd000]/5',
  POOR: 'border-[#ff4d4d] bg-[#ff4d4d]/5',
}
const RATING_TEXT: Record<string, string> = {
  EXCELLENT: 'text-[#00ff88]',
  GOOD: 'text-[#5fd0a8]',
  AVERAGE: 'text-[#ffd000]',
  POOR: 'text-[#ff4d4d]',
}

export default function NewLoadPage() {
  const supabase = createClient()

  const [mode, setMode] = useState<'screenshot' | 'manual'>('screenshot')
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [selectedTruck, setSelectedTruck] = useState('')
  const [fuelPrice, setFuelPrice] = useState<number | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Manual form fields
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [revenue, setRevenue] = useState('')
  const [loadedMiles, setLoadedMiles] = useState('')
  const [deadheadMiles, setDeadheadMiles] = useState('0')
  const [commodity, setCommodity] = useState('')
  const [driverPay, setDriverPay] = useState('0')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AIAnalysis | null>(null)
  const [savedLoadId, setSavedLoadId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: trucksData }, fuelRes] = await Promise.all([
        supabase.from('trucks').select('*').eq('user_id', user.id).order('created_at'),
        fetch('/api/fuel-prices'),
      ])

      if (trucksData) setTrucks(trucksData as Truck[])
      if (fuelRes.ok) {
        const fuelData = await fuelRes.json()
        setFuelPrice(fuelData.value)
        if (trucksData && trucksData.length > 0) setSelectedTruck(trucksData[0].id)
      }
    }
    load()
  }, [])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    setResult(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    if (mode === 'screenshot' && !image) {
      setError('Please upload a screenshot first.')
      setLoading(false)
      return
    }
    if (mode === 'manual' && (!revenue || !loadedMiles)) {
      setError('Revenue and loaded miles are required.')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()

      if (image) formData.append('image', image)
      if (selectedTruck) formData.append('truck_id', selectedTruck)
      if (origin) formData.append('origin', origin)
      if (destination) formData.append('destination', destination)
      if (revenue) formData.append('revenue', revenue)
      if (loadedMiles) formData.append('loaded_miles', loadedMiles)
      formData.append('deadhead_miles', deadheadMiles || '0')
      if (commodity) formData.append('commodity', commodity)
      formData.append('driver_pay', driverPay || '0')

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/analyze-load', {
        method: 'POST',
        body: formData,
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setResult(data.analysis)
      if (data.load_id) setSavedLoadId(data.load_id)
      if (data.fuel_price) setFuelPrice(data.fuel_price)

      // Scroll to result
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const activeTruck = trucks.find(t => t.id === selectedTruck)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/loads" className="text-zinc-500 hover:text-white text-sm">← Loads</Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-bold">Analyze Load</h1>
      </div>

      {/* Live fuel price banner */}
      {fuelPrice && (
        <div className="bg-[#5fd0a8]/10 border border-[#5fd0a8]/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
          <span>⛽</span>
          <span className="text-zinc-300">
            Live diesel price: <strong className="text-white">${fuelPrice.toFixed(3)}/gal</strong>
            <span className="text-zinc-500 ml-2">National avg · updated weekly</span>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mode toggle */}
        <div className="bg-[#121212] border border-[#242424] rounded-2xl p-1 flex">
          {(['screenshot', 'manual'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === m ? 'bg-[#5fd0a8] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {m === 'screenshot' ? '📷 Screenshot' : '✏️ Manual Entry'}
            </button>
          ))}
        </div>

        {/* Truck selector */}
        {trucks.length > 0 && (
          <div className="bg-[#121212] border border-[#242424] rounded-2xl p-5">
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Truck Profile
              <span className="text-zinc-500 font-normal ml-2 text-xs">Auto-fills MPG and maintenance cost</span>
            </label>
            <select
              value={selectedTruck}
              onChange={e => setSelectedTruck(e.target.value)}
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5fd0a8] transition-colors"
            >
              <option value="">No truck selected (use defaults)</option>
              {trucks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.year} {t.make} {t.model} · {t.mpg} MPG
                </option>
              ))}
            </select>
            {activeTruck && (
              <p className="text-xs text-zinc-500 mt-2">
                Using: {activeTruck.mpg} MPG · ${activeTruck.maintenance_cost_per_mile}/mi maintenance
              </p>
            )}
          </div>
        )}

        {/* Screenshot upload */}
        {mode === 'screenshot' && (
          <div className="bg-[#121212] border border-[#242424] rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Upload Load Board Screenshot</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Upload a screenshot from DAT, Truckstop, Amazon Relay, Convoy, or any load board.
              Claude AI will extract all load details automatically.
            </p>

            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                imagePreview ? 'border-[#5fd0a8]/40' : 'border-[#333] hover:border-[#5fd0a8]/40'
              }`}
            >
              {imagePreview ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Screenshot preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <p className="text-[#5fd0a8] text-sm mt-3">{image?.name}</p>
                  <p className="text-zinc-500 text-xs mt-1">Click to change</p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-zinc-400 text-sm">Click to upload or drag and drop</p>
                  <p className="text-zinc-600 text-xs mt-1">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Optional override fields for screenshot mode */}
            <details className="mt-4">
              <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-300 select-none">
                + Add route details manually (optional override)
              </summary>
              <div className="mt-3 space-y-3">
                <ManualFields
                  origin={origin} setOrigin={setOrigin}
                  destination={destination} setDestination={setDestination}
                  driverPay={driverPay} setDriverPay={setDriverPay}
                />
              </div>
            </details>
          </div>
        )}

        {/* Manual entry */}
        {mode === 'manual' && (
          <div className="bg-[#121212] border border-[#242424] rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold">Load Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Origin</label>
                <input
                  type="text"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  placeholder="Dallas, TX"
                  className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Atlanta, GA"
                  className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Load Revenue ($) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  required
                  placeholder="3100"
                  min="0"
                  className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Loaded Miles <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={loadedMiles}
                  onChange={e => setLoadedMiles(e.target.value)}
                  required
                  placeholder="850"
                  min="0"
                  className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Deadhead Miles</label>
                <input
                  type="number"
                  value={deadheadMiles}
                  onChange={e => setDeadheadMiles(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Commodity</label>
                <input
                  type="text"
                  value={commodity}
                  onChange={e => setCommodity(e.target.value)}
                  placeholder="General Freight"
                  className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Driver Pay ($) <span className="text-zinc-600 font-normal">flat rate or leave 0</span>
              </label>
              <input
                type="number"
                value={driverPay}
                onChange={e => setDriverPay(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#5fd0a8] hover:bg-[#46b891] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span>
              Analyzing with AI…
            </>
          ) : (
            '🤖 Analyze Load with AI'
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div id="result-section" className={`border-2 rounded-2xl p-6 space-y-5 ${RATING_COLORS[result.rating] || 'border-[#333]'}`}>
          {/* Rating header */}
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-2xl font-black ${RATING_TEXT[result.rating]}`}>
                {result.rating}
              </span>
              <p className="text-zinc-400 text-sm mt-0.5">FleetBrain AI Rating</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${result.costs.net_profit.toFixed(0)}</p>
              <p className="text-zinc-400 text-sm">Net Profit</p>
            </div>
          </div>

          {/* Route */}
          {(result.extraction.origin || result.extraction.destination) && (
            <div className="bg-black/20 rounded-xl px-4 py-3 text-sm">
              <span className="text-zinc-400">Route: </span>
              <span className="font-medium">{result.extraction.origin} → {result.extraction.destination}</span>
              {result.extraction.commodity && (
                <span className="text-zinc-500 ml-2">· {result.extraction.commodity}</span>
              )}
            </div>
          )}

          {/* Cost breakdown */}
          <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-3">Cost Breakdown</h3>
            <div className="grid grid-cols-2 gap-3">
              <BreakdownItem label="Revenue" value={`$${result.extraction.revenue.toFixed(0)}`} positive />
              <BreakdownItem label="Rate/Mile" value={`$${result.costs.rate_per_mile.toFixed(2)}`} />
              <BreakdownItem label="Fuel Cost" value={`-$${result.costs.fuel_cost.toFixed(0)}`} negative />
              <BreakdownItem label="Diesel Price" value={`$${result.costs.fuel_price_used.toFixed(3)}/gal`} />
              <BreakdownItem label="Maintenance" value={`-$${result.costs.maintenance_allocation.toFixed(0)}`} negative />
              {result.costs.driver_pay > 0 && (
                <BreakdownItem label="Driver Pay" value={`-$${result.costs.driver_pay.toFixed(0)}`} negative />
              )}
              {result.costs.toll_estimate > 0 && (
                <BreakdownItem label="Tolls" value={`-$${result.costs.toll_estimate.toFixed(0)}`} negative />
              )}
              <BreakdownItem label="Total Expenses" value={`-$${result.costs.total_expenses.toFixed(0)}`} negative />
              <BreakdownItem label="Profit/Mile" value={`$${result.costs.profit_per_mile.toFixed(2)}`} />
            </div>
          </div>

          {/* Route details */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-black/20 rounded-xl p-3">
              <p className="text-lg font-bold">{result.extraction.loaded_miles}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Loaded Mi</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3">
              <p className="text-lg font-bold">{result.extraction.deadhead_miles}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Deadhead Mi</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3">
              <p className="text-lg font-bold">
                {result.extraction.loaded_miles > 0
                  ? Math.round((result.extraction.deadhead_miles / result.extraction.loaded_miles) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">DH Ratio</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-black/20 rounded-xl p-4">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">AI Recommendation</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{result.recommendation}</p>
          </div>

          {/* Flags */}
          {result.flags.length > 0 && (
            <div className="space-y-2">
              {result.flags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="text-yellow-500 mt-0.5">⚠</span>
                  {flag}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/loads"
              className="flex-1 text-center bg-[#1e1e1e] hover:bg-[#2a2a2a] text-zinc-300 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              View All Loads
            </Link>
            <button
              type="button"
              onClick={() => {
                setResult(null)
                setImage(null)
                setImagePreview(null)
                setOrigin('')
                setDestination('')
                setRevenue('')
                setLoadedMiles('')
                setDeadheadMiles('0')
                setCommodity('')
                setDriverPay('0')
              }}
              className="flex-1 bg-[#5fd0a8] hover:bg-[#46b891] text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              Analyze Another Load
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ManualFields({
  origin, setOrigin, destination, setDestination, driverPay, setDriverPay
}: {
  origin: string; setOrigin: (v: string) => void
  destination: string; setDestination: (v: string) => void
  driverPay: string; setDriverPay: (v: string) => void
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Origin</label>
          <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Dallas, TX"
            className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Destination</label>
          <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Atlanta, GA"
            className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8]" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Driver Pay ($)</label>
        <input type="number" value={driverPay} onChange={e => setDriverPay(e.target.value)} placeholder="0" min="0"
          className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8]" />
      </div>
    </>
  )
}

function BreakdownItem({ label, value, positive, negative }: {
  label: string; value: string; positive?: boolean; negative?: boolean
}) {
  return (
    <div className="bg-black/20 rounded-xl px-3 py-2.5 flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-bold ${positive ? 'text-[#00ff88]' : negative ? 'text-[#ff4d4d]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}
