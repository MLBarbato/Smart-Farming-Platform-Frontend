'use client'

import { Marker, useMapEvents } from 'react-leaflet'
import { MapaBase } from './base'
import { iconeDeMarcador } from './marcador'

function Cliques({ aoEscolher }: { aoEscolher: (lat: number, lon: number) => void }) {
  useMapEvents({ click: e => aoEscolher(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))) })
  return null
}

/** Clique no mapa para escolher a localização da fazenda (latitude e longitude). */
export function SeletorPonto({
  valor,
  aoEscolher,
}: {
  valor?: [number, number] | null
  aoEscolher: (lat: number, lon: number) => void
}) {
  return (
    <MapaBase centro={valor ?? undefined} limites={valor ? [valor, valor] : null} className="h-64 w-full">
      <Cliques aoEscolher={aoEscolher} />
      {valor && <Marker position={valor} icon={iconeDeMarcador()} />}
    </MapaBase>
  )
}
