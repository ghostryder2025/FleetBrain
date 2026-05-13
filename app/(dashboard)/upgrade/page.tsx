'use client'

import Link from 'next/link'

const FREE_FEATURES = [
  'Manual load entry',
  'Math-based profit calculation',
  'Local diesel pricing by zip code',
  'Auto deadhead estimation',
  'Load history',
  'Fleet & truck profiles',
]

const PREMIUM_FEATURES = [
  'Everything in Free',
  '📷 Screenshot AI analysis (DAT, Truckstop, Amazon Relay, etc.)',
  '🤖 AI load recommendations',
  '🚩 Smart flags & warnings',
  '⚡ Instant load board OCR extraction',
  'Priority support',
]

export default function UpgradePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Upgrade to Premium</h1>
        <p className="text-zinc-500 mt-1">Unlock AI-powered load analysis for serious truckers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className="bg-[#121212] border border-[#242424] rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Free</p>
            <p className="text-3xl font-black mt-1">$0<span className="text-sm font-normal text-zinc-500">/mo</span></p>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="text-zinc-500 mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/loads/new"
            className="block w-full text-center bg-[#1e1e1e] hover:bg-[#2a2a2a] text-zinc-300 font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Current Plan
          </Link>
        </div>

        {/* Premium */}
        <div className="bg-[#121212] border-2 border-[#5fd0a8] rounded-2xl p-6 space-y-4 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-[#5fd0a8] text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#5fd0a8] uppercase tracking-wide">Premium</p>
            <p className="text-3xl font-black mt-1">$49<span className="text-sm font-normal text-zinc-500">/mo</span></p>
          </div>
          <ul className="space-y-2.5">
            {PREMIUM_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="text-[#5fd0a8] mt-0.5 shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <a
            href="mailto:khalic.muhammad@gmail.com?subject=FleetBrain Premium Upgrade"
            className="block w-full text-center bg-[#5fd0a8] hover:bg-[#46b891] text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Get Premium →
          </a>
          <p className="text-xs text-zinc-500 text-center">
            Email us to activate. Cancel anytime.
          </p>
        </div>
      </div>

      <div className="bg-[#121212] border border-[#242424] rounded-2xl p-5 text-sm text-zinc-400 space-y-1">
        <p className="font-semibold text-white">Why upgrade?</p>
        <p>Free drivers manually enter every load detail. Premium drivers upload a screenshot and get instant AI analysis — rate per mile, fuel cost, profit, warnings, and a recommendation in seconds.</p>
      </div>
    </div>
  )
}
