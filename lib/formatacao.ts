const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export const formatarNumero = (valor: number | null | undefined, casas?: number) =>
  valor === null || valor === undefined
    ? '—'
    : casas === undefined
      ? numero.format(valor)
      : valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

/** Lê um número digitado no formato brasileiro ("1.200,5") ou simples ("1200.5"); vazio ou inválido dá `undefined`. */
export function lerNumero(texto: string): number | undefined {
  const limpo = texto.trim()
  if (!limpo) return undefined
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const valor = Number(normalizado)
  return Number.isFinite(valor) ? valor : undefined
}

/** "2026-11-16" → "16/11/2026" (sem passar por fuso). */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarCoordenada(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : valor.toFixed(5).replace('.', ',')
}
