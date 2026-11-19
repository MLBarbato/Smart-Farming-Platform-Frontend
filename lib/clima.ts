/** Utilidades do módulo de clima: datas sem fuso, descrição do tempo e agregação do histórico da estação. */

export const FUSO = 'America/Sao_Paulo'

export const periodosClima = [
  { chave: '7d', rotulo: '7 dias', dias: 7 },
  { chave: '15d', rotulo: '15 dias', dias: 15 },
  { chave: '30d', rotulo: '30 dias', dias: 30 },
] as const
export type ChavePeriodoClima = (typeof periodosClima)[number]['chave']

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const diaDaSemana = (data: string) => DIAS_SEMANA[new Date(data + 'T00:00:00Z').getUTCDay()]
export const diaMes = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`

/** Data (YYYY-MM-DD) de um instante no fuso da fazenda. */
export function dataNoFuso(instante: string | number | Date, fuso = FUSO): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instante))
}

/** "hoje às 17:00" ou "17/11 às 17:00": hora da leitura no fuso da fazenda (a API devolve UTC). */
export function rotuloHoraLeitura(iso: string, hoje: string, fuso = FUSO): string {
  const instante = new Date(iso)
  const hora = new Intl.DateTimeFormat('pt-BR', { timeZone: fuso, hour: '2-digit', minute: '2-digit', hour12: false }).format(instante)
  const data = dataNoFuso(instante, fuso)
  return `${data === hoje ? 'hoje' : diaMes(data)} às ${hora}`
}

export type IconeTempo = 'sun' | 'partly' | 'cloud' | 'drizzle' | 'rain' | 'storm'

/** A previsão da API não traz código de condição: estima-o pela chuva e pela probabilidade previstas. */
export function descreverTempo(precipitacaoMm = 0, probabilidade = 0): { rotulo: string; icone: IconeTempo } {
  if (precipitacaoMm >= 25) return { rotulo: 'Tempestade', icone: 'storm' }
  if (precipitacaoMm >= 2) return { rotulo: 'Chuva', icone: 'rain' }
  if (precipitacaoMm > 0) return { rotulo: 'Garoa', icone: 'drizzle' }
  if (probabilidade < 15) return { rotulo: 'Céu limpo', icone: 'sun' }
  if (probabilidade < 30) return { rotulo: 'Predominantemente limpo', icone: 'sun' }
  if (probabilidade < 50) return { rotulo: 'Parcialmente nublado', icone: 'partly' }
  return { rotulo: 'Nublado', icone: 'cloud' }
}

export type PontoAgregado = { inicio?: string; minimo?: number; media?: number; maximo?: number; quantidade?: number }
export type DiaHistorico = { data: string; tempMax?: number; tempMin?: number; chuva?: number }

/**
 * Reúne as séries diárias da estação (temperatura e precipitação) por data, sem o dia de hoje (incompleto).
 * A chuva do dia é a soma das leituras horárias: média × quantidade.
 */
export function montarHistorico(temperatura: PontoAgregado[], precipitacao: PontoAgregado[], hoje: string, fuso = FUSO): DiaHistorico[] {
  const dias = new Map<string, DiaHistorico>()
  const de = (iso?: string) => (iso ? dataNoFuso(iso, fuso) : undefined)
  for (const p of temperatura) {
    const d = de(p.inicio)
    if (d && d < hoje) dias.set(d, { ...dias.get(d), data: d, tempMax: p.maximo, tempMin: p.minimo })
  }
  for (const p of precipitacao) {
    const d = de(p.inicio)
    if (d && d < hoje) dias.set(d, { ...dias.get(d), data: d, chuva: p.media !== undefined && p.quantidade ? Math.round(p.media * p.quantidade * 10) / 10 : undefined })
  }
  return [...dias.values()].sort((a, b) => (a.data < b.data ? -1 : 1))
}

/**
 * Períodos do histórico que a estação já consegue preencher: o menor sempre fica disponível; os maiores só quando
 * há dias suficientes (a estação só tem leituras desde que foi criada).
 */
export function periodosDisponiveis(diasDisponiveis: number): ChavePeriodoClima[] {
  return periodosClima.filter((p, i) => i === 0 || diasDisponiveis >= p.dias).map(p => p.chave)
}
