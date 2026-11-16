'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CloudDrizzle, CloudLightning, CloudRain, CloudSun, Cloud, Droplets, Info, MapPin, Sun, Thermometer, Umbrella, Wind } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'
import { ClimateChart } from '@/components/climate-chart'
import { LAST_UPDATE, WEATHER_SOURCE, ClimatePeriodKey, climatePeriods, describeWeather, farmLocations, fmtDay, getCurrent, getForecast, getHistory, today, weekday } from '@/lib/climate-data'
import { formatReadAt } from '@/lib/sensors-data'

const selectCls = 'h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]'
const icons = { sun: Sun, partly: CloudSun, cloud: Cloud, drizzle: CloudDrizzle, rain: CloudRain, storm: CloudLightning }
const nf = (v: number, d = 1) => v.toFixed(d).replace('.', ',')

// Identidade visual dos dados externos (azul) — distinta dos sensores (verde).
const ExternalTag = () => <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#eff6ff] px-2 py-0.5 text-xs font-medium text-[#1d4ed8]"><CloudSun className="size-3" />{WEATHER_SOURCE.name} · dado externo</span>

export function ClimatePage() {
  const [farm, setFarm] = useState(farmLocations[0].farm)
  const [period, setPeriod] = useState<ClimatePeriodKey>('7d')

  const loc = farmLocations.find(f => f.farm === farm)!
  const days = climatePeriods.find(p => p.key === period)!.days
  const current = useMemo(() => getCurrent(farm), [farm])
  const forecast = useMemo(() => getForecast(farm), [farm])
  const history = useMemo(() => getHistory(farm, days), [farm, days])
  const cond = describeWeather(current.weatherCode)
  const CondIcon = icons[cond.icon]
  const dates = history.map(d => d.date)
  const totalRain = history.reduce((s, d) => s + d.precipitationSum, 0)
  const rainyDays = history.filter(d => d.precipitationSum > 0).length

  const indicators = [
    { title: 'Temperatura do ar', value: nf(current.temperature), unit: '°C', desc: 'A 2 m do solo', Icon: Thermometer },
    { title: 'Condição', value: cond.label, desc: `Código WMO ${current.weatherCode}`, Icon: CondIcon, text: true },
    { title: 'Umidade do ar', value: String(current.humidity), unit: '%', desc: 'Umidade relativa do ar', Icon: Droplets },
    { title: 'Probabilidade de chuva', value: String(current.precipitationProbability), unit: '%', desc: 'Para hoje', Icon: Umbrella },
    { title: 'Vento', value: nf(current.windSpeed), unit: 'km/h', desc: 'A 10 m de altura', Icon: Wind },
  ]

  return (
    <DashboardShell title="Clima" subtitle="Condições e previsão meteorológica na localização de cada fazenda.">
      <div className="mb-6 flex flex-col gap-3">
        <div role="note" className="flex items-start gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 text-sm text-[#92400e]"><Info className="mt-0.5 size-4 shrink-0" /><p><strong>Dados simulados.</strong> A integração com o Open-Meteo ainda não foi feita; todos os valores meteorológicos desta tela são fictícios.</p></div>
        <div role="note" className="flex items-start gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm text-[#1e40af]"><CloudSun className="mt-0.5 size-4 shrink-0" /><p><strong>Dados meteorológicos externos.</strong> Esta tela mostra temperatura e umidade do <em>ar</em> e previsão do tempo vindas de um serviço externo. Não são medições dos sensores das fazendas. Para temperatura e umidade do <em>solo</em>, veja <Link href="/dashboard/monitoramento" className="font-medium underline">Monitoramento</Link>.</p></div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3" role="group" aria-label="Filtros de clima">
        <select value={farm} onChange={e => setFarm(e.target.value)} aria-label="Fazenda" className={selectCls}>{farmLocations.map(f => <option key={f.farm}>{f.farm}</option>)}</select>
        <div className="flex rounded-lg border border-[#dde5df] bg-white p-0.5" role="radiogroup" aria-label="Período do histórico">
          {climatePeriods.map(p => <button key={p.key} role="radio" aria-checked={period === p.key} onClick={() => setPeriod(p.key)} className={`h-9 rounded-md px-3 text-sm transition ${period === p.key ? 'bg-[#0b5d3b] font-medium text-white' : 'text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]'}`}>{p.label}</button>)}
        </div>
        <span className="text-xs text-[#66736b]">O período vale para o histórico; a previsão cobre sempre os próximos 7 dias.</span>
      </div>

      <section aria-labelledby="loc-title" className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="loc-title" className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-[#0b5d3b]" />{loc.farm}</h2><ExternalTag /></div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div><dt className="text-xs text-[#66736b]">Localidade</dt><dd className="font-medium">{loc.city} · {loc.state}</dd></div>
          <div><dt className="text-xs text-[#66736b]">Latitude (consulta)</dt><dd className="font-medium tabular-nums">{loc.latitude.toFixed(4)}°</dd></div>
          <div><dt className="text-xs text-[#66736b]">Longitude (consulta)</dt><dd className="font-medium tabular-nums">{loc.longitude.toFixed(4)}°</dd></div>
          <div><dt className="text-xs text-[#66736b]">Fonte dos dados</dt><dd className="font-medium">{WEATHER_SOURCE.name} <span className="font-normal text-[#66736b]">(simulado)</span></dd></div>
          <div><dt className="text-xs text-[#66736b]">Última atualização</dt><dd className="font-medium tabular-nums">{formatReadAt(LAST_UPDATE)} <span className="font-normal text-[#66736b]">({loc.timezone})</span></dd></div>
        </dl>
        <p className="mt-3 text-xs text-[#66736b]">A consulta usa a latitude e a longitude cadastradas na fazenda.</p>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {indicators.map(({ title, value, unit, desc, Icon, text }) => (
          <div key={title} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2"><span className="text-sm text-[#66736b]">{title}</span><Icon className="size-5 shrink-0 text-[#1d4ed8]" /></div>
            <p className={`mt-3 font-semibold ${text ? 'text-xl leading-9' : 'flex items-baseline gap-1 text-3xl'}`}>{value}{unit && <span className="text-base font-normal text-[#66736b]">{unit}</span>}</p>
            <p className="mt-1 text-xs text-[#66736b]">{desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-8" aria-labelledby="fc-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 id="fc-title" className="text-lg font-semibold">Previsão para os próximos 7 dias</h2><p className="text-sm text-[#66736b]">Temperatura do ar e possibilidade de precipitação.</p></div><ExternalTag /></div>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {forecast.map(d => {
            const w = describeWeather(d.weatherCode), Icon = icons[w.icon], isToday = d.date === today()
            return (
              <li key={d.date} className={`rounded-xl border bg-white p-4 text-center shadow-sm ${isToday ? 'border-[#1d4ed8]/50' : 'border-[#dde5df]'}`}>
                <p className="text-sm font-semibold">{isToday ? 'Hoje' : weekday(d.date)}</p><p className="text-xs text-[#66736b]">{fmtDay(d.date)}</p>
                <Icon aria-hidden="true" className="mx-auto my-3 size-7 text-[#1d4ed8]" /><p className="min-h-8 text-xs text-[#66736b]">{w.label}</p>
                <p className="mt-2 text-sm tabular-nums"><span className="font-semibold">{nf(d.tempMax, 0)}°</span> <span className="text-[#66736b]">/ {nf(d.tempMin, 0)}°</span></p>
                <p className="mt-2 flex items-center justify-center gap-1 text-xs text-[#52514e]"><Umbrella className="size-3" />{d.precipitationProbabilityMax}% · {nf(d.precipitationSum)} mm</p>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="mt-8" aria-labelledby="hist-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 id="hist-title" className="text-lg font-semibold">Histórico meteorológico</h2><p className="text-sm text-[#66736b]">Últimos {days} dias, até ontem · {nf(totalRain)} mm acumulados em {rainyDays} {rainyDays === 1 ? 'dia' : 'dias'} com chuva</p></div><ExternalTag /></div>
        <div className="grid gap-6 2xl:grid-cols-2">
          <ClimateChart key={`t-${farm}-${days}`} kind="line" title="Temperatura do ar" subtitle="Máxima e mínima diárias" unit="°C" dates={dates} series={[{ label: 'Máxima', color: '#eb6834', values: history.map(d => d.tempMax) }, { label: 'Mínima', color: '#2a78d6', values: history.map(d => d.tempMin) }]} />
          <ClimateChart key={`p-${farm}-${days}`} kind="bar" title="Precipitação" subtitle="Total diário" unit="mm" dates={dates} series={[{ label: 'Precipitação', color: '#2a78d6', values: history.map(d => d.precipitationSum) }]} />
        </div>
      </section>
    </DashboardShell>
  )
}
