import { NextResponse, type NextRequest } from 'next/server'
import { API_ORIGIN } from '@/lib/auth/config'
import { ipDoCliente } from '@/lib/auth/servidor'
import { gravarTokens } from '@/lib/auth/tokens'

export const dynamic = 'force-dynamic'

/** Faz o login no backend e guarda os tokens em cookies httpOnly; o navegador recebe só o usuário. */
export async function POST(request: NextRequest) {
  let credenciais: { email?: unknown; senha?: unknown }
  try {
    credenciais = await request.json()
  } catch {
    return NextResponse.json({ status: 400, erro: 'Bad Request', mensagem: 'Requisição inválida.' }, { status: 400 })
  }

  const ip = ipDoCliente(request)
  let resposta: Response
  try {
    resposta = await fetch(`${API_ORIGIN}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(ip ? { 'X-Forwarded-For': ip } : {}) },
      body: JSON.stringify({ email: credenciais.email, senha: credenciais.senha }),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json(
      { status: 503, erro: 'Service Unavailable', mensagem: 'Servidor indisponível. Tente novamente em instantes.' },
      { status: 503 },
    )
  }

  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok || !corpo?.accessToken || !corpo?.refreshToken) {
    const saida = NextResponse.json(corpo ?? { status: resposta.status }, {
      status: resposta.ok ? 502 : resposta.status,
      headers: { 'Cache-Control': 'no-store' },
    })
    const espera = resposta.headers.get('retry-after')
    if (espera) saida.headers.set('Retry-After', espera)
    return saida
  }

  const saida = NextResponse.json({ usuario: corpo.usuario }, { headers: { 'Cache-Control': 'no-store' } })
  gravarTokens(saida, { accessToken: corpo.accessToken, refreshToken: corpo.refreshToken })
  return saida
}
