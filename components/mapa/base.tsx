'use client'

import 'leaflet/dist/leaflet.css'
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'
import { useEffect, type ReactNode } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'

/** Brasil inteiro, para quando ainda não há nada a mostrar. */
const CENTRO_PADRAO: LatLngExpression = [-14.2, -51.9]

function AjustarLimites({ limites }: { limites?: LatLngBoundsExpression | null }) {
  const mapa = useMap()
  useEffect(() => {
    if (limites) mapa.fitBounds(limites, { padding: [24, 24], maxZoom: 16 })
  }, [mapa, limites])
  return null
}

/** Mapa OpenStreetMap (a atribuição é exigida pela licença dos tiles). */
export function MapaBase({
  centro,
  zoom = 4,
  limites,
  className = 'h-80 w-full',
  children,
}: {
  centro?: LatLngExpression
  zoom?: number
  limites?: LatLngBoundsExpression | null
  className?: string
  children?: ReactNode
}) {
  return (
    <MapContainer center={centro ?? CENTRO_PADRAO} zoom={centro ? 13 : zoom} scrollWheelZoom className={`${className} z-0 rounded-lg`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarLimites limites={limites} />
      {children}
    </MapContainer>
  )
}
