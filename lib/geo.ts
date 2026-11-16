/** Utilitários de GeoJSON para talhões. Coordenadas no padrão do backend: [longitude, latitude]. */

export type Posicao = [number, number]
export type Poligono = { type: 'Polygon'; coordinates: Posicao[][] }

const RAIO_TERRA_M = 6_371_008.8

export function ehPoligono(valor: unknown): valor is Poligono {
  const p = valor as Poligono | null
  return (
    !!p && p.type === 'Polygon' && Array.isArray(p.coordinates) && Array.isArray(p.coordinates[0]) &&
    p.coordinates[0].length >= 4 && p.coordinates[0].every(c => Array.isArray(c) && c.length >= 2)
  )
}

/** Área aproximada (esfera) em hectares, considerando só o anel externo. */
export function areaHectares(poligono: Poligono): number {
  const anel = poligono.coordinates[0]
  let soma = 0
  for (let i = 0; i < anel.length - 1; i++) {
    const [lon1, lat1] = anel[i]
    const [lon2, lat2] = anel[i + 1]
    soma += ((lon2 - lon1) * Math.PI) / 180 * (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180))
  }
  const metros2 = Math.abs((soma * RAIO_TERRA_M * RAIO_TERRA_M) / 2)
  return metros2 / 10_000
}

/** [[sul, oeste], [norte, leste]] que contém todos os polígonos e pontos, ou nulo se não há nada. */
export function limites(poligonos: Poligono[], pontos: [number, number][] = []): [[number, number], [number, number]] | null {
  const lats: number[] = pontos.map(p => p[0])
  const lons: number[] = pontos.map(p => p[1])
  for (const p of poligonos) for (const [lon, lat] of p.coordinates[0]) { lats.push(lat); lons.push(lon) }
  if (lats.length === 0) return null
  return [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]]
}

/** Para o Leaflet, que usa [latitude, longitude]. */
export function paraLatLng(poligono: Poligono): [number, number][] {
  return poligono.coordinates[0].map(([lon, lat]) => [lat, lon])
}

/** Do Leaflet para GeoJSON, com o anel fechado (primeira posição repetida no fim). */
export function deLatLng(pontos: { lat: number; lng: number }[]): Poligono {
  const anel: Posicao[] = pontos.map(p => [Number(p.lng.toFixed(6)), Number(p.lat.toFixed(6))])
  const [primeiro] = anel
  const ultimo = anel[anel.length - 1]
  if (primeiro && (primeiro[0] !== ultimo[0] || primeiro[1] !== ultimo[1])) anel.push([...primeiro])
  return { type: 'Polygon', coordinates: [anel] }
}

export const MAX_POSICOES = 1000
