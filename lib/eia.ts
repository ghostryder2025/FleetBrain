import type { FuelPrice } from '@/types'

// EIA API v2 - On-Highway Diesel Price (National Average)
// Register free at https://www.eia.gov/opendata/register.php
const EIA_BASE = 'https://api.eia.gov/v2'

export async function getDieselPrice(): Promise<FuelPrice> {
  const apiKey = process.env.EIA_API_KEY

  if (!apiKey || apiKey === 'your_eia_api_key') {
    // Return a reasonable default if no key configured
    return { value: 3.85, period: new Date().toISOString().split('T')[0], region: 'National' }
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      frequency: 'weekly',
      'data[0]': 'value',
      'facets[product][]': 'DSD',   // Diesel
      'facets[duoarea][]': 'NUS',   // National US
      'sort[0][column]': 'period',
      'sort[0][direction]': 'desc',
      length: '1',
    })

    const res = await fetch(`${EIA_BASE}/petroleum/pri/gnd/data/?${params}`, {
      next: { revalidate: 86400 }, // Cache 24 hours
    })

    if (!res.ok) throw new Error(`EIA API error: ${res.status}`)

    const json = await res.json()
    const latest = json?.response?.data?.[0]

    if (!latest) throw new Error('No fuel price data returned')

    return {
      value: parseFloat(latest.value),
      period: latest.period,
      region: 'National Average',
    }
  } catch (err) {
    console.error('EIA fuel price fetch failed:', err)
    return { value: 3.85, period: new Date().toISOString().split('T')[0], region: 'National' }
  }
}
