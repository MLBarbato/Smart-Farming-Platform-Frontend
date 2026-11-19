import { describe, expect, it } from 'vitest'
import { niceTicks } from './monitoring-chart'

describe('niceTicks', () => {
  it('cobre todo o intervalo: o último valor nunca fica abaixo do máximo', () => {
    // caso real: leituras de 15 a 31 °C, o eixo parava em 30 e a linha saía do gráfico
    const t = niceTicks(14.5, 31.4)
    expect(t[0]).toBeLessThanOrEqual(14.5)
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(31.4)
  })
  it('vale para varreduras de valores', () => {
    for (let min = 0; min < 40; min += 3.7) {
      for (let max = min + 0.3; max < min + 60; max += 2.3) {
        const t = niceTicks(min, max)
        expect(t[0]).toBeLessThanOrEqual(min + 1e-6)
        expect(t[t.length - 1]).toBeGreaterThanOrEqual(max - 1e-6)
      }
    }
  })
  it('intervalo vazio ainda gera marcas', () => expect(niceTicks(5, 5).length).toBeGreaterThan(1))
})
