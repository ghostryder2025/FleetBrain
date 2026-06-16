/**
 * Subscription tier + free trial helpers.
 * New users get a 7-day free trial of Premium starting at signup (profiles.created_at).
 */

export const TRIAL_DAYS = 7
export const PREMIUM_PRICE = 29

export interface TrialStatus {
  /** Effective tier for feature gating — 'premium' if paid OR trial is active */
  effectiveTier: 'free' | 'premium'
  isPaidPremium: boolean
  isTrialActive: boolean
  trialDaysLeft: number
  trialEndsAt: string | null
}

export function getTrialStatus(subscriptionTier: string | null | undefined, createdAt: string | null | undefined): TrialStatus {
  const isPaidPremium = subscriptionTier === 'premium'

  let isTrialActive = false
  let trialDaysLeft = 0
  let trialEndsAt: string | null = null

  if (!isPaidPremium && createdAt) {
    const signupTime = new Date(createdAt).getTime()
    const trialEndTime = signupTime + TRIAL_DAYS * 24 * 60 * 60 * 1000
    trialEndsAt = new Date(trialEndTime).toISOString()
    const msLeft = trialEndTime - Date.now()
    isTrialActive = msLeft > 0
    trialDaysLeft = isTrialActive ? Math.ceil(msLeft / (24 * 60 * 60 * 1000)) : 0
  }

  return {
    effectiveTier: isPaidPremium || isTrialActive ? 'premium' : 'free',
    isPaidPremium,
    isTrialActive,
    trialDaysLeft,
    trialEndsAt,
  }
}
