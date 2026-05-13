// Zip code lookup, geocoding, and distance utilities

export interface ZipInfo {
  zip: string
  city: string
  state: string        // full name e.g. "California"
  stateAbbr: string   // e.g. "CA"
  lat: number
  lng: number
}

export interface Coordinates {
  lat: number
  lng: number
  label: string
}

// State → EIA PADD region
const STATE_TO_PADD: Record<string, string> = {
  // PADD 1 — East Coast
  CT: 'east', DC: 'east', DE: 'east', FL: 'east', GA: 'east',
  ME: 'east', MD: 'east', MA: 'east', NC: 'east', NH: 'east',
  NJ: 'east', NY: 'east', PA: 'east', RI: 'east', SC: 'east',
  VA: 'east', VT: 'east', WV: 'east',
  // PADD 2 — Midwest
  IL: 'midwest', IN: 'midwest', IA: 'midwest', KS: 'midwest',
  KY: 'midwest', MI: 'midwest', MN: 'midwest', MO: 'midwest',
  ND: 'midwest', NE: 'midwest', OH: 'midwest', OK: 'midwest',
  SD: 'midwest', TN: 'midwest', WI: 'midwest',
  // PADD 3 — Gulf Coast
  AL: 'gulf', AR: 'gulf', LA: 'gulf', MS: 'gulf', NM: 'gulf', TX: 'gulf',
  // PADD 4 — Rocky Mountain
  CO: 'rockies', ID: 'rockies', MT: 'rockies', UT: 'rockies', WY: 'rockies',
  // PADD 5 — West Coast (California gets its own EIA series)
  CA: 'california', AK: 'west', AZ: 'west', HI: 'west', NV: 'west',
  OR: 'west', WA: 'west',
}

/** Lookup zip code → city, state, coordinates via zippopotam.us (free, no key) */
export async function lookupZip(zip: string): Promise<ZipInfo | null> {
  if (!/^\d{5}$/.test(zip)) return null
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null
    return {
      zip,
      city: place['place name'],
      state: place['state'],
      stateAbbr: place['state abbreviation'],
      lat: parseFloat(place['latitude']),
      lng: parseFloat(place['longitude']),
    }
  } catch {
    return null
  }
}

/** Get EIA region key for a state abbreviation */
export function stateToRegion(stateAbbr: string): string {
  return STATE_TO_PADD[stateAbbr.toUpperCase()] ?? 'national'
}

/** Geocode a city/state string → coordinates via OSM Nominatim (free) */
export async function geocodeCity(cityState: string): Promise<Coordinates | null> {
  if (!cityState.trim()) return null
  try {
    const encoded = encodeURIComponent(cityState + ', USA')
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=us`,
      {
        headers: { 'User-Agent': 'FleetBrain/1.0 (fleet-brain.vercel.app)' },
        next: { revalidate: 86400 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data[0]) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: data[0].display_name,
    }
  } catch {
    return null
  }
}

/** Haversine distance in miles between two lat/lng points */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) { return deg * (Math.PI / 180) }

/**
 * Estimate driving deadhead miles from a home zip to a pickup city.
 * Uses straight-line distance × 1.25 road factor (industry standard estimate).
 */
export async function estimateDeadhead(
  homeZip: string,
  pickupCity: string
): Promise<{ miles: number; method: 'calculated' | 'fallback' } | null> {
  const [zipInfo, pickup] = await Promise.all([
    lookupZip(homeZip),
    geocodeCity(pickupCity),
  ])
  if (!zipInfo || !pickup) return null
  const straight = haversineDistance(zipInfo.lat, zipInfo.lng, pickup.lat, pickup.lng)
  return { miles: Math.round(straight * 1.25), method: 'calculated' }
}
