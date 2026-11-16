// ⚠️ DADOS SIMULADOS — nenhuma chamada à API Open-Meteo é feita ainda.
// Estes dados são METEOROLÓGICOS EXTERNOS (modelo/reanálise), NÃO medições de sensores físicos.
//
// Mapeamento para a futura integração (https://open-meteo.com/en/docs):
//   current : temperature_2m, relative_humidity_2m, precipitation_probability, wind_speed_10m, weather_code
//   daily   : temperature_2m_max, temperature_2m_min, precipitation_sum, precipitation_probability_max, weather_code
//   histórico: parâmetro past_days (ou API de arquivo histórico)
// A consulta usa a latitude/longitude cadastradas na fazenda. Ao integrar, substitua os `get*` por chamadas à API.

import { NOW } from '@/lib/sensors-data'

export type FarmLocation = { farm: string; city: string; state: string; latitude: number; longitude: number; timezone: string }

export type CurrentWeather = {
  time: string // ISO local
  temperature: number // °C — temperature_2m (AR, a 2 m)
  humidity: number // % — relative_humidity_2m (AR)
  precipitationProbability: number // %
  windSpeed: number // km/h — wind_speed_10m
  weatherCode: number // código WMO
}

export type DailyWeather = {
  date: string // YYYY-MM-DD
  tempMax: number // °C (ar)
  tempMin: number // °C (ar)
  precipitationSum: number // mm
  precipitationProbabilityMax: number // %
  weatherCode: number
}

export const WEATHER_SOURCE = { name: 'Open-Meteo', url: 'https://open-meteo.com', simulated: true }
export const LAST_UPDATE = '2026-11-12T09:45'

// Coordenadas fictícias associadas às fazendas (futuro: campos latitude/longitude do cadastro da fazenda).
export const farmLocations: FarmLocation[] = [
  { farm: 'Fazenda Santa Maria', city: 'Rio Verde', state: 'GO', latitude: -17.7923, longitude: -50.9192, timezone: 'America/Sao_Paulo' },
  { farm: 'Fazenda Boa Esperança', city: 'Sorriso', state: 'MT', latitude: -12.5425, longitude: -55.7211, timezone: 'America/Cuiaba' },
  { farm: 'Sítio Água Limpa', city: 'Patos de Minas', state: 'MG', latitude: -18.5789, longitude: -46.5181, timezone: 'America/Sao_Paulo' },
]

export const climatePeriods = [
  { key: '7d', label: '7 dias', days: 7 },
  { key: '15d', label: '15 dias', days: 15 },
  { key: '30d', label: '30 dias', days: 30 },
] as const
export type ClimatePeriodKey = (typeof climatePeriods)[number]['key']

export const FORECAST_DAYS = 7

// ---------- utilidades de data (sem fuso, determinísticas) ----------
const TODAY = NOW.slice(0, 10)
export function addDays(date: string, n: number) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const weekday = (date: string) => WEEKDAYS[new Date(date + 'T00:00:00Z').getUTCDay()]
export const fmtDay = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`
export const today = () => TODAY

// ---------- geração simulada ----------
const rnd = (seed: number, offset: number, salt: number) => { const x = Math.sin(offset * 12.9898 + seed * 78.233 + salt * 37.719) * 43758.5453; return x - Math.floor(x) }

function codeFor(prob: number, precip: number) {
  if (precip >= 25) return 95
  if (precip >= 8) return 63
  if (precip >= 2) return 61
  if (precip > 0) return 51
  return prob < 15 ? 0 : prob < 30 ? 1 : prob < 50 ? 2 : 3
}

function day(farm: string, offset: number): DailyWeather {
  const i = Math.max(0, farmLocations.findIndex(f => f.farm === farm))
  const baseMax = [31, 33, 29][i], baseMin = [20, 22, 18][i]
  const r = rnd(i, offset, 1), r2 = rnd(i, offset, 2), r3 = rnd(i, offset, 3)
  const rainy = r > 0.5
  const precip = rainy ? Number(((r - 0.5) * 2 * 45 * (0.4 + r3)).toFixed(1)) : 0
  const prob = rainy ? Math.round(50 + r2 * 45) : Math.round(r2 * 30)
  const tempMax = Number((baseMax + 2.5 * Math.sin(offset * 0.8 + i) - (rainy ? 2.5 : 0) + r3).toFixed(1))
  const tempMin = Number((baseMin + 1.5 * Math.sin(offset * 0.6 + i * 2) + r2 - (rainy ? 0.5 : 0)).toFixed(1))
  return { date: addDays(TODAY, offset), tempMax, tempMin, precipitationSum: precip, precipitationProbabilityMax: prob, weatherCode: codeFor(prob, precip) }
}

/** Futuro: GET /v1/forecast?latitude=&longitude=&daily=...&forecast_days=7 */
export const getForecast = (farm: string, days = FORECAST_DAYS): DailyWeather[] => Array.from({ length: days }, (_, k) => day(farm, k))

/** Dias completos anteriores a hoje (até ontem). Futuro: past_days ou API de arquivo histórico. */
export const getHistory = (farm: string, days: number): DailyWeather[] => Array.from({ length: days }, (_, k) => day(farm, k - days))

/** Condição atual. Futuro: GET /v1/forecast?...&current=... */
export function getCurrent(farm: string): CurrentWeather {
  const i = Math.max(0, farmLocations.findIndex(f => f.farm === farm))
  const d = day(farm, 0)
  const humidity = Math.round(88 - (d.tempMax - 24) * 3 - (d.precipitationSum > 0 ? 0 : 8) + rnd(i, 0, 5) * 6)
  return {
    time: NOW,
    temperature: Number((d.tempMin + (d.tempMax - d.tempMin) * 0.55).toFixed(1)),
    humidity: Math.min(95, Math.max(30, humidity)),
    precipitationProbability: d.precipitationProbabilityMax,
    windSpeed: Number((8 + rnd(i, 0, 6) * 14).toFixed(1)),
    weatherCode: d.weatherCode,
  }
}

/** Descrição dos códigos WMO usados pelo Open-Meteo (subconjunto). */
export function describeWeather(code: number): { label: string; icon: 'sun' | 'partly' | 'cloud' | 'drizzle' | 'rain' | 'storm' } {
  if (code === 0) return { label: 'Céu limpo', icon: 'sun' }
  if (code === 1) return { label: 'Predominantemente limpo', icon: 'sun' }
  if (code === 2) return { label: 'Parcialmente nublado', icon: 'partly' }
  if (code === 3) return { label: 'Nublado', icon: 'cloud' }
  if (code >= 51 && code <= 57) return { label: 'Garoa', icon: 'drizzle' }
  if (code >= 61 && code <= 82) return { label: 'Chuva', icon: 'rain' }
  if (code >= 95) return { label: 'Tempestade', icon: 'storm' }
  return { label: 'Indefinido', icon: 'cloud' }
}
