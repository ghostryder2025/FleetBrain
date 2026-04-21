import { NextRequest, NextResponse } from 'next/server'
import { getDieselPrice } from '@/lib/eia'

export async function GET(req: NextRequest) {
  try {
    const region = req.nextUrl.searchParams.get('region') ?? 'national'
    const price = await getDieselPrice(region)
    return NextResponse.json(price)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch fuel price' }, { status: 500 })
  }
}
