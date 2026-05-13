/**
 * Free-tier math-based load profit calculator.
 * No AI, no API cost — pure arithmetic.
 */
import type { AIAnalysis } from '@/types'

interface CalcParams {
  origin?: string
  destination?: string
  revenue: number
  loaded_miles: number
  deadhead_miles: number
  commodity?: string
  mpg: number
  fuel_price: number
  maintenance_cost_per_mile: number
  driver_pay: number
}

export function calculateLoadProfit(p: CalcParams): AIAnalysis {
  const total_miles = p.loaded_miles + p.deadhead_miles
  const fuel_cost = (total_miles / p.mpg) * p.fuel_price
  const maintenance_allocation = p.loaded_miles * p.maintenance_cost_per_mile
  const toll_estimate = 0
  const total_expenses = fuel_cost + maintenance_allocation + p.driver_pay + toll_estimate
  const net_profit = p.revenue - total_expenses
  const profit_per_mile = p.loaded_miles > 0 ? net_profit / p.loaded_miles : 0
  const rate_per_mile = p.loaded_miles > 0 ? p.revenue / p.loaded_miles : 0

  let rating: AIAnalysis['rating']
  if (profit_per_mile > 2.00) rating = 'EXCELLENT'
  else if (profit_per_mile >= 1.50) rating = 'GOOD'
  else if (profit_per_mile >= 1.25) rating = 'AVERAGE'
  else rating = 'POOR'

  const flags: string[] = []
  if (p.deadhead_miles > 0 && p.loaded_miles > 0) {
    const dhRatio = p.deadhead_miles / p.loaded_miles
    if (dhRatio > 0.20) flags.push(`⚠️ High deadhead: ${p.deadhead_miles} miles is ${Math.round(dhRatio * 100)}% of loaded miles`)
  }
  if (rate_per_mile < 2.00) flags.push(`⚠️ Rate per mile $${rate_per_mile.toFixed(2)} is below the $2.00 benchmark`)
  if (rate_per_mile >= 2.00) flags.push(`✅ Rate per mile $${rate_per_mile.toFixed(2)} is above the $2.00 benchmark`)
  if (p.loaded_miles > 1500) flags.push(`⚠️ Long haul — plan for HOS compliance across multiple days`)

  const recommendation = `This load pays $${p.revenue.toLocaleString()} gross at $${rate_per_mile.toFixed(2)}/mile. ` +
    `After fuel ($${fuel_cost.toFixed(0)}), maintenance ($${maintenance_allocation.toFixed(0)}), ` +
    (p.driver_pay > 0 ? `and driver pay ($${p.driver_pay.toFixed(0)}), ` : '') +
    `your net is $${net_profit.toFixed(0)} ($${profit_per_mile.toFixed(2)}/mile). ` +
    `Upgrade to Premium for AI-powered insights and screenshot analysis.`

  return {
    extraction: {
      origin: p.origin ?? 'Unknown',
      destination: p.destination ?? 'Unknown',
      revenue: p.revenue,
      loaded_miles: p.loaded_miles,
      deadhead_miles: p.deadhead_miles,
      commodity: p.commodity ?? 'General Freight',
      pickup_date: null,
      delivery_date: null,
      broker_name: null,
    },
    costs: {
      fuel_price_used: p.fuel_price,
      fuel_cost,
      maintenance_allocation,
      driver_pay: p.driver_pay,
      toll_estimate,
      total_expenses,
      net_profit,
      profit_per_mile,
      rate_per_mile,
    },
    rating,
    recommendation,
    flags,
  }
}
