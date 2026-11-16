import { NextResponse, type NextRequest } from 'next/server'
import { API_ORIGIN, COOKIE_RENOVACAO } from '@/lib/auth/config'
import { limparTokens } from '@/lib/auth/tokens'

export const dynamic = 'force-dynamic'

/** Revoga o refresh token no backend (se possível) e apaga os cookies. */
export async function POST(request: NextRequest) {
  const refresh = request.cookies.get(COOKIE_RENOVACAO)?.value
  if (refresh) {
    await fetch(`${API_ORIGIN}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
      cache: 'no-store',
    }).catch(() => undefined)
  }
  const saida = new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  limparTokens(saida)
  return saida
}
