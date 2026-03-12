'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company_name: companyName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Manually create profile (no trigger dependency)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        company_name: companyName || null,
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#5fd0a8]">FleetBrain</h1>
          <p className="text-zinc-400 mt-2">Create your free account</p>
        </div>

        <div className="bg-[#121212] border border-[#242424] rounded-2xl p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="John Smith"
                className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Company Name <span className="text-zinc-500 font-normal">(optional)</span></label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Smith Trucking LLC"
                className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full bg-[#1b1b1b] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#5fd0a8] transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5fd0a8] hover:bg-[#46b891] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#5fd0a8] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
