import { describe, expect, it } from 'vitest'
import { calcularIndicador, classificarSensor, condicaoDoTalhao, descreverIdade, dividirEmTrechos } from './monitoramento'

const agora = Date.parse('2026-11-18T12:00:00Z')
const ativo = { status: 'ATIVO', variavel: 'UMIDADE_SOLO', valor: 35, dataHora: '2026-11-18T11:50:00Z' } as const

describe('classificarSensor', () => {
  it('normal dentro da faixa', () => expect(classificarSensor(ativo, agora).estado).toBe('NORMAL'))
  it('crítico abaixo e acima da faixa', () => {
    expect(classificarSensor({ ...ativo, valor: 10 }, agora)).toEqual({ estado: 'CRITICO', desvio: 'abaixo' })
    expect(classificarSensor({ ...ativo, valor: 70 }, agora)).toEqual({ estado: 'CRITICO', desvio: 'acima' })
  })
  it('sem comunicação quando não há leitura ou ela é antiga', () => {
    expect(classificarSensor({ status: 'ATIVO', variavel: 'UMIDADE_SOLO' }, agora).estado).toBe('SEM_COMUNICACAO')
    expect(classificarSensor({ ...ativo, dataHora: '2026-11-18T08:00:00Z' }, agora).estado).toBe('SEM_COMUNICACAO')
    expect(classificarSensor({ ...ativo, dataHora: '2026-11-18T08:00:00Z' }, agora, 600).estado).toBe('NORMAL')
  })
  it('sensor inativo ou em manutenção é desativado', () => {
    expect(classificarSensor({ ...ativo, status: 'INATIVO' }, agora).estado).toBe('DESATIVADO')
    expect(classificarSensor({ ...ativo, status: 'MANUTENCAO' }, agora).estado).toBe('DESATIVADO')
  })
})

describe('condicaoDoTalhao', () => {
  it('alerta aberto ou sensor crítico', () => {
    expect(condicaoDoTalhao(['NORMAL'], 1)).toBe('ALERTA')
    expect(condicaoDoTalhao(['NORMAL', 'CRITICO'])).toBe('ALERTA')
  })
  it('normal com algum sensor normal; indisponível sem nenhum', () => {
    expect(condicaoDoTalhao(['NORMAL', 'SEM_COMUNICACAO'])).toBe('NORMAL')
    expect(condicaoDoTalhao(['SEM_COMUNICACAO', 'DESATIVADO'])).toBe('INDISPONIVEL')
    expect(condicaoDoTalhao([])).toBe('INDISPONIVEL')
  })
})

describe('dividirEmTrechos', () => {
  const h = 3600_000
  it('mantém um trecho só quando não há buracos', () => {
    expect(dividirEmTrechos([{ t: 0 }, { t: h }, { t: 2 * h }], 3 * h)).toHaveLength(1)
  })
  it('quebra a linha em intervalos longos e preserva pontos isolados', () => {
    const trechos = dividirEmTrechos([{ t: 0 }, { t: h }, { t: 10 * h }, { t: 20 * h }, { t: 21 * h }], 3 * h)
    expect(trechos.map(t => t.length)).toEqual([2, 1, 2])
  })
  it('série vazia não tem trechos', () => expect(dividirEmTrechos([], h)).toEqual([]))
})

describe('calcularIndicador', () => {
  const ag = Date.parse('2026-11-18T12:00:00Z')
  it('usa só os sensores com leitura recente quando há algum', () => {
    const r = calcularIndicador([
      { variavel: 'UMIDADE_SOLO', estado: 'NORMAL', valor: 30, dataHora: '2026-11-18T11:50:00Z' },
      { variavel: 'UMIDADE_SOLO', estado: 'SEM_COMUNICACAO', valor: 90, dataHora: '2026-11-16T10:00:00Z' },
    ], 'UMIDADE_SOLO', ag)
    expect(r).toMatchObject({ media: 30, n: 1, desatualizado: false, fora: false })
  })
  it('sem sensor recente, usa a última leitura conhecida e marca como desatualizado', () => {
    const r = calcularIndicador([
      { variavel: 'UMIDADE_SOLO', estado: 'SEM_COMUNICACAO', valor: 30, dataHora: '2026-11-16T12:00:00Z' },
      { variavel: 'UMIDADE_SOLO', estado: 'DESATIVADO', valor: 50, dataHora: '2026-11-17T12:00:00Z' },
    ], 'UMIDADE_SOLO', ag)
    expect(r).toMatchObject({ media: 40, n: 2, desatualizado: true, idadeMs: 24 * 3600_000 })
  })
  it('marca média fora da faixa esperada', () => {
    expect(calcularIndicador([{ variavel: 'UMIDADE_SOLO', estado: 'NORMAL', valor: 10, dataHora: '2026-11-18T11:55:00Z' }], 'UMIDADE_SOLO', ag)?.fora).toBe(true)
  })
  it('nulo quando não há nenhuma leitura da variável', () => {
    expect(calcularIndicador([{ variavel: 'UMIDADE_SOLO', estado: 'SEM_COMUNICACAO' }], 'UMIDADE_SOLO', ag)).toBeNull()
    expect(calcularIndicador([{ variavel: 'PH_SOLO', estado: 'NORMAL', valor: 6, dataHora: '2026-11-18T11:55:00Z' }], 'UMIDADE_SOLO', ag)).toBeNull()
  })
})

describe('descreverIdade', () => {
  it('escolhe a unidade adequada', () => {
    expect(descreverIdade(30_000)).toBe('há menos de 1 minuto')
    expect(descreverIdade(35 * 60_000)).toBe('há 35 minutos')
    expect(descreverIdade(3 * 3600_000)).toBe('há 3 horas')
    expect(descreverIdade(24 * 3600_000)).toBe('há 1 dia')
    expect(descreverIdade(50 * 3600_000)).toBe('há 2 dias')
  })
})
