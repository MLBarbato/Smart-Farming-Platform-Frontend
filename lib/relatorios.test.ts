import { describe, expect, it } from 'vitest'
import { diasNoPeriodo, nomeDoArquivo, somarDias, validarPeriodo } from './relatorios'

describe('período do relatório', () => {
  it('soma dias e conta o início e o fim', () => {
    expect(somarDias('2026-11-18', -29)).toBe('2026-10-20')
    expect(somarDias('2026-02-28', 1)).toBe('2026-03-01')
    expect(diasNoPeriodo('2026-11-01', '2026-11-01')).toBe(1)
    expect(diasNoPeriodo('2026-10-20', '2026-11-18')).toBe(30)
  })

  it('valida a ordem e o limite de 366 dias', () => {
    expect(validarPeriodo('2026-11-01', '2026-11-07')).toBeUndefined()
    expect(validarPeriodo('2026-11-07', '2026-11-01')).toMatch(/anterior/)
    expect(validarPeriodo('2025-01-02', '2026-01-02')).toBeUndefined()
    expect(validarPeriodo('2025-01-01', '2026-01-02')).toMatch(/366/)
    expect(validarPeriodo('', '2026-01-02')).toMatch(/Informe/)
  })
})

describe('nomeDoArquivo', () => {
  it('lê o nome codificado em UTF-8 ou o simples', () => {
    expect(nomeDoArquivo("attachment; filename*=UTF-8''relatorio-alertas-fazenda-8.csv", 'x.csv')).toBe('relatorio-alertas-fazenda-8.csv')
    expect(nomeDoArquivo('attachment; filename="relatorio.csv"', 'x.csv')).toBe('relatorio.csv')
    expect(nomeDoArquivo("attachment; filename=\"a.csv\"; filename*=UTF-8''relat%C3%B3rio.csv", 'x.csv')).toBe('relatório.csv')
  })

  it('usa o padrão sem cabeçalho', () => {
    expect(nomeDoArquivo(null, 'padrao.csv')).toBe('padrao.csv')
    expect(nomeDoArquivo('attachment', 'padrao.csv')).toBe('padrao.csv')
  })
})
