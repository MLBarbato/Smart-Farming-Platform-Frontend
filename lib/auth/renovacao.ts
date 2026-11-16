import { API_ORIGIN } from './config'
import type { Tokens } from './tokens'

/**
 * O refresh token do backend é rotativo: cada renovação invalida o token usado. Se várias requisições
 * simultâneas (ou atrasadas, que ainda levam o cookie antigo) tentassem renovar com o mesmo token, só a
 * primeira funcionaria e as outras derrubariam a sessão. Por isso as renovações com o mesmo token são
 * compartilhadas: a primeira chama o backend e as demais, por um curto período, reaproveitam o resultado.
 *
 * Vale por processo do Next; com várias instâncias do servidor, use afinidade de sessão ou um cache comum.
 */
const REAPROVEITAR_POR_MS = 30_000
const emAndamento = new Map<string, Promise<Tokens | null>>()

type Renovador = (refreshToken: string) => Promise<Tokens | null>

export async function renovarSessao(
  refreshToken: string,
  renovador: Renovador = renovarNoBackend,
): Promise<Tokens | null> {
  const existente = emAndamento.get(refreshToken)
  if (existente) return existente

  const promessa = renovador(refreshToken).catch(() => null)
  emAndamento.set(refreshToken, promessa)
  const limpar = setTimeout(() => emAndamento.delete(refreshToken), REAPROVEITAR_POR_MS)
  limpar.unref?.()
  // Falhas não ficam guardadas: uma nova tentativa deve chamar o backend de novo.
  void promessa.then(resultado => {
    if (!resultado) {
      emAndamento.delete(refreshToken)
      clearTimeout(limpar)
    }
  })
  return promessa
}

/** Só para testes. */
export function limparRenovacoes() {
  emAndamento.clear()
}

async function renovarNoBackend(refreshToken: string): Promise<Tokens | null> {
  const resposta = await fetch(`${API_ORIGIN}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  })
  if (!resposta.ok) return null
  const corpo = (await resposta.json()) as { accessToken?: string; refreshToken?: string }
  if (!corpo.accessToken || !corpo.refreshToken) return null
  return { accessToken: corpo.accessToken, refreshToken: corpo.refreshToken }
}
