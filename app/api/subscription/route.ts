import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrialStatus } from '@/lib/subscription'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ tier: 'free' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_started_at, created_at')
      .eq('id', user.id)
      .single()

    const trial = getTrialStatus(profile?.subscription_tier, profile?.created_at)

    return NextResponse.json({
      tier: trial.effectiveTier,
      isPaidPremium: trial.isPaidPremium,
      isTrialActive: trial.isTrialActive,
      trialDaysLeft: trial.trialDaysLeft,
      trialEndsAt: trial.trialEndsAt,
      since: profile?.subscription_started_at ?? null,
    })
  } catch {
    return NextResponse.json({ tier: 'free' })
  }
}
