// ⚠️ DADOS SIMULADOS — nenhum dispositivo físico está integrado.
// Entidades envolvidas na futura integração: Talhao, Sensor, Leitura (ver lib/sensors-data.ts).
// Dados meteorológicos externos (ex.: Open-Meteo) NÃO fazem parte deste módulo: não são leituras de sensores.

import { Device, Reading, Sensor, NOW, fieldsByFarm, getLastReading, initialDevices, measurements, minutesOf } from '@/lib/sensors-data'

export type Talhao = { name: string; farm: string }
export type SensorState = 'NORMAL' | 'CRITICO' | 'SEM_COMUNICACAO'
export type FieldCondition = 'NORMAL' | 'ALERTA' | 'INDISPONIVEL'

/** Faixa esperada por tipo de medição, na unidade padrão do tipo. Futuro: parâmetros por cultura/talhão. */
export const expectedRange: Record<string, { min: number; max: number }> = {
  'Umidade do solo': { min: 20, max: 60 },
  'Temperatura do solo': { min: 15, max: 32 },
  'Temperatura do ar': { min: 10, max: 35 },
  'pH': { min: 5.5, max: 7 },
  'Umidade do ar': { min: 40, max: 90 },
  'Condutividade elétrica': { min: 0.5, max: 2.5 },
  'Precipitação': { min: 0, max: 50 },
  'Luminosidade': { min: 0, max: 120000 },
}

/** Sem leitura há mais que isso = sem comunicação. */
export const COMM_TIMEOUT_MIN = 120

export const talhoes: Talhao[] = Object.entries(fieldsByFarm).flatMap(([farm, names]) => names.map(name => ({ name, farm })))
export const devices: Device[] = initialDevices

export type SensorEntry = {
  device: Device
  sensor: Sensor
  last: Reading | null
  state: SensorState
  /** Direção do desvio quando crítico. */
  deviation?: 'abaixo' | 'acima'
}

export function classify(device: Device, sensor: Sensor): SensorEntry {
  const last = getLastReading(sensor.id)
  const stale = !last || minutesOf(NOW) - minutesOf(last.readAt) > COMM_TIMEOUT_MIN
  if (device.status === 'INATIVO' || device.status === 'FALHA' || stale) return { device, sensor, last, state: 'SEM_COMUNICACAO' }
  const range = expectedRange[sensor.measurement]
  // Faixa definida na unidade padrão; outras unidades não são avaliadas.
  if (range && last && sensor.unit === measurements[sensor.measurement][0]) {
    if (last.value < range.min) return { device, sensor, last, state: 'CRITICO', deviation: 'abaixo' }
    if (last.value > range.max) return { device, sensor, last, state: 'CRITICO', deviation: 'acima' }
  }
  return { device, sensor, last, state: 'NORMAL' }
}

export const allEntries: SensorEntry[] = devices.flatMap(d => d.sensors.map(s => classify(d, s)))

export function fieldCondition(entries: SensorEntry[]): FieldCondition {
  if (entries.some(e => e.state === 'CRITICO')) return 'ALERTA'
  if (entries.some(e => e.state === 'NORMAL')) return 'NORMAL'
  return 'INDISPONIVEL'
}

export const periods = [
  { key: '24h', label: '24 horas', hours: 24, step: 30 },
  { key: '7d', label: '7 dias', hours: 24 * 7, step: 120 },
  { key: '30d', label: '30 dias', hours: 24 * 30, step: 360 },
] as const
export type PeriodKey = (typeof periods)[number]['key']
