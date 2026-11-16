'use client'

import { Marker, Polygon, Popup, Tooltip } from 'react-leaflet'
import { limites, paraLatLng, type Poligono } from '@/lib/geo'
import { MapaBase } from './base'
import { iconeDeMarcador } from './marcador'

export type TalhaoNoMapa = {
  id: number
  identificacao: string
  geometria?: Poligono | null
  cor: string
  linhas: string[]
}

/** Fazenda (marcador) e talhões (polígonos coloridos); ao passar o mouse, um cartão identifica o talhão. */
export function MapaFazenda({
  ponto,
  talhoes,
  selecionadoId,
  aoSelecionar,
  className,
}: {
  ponto?: [number, number] | null
  talhoes: TalhaoNoMapa[]
  selecionadoId?: number | null
  aoSelecionar?: (id: number) => void
  className?: string
}) {
  const desenhados = talhoes.filter(t => t.geometria)
  const area = limites(desenhados.map(t => t.geometria as Poligono), ponto ? [ponto] : [])
  return (
    <MapaBase centro={!area && ponto ? ponto : undefined} limites={area} className={className}>
      {ponto && <Marker position={ponto} icon={iconeDeMarcador()} />}
      {desenhados.map(t => (
        <Polygon
          key={t.id}
          positions={paraLatLng(t.geometria as Poligono)}
          pathOptions={{ color: t.cor, weight: selecionadoId === t.id ? 4 : 2, fillColor: t.cor, fillOpacity: selecionadoId === t.id ? 0.5 : 0.3 }}
          eventHandlers={{ click: () => aoSelecionar?.(t.id) }}
        >
          <Tooltip sticky>
            <strong>{t.identificacao}</strong>
            {t.linhas.map(l => <div key={l}>{l}</div>)}
          </Tooltip>
          <Popup>
            <strong>{t.identificacao}</strong>
            {t.linhas.map(l => <div key={l}>{l}</div>)}
          </Popup>
        </Polygon>
      ))}
    </MapaBase>
  )
}
