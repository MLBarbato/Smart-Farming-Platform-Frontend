import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_RENOVACAO } from '@/lib/auth/config'

/** Páginas do painel exigem uma sessão: sem o cookie de renovação, vai para o login e volta depois. */
export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIE_RENOVACAO)) return NextResponse.next()
  const login = new URL('/login', request.url)
  login.searchParams.set('proximo', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
