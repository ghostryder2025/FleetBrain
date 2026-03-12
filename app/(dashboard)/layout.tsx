'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/loads', label: 'Loads', icon: '📦' },
  { href: '/fleet', label: 'Fleet', icon: '🚚' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-[#0e0e0e] border-r border-[#1e1e1e] flex flex-col
        transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#1e1e1e]">
          <span className="text-xl font-bold text-[#5fd0a8]">FleetBrain</span>
          <p className="text-xs text-zinc-500 mt-1">AI Load Intelligence</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#5fd0a8]/15 text-[#5fd0a8]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Analyze CTA */}
        <div className="px-3 pb-4">
          <Link
            href="/loads/new"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-[#5fd0a8] hover:bg-[#46b891] text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
          >
            + Analyze Load
          </Link>
        </div>

        {/* Sign out */}
        <div className="px-3 pb-6 border-t border-[#1e1e1e] pt-4">
          <button
            onClick={signOut}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-[#1e1e1e] bg-[#0e0e0e]">
          <span className="text-lg font-bold text-[#5fd0a8]">FleetBrain</span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-zinc-400 hover:text-white p-2"
          >
            ☰
          </button>
        </header>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
