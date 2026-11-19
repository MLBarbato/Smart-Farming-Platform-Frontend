'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, dados } from '@/lib/api/client'
import type { PaginaRecomendacoes, RecomendacaoIrrigacao } from './tipos'

/** A recomendação mais recente de cada talhão com plantio em cultivo. */
export function useRecomendacoesAtuais(fazendaId: number | undefined) {
  return useQuery<RecomendacaoIrrigacao[]>({
    queryKey: ['recomendacoes', 'atuais', fazendaId],
    queryFn: () => dados(api.GET('/api/v1/fazendas/{fazendaId}/recomendacoes-irrigacao/atuais', { params: { path: { fazendaId: fazendaId! } } })),
    enabled: fazendaId !== undefined,
  })
}

export function useHistoricoRecomendacoes(fazendaId: number | undefined, tamanho = 10) {
  return useQuery<PaginaRecomendacoes>({
    queryKey: ['recomendacoes', 'historico', fazendaId, tamanho],
    queryFn: () => dados(api.GET('/api/v1/fazendas/{fazendaId}/recomendacoes-irrigacao', { params: { path: { fazendaId: fazendaId! }, query: { tamanho } } })),
    enabled: fazendaId !== undefined,
  })
}

/** Recalcula as recomendações da fazenda agora (cálculo local; só grava se o resultado mudou). */
export function useRecalcularRecomendacoes(fazendaId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => dados(api.POST('/api/v1/fazendas/{fazendaId}/recomendacoes-irrigacao/calcular', { params: { path: { fazendaId } } })),
    onSuccess: () => Promise.all(['recomendacoes', 'resumo', 'mapa'].map(chave => queryClient.invalidateQueries({ queryKey: [chave] }))),
  })
}
