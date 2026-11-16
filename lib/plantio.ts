import type { StatusPlantio } from '@/lib/dados/tipos'

/** Data local de hoje no formato AAAA-MM-DD (sem converter para UTC). */
export function hojeIso(agora = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`
}

/** A safra é AAAA/AAAA com anos consecutivos (o backend recusa outros formatos). */
export function safraValida(safra: string): boolean {
  const m = /^(\d{4})\/(\d{4})$/.exec(safra.trim())
  return !!m && Number(m[2]) === Number(m[1]) + 1
}

/** O ano-safra começa em julho (como no backend): plantar em 2026-10 dá 2026/2027; em 2027-03, também. */
export function safraDaData(dataIso: string): string {
  const [ano, mes] = dataIso.split('-').map(Number)
  const inicio = mes >= 7 ? ano : ano - 1
  return `${inicio}/${inicio + 1}`
}

/** Ações disponíveis para um plantio em cada estado (espelha as transições do backend). */
export function acoesDoPlantio(status: StatusPlantio | undefined) {
  return {
    iniciar: status === 'PLANEJADO',
    colher: status === 'EM_CULTIVO',
    editar: status === 'PLANEJADO' || status === 'EM_CULTIVO',
    cancelar: status === 'PLANEJADO' || status === 'EM_CULTIVO',
    excluir: status === 'PLANEJADO',
    corrigirColheita: status === 'COLHIDO',
  }
}
