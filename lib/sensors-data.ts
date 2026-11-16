// ⚠️ DADOS SIMULADOS — ainda não há dispositivos físicos integrados.
// Os tipos abaixo espelham as futuras entidades do backend:
//   Device (Dispositivo) 1—N Sensor 1—N Reading (Leitura)
// Ao integrar, basta substituir os `get*` por chamadas à API.

export type SensorStatus = 'ATIVO' | 'INATIVO' | 'ALERTA' | 'FALHA'

export type Sensor = {
  id: number
  deviceId: number
  name: string
  measurement: string
  unit: string
}

export type Device = {
  id: number
  code: string // identificação do dispositivo (ex.: DEV-001)
  name: string
  model: string
  farm: string
  field: string
  status: SensorStatus
  sensors: Sensor[]
}

export type Reading = { id: number; sensorId: number; value: number; readAt: string } // readAt: ISO local, sem fuso

export const statusLabel: Record<SensorStatus, string> = { ATIVO: 'Ativo', INATIVO: 'Inativo', ALERTA: 'Alerta', FALHA: 'Falha' }
export const sensorStatuses = Object.keys(statusLabel) as SensorStatus[]

// Catálogos
export const measurements: Record<string, string[]> = {
  'Umidade do solo': ['%', 'm³/m³'],
  'Temperatura do solo': ['°C', '°F'],
  'Temperatura do ar': ['°C', '°F'],
  'pH': ['pH'],
  'Umidade do ar': ['%'],
  'Condutividade elétrica': ['dS/m', 'mS/cm'],
  'Precipitação': ['mm'],
  'Luminosidade': ['lux', 'W/m²'],
}
export const measurementTypes = Object.keys(measurements)
export const deviceModels = ['Estação de solo SF-100', 'Estação meteorológica SF-200', 'Nó LoRa SF-Mini', 'Pluviômetro SF-R1']

export const fieldsByFarm: Record<string, string[]> = {
  'Fazenda Santa Maria': ['Talhão A1', 'Talhão A2', 'Talhão B1'],
  'Fazenda Boa Esperança': ['Talhão 01', 'Talhão 02'],
  'Sítio Água Limpa': ['Talhão Café 1', 'Talhão Café 2'],
}
export const farms = Object.keys(fieldsByFarm)
export const allFields = Array.from(new Set(Object.values(fieldsByFarm).flat()))

// Dados fictícios
export const initialDevices: Device[] = [
  { id: 1, code: 'DEV-001', name: 'Estação A1 Norte', model: 'Estação de solo SF-100', farm: 'Fazenda Santa Maria', field: 'Talhão A1', status: 'ATIVO', sensors: [
    { id: 101, deviceId: 1, name: 'Umidade 20 cm', measurement: 'Umidade do solo', unit: '%' },
    { id: 102, deviceId: 1, name: 'Temperatura do solo', measurement: 'Temperatura do solo', unit: '°C' },
    { id: 103, deviceId: 1, name: 'pH do solo', measurement: 'pH', unit: 'pH' },
  ] },
  { id: 2, code: 'DEV-002', name: 'Estação A2 Córrego', model: 'Estação de solo SF-100', farm: 'Fazenda Santa Maria', field: 'Talhão A2', status: 'ALERTA', sensors: [
    { id: 201, deviceId: 2, name: 'Umidade 20 cm', measurement: 'Umidade do solo', unit: '%' },
    { id: 202, deviceId: 2, name: 'Condutividade', measurement: 'Condutividade elétrica', unit: 'dS/m' },
  ] },
  { id: 3, code: 'DEV-003', name: 'Meteorológica Sede', model: 'Estação meteorológica SF-200', farm: 'Fazenda Santa Maria', field: 'Talhão B1', status: 'ATIVO', sensors: [
    { id: 301, deviceId: 3, name: 'Temperatura do ar', measurement: 'Temperatura do ar', unit: '°C' },
    { id: 302, deviceId: 3, name: 'Umidade do ar', measurement: 'Umidade do ar', unit: '%' },
    { id: 303, deviceId: 3, name: 'Pluviômetro', measurement: 'Precipitação', unit: 'mm' },
  ] },
  { id: 4, code: 'DEV-004', name: 'Nó 01 Entrada', model: 'Nó LoRa SF-Mini', farm: 'Fazenda Boa Esperança', field: 'Talhão 01', status: 'ATIVO', sensors: [
    { id: 401, deviceId: 4, name: 'Umidade 15 cm', measurement: 'Umidade do solo', unit: '%' },
  ] },
  { id: 5, code: 'DEV-005', name: 'Nó 02 Divisa', model: 'Nó LoRa SF-Mini', farm: 'Fazenda Boa Esperança', field: 'Talhão 02', status: 'FALHA', sensors: [
    { id: 501, deviceId: 5, name: 'Umidade 15 cm', measurement: 'Umidade do solo', unit: '%' },
    { id: 502, deviceId: 5, name: 'Temperatura do solo', measurement: 'Temperatura do solo', unit: '°C' },
  ] },
  { id: 6, code: 'DEV-006', name: 'Pluviômetro Café 1', model: 'Pluviômetro SF-R1', farm: 'Sítio Água Limpa', field: 'Talhão Café 1', status: 'ATIVO', sensors: [
    { id: 601, deviceId: 6, name: 'Chuva acumulada', measurement: 'Precipitação', unit: 'mm' },
  ] },
  { id: 7, code: 'DEV-007', name: 'Estação Café 2', model: 'Estação de solo SF-100', farm: 'Sítio Água Limpa', field: 'Talhão Café 2', status: 'INATIVO', sensors: [
    { id: 701, deviceId: 7, name: 'Umidade 20 cm', measurement: 'Umidade do solo', unit: '%' },
    { id: 702, deviceId: 7, name: 'pH do solo', measurement: 'pH', unit: 'pH' },
  ] },
]

