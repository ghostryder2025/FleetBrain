'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TRUCK_DATABASE, getModels, getMpg } from '@/lib/trucks'

export default function NewTruckPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [vin, setVin] = useState('')
  const [mpg, setMpg] = useState('')
  const [maintenanceCost, setMaintenanceCost] = useState('0.20')
  const [status, setStatus] = useState('available')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const makes = TRUCK_DATABASE.map(t => t.make)
  const models = make ? getModels(make) : []

  function handleMakeChange(selectedMake: string) {
    setMake(selectedMake)
    setModel('')
    setMpg('')
  }

  function handleModelChange(selectedModel: string) {
    setModel(selectedModel)
    if (make && selectedModel) {
      const avg = getMpg(make, selectedModel)
      setMpg(avg.toString())
    }
  }

  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !make || !model || !year || !mpg) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error: dbError } = await supabase.from('trucks').insert({
      user_id: user!.id,
      name,
      make,
      model,
      year: parseInt(year),
      vin: vin || null,
      mpg: parseFloat(mpg),
      maintenance_cost_per_mile: parseFloat(maintenanceCost),
      status,
      notes: notes || null,
    })

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
    } else {
      router.push('/fleet')
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fleet" className="text-zinc-500 hover:text-white text-sm">← Fleet</Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-bold">Add Truck</h1>
      </div>

      <div className="bg-[#121212] border border-[#242424] rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Truck nickname */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Truck Name / Nickname <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder='e.g. "Big Red" or "Truck 1"'
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
            />
          </div>

          {/* Make */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Make <span className="text-red-400">*</span>
            </label>
            <select
              value={make}
              onChange={e => handleMakeChange(e.target.value)}
              required
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5fd0a8] transition-colors"
            >
              <option value="">Select make…</option>
              {makes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Model <span className="text-red-400">*</span>
            </label>
            <select
              value={model}
              onChange={e => handleModelChange(e.target.value)}
              required
              disabled={!make}
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5fd0a8] transition-colors disabled:opacity-50"
            >
              <option value="">Select model…</option>
              {models.map(m => (
                <option key={m.model} value={m.model}>
                  {m.model} (avg {m.mpg_avg} MPG)
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Year <span className="text-red-400">*</span>
            </label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              required
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5fd0a8] transition-colors"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* MPG */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              MPG <span className="text-red-400">*</span>
              {model && <span className="text-zinc-500 font-normal ml-2 text-xs">(auto-filled from make/model)</span>}
            </label>
            <input
              type="number"
              value={mpg}
              onChange={e => setMpg(e.target.value)}
              required
              step="0.1"
              min="1"
              max="30"
              placeholder="e.g. 7.0"
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
            />
          </div>

          {/* Maintenance cost */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Maintenance Cost Per Mile ($)
              <span className="text-zinc-500 font-normal ml-2 text-xs">Industry avg: $0.18–$0.22</span>
            </label>
            <input
              type="number"
              value={maintenanceCost}
              onChange={e => setMaintenanceCost(e.target.value)}
              step="0.01"
              min="0"
              placeholder="0.20"
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
            />
          </div>

          {/* VIN (optional) */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              VIN <span className="text-zinc-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={vin}
              onChange={e => setVin(e.target.value)}
              placeholder="17-character VIN"
              maxLength={17}
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5fd0a8] transition-colors"
            >
              <option value="available">Available</option>
              <option value="on_load">On Load</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Notes <span className="text-zinc-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes about this truck…"
              className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/fleet"
              className="flex-1 text-center bg-[#1e1e1e] hover:bg-[#2a2a2a] text-zinc-300 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#5fd0a8] hover:bg-[#46b891] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {loading ? 'Saving…' : 'Save Truck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
