import { NextRequest, NextResponse } from 'next/server'
import { analyzeLoad } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { getDieselPrice } from '@/lib/eia'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()

    const image = formData.get('image') as File | null
    const truckId = formData.get('truck_id') as string | null

    // Manual fields (used if no image, or to override extraction)
    const manualRevenue = formData.get('revenue') as string | null
    const manualMiles = formData.get('loaded_miles') as string | null
    const manualDeadhead = formData.get('deadhead_miles') as string | null
    const manualOrigin = formData.get('origin') as string | null
    const manualDestination = formData.get('destination') as string | null
    const manualCommodity = formData.get('commodity') as string | null
    const manualDriverPay = formData.get('driver_pay') as string | null

    // Get truck profile if selected
    let truckMpg = 7.0
    let maintenanceCostPerMile = 0.20

    if (truckId) {
      const { data: truck } = await supabase
        .from('trucks')
        .select('mpg, maintenance_cost_per_mile')
        .eq('id', truckId)
        .eq('user_id', user.id)
        .single()

      if (truck) {
        truckMpg = parseFloat(truck.mpg)
        maintenanceCostPerMile = parseFloat(truck.maintenance_cost_per_mile)
      }
    }

    // Get live fuel price
    const fuelPriceData = await getDieselPrice()
    const fuelPrice = fuelPriceData.value

    // Prepare image if provided
    let imageBase64: string | undefined
    let imageMimeType: string | undefined

    if (image && image.size > 0) {
      const buffer = await image.arrayBuffer()
      imageBase64 = Buffer.from(buffer).toString('base64')
      imageMimeType = image.type || 'image/jpeg'
    }

    const hasManualData = manualRevenue || manualMiles

    const analysis = await analyzeLoad({
      imageBase64,
      imageMimeType,
      manualData: hasManualData ? {
        origin: manualOrigin || undefined,
        destination: manualDestination || undefined,
        revenue: manualRevenue ? parseFloat(manualRevenue) : undefined,
        loaded_miles: manualMiles ? parseFloat(manualMiles) : undefined,
        deadhead_miles: manualDeadhead ? parseFloat(manualDeadhead) : undefined,
        commodity: manualCommodity || undefined,
      } : undefined,
      truckMpg,
      maintenanceCostPerMile,
      fuelPrice,
      driverPay: manualDriverPay ? parseFloat(manualDriverPay) : 0,
    })

    // Save to database
    const { data: savedLoad, error: dbError } = await supabase.from('loads').insert({
      user_id: user.id,
      truck_id: truckId || null,
      origin: analysis.extraction.origin,
      destination: analysis.extraction.destination,
      pickup_date: analysis.extraction.pickup_date || null,
      delivery_date: analysis.extraction.delivery_date || null,
      commodity: analysis.extraction.commodity,
      revenue: analysis.extraction.revenue,
      loaded_miles: analysis.extraction.loaded_miles,
      deadhead_miles: analysis.extraction.deadhead_miles,
      fuel_price: fuelPrice,
      fuel_cost: analysis.costs.fuel_cost,
      toll_cost: analysis.costs.toll_estimate,
      driver_pay: analysis.costs.driver_pay,
      maintenance_allocation: analysis.costs.maintenance_allocation,
      net_profit: analysis.costs.net_profit,
      profit_per_mile: analysis.costs.profit_per_mile,
      ai_rating: analysis.rating,
      ai_recommendation: analysis.recommendation,
      ai_analysis: analysis,
    }).select().single()

    if (dbError) {
      console.error('DB save error:', dbError)
    }

    return NextResponse.json({
      analysis,
      load_id: savedLoad?.id,
      fuel_price: fuelPrice,
    })
  } catch (err) {
    console.error('analyze-load error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
