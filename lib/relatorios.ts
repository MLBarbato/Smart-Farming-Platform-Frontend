import type { paths } from '@/lib/api/schema'

export type TipoRelatorio = paths['/api/v1/fazendas/{fazendaId}/relatorios/{tipo}']['get']['parameters']['path']['tipo']

/** Limite do backend: períodos de até 366 dias (início e fim incluídos). */
export const MAXIMO_DIAS = 366
export const DIAS_PADRAO = 30

const DIA_MS = 24 * 60 * 60 * 1000

/** "AAAA-MM-DD" ± n dias, sem passar por fuso (a data já é local de Brasília). */
export function somarDias(data: string, dias: number): string {
  return new Date(Date.parse(data + 'T00:00:00Z') + dias * DIA_MS).toISOString().slice(0, 10)
}

/** Quantos dias o período tem, contando o início e o fim. */
export function diasNoPeriodo(de: string, ate: string): number {
  return Math.round((Date.parse(ate + 'T00:00:00Z') - Date.parse(de + 'T00:00:00Z')) / DIA_MS) + 1
}

/** Mensagem de erro do período, ou `undefined` se ele é válido. */
export function validarPeriodo(de: string, ate: string): string | undefined {
  if (!de || !ate) return 'Informe as datas inicial e final.'
  if (de > ate) return 'A data inicial deve ser anterior ou igual à final.'
  if (diasNoPeriodo(de, ate) > MAXIMO_DIAS) return `O período pode ter no máximo ${MAXIMO_DIAS} dias.`
  return undefined
}

/**
 * Nome do arquivo do cabeçalho Content-Disposition. Prefere `filename*` (RFC 5987, UTF-8) e aceita o
 * `filename` simples; sem cabeçalho, usa o padrão.
 */
export function nomeDoArquivo(contentDisposition: string | null | undefined, padrao: string): string {
  if (!contentDisposition) return padrao
  const codificado = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(contentDisposition)?.[1]
  if (codificado) {
    try {
      return decodeURIComponent(codificado.trim().replace(/^"|"$/g, ''))
    } catch {
      // nome mal codificado: tenta o simples
    }
  }
  const simples = /filename\s*=\s*"?([^";]+)"?/.exec(contentDisposition)?.[1]
  return simples?.trim() || padrao
}
