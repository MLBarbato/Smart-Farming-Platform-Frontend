'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, dados } from '@/lib/api/client'
import { chaves, invalidarCadastros } from './chaves'
import type { MapaFazendaResponse, TalhaoRequest } from './tipos'

/** Fazenda, talhões com polígono, plantio atual, sensores, alertas e recomendação (uma consulta só). */
export function useMapa(fazendaId: number | undefined) {
  return useQuery<MapaFazendaResponse>({
    queryKey: chaves.mapa(fazendaId ?? 0),
    queryFn: () => dados(api.GET('/api/v1/fazendas/{fazendaId}/mapa', { params: { path: { fazendaId: fazendaId! } } })),
    enabled: fazendaId !== undefined,
  })
}

export function useSalvarTalhao(fazendaId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, corpo }: { id?: number; corpo: TalhaoRequest }) =>
      id !== undefined
        ? dados(api.PUT('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}', { params: { path: { fazendaId, talhaoId: id } }, body: corpo }))
        : dados(api.POST('/api/v1/fazendas/{fazendaId}/talhoes', { params: { path: { fazendaId } }, body: corpo })),
    onSuccess: () => invalidarCadastros(queryClient),
  })
}

export function useExcluirTalhao(fazendaId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (talhaoId: number) =>
      dados(api.DELETE('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}', { params: { path: { fazendaId, talhaoId } } })),
    onSuccess: () => invalidarCadastros(queryClient),
  })
}
