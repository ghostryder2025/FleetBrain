import { NextResponse } from 'next/server'
import { getDieselPrice } from '@/lib/eia'

export async function GET() {
  try {
    const price = await getDieselPrice()
    return NextResponse.json(price)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch fuel price' }, { status: 500 })
  }
}
