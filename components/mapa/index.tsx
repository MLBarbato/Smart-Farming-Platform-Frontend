'use client'

import dynamic from 'next/dynamic'
import { Carregando } from '@/components/ui/estados'

const carregando = () => <Carregando texto="Carregando mapa..." />

/** Os mapas usam `window`; por isso só são carregados no navegador. */
export const MapaFazenda = dynamic(() => import('./mapa-fazenda').then(m => m.MapaFazenda), { ssr: false, loading: carregando })
export const SeletorPonto = dynamic(() => import('./seletor-ponto').then(m => m.SeletorPonto), { ssr: false, loading: carregando })
export const EditorPoligono = dynamic(() => import('./editor-poligono').then(m => m.EditorPoligono), { ssr: false, loading: carregando })
export type { TalhaoNoMapa } from './mapa-fazenda'
