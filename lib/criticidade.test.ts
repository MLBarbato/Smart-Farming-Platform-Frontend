import { describe, expect, it } from 'vitest'
import { corDaCriticidade, rotuloDaSituacao } from './criticidade'

describe('criticidade', () => {
  it('a cor segue a maior criticidade de alerta aberto', () => {
    expect(corDaCriticidade(null)).toBe('#16a34a')
    expect(corDaCriticidade(undefined)).toBe('#16a34a')
    expect(corDaCriticidade('BAIXA')).toBe('#ca8a04')
    expect(corDaCriticidade('MEDIA')).toBe('#ea580c')
    expect(corDaCriticidade('ALTA')).toBe('#dc2626')
  })

  it('o rótulo complementa a cor (não depende só dela)', () => {
    expect(rotuloDaSituacao(null)).toBe('Saudável')
    expect(rotuloDaSituacao('BAIXA')).toBe('Atenção')
    expect(rotuloDaSituacao('MEDIA')).toBe('Atenção')
    expect(rotuloDaSituacao('ALTA')).toBe('Crítico')
  })
})
