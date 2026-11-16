'use client'

import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import type { FeatureGroup, Layer, Polygon as PolygonLayer } from 'leaflet'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { Marker, Polygon, useMap } from 'react-leaflet'
import { deLatLng, limites, paraLatLng, type Poligono } from '@/lib/geo'
import { MapaBase } from './base'
import { iconeDeMarcador } from './marcador'

/** Desenho do talhão: um único polígono, que pode ser redesenhado, editado e apagado. */
function Editor({ inicial, aoMudar }: { inicial?: Poligono | null; aoMudar: (p: Poligono | null) => void }) {
  const mapa = useMap()
  const grupo = useRef<FeatureGroup | null>(null)
  const aoMudarRef = useRef(aoMudar)
  useEffect(() => {
    aoMudarRef.current = aoMudar
  })

  useEffect(() => {
    mapa.pm.setLang('pt_br')
    mapa.pm.addControls({
      position: 'topleft',
      drawMarker: false, drawCircleMarker: false, drawPolyline: false, drawRectangle: true, drawCircle: false,
      drawText: false, drawPolygon: true, editMode: true, dragMode: false, cutPolygon: false, rotateMode: false,
      removalMode: true,
    })
    const camadas = L.featureGroup().addTo(mapa)
    grupo.current = camadas

    const atualizar = (camada: Layer) => {
      const aneis = (camada as PolygonLayer).getLatLngs() as L.LatLng[][]
      aoMudarRef.current(deLatLng(aneis[0]))
    }
    const registrar = (camada: Layer) => {
      camadas.addLayer(camada)
      camada.on('pm:edit', () => atualizar(camada))
      camada.on('pm:remove', () => {
        camadas.removeLayer(camada)
        aoMudarRef.current(null)
      })
    }
    if (inicial) {
      const existente = L.polygon(paraLatLng(inicial))
      registrar(existente)
    }
    const aoCriar = (e: { layer: Layer }) => {
      // só um polígono por talhão: o desenho novo substitui o anterior
      camadas.eachLayer(l => { if (l !== e.layer) camadas.removeLayer(l) })
      registrar(e.layer)
      atualizar(e.layer)
    }
    mapa.on('pm:create', aoCriar)
    return () => {
      mapa.off('pm:create', aoCriar)
      mapa.pm.removeControls()
      mapa.removeLayer(camadas)
    }
    // o polígono inicial só vale na abertura do editor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa])
  return null
}

export function EditorPoligono({
  inicial,
  contexto,
  ponto,
  aoMudar,
}: {
  inicial?: Poligono | null
  /** Outros talhões da fazenda, só como referência visual. */
  contexto: Poligono[]
  ponto?: [number, number] | null
  aoMudar: (p: Poligono | null) => void
}) {
  const area = limites([...(inicial ? [inicial] : []), ...contexto], ponto ? [ponto] : [])
  return (
    <MapaBase centro={!area && ponto ? ponto : undefined} limites={area} className="h-96 w-full">
      {ponto && <Marker position={ponto} icon={iconeDeMarcador()} />}
      {contexto.map((p, i) => (
        <Polygon key={i} positions={paraLatLng(p)} pathOptions={{ color: '#66736b', weight: 1, fillOpacity: 0.1, dashArray: '4' }} interactive={false} />
      ))}
      <Editor inicial={inicial} aoMudar={aoMudar} />
    </MapaBase>
  )
}
