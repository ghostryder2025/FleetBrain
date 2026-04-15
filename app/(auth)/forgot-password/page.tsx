'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#5fd0a8]">FleetBrain</h1>
          <p className="text-zinc-400 mt-2">Reset your password</p>
        </div>

        <div className="bg-[#121212] border border-[#242424] rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <h2 className="text-white font-bold text-lg">Check your email</h2>
              <p className="text-zinc-400 text-sm">
                We sent a password reset link to <span className="text-white">{email}</span>
              </p>
              <p className="text-zinc-500 text-xs">
                Click the link in the email to set a new password. Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="block mt-4 text-[#5fd0a8] hover:underline text-sm"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-zinc-400 text-sm">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

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
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>

              <p className="text-center text-zinc-500 text-sm">
                <Link href="/login" className="text-[#5fd0a8] hover:underline">
                  ← Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
