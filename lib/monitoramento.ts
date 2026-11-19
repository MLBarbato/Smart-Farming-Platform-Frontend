import type { StatusSensor, VariavelMonitorada } from '@/lib/dados/tipos'

export type EstadoSensor = 'NORMAL' | 'CRITICO' | 'SEM_COMUNICACAO' | 'DESATIVADO'
export type CondicaoTalhao = 'NORMAL' | 'ALERTA' | 'INDISPONIVEL'

/** Faixa esperada por variável, na unidade fixa da variável. Futuro: parâmetros por cultura/talhão. */
export const faixaEsperada: Partial<Record<VariavelMonitorada, { min: number; max: number }>> = {
  UMIDADE_SOLO: { min: 20, max: 60 },
  TEMPERATURA_SOLO: { min: 15, max: 32 },
  TEMPERATURA_AR: { min: 10, max: 35 },
  PH_SOLO: { min: 5.5, max: 7 },
  UMIDADE_AR: { min: 40, max: 90 },
  CONDUTIVIDADE_ELETRICA: { min: 0.5, max: 2.5 },
  PRECIPITACAO: { min: 0, max: 50 },
  LUMINOSIDADE: { min: 0, max: 120000 },
}

export const PADRAO_SEM_LEITURA_MINUTOS = 120

export const periodos = [
  { chave: '24h', rotulo: '24 horas', horas: 24, intervalo: 'HORA', passoMs: 3600_000 },
  { chave: '7d', rotulo: '7 dias', horas: 24 * 7, intervalo: 'HORA', passoMs: 3600_000 },
  { chave: '30d', rotulo: '30 dias', horas: 24 * 30, intervalo: 'DIA', passoMs: 24 * 3600_000 },
] as const
export type ChavePeriodo = (typeof periodos)[number]['chave']

/**
 * Situação de um sensor: desativado (inativo ou em manutenção), sem comunicação (ativo, sem leitura ou com a
 * última mais antiga que o limite), crítico (fora da faixa esperada) ou normal.
 */
export function classificarSensor(
  s: { status?: StatusSensor; variavel?: VariavelMonitorada; valor?: number; dataHora?: string },
  agora: number,
  limiteMinutos = PADRAO_SEM_LEITURA_MINUTOS,
): { estado: EstadoSensor; desvio?: 'abaixo' | 'acima' } {
  if (s.status !== 'ATIVO') return { estado: 'DESATIVADO' }
  const quando = s.dataHora ? Date.parse(s.dataHora) : NaN
  if (s.valor === undefined || Number.isNaN(quando) || agora - quando > limiteMinutos * 60_000) return { estado: 'SEM_COMUNICACAO' }
  const faixa = s.variavel ? faixaEsperada[s.variavel] : undefined
  if (faixa && s.valor < faixa.min) return { estado: 'CRITICO', desvio: 'abaixo' }
  if (faixa && s.valor > faixa.max) return { estado: 'CRITICO', desvio: 'acima' }
  return { estado: 'NORMAL' }
}

export function condicaoDoTalhao(estados: EstadoSensor[], alertasAbertos = 0): CondicaoTalhao {
  if (alertasAbertos > 0 || estados.includes('CRITICO')) return 'ALERTA'
  if (estados.includes('NORMAL')) return 'NORMAL'
  return 'INDISPONIVEL'
}

/**
 * Divide uma série em trechos contínuos: um intervalo sem leituras maior que `limiteMs` interrompe a linha
 * (sensor sem comunicação), em vez de ligar com uma reta dois pontos distantes. Entrada ordenada por tempo.
 */
export function dividirEmTrechos<T extends { t: number }>(pontos: T[], limiteMs: number): T[][] {
  const trechos: T[][] = []
  for (const p of pontos) {
    const atual = trechos[trechos.length - 1]
    if (atual && p.t - atual[atual.length - 1].t <= limiteMs) atual.push(p)
    else trechos.push([p])
  }
  return trechos
}

export type EntradaIndicador = { variavel?: VariavelMonitorada; estado: EstadoSensor; valor?: number; dataHora?: string }
export type Indicador = { media: number; n: number; fora: boolean; desatualizado: boolean; idadeMs?: number }

/**
 * Média atual de uma variável. Usa os sensores com leitura recente; se nenhum tem, recorre à última leitura
 * conhecida de cada sensor e marca o resultado como desatualizado (com a idade da leitura mais recente), em vez de
 * esconder dados que existem. Sem nenhuma leitura, devolve `null`.
 */
export function calcularIndicador(entradas: EntradaIndicador[], variavel: VariavelMonitorada, agora: number): Indicador | null {
  const daVariavel = entradas.filter(e => e.variavel === variavel && e.valor !== undefined)
  const vivos = daVariavel.filter(e => e.estado === 'NORMAL' || e.estado === 'CRITICO')
  const desatualizado = vivos.length === 0
  const base = desatualizado ? daVariavel : vivos
  if (base.length === 0) return null
  const media = base.reduce((soma, e) => soma + (e.valor ?? 0), 0) / base.length
  const faixa = faixaEsperada[variavel]
  const maisRecente = Math.max(...base.map(e => (e.dataHora ? Date.parse(e.dataHora) : NaN)).filter(t => !Number.isNaN(t)))
  return {
    media,
    n: base.length,
    fora: !!faixa && (media < faixa.min || media > faixa.max),
    desatualizado,
    idadeMs: desatualizado && Number.isFinite(maisRecente) ? Math.max(0, agora - maisRecente) : undefined,
  }
}

/** "há 35 minutos", "há 3 horas", "há 2 dias". */
export function descreverIdade(ms: number): string {
  const minutos = Math.floor(ms / 60_000)
  if (minutos < 1) return 'há menos de 1 minuto'
  if (minutos < 60) return `há ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`
  const dias = Math.floor(horas / 24)
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}
