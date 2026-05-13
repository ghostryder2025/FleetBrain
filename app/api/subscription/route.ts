import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ tier: 'free' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_started_at')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      tier: profile?.subscription_tier ?? 'free',
      since: profile?.subscription_started_at ?? null,
    })
  } catch {
    return NextResponse.json({ tier: 'free' })
  }
}