// Estado de cada sensor simulado: valor base, oscilação, última leitura e status individual.
const seed: Record<number, { base: number; amp: number; lastAt: string; status: SensorStatus }> = {
  101: { base: 32, amp: 3, lastAt: '2026-11-12T09:58', status: 'ATIVO' },
  102: { base: 24.5, amp: 1.5, lastAt: '2026-11-12T09:58', status: 'ATIVO' },
  103: { base: 6.3, amp: 0.2, lastAt: '2026-11-12T09:58', status: 'ATIVO' },
  201: { base: 14, amp: 2, lastAt: '2026-11-12T09:55', status: 'ALERTA' },
  202: { base: 1.8, amp: 0.3, lastAt: '2026-11-12T09:55', status: 'ATIVO' },
  301: { base: 28, amp: 2.5, lastAt: '2026-11-12T09:57', status: 'ATIVO' },
  302: { base: 61, amp: 6, lastAt: '2026-11-12T09:57', status: 'ATIVO' },
  303: { base: 0.4, amp: 0.4, lastAt: '2026-11-12T09:57', status: 'ATIVO' },
  401: { base: 38, amp: 3, lastAt: '2026-11-12T09:50', status: 'ATIVO' },
  501: { base: 22, amp: 2, lastAt: '2026-11-11T18:20', status: 'FALHA' },
  502: { base: 26, amp: 1, lastAt: '2026-11-11T18:20', status: 'FALHA' },
  601: { base: 1.2, amp: 1, lastAt: '2026-11-12T09:40', status: 'ATIVO' },
  701: { base: 30, amp: 2, lastAt: '2026-11-05T14:00', status: 'INATIVO' },
  702: { base: 5.9, amp: 0.2, lastAt: '2026-11-05T14:00', status: 'INATIVO' },
}

export function getSensorStatus(sensorId: number, device: Device): SensorStatus {
  if (device.status === 'INATIVO') return 'INATIVO'
  const own = seed[sensorId]?.status
  return own && own !== 'INATIVO' ? own : 'ATIVO'
}

// Referência de "agora" fixa (simulação) — evita divergência entre servidor e navegador.
export const NOW = '2026-11-12T10:00'

const toMin = (iso: string) => { const [d, t] = iso.split('T'); const [y, mo, da] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number); return Date.UTC(y, mo - 1, da, h, mi) / 60000 }
const toIso = (min: number) => { const dt = new Date(min * 60000); const p = (n: number) => String(n).padStart(2, '0'); return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}T${p(dt.getUTCHours())}:${p(dt.getUTCMinutes())}` }
export const minutesOf = toMin
export const isoOf = toIso

/** Valor simulado determinístico de um sensor em um instante (ciclo diário + oscilação). */
function valueAt(sensorId: number, min: number): number {
  const s = seed[sensorId]
  const h = min / 60
  const v = s.base + s.amp * (0.7 * Math.sin((2 * Math.PI * h) / 24 + sensorId) + 0.3 * Math.sin(h * 0.37 + sensorId * 3))
  return Number(Math.max(0, v).toFixed(s.base < 10 && s.amp < 1 && s.base > 4 ? 2 : 1))
}

/** Leituras recentes simuladas (mais recente primeiro). Futuro: GET /sensores/:id/leituras */
export function getReadings(sensorId: number, limit = 6): Reading[] {
  const s = seed[sensorId]
  if (!s) return []
  const last = toMin(s.lastAt)
  return Array.from({ length: limit }, (_, i) => ({ id: sensorId * 100 + i, sensorId, value: valueAt(sensorId, last - i * 30), readAt: toIso(last - i * 30) }))
}

export const getLastReading = (sensorId: number): Reading | null => getReadings(sensorId, 1)[0] ?? null

/** Série histórica (ordem cronológica) dentro da janela [NOW - hours, NOW]. Futuro: GET /sensores/:id/leituras?de=&ate= */
export function getSeries(sensorId: number, hours: number, stepMinutes: number): Reading[] {
  const s = seed[sensorId]
  if (!s) return []
  const last = toMin(s.lastAt), from = toMin(NOW) - hours * 60
  const out: Reading[] = []
  for (let m = Math.ceil(from / stepMinutes) * stepMinutes; m <= last; m += stepMinutes) out.push({ id: sensorId * 100000 + m, sensorId, value: valueAt(sensorId, m), readAt: toIso(m) })
  if (last >= from && out[out.length - 1]?.readAt !== s.lastAt) out.push({ id: sensorId * 100000 + last, sensorId, value: valueAt(sensorId, last), readAt: s.lastAt })
  return out
}

export function formatReadAt(iso: string) {
  const [d, t] = iso.split('T'); const [, mo, da] = d.split('-')
  return `${da}/${mo} ${t}`
}
