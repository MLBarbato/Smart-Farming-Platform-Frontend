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

export type ResumoFazendaResponse = Esquemas['ResumoFazendaResponse']
export type PrevisaoFazendaResponse = Esquemas['PrevisaoFazendaResponse']
export type LeituraAgregadaResponse = Esquemas['LeituraAgregadaResponse']
export type AlertaResponse = Esquemas['AlertaResponse']
export type PaginaAlertas = Esquemas['PaginaResponseAlertaResponse']

export type SensorResponse = Esquemas['SensorResponse']
export type SensorRequest = Esquemas['SensorRequest']
export type SensorLeituraAtualResponse = Esquemas['SensorLeituraAtualResponse']
export type VariavelMonitorada = NonNullable<SensorRequest['variavel']>
export type StatusSensor = NonNullable<SensorResponse['status']>

export const rotuloVariavel: Record<VariavelMonitorada, string> = {
  TEMPERATURA_AR: 'Temperatura do ar',
  UMIDADE_AR: 'Umidade do ar',
  UMIDADE_SOLO: 'Umidade do solo',
  LUMINOSIDADE: 'Luminosidade',
  PH_SOLO: 'pH do solo',
  VELOCIDADE_VENTO: 'Velocidade do vento',
  PRECIPITACAO: 'Precipitação',
  TEMPERATURA_SOLO: 'Temperatura do solo',
  CONDUTIVIDADE_ELETRICA: 'Condutividade elétrica',
}

export const rotuloStatusSensor: Record<StatusSensor, string> = { ATIVO: 'Ativo', INATIVO: 'Inativo', MANUTENCAO: 'Manutenção' }

export type EstacaoResponse = Esquemas['EstacaoResponse']

export type RecomendacaoIrrigacao = Esquemas['RecomendacaoIrrigacaoResponse']
export type PaginaRecomendacoes = Esquemas['PaginaResponseRecomendacaoIrrigacaoResponse']
export type SituacaoIrrigacao = NonNullable<RecomendacaoIrrigacao['situacao']>

export const rotuloSituacaoIrrigacao: Record<SituacaoIrrigacao, string> = {
  IRRIGAR: 'Irrigar',
  AGUARDAR_CHUVA: 'Aguardar chuva',
  NAO_IRRIGAR: 'Não irrigar',
  SEM_DADOS_SUFICIENTES: 'Sem dados suficientes',
}

export type StatusAlerta = NonNullable<AlertaResponse['status']>
export type EventoAlerta = NonNullable<AlertaResponse['evento']>
export type CriticidadeAlerta = NonNullable<AlertaResponse['criticidade']>

export const rotuloStatusAlerta: Record<StatusAlerta, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em atendimento',
  RESOLVIDO: 'Resolvido',
  DISPENSADO: 'Dispensado',
}

export const rotuloEventoAlerta: Record<EventoAlerta, string> = {
  SECA: 'Seca',
  EXCESSO_PRECIPITACAO: 'Excesso de chuva',
  RISCO_GEADA: 'Risco de geada',
  FALHA_SENSOR: 'Falha de sensor',
}
