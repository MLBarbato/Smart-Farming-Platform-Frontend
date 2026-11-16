'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, dados } from '@/lib/api/client'
import { useSessao } from '@/lib/auth/sessao'
import { chaves, invalidarCadastros } from './chaves'
import type { FazendaRequest, FazendaResponse, ResumoGeralResponse } from './tipos'

export function useFazendas() {
  return useQuery<FazendaResponse[]>({
    queryKey: chaves.fazendas,
    queryFn: () => dados(api.GET('/api/v1/fazendas')),
  })
}

export function useResumoGeral() {
  return useQuery<ResumoGeralResponse>({
    queryKey: chaves.resumo,
    queryFn: () => dados(api.GET('/api/v1/resumo')),
  })
}

/** Cria (sem `id`) ou atualiza uma fazenda; a nova fazenda é do usuário logado. */
export function useSalvarFazenda() {
  const queryClient = useQueryClient()
  const { data: usuario } = useSessao()
  return useMutation({
    mutationFn: ({ id, corpo }: { id?: number; corpo: FazendaRequest }) => {
      if (id !== undefined) {
        return dados(api.PUT('/api/v1/fazendas/{id}', { params: { path: { id } }, body: corpo }))
      }
      if (!usuario?.id) throw new Error('Sessão não carregada.')
      return dados(api.POST('/api/v1/usuarios/{usuarioId}/fazendas', { params: { path: { usuarioId: usuario.id } }, body: corpo }))
    },
    onSuccess: () => invalidarCadastros(queryClient),
  })
}

export function useExcluirFazenda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => dados(api.DELETE('/api/v1/fazendas/{id}', { params: { path: { id } } })),
    onSuccess: () => invalidarCadastros(queryClient),
  })
}
