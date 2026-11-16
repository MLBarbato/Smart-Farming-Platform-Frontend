'use client'

import { useQuery } from '@tanstack/react-query'
import type { components } from '@/lib/api/schema'
import { ApiError, erroDaResposta, erroDeRede } from '@/lib/api/erro'

export type Usuario = components['schemas']['UsuarioResponse']

async function chamarAuth(caminho: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(caminho, { cache: 'no-store', ...init })
  } catch {
    throw erroDeRede()
  }
}

/** Entra com e-mail e senha; o servidor guarda os tokens em cookies e devolve só o usuário. */
export async function entrar(email: string, senha: string): Promise<Usuario> {
  const resposta = await chamarAuth('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) throw erroDaResposta(resposta.status, corpo, resposta.headers.get('retry-after'))
  return corpo.usuario as Usuario
}

export async function sair(): Promise<void> {
  await chamarAuth('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
}

async function carregarSessao(): Promise<Usuario> {
  const resposta = await chamarAuth('/api/auth/session')
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) throw erroDaResposta(resposta.status, corpo)
  return corpo.usuario as Usuario
}

export const CHAVE_SESSAO = ['sessao'] as const

/** Usuário logado (nulo enquanto carrega); o erro 401/403 significa "sem sessão". */
export function useSessao() {
  return useQuery<Usuario, ApiError>({
    queryKey: CHAVE_SESSAO,
    queryFn: carregarSessao,
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export const ehAdministrador = (usuario?: Usuario) => usuario?.perfil === 'ADMINISTRADOR'
