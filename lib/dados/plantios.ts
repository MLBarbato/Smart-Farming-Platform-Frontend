'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, dados } from '@/lib/api/client'
import { chaves, invalidarCadastros } from './chaves'
import type { CulturaResponse, PlantioRequest, PlantioResponse, StatusPlantio } from './tipos'

/** Catálogo de culturas (mantido pelo administrador); a lista de culturas vem sempre daqui. */
export function useCulturas() {
  return useQuery<CulturaResponse[]>({
    queryKey: chaves.culturas,
    queryFn: () => dados(api.GET('/api/v1/culturas')),
    staleTime: 5 * 60_000,
  })
}

export function usePlantios(fazendaId: number | undefined) {
  return useQuery<PlantioResponse[]>({
    queryKey: chaves.plantios(fazendaId ?? 0),
    queryFn: () => dados(api.GET('/api/v1/fazendas/{fazendaId}/plantios', { params: { path: { fazendaId: fazendaId! } } })),
    enabled: fazendaId !== undefined,
  })
}

type Alvo = { fazendaId: number; talhaoId: number }

export function useSalvarPlantio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fazendaId, talhaoId, id, corpo }: Alvo & { id?: number; corpo: PlantioRequest }) =>
      id !== undefined
        ? dados(api.PUT('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/plantios/{plantioId}', { params: { path: { fazendaId, talhaoId, plantioId: id } }, body: corpo }))
        : dados(api.POST('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/plantios', { params: { path: { fazendaId, talhaoId } }, body: corpo })),
    onSuccess: () => invalidarCadastros(queryClient),
  })
}

/** Iniciar (EM_CULTIVO), colher (COLHIDO, com data e quantidade) ou cancelar. */
export function useAlterarStatusPlantio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fazendaId, talhaoId, id, status, dataColheitaReal, quantidadeColhidaKg }: Alvo & {
      id: number
      status: StatusPlantio
      dataColheitaReal?: string
      quantidadeColhidaKg?: number
    }) =>
      dados(api.PATCH('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/plantios/{plantioId}/status', {
        params: { path: { fazendaId, talhaoId, plantioId: id } },
        body: { status, dataColheitaReal, quantidadeColhidaKg },
      })),
    onSuccess: () => invalidarCadastros(queryClient),
  })
}

export function useCorrigirColheita() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fazendaId, talhaoId, id, dataColheitaReal, quantidadeColhidaKg }: Alvo & {
      id: number
      dataColheitaReal: string
      quantidadeColhidaKg?: number
    }) =>
      dados(api.PATCH('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/plantios/{plantioId}/colheita', {
        params: { path: { fazendaId, talhaoId, plantioId: id } },
        body: { dataColheitaReal, quantidadeColhidaKg },
      })),
    onSuccess: () => invalidarCadastros(queryClient),
  })
}

export function useExcluirPlantio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fazendaId, talhaoId, id }: Alvo & { id: number }) =>
      dados(api.DELETE('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/plantios/{plantioId}', { params: { path: { fazendaId, talhaoId, plantioId: id } } })),
    onSuccess: () => invalidarCadastros(queryClient),
  })
}
