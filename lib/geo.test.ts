import { describe, expect, it } from 'vitest'
import { areaHectares, deLatLng, ehPoligono, limites, paraLatLng, type Poligono } from './geo'

// Quadrado de ~1 km de lado perto de Rio Verde (GO): 0,009° de latitude ≈ 1 km.
const lat = -17.79
const dLat = 0.009
const dLon = 0.009 / Math.cos((lat * Math.PI) / 180)
const quadrado: Poligono = {
  type: 'Polygon',
  coordinates: [[[-50.92, lat], [-50.92 + dLon, lat], [-50.92 + dLon, lat + dLat], [-50.92, lat + dLat], [-50.92, lat]]],
}

describe('areaHectares', () => {
  it('calcula a área de um quadrado de cerca de 1 km (≈ 100 ha)', () => {
    expect(areaHectares(quadrado)).toBeGreaterThan(98)
    expect(areaHectares(quadrado)).toBeLessThan(102)
  })

  it('não depende do sentido do desenho', () => {
    const invertido: Poligono = { type: 'Polygon', coordinates: [[...quadrado.coordinates[0]].reverse()] }
    expect(areaHectares(invertido)).toBeCloseTo(areaHectares(quadrado), 6)
  })
})

describe('ehPoligono', () => {
  it('aceita um polígono GeoJSON e recusa o resto', () => {
    expect(ehPoligono(quadrado)).toBe(true)
    expect(ehPoligono(null)).toBe(false)
    expect(ehPoligono(undefined)).toBe(false)
    expect(ehPoligono({ type: 'Point', coordinates: [1, 2] })).toBe(false)
    expect(ehPoligono({ type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 0]]] })).toBe(false)
    expect(ehPoligono('Polygon')).toBe(false)
  })
})

describe('conversões com o Leaflet', () => {
  it('troca [lon, lat] por [lat, lon]', () => {
    expect(paraLatLng(quadrado)[0]).toEqual([lat, -50.92])
  })

  it('fecha o anel ao voltar do Leaflet e arredonda a 6 casas', () => {
    const poligono = deLatLng([{ lat: 1.1234567, lng: 2 }, { lat: 1, lng: 3 }, { lat: 2, lng: 3 }])
    const anel = poligono.coordinates[0]
    expect(anel).toHaveLength(4)
    expect(anel[0]).toEqual([2, 1.123457])
    expect(anel[3]).toEqual(anel[0])
  })

  it('não repete a primeira posição se o anel já está fechado', () => {
    const anel = deLatLng([{ lat: 0, lng: 0 }, { lat: 1, lng: 0 }, { lat: 1, lng: 1 }, { lat: 0, lng: 0 }]).coordinates[0]
    expect(anel).toHaveLength(4)
  })
})

describe('limites', () => {
  it('une polígonos e pontos em [[sul, oeste], [norte, leste]]', () => {
    const [[sul, oeste], [norte, leste]] = limites([quadrado], [[-10, -40]])!
    expect(sul).toBeCloseTo(lat)
    expect(oeste).toBeCloseTo(-50.92)
    expect(norte).toBe(-10)
    expect(leste).toBe(-40)
  })

  it('devolve nulo quando não há nada', () => {
    expect(limites([])).toBeNull()
  })
})
