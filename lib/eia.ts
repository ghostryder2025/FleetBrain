import type { FuelPrice } from '@/types'

const EIA_BASE = 'https://api.eia.gov/v2'

export const DIESEL_REGIONS: Record<string, { label: string; duoarea: string; fallback: number }> = {
  national: { label: 'National Average',  duoarea: 'NUS', fallback: 3.85 },
  east:     { label: 'East Coast',        duoarea: 'R10', fallback: 3.90 },
  midwest:  { label: 'Midwest',           duoarea: 'R20', fallback: 3.75 },
  gulf:     { label: 'Gulf Coast',        duoarea: 'R30', fallback: 3.65 },
  rockies:  { label: 'Rocky Mountain',    duoarea: 'R40', fallback: 3.80 },
  west:     { label: 'West Coast',        duoarea: 'R50', fallback: 4.50 },
  california: { label: 'California',      duoarea: 'SCO', fallback: 5.50 },
}

export async function getDieselPrice(regionKey = 'national'): Promise<FuelPrice> {
  const apiKey = process.env.EIA_API_KEY
  const region = DIESEL_REGIONS[regionKey] ?? DIESEL_REGIONS.national

  if (!apiKey || apiKey === 'your_eia_api_key') {
    return { value: region.fallback, period: new Date().toISOString().split('T')[0], region: region.label }
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      frequency: 'weekly',
      'data[0]': 'value',
      'facets[product][]': 'DSD',
      'facets[duoarea][]': region.duoarea,
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

    if (!latest) throw new Error('No fuel price data returned')

    return {
      value: parseFloat(latest.value),
      period: latest.period,
      region: region.label,
    }
  } catch (err) {
    console.error('EIA fuel price fetch failed:', err)
    return { value: region.fallback, period: new Date().toISOString().split('T')[0], region: region.label }
  }
}
