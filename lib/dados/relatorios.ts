'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { ApiError, erroDaResposta, erroDeRede } from '@/lib/api/erro'
import { nomeDoArquivo, type TipoRelatorio } from '@/lib/relatorios'

export type PedidoRelatorio = { fazendaId: number; tipo: TipoRelatorio; de: string; ate: string }

/** Baixa o CSV do relatório pelo proxy e devolve o arquivo com o nome sugerido pelo backend. */
async function buscarRelatorio({ fazendaId, tipo, de, ate }: PedidoRelatorio): Promise<{ arquivo: Blob; nome: string }> {
  let resultado
  try {
    resultado = await api.GET('/api/v1/fazendas/{fazendaId}/relatorios/{tipo}', {
      params: { path: { fazendaId, tipo }, query: { de, ate } },
      parseAs: 'blob',
    })
  } catch (erro) {
    if (erro instanceof ApiError) throw erro
    throw erroDeRede()
  }
  const { data, error, response } = resultado
  if (error !== undefined || !response.ok || !data) {
    throw erroDaResposta(response.status, error, response.headers.get('retry-after'))
  }
  const padrao = `relatorio-${tipo.toLowerCase()}-${de}-a-${ate}.csv`
  return { arquivo: data as Blob, nome: nomeDoArquivo(response.headers.get('content-disposition'), padrao) }
}

/** Entrega o arquivo ao navegador como download. */
function salvar(arquivo: Blob, nome: string) {
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function useBaixarRelatorio() {
  return useMutation({
    mutationFn: buscarRelatorio,
    onSuccess: ({ arquivo, nome }) => salvar(arquivo, nome),
  })
}
