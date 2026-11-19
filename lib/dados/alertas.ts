'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, dados } from '@/lib/api/client'
import type { CriticidadeAlerta, EventoAlerta, PaginaAlertas, StatusAlerta } from './tipos'

export type FiltroAlertas = {
  fazendaId?: number
  status?: StatusAlerta[]
  criticidade?: CriticidadeAlerta
  evento?: EventoAlerta
  pagina?: number
  tamanho?: number
}

/** Alertas das fazendas do usuário (administrador: de todas), do mais recente para o mais antigo. */
export function useListaAlertas(filtro: FiltroAlertas) {
  return useQuery<PaginaAlertas>({
    queryKey: ['alertas', 'lista', filtro],
    queryFn: () => dados(api.GET('/api/v1/alertas', { params: { query: filtro } })),
    placeholderData: anterior => anterior,
  })
}

/** Muda o estado de um alerta (atender, resolver ou dispensar com nota). */
export function useAtenderAlerta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fazendaId, alertaId, status, nota }: { fazendaId: number; alertaId: number; status: StatusAlerta; nota?: string }) =>
      dados(api.PATCH('/api/v1/fazendas/{fazendaId}/alertas/{alertaId}/status', {
        params: { path: { fazendaId, alertaId } },
        body: { status, ...(nota ? { nota } : {}) },
      })),
    onSuccess: () => Promise.all(['alertas', 'resumo', 'mapa'].map(chave => queryClient.invalidateQueries({ queryKey: [chave] }))),
  })
}
