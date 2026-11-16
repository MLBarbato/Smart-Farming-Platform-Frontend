import type { QueryClient } from '@tanstack/react-query'

/** Chaves do cache de dados da API. */
export const chaves = {
  fazendas: ['fazendas'] as const,
  resumo: ['resumo'] as const,
  culturas: ['culturas'] as const,
  mapa: (fazendaId: number) => ['mapa', fazendaId] as const,
  talhoes: (fazendaId: number) => ['talhoes', fazendaId] as const,
  plantios: (fazendaId: number) => ['plantios', fazendaId] as const,
}

/** Depois de criar, alterar ou excluir um cadastro, tudo o que o resumo e o mapa derivam dele fica velho. */
export function invalidarCadastros(queryClient: QueryClient) {
  return Promise.all(
    ['fazendas', 'resumo', 'mapa', 'talhoes', 'plantios'].map(chave => queryClient.invalidateQueries({ queryKey: [chave] })),
  )
}
