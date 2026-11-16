import createClient from 'openapi-fetch'
import type { paths } from './schema'
import { ApiError, erroDaResposta, erroDeRede } from './erro'

/**
 * Cliente tipado da API, gerado a partir do contrato OpenAPI do backend (`pnpm gen:api`). Todas as chamadas
 * passam pelo proxy do próprio Next (`/api/backend`), que cuida do token e da renovação da sessão; os caminhos
 * são os do contrato, por exemplo `api.GET('/api/v1/alertas')`.
 */
export const api = createClient<paths>({ baseUrl: '/api/backend' })

// Sessão encerrada (refresh vencido ou revogado): volta ao login e retorna à página atual depois.
api.use({
  async onResponse({ response }) {
    if (response.status === 401 && typeof window !== 'undefined') {
      const corpo = await response.clone().json().catch(() => null)
      if (corpo?.codigo === 'SESSAO_EXPIRADA') {
        const proximo = encodeURIComponent(window.location.pathname + window.location.search)
        // Navegação completa de propósito: descarta todo o estado e o cache da sessão encerrada.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/login?proximo=${proximo}`)
      }
    }
    return undefined
  },
})

type Resultado<T> = { data?: T; error?: unknown; response: Response }

/**
 * Desembrulha uma chamada do cliente tipado: devolve os dados ou lança `ApiError` (padrão de erro do backend),
 * o que combina com o React Query.
 */
export async function dados<T>(chamada: Promise<Resultado<T>>): Promise<T> {
  let resultado: Resultado<T>
  try {
    resultado = await chamada
  } catch (erro) {
    if (erro instanceof ApiError) throw erro
    throw erroDeRede()
  }
  if (resultado.error !== undefined || !resultado.response.ok) {
    throw erroDaResposta(resultado.response.status, resultado.error, resultado.response.headers.get('retry-after'))
  }
  return resultado.data as T
}
