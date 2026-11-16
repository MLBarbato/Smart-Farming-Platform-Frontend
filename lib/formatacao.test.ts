import { describe, expect, it } from 'vitest'
import { formatarCoordenada, formatarData, formatarNumero, lerNumero } from './formatacao'

describe('lerNumero', () => {
  it('lê o formato brasileiro e o simples', () => {
    expect(lerNumero('1.240,5')).toBe(1240.5)
    expect(lerNumero('48,75')).toBe(48.75)
    expect(lerNumero('1200.5')).toBe(1200.5)
    expect(lerNumero('-17.7923')).toBe(-17.7923)
    expect(lerNumero('  10 ')).toBe(10)
  })

  it('vazio ou inválido dá undefined', () => {
    expect(lerNumero('')).toBeUndefined()
    expect(lerNumero('   ')).toBeUndefined()
    expect(lerNumero('abc')).toBeUndefined()
    expect(lerNumero('1,2,3')).toBeUndefined()
  })
})

describe('formatação', () => {
  it('formata números no padrão brasileiro e trata ausência', () => {
    expect(formatarNumero(1240.5)).toBe('1.240,5')
    expect(formatarNumero(6000, 0)).toBe('6.000')
    expect(formatarNumero(45.04, 1)).toBe('45,0')
    expect(formatarNumero(undefined)).toBe('—')
    expect(formatarNumero(null)).toBe('—')
  })

  it('formata datas sem passar por fuso', () => {
    expect(formatarData('2026-11-16')).toBe('16/11/2026')
    expect(formatarData('2026-11-16T03:00:00Z')).toBe('16/11/2026')
    expect(formatarData(null)).toBe('—')
  })

  it('formata coordenadas com 5 casas e vírgula', () => {
    expect(formatarCoordenada(-17.79234)).toBe('-17,79234')
    expect(formatarCoordenada(undefined)).toBe('—')
  })
})
