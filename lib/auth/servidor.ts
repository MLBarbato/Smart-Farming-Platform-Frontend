import { NextResponse, type NextRequest } from 'next/server'
import { API_ORIGIN, COOKIE_ACESSO, COOKIE_RENOVACAO } from './config'
import { renovarSessao } from './renovacao'
import { limparTokens, type Tokens } from './tokens'

export type ResultadoComSessao =
  | { expirada: true }
  | { expirada: false; resposta: Response; novosTokens: Tokens | null }

/**
 * Executa uma chamada ao backend em nome do usuário da requisição: usa o access token do cookie, renova a
 * sessão com o refresh token quando o access token falta ou o backend responde 401 (uma única vez) e informa
 * os tokens novos para o chamador gravar nos cookies. `expirada` indica que não há mais sessão válida.
 */
export async function executarComSessao(
  request: NextRequest,
  chamar: (accessToken: string | undefined) => Promise<Response>,
): Promise<ResultadoComSessao> {
  const refresh = request.cookies.get(COOKIE_RENOVACAO)?.value
  let token = request.cookies.get(COOKIE_ACESSO)?.value
  let novos: Tokens | null = null

  if (!token && refresh) {
    novos = await renovarSessao(refresh)
    if (!novos) return { expirada: true }
    token = novos.accessToken
  }
  let resposta = await chamar(token)
  if (resposta.status === 401 && refresh && !novos) {
    novos = await renovarSessao(refresh)
    if (!novos) return { expirada: true }
    resposta = await chamar(novos.accessToken)
  }
  return { expirada: false, resposta, novosTokens: novos }
}

export function urlDoBackend(caminho: string): string {
  return `${API_ORIGIN}/${caminho.replace(/^\/+/, '')}`
}

/** Resposta 401 padrão quando a sessão acabou; também apaga os cookies. */
export function sessaoExpirada(): NextResponse {
  const resposta = NextResponse.json(
    { status: 401, erro: 'Unauthorized', mensagem: 'Sessão expirada. Entre novamente.', codigo: 'SESSAO_EXPIRADA' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } },
  )
  limparTokens(resposta)
  return resposta
}

/** Primeiro IP de X-Forwarded-For, repassado ao backend para o limite de tentativas de login. */
export function ipDoCliente(request: NextRequest): string | undefined {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
}
