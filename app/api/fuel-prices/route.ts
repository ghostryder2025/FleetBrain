import { NextRequest, NextResponse } from 'next/server'
import { getDieselPrice, getDieselPriceByZip } from '@/lib/eia'

export async function GET(req: NextRequest) {
  try {
    const zip = req.nextUrl.searchParams.get('zip')
    const region = req.nextUrl.searchParams.get('region') ?? 'national'

    const price = zip ? await getDieselPriceByZip(zip) : await getDieselPrice(region)
    return NextResponse.json(price)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch fuel price' }, { status: 500 })
  }
}
