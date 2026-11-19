'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, dados } from '@/lib/api/client'
import { ApiError } from '@/lib/api/erro'
import { FUSO, dataNoFuso, montarHistorico, type DiaHistorico } from '@/lib/clima'
import type { EstacaoResponse } from './tipos'

/** Estação virtual da fazenda; `null` quando a fazenda ainda não tem (a API responde 404). */
export function useEstacao(fazendaId: number | undefined) {
  return useQuery<EstacaoResponse | null>({
    queryKey: ['estacao', fazendaId],
    queryFn: async () => {
      try {
        return await dados(api.GET('/api/v1/fazendas/{fazendaId}/estacao', { params: { path: { fazendaId: fazendaId! } } }))
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 404) return null
        throw erro
      }
    },
    enabled: fazendaId !== undefined,
    retry: false,
  })
}

/** Máximo de dias pedidos de uma vez; a tela recorta o período escolhido a partir deste histórico. */
export const DIAS_DE_HISTORICO = 30

/**
 * Temperatura (mínima e máxima) e chuva diárias da estação nos últimos 30 dias, até ontem. Só há dias desde
 * que a estação foi criada (o backend carrega o histórico inicial na criação), então pode vir menos que 30.
 */
export function useHistoricoClima(fazendaId: number | undefined, ativo: boolean) {
  return useQuery<DiaHistorico[]>({
    queryKey: ['estacao', 'historico', fazendaId],
    enabled: fazendaId !== undefined && ativo,
    queryFn: async () => {
      const de = new Date(Date.now() - (DIAS_DE_HISTORICO + 1) * 24 * 3600_000).toISOString()
      const consulta = (variavel: 'TEMPERATURA_AR' | 'PRECIPITACAO') =>
        dados(api.GET('/api/v1/fazendas/{fazendaId}/estacao/leituras/agregadas', {
          params: { path: { fazendaId: fazendaId! }, query: { variavel, de, intervalo: 'DIA', fuso: FUSO } },
        }))
      const [temperatura, chuva] = await Promise.all([consulta('TEMPERATURA_AR'), consulta('PRECIPITACAO')])
      const historico = montarHistorico(temperatura.pontos ?? [], chuva.pontos ?? [], dataNoFuso(Date.now()))
      return historico.slice(-DIAS_DE_HISTORICO)
    },
  })
}

function useInvalidarClima() {
  const queryClient = useQueryClient()
  return () => Promise.all(['previsao', 'estacao'].map(chave => queryClient.invalidateQueries({ queryKey: [chave] })))
}

export function useAtualizarPrevisao(fazendaId: number) {
  const invalidar = useInvalidarClima()
  return useMutation({
    mutationFn: () => dados(api.POST('/api/v1/fazendas/{fazendaId}/previsao/atualizar', { params: { path: { fazendaId } } })),
    onSuccess: invalidar,
  })
}

export function useCriarEstacao(fazendaId: number) {
  const invalidar = useInvalidarClima()
  return useMutation({
    mutationFn: () => dados(api.POST('/api/v1/fazendas/{fazendaId}/estacao', { params: { path: { fazendaId } } })),
    onSuccess: invalidar,
  })
}

export function useSincronizarEstacao(fazendaId: number) {
  const invalidar = useInvalidarClima()
  return useMutation({
    mutationFn: () => dados(api.POST('/api/v1/fazendas/{fazendaId}/estacao/sincronizar', { params: { path: { fazendaId } } })),
    onSuccess: invalidar,
  })
}
