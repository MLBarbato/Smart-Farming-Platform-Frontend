import type { NextResponse } from 'next/server'
import { COOKIE_ACESSO, COOKIE_RENOVACAO, DURACAO_SESSAO_SEGUNDOS, opcoesDeCookie } from './config'

export type Tokens = {
  accessToken: string
  refreshToken: string
}

/** Grava os tokens em cookies httpOnly: o JavaScript do navegador nunca os enxerga. */
export function gravarTokens(resposta: NextResponse, tokens: Tokens) {
  resposta.cookies.set(COOKIE_ACESSO, tokens.accessToken, opcoesDeCookie(DURACAO_SESSAO_SEGUNDOS))
  resposta.cookies.set(COOKIE_RENOVACAO, tokens.refreshToken, opcoesDeCookie(DURACAO_SESSAO_SEGUNDOS))
}

export function limparTokens(resposta: NextResponse) {
  resposta.cookies.set(COOKIE_ACESSO, '', opcoesDeCookie(0))
  resposta.cookies.set(COOKIE_RENOVACAO, '', opcoesDeCookie(0))
}
