'use client'

import { useQuery } from '@tanstack/react-query'
import { api, dados } from '@/lib/api/client'
import type { AlertaResponse, LeituraAgregadaResponse, PaginaAlertas, PrevisaoFazendaResponse, ResumoFazendaResponse } from './tipos'

/** Indicadores de uma fazenda: condições atuais, estação, sensores, alertas e irrigação. */
export function useResumoFazenda(fazendaId: number | undefined) {
  return useQuery<ResumoFazendaResponse>({
    queryKey: ['resumo', 'fazenda', fazendaId],
    queryFn: () => dados(api.GET('/api/v1/fazendas/{fazendaId}/resumo', { params: { path: { fazendaId: fazendaId! } } })),
    enabled: fazendaId !== undefined,
  })
}

export function usePrevisao(fazendaId: number | undefined) {
  return useQuery<PrevisaoFazendaResponse>({
    queryKey: ['previsao', fazendaId],
    queryFn: () => dados(api.GET('/api/v1/fazendas/{fazendaId}/previsao', { params: { path: { fazendaId: fazendaId! } } })),
    enabled: fazendaId !== undefined,
  })
}

/** Temperatura do ar da estação virtual da fazenda, agregada por hora (até 2 dias) ou por dia. */
export function useTemperaturaEstacao(fazendaId: number | undefined, dias: 1 | 7 | 30, agora: number) {
  return useQuery<LeituraAgregadaResponse>({
    queryKey: ['estacao', 'temperatura', fazendaId, dias, agora],
    queryFn: () => {
      const de = new Date(agora - dias * 24 * 3600 * 1000).toISOString()
      return dados(api.GET('/api/v1/fazendas/{fazendaId}/estacao/leituras/agregadas', {
        params: {
          path: { fazendaId: fazendaId! },
          query: { variavel: 'TEMPERATURA_AR', de, intervalo: dias === 30 ? 'DIA' : 'HORA', fuso: 'America/Sao_Paulo' },
        },
      }))
    },
    enabled: fazendaId !== undefined,
  })
}

/** Alertas abertos mais recentes de todas as fazendas do usuário (administrador: de todas). */
export function useAlertasAbertos(tamanho = 4) {
  return useQuery<PaginaAlertas>({
    queryKey: ['alertas', 'abertos', tamanho],
    queryFn: () => dados(api.GET('/api/v1/alertas', { params: { query: { status: ['ABERTO'], tamanho } } })),
  })
}

export type { AlertaResponse }
