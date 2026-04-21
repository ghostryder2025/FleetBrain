import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      // Detect password recovery vs regular auth
      const isRecovery = next === '/reset-password' ||
        data.session.user.recovery_sent_at != null
      return NextResponse.redirect(`${origin}${isRecovery ? '/reset-password' : next}`)
    }
  }

  return NextResponse.redirect(`${origin}/reset-password?error=expired`)
}
