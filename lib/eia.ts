import type { FuelPrice } from '@/types'
import { lookupZip, stateToRegion } from './location'

const EIA_BASE = 'https://api.eia.gov/v2'

export const DIESEL_REGIONS: Record<string, { label: string; duoarea: string; fallback: number }> = {
  national:   { label: 'National Average', duoarea: 'NUS', fallback: 3.85 },
  east:       { label: 'East Coast',       duoarea: 'R10', fallback: 3.90 },
  midwest:    { label: 'Midwest',          duoarea: 'R20', fallback: 3.75 },
  gulf:       { label: 'Gulf Coast',       duoarea: 'R30', fallback: 3.65 },
  rockies:    { label: 'Rocky Mountain',   duoarea: 'R40', fallback: 3.80 },
  west:       { label: 'West Coast',       duoarea: 'R50', fallback: 4.50 },
  california: { label: 'California',       duoarea: 'SCA', fallback: 5.50 },
}

async function fetchEIAPrice(duoarea: string, label: string, fallback: number): Promise<FuelPrice> {
  const apiKey = process.env.EIA_API_KEY
  if (!apiKey || apiKey === 'your_eia_api_key') {
    return { value: fallback, period: new Date().toISOString().split('T')[0], region: label }
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    frequency: 'weekly',
    'data[0]': 'value',
    'facets[product][]': 'EPD2D',
    'facets[duoarea][]': duoarea,
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  })

  const res = await fetch(`${EIA_BASE}/petroleum/pri/gnd/data/?${params}`, {
    next: { revalidate: 86400 },
  })
  if (!res.ok) throw new Error(`EIA API error: ${res.status}`)

  const json = await res.json()
  const latest = json?.response?.data?.[0]
  if (!latest) throw new Error('No data returned')

  return { value: parseFloat(latest.value), period: latest.period, region: label }
}

/** Fetch diesel price by EIA region key */
export async function getDieselPrice(regionKey = 'national'): Promise<FuelPrice> {
  const region = DIESEL_REGIONS[regionKey] ?? DIESEL_REGIONS.national
  try {
    return await fetchEIAPrice(region.duoarea, region.label, region.fallback)
  } catch (err) {
    console.error('EIA fetch failed:', err)
    return { value: region.fallback, period: new Date().toISOString().split('T')[0], region: region.label }
  }
}

/** Fetch diesel price by zip code — auto-detects state → PADD region */
export async function getDieselPriceByZip(zip: string): Promise<FuelPrice> {
  try {
    const zipInfo = await lookupZip(zip)
    if (!zipInfo) return getDieselPrice('national')

    const regionKey = stateToRegion(zipInfo.stateAbbr)
    const region = DIESEL_REGIONS[regionKey] ?? DIESEL_REGIONS.national

    const price = await fetchEIAPrice(region.duoarea, region.label, region.fallback)
    return {
      ...price,
      region: `${zipInfo.city}, ${zipInfo.stateAbbr}`,
    }
  } catch (err) {
    console.error('EIA zip lookup failed:', err)
    return getDieselPrice('national')
  }
}
