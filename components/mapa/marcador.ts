import L from 'leaflet'

/** Marcador desenhado em CSS (evita os ícones de imagem do Leaflet, que quebram em bundlers). */
export const iconeDeMarcador = (cor = '#0b5d3b') =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${cor};border:3px solid #fff;box-shadow:0 0 0 2px ${cor},0 2px 6px rgba(0,0,0,.35)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
