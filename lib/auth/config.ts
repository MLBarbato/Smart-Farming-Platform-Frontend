/** Configuração da sessão no servidor (BFF). Nada aqui vai para o navegador. */

/** Origem do backend (sem barra final e sem /api/v1: as rotas do contrato já começam com /api/v1). */
export const API_ORIGIN = (process.env.API_ORIGIN ?? 'http://localhost:8080').replace(/\/+$/, '')

export const COOKIE_ACESSO = 'sf_at'
export const COOKIE_RENOVACAO = 'sf_rt'

/** O refresh token do backend vale 7 dias; o cookie dura o mesmo. */
export const DURACAO_SESSAO_SEGUNDOS = 7 * 24 * 60 * 60

export function opcoesDeCookie(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}
