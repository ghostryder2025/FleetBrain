import { NextRequest, NextResponse } from 'next/server'
import { estimateDeadhead } from '@/lib/location'

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip')
  const pickup = req.nextUrl.searchParams.get('pickup')

  if (!zip || !pickup) {
    return NextResponse.json({ error: 'zip and pickup are required' }, { status: 400 })
  }

  const result = await estimateDeadhead(zip, pickup)
  if (!result) {
    return NextResponse.json({ error: 'Could not calculate deadhead' }, { status: 422 })
  }

  return NextResponse.json(result)
}
