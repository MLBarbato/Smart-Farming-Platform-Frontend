import { NextResponse, type NextRequest } from 'next/server'
import { executarComSessao, sessaoExpirada, urlDoBackend } from '@/lib/auth/servidor'
import { gravarTokens, limparTokens } from '@/lib/auth/tokens'

export const dynamic = 'force-dynamic'

/** Devolve o usuário da sessão (consultando o backend, que é quem sabe se a conta ainda está ativa). */
export async function GET(request: NextRequest) {
  const resultado = await executarComSessao(request, token =>
    token
      ? fetch(urlDoBackend('api/v1/usuarios/me'), {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
      : Promise.resolve(new Response(null, { status: 401 })),
  )
  if (resultado.expirada) return sessaoExpirada()

  const { resposta, novosTokens } = resultado
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const saida = NextResponse.json(corpo ?? { status: resposta.status }, {
      status: resposta.status,
      headers: { 'Cache-Control': 'no-store' },
    })
    if (resposta.status === 401 || resposta.status === 403) limparTokens(saida)
    return saida
  }
  const saida = NextResponse.json({ usuario: corpo }, { headers: { 'Cache-Control': 'no-store' } })
  if (novosTokens) gravarTokens(saida, novosTokens)
  return saida
}
