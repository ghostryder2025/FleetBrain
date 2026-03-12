import { NextRequest, NextResponse } from 'next/server'
import { getMakes, getModels, TRUCK_DATABASE } from '@/lib/trucks'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const make = searchParams.get('make')

  if (!make) {
    return NextResponse.json({ makes: getMakes() })
  }

  const models = getModels(make)
  return NextResponse.json({ models })
}
