import Anthropic from '@anthropic-ai/sdk'
import type { AIAnalysis } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert freight load analyst for owner-operator truck drivers and small fleets.
Your job is to analyze load board data and provide clear profitability assessments.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`

interface AnalyzeLoadParams {
  imageBase64?: string
  imageMimeType?: string
  manualData?: {
    origin?: string
    destination?: string
    revenue?: number
    loaded_miles?: number
    deadhead_miles?: number
    commodity?: string
  }
  truckMpg: number
  maintenanceCostPerMile: number
  fuelPrice: number
  driverPay?: number
}

export async function analyzeLoad(params: AnalyzeLoadParams): Promise<AIAnalysis> {
  const {
    imageBase64,
    imageMimeType,
    manualData,
    truckMpg,
    maintenanceCostPerMile,
    fuelPrice,
    driverPay = 0,
  } = params

  const userPrompt = `Analyze this freight load and return ONLY valid JSON.

TRUCK PROFILE:
- MPG: ${truckMpg}
- Maintenance cost per mile: $${maintenanceCostPerMile}
- Driver pay (flat): $${driverPay}

CURRENT DIESEL PRICE: $${fuelPrice}/gallon

${manualData ? `
MANUALLY PROVIDED LOAD DATA:
- Origin: ${manualData.origin || 'Unknown'}
- Destination: ${manualData.destination || 'Unknown'}
- Revenue: $${manualData.revenue || 0}
- Loaded miles: ${manualData.loaded_miles || 0}
- Deadhead miles: ${manualData.deadhead_miles || 0}
- Commodity: ${manualData.commodity || 'General Freight'}
` : ''}

${imageBase64 ? 'A load board screenshot has been provided. Extract all visible load details.' : ''}

Calculate all costs and return this exact JSON structure:
{
  "extraction": {
    "origin": "City, ST",
    "destination": "City, ST",
    "revenue": 0,
    "loaded_miles": 0,
    "deadhead_miles": 0,
    "commodity": "General Freight",
    "pickup_date": null,
    "delivery_date": null,
    "broker_name": null
  },
  "costs": {
    "fuel_price_used": 0,
    "fuel_cost": 0,
    "maintenance_allocation": 0,
    "driver_pay": 0,
    "toll_estimate": 0,
    "total_expenses": 0,
    "net_profit": 0,
    "profit_per_mile": 0,
    "rate_per_mile": 0
  },
  "rating": "EXCELLENT",
  "recommendation": "2-3 sentence recommendation explaining whether to take this load and why.",
  "flags": ["Any warnings or positive notes about this load"]
}

Rating criteria (based on NET profit per loaded mile):
- EXCELLENT: > $2.00/mile
- GOOD: $1.50 - $2.00/mile
- AVERAGE: $1.25 - $1.50/mile
- POOR: < $1.25/mile

Flag warnings for: deadhead > 20% of loaded miles, rate per mile < $2.00, very short or very long hauls.
Flag positives for: high RPM, low deadhead, premium commodity types.`

  const messages: Anthropic.MessageParam[] = []

  if (imageBase64 && imageMimeType) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: imageBase64,
          },
        },
        { type: 'text', text: userPrompt },
      ],
    })
  } else {
    messages.push({ role: 'user', content: userPrompt })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip any accidental markdown code blocks
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  return JSON.parse(cleaned) as AIAnalysis
}
