import { describe, expect, it } from 'vitest'
import { acoesDoPlantio, hojeIso, safraDaData, safraValida } from './plantio'

describe('safra', () => {
  it('valida AAAA/AAAA com anos consecutivos', () => {
    expect(safraValida('2026/2027')).toBe(true)
    expect(safraValida(' 2026/2027 ')).toBe(true)
    expect(safraValida('2026/27')).toBe(false)
    expect(safraValida('2026/2028')).toBe(false)
    expect(safraValida('2027/2026')).toBe(false)
    expect(safraValida('')).toBe(false)
  })

  it('o ano-safra começa em julho, como no backend', () => {
    expect(safraDaData('2026-10-05')).toBe('2026/2027')
    expect(safraDaData('2026-07-01')).toBe('2026/2027')
    expect(safraDaData('2026-06-30')).toBe('2025/2026')
    expect(safraDaData('2027-03-10')).toBe('2026/2027')
  })
})

describe('hojeIso', () => {
  it('usa a data local, sem converter para UTC', () => {
    expect(hojeIso(new Date(2026, 10, 16, 23, 30))).toBe('2026-11-16')
    expect(hojeIso(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05')
  })
})

describe('acoesDoPlantio', () => {
  it('espelha as transições do backend', () => {
    expect(acoesDoPlantio('PLANEJADO')).toMatchObject({ iniciar: true, colher: false, editar: true, cancelar: true, excluir: true })
    expect(acoesDoPlantio('EM_CULTIVO')).toMatchObject({ iniciar: false, colher: true, editar: true, cancelar: true, excluir: false })
    expect(acoesDoPlantio('COLHIDO')).toMatchObject({ corrigirColheita: true, editar: false, cancelar: false, excluir: false })
    expect(acoesDoPlantio('CANCELADO')).toEqual({ iniciar: false, colher: false, editar: false, cancelar: false, excluir: false, corrigirColheita: false })
  })
})
