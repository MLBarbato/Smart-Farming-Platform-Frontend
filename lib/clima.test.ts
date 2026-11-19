import { describe, expect, it } from 'vitest'
import { dataNoFuso, descreverTempo, diaDaSemana, diaMes, montarHistorico, periodosDisponiveis, rotuloHoraLeitura } from './clima'

describe('descreverTempo', () => {
  it('usa a chuva prevista primeiro', () => {
    expect(descreverTempo(30, 90).icone).toBe('storm')
    expect(descreverTempo(5, 80).icone).toBe('rain')
    expect(descreverTempo(0.5, 40).icone).toBe('drizzle')
  })
  it('sem chuva, depende da probabilidade', () => {
    expect(descreverTempo(0, 5).rotulo).toBe('Céu limpo')
    expect(descreverTempo(0, 40).rotulo).toBe('Parcialmente nublado')
    expect(descreverTempo(0, 70).rotulo).toBe('Nublado')
  })
})

describe('datas', () => {
  it('converte o instante para a data do fuso', () => {
    expect(dataNoFuso('2026-11-18T02:00:00Z')).toBe('2026-11-17')
    expect(dataNoFuso('2026-11-18T12:00:00Z')).toBe('2026-11-18')
  })
  it('formata dia da semana e dia/mês', () => {
    expect(diaDaSemana('2026-11-18')).toBe('Qua')
    expect(diaMes('2026-11-18')).toBe('18/11')
  })
})

describe('montarHistorico', () => {
  it('junta temperatura e chuva por dia, soma a chuva e descarta hoje', () => {
    const h = montarHistorico(
      [{ inicio: '2026-11-16T03:00:00Z', minimo: 18, maximo: 30 }, { inicio: '2026-11-18T03:00:00Z', minimo: 19, maximo: 25 }],
      [{ inicio: '2026-11-16T03:00:00Z', media: 0.5, quantidade: 24 }],
      '2026-11-18',
    )
    expect(h).toEqual([{ data: '2026-11-16', tempMax: 30, tempMin: 18, chuva: 12 }])
  })
})

describe('periodosDisponiveis', () => {
  it('o menor período fica sempre disponível', () => {
    expect(periodosDisponiveis(0)).toEqual(['7d'])
    expect(periodosDisponiveis(3)).toEqual(['7d'])
  })
  it('libera os maiores conforme há dias de histórico', () => {
    expect(periodosDisponiveis(7)).toEqual(['7d'])
    expect(periodosDisponiveis(15)).toEqual(['7d', '15d'])
    expect(periodosDisponiveis(30)).toEqual(['7d', '15d', '30d'])
  })
})

describe('rotuloHoraLeitura', () => {
  it('converte de UTC para o horário de Brasília', () => {
    expect(rotuloHoraLeitura('2026-11-18T20:00:00Z', '2026-11-18')).toBe('hoje às 17:00')
  })
  it('mostra a data quando não é hoje, inclusive na virada do dia', () => {
    expect(rotuloHoraLeitura('2026-11-18T02:00:00Z', '2026-11-18')).toBe('17/11 às 23:00')
  })
})
