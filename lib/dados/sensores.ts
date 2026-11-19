'use client'

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { api, dados } from '@/lib/api/client'
import type { SensorLeituraAtualResponse, SensorRequest, StatusSensor } from './tipos'

export type SensorDoTalhao = SensorLeituraAtualResponse & { talhaoId: number; talhaoIdentificacao: string }

/**
 * Sensores de uma fazenda com a última leitura de cada um. A API lista sensores por talhão, então é uma
 * consulta por talhão (`/leituras/atuais`), reunidas aqui.
 */
export function useSensoresDaFazenda(fazendaId: number | undefined, talhoes: { id: number; identificacao: string }[]) {
  const consultas = useQueries({
    queries: talhoes.map(t => ({
      queryKey: ['sensores', fazendaId, t.id],
      queryFn: () => dados(api.GET('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/leituras/atuais', { params: { path: { fazendaId: fazendaId!, talhaoId: t.id } } })),
      enabled: fazendaId !== undefined,
    })),
  })
  const sensores: SensorDoTalhao[] = consultas.flatMap((c, i) =>
    (c.data ?? []).map(s => ({ ...s, talhaoId: talhoes[i].id, talhaoIdentificacao: talhoes[i].identificacao })),
  )
  return {
    sensores,
    carregando: consultas.some(c => c.isPending && c.fetchStatus !== 'idle'),
    erro: consultas.find(c => c.isError)?.error,
    recarregar: () => consultas.forEach(c => c.refetch()),
  }
}

function useInvalidarSensores() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(['sensores', 'resumo', 'mapa'].map(chave => queryClient.invalidateQueries({ queryKey: [chave] })))
}

export function useCriarSensor(fazendaId: number) {
  const invalidar = useInvalidarSensores()
  return useMutation({
    mutationFn: ({ talhaoId, corpo }: { talhaoId: number; corpo: SensorRequest }) =>
      dados(api.POST('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/sensores', { params: { path: { fazendaId, talhaoId } }, body: corpo })),
    onSuccess: invalidar,
  })
}

export function useAlterarStatusSensor(fazendaId: number) {
  const invalidar = useInvalidarSensores()
  return useMutation({
    mutationFn: ({ talhaoId, sensorId, status }: { talhaoId: number; sensorId: number; status: StatusSensor }) =>
      dados(api.PATCH('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/sensores/{sensorId}/status', { params: { path: { fazendaId, talhaoId, sensorId } }, body: { status } })),
    onSuccess: invalidar,
  })
}

export function useExcluirSensor(fazendaId: number) {
  const invalidar = useInvalidarSensores()
  return useMutation({
    mutationFn: ({ talhaoId, sensorId }: { talhaoId: number; sensorId: number }) =>
      dados(api.DELETE('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/sensores/{sensorId}', { params: { path: { fazendaId, talhaoId, sensorId } } })),
    onSuccess: invalidar,
  })
}

/** Leituras agregadas (mínimo, média e máximo por intervalo) de cada sensor pedido, para os gráficos. */
export function useSeriesDosSensores(
  fazendaId: number | undefined,
  sensores: { id: number; talhaoId: number }[],
  periodo: { horas: number; intervalo: 'HORA' | 'DIA' },
) {
  return useQueries({
    queries: sensores.map(s => ({
      queryKey: ['sensores', 'serie', fazendaId, s.talhaoId, s.id, periodo.horas, periodo.intervalo],
      queryFn: () => {
        const de = new Date(Date.now() - periodo.horas * 3600_000).toISOString()
        return dados(api.GET('/api/v1/fazendas/{fazendaId}/talhoes/{talhaoId}/sensores/{sensorId}/leituras/agregadas', {
          params: { path: { fazendaId: fazendaId!, talhaoId: s.talhaoId, sensorId: s.id }, query: { de, intervalo: periodo.intervalo, fuso: 'America/Sao_Paulo' } },
        }))
      },
      enabled: fazendaId !== undefined,
      staleTime: 60_000,
    })),
  })
}
