import type { components } from '@/lib/api/schema'

type Esquemas = components['schemas']

export type FazendaResponse = Esquemas['FazendaResponse']
export type FazendaRequest = Esquemas['FazendaRequest']
export type TalhaoResponse = Esquemas['TalhaoResponse']
export type TalhaoRequest = Esquemas['TalhaoRequest']
export type CulturaResponse = Esquemas['CulturaResponse']
export type PlantioResponse = Esquemas['PlantioResponse']
export type PlantioRequest = Esquemas['PlantioRequest']
export type ResumoGeralResponse = Esquemas['ResumoGeralResponse']
export type MapaFazendaResponse = Esquemas['MapaFazendaResponse']
export type TalhaoMapa = Esquemas['TalhaoMapa']
export type UsuarioResponse = Esquemas['UsuarioResponse']

export type StatusPlantio = 'PLANEJADO' | 'EM_CULTIVO' | 'COLHIDO' | 'CANCELADO'

export const rotuloStatusPlantio: Record<StatusPlantio, string> = {
  PLANEJADO: 'Planejado',
  EM_CULTIVO: 'Em cultivo',
  COLHIDO: 'Colhido',
  CANCELADO: 'Cancelado',
}
