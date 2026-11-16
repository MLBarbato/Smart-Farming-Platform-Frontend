'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, CloudSun, Droplets, FlaskConical, Info, Thermometer, WifiOff } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'
import { FALLBACK_COLOR, MonitoringChart, SERIES_COLORS } from '@/components/monitoring-chart'
import { allFields, farms, fieldsByFarm, formatReadAt, measurementTypes, measurements } from '@/lib/sensors-data'
import { FieldCondition, PeriodKey, SensorEntry, SensorState, allEntries, expectedRange, fieldCondition, periods, talhoes } from '@/lib/monitoring-data'

const selectCls = 'h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]'

const stateInfo: Record<SensorState, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  NORMAL: { label: 'Normal', cls: 'bg-[#dff5e9] text-[#0b5d3b]', Icon: CheckCircle2 },
  CRITICO: { label: 'Leitura crítica', cls: 'bg-[#fef2f2] text-[#b91c1c]', Icon: AlertTriangle },
  SEM_COMUNICACAO: { label: 'Sem comunicação', cls: 'bg-[#f1f3f2] text-[#66736b]', Icon: WifiOff },
}
const conditionInfo: Record<FieldCondition, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  NORMAL: { label: 'Normal', cls: 'bg-[#dff5e9] text-[#0b5d3b]', Icon: CheckCircle2 },
  ALERTA: { label: 'Alerta', cls: 'bg-[#fff7ed] text-[#b45309]', Icon: AlertTriangle },
  INDISPONIVEL: { label: 'Dados indisponíveis', cls: 'bg-[#f1f3f2] text-[#66736b]', Icon: WifiOff },
}

export function MonitoringPage() {
  const [farm, setFarm] = useState('Todas')
  const [field, setField] = useState('Todos')
  const [type, setType] = useState('Todos')
  const [period, setPeriod] = useState<PeriodKey>('24h')

  const p = periods.find(x => x.key === period)!
  const filterFields = farm === 'Todas' ? allFields : fieldsByFarm[farm]

  // Escopo por fazenda/talhão (vale para indicadores, talhões, gráficos e leituras)
  const scoped = useMemo(() => allEntries.filter(e => (farm === 'Todas' || e.device.farm === farm) && (field === 'Todos' || e.device.field === field)), [farm, field])
  const scopedTalhoes = useMemo(() => talhoes.filter(t => (farm === 'Todas' || t.farm === farm) && (field === 'Todos' || t.name === field)), [farm, field])
  const typed = useMemo(() => scoped.filter(e => type === 'Todos' || e.sensor.measurement === type), [scoped, type])

  // Cor estável por sensor (posição entre todos os sensores do mesmo tipo), independente dos filtros
  const colorOf = (e: SensorEntry) => SERIES_COLORS[allEntries.filter(x => x.sensor.measurement === e.sensor.measurement).findIndex(x => x.sensor.id === e.sensor.id)] ?? FALLBACK_COLOR

  const charts = measurementTypes.map(m => ({ m, entries: typed.filter(e => e.sensor.measurement === m) })).filter(c => c.entries.length > 0)
  const latest = [...typed].filter(e => e.last).sort((a, b) => (a.last!.readAt < b.last!.readAt ? 1 : -1))

  const kpi = (measurement: string) => {
    const live = scoped.filter(e => e.sensor.measurement === measurement && e.state !== 'SEM_COMUNICACAO' && e.last)
    if (!live.length) return null
    const avg = live.reduce((s, e) => s + e.last!.value, 0) / live.length
    const r = expectedRange[measurement]
    return { avg: Number(avg.toFixed(measurement === 'pH' ? 2 : 1)), n: live.length, out: !!r && (avg < r.min || avg > r.max) }
  }
  const critical = scoped.filter(e => e.state === 'CRITICO').length
  const offline = scoped.filter(e => e.state === 'SEM_COMUNICACAO').length

  const kpis = [
    { title: 'Umidade do solo', measurement: 'Umidade do solo', Icon: Droplets },
    { title: 'Temperatura do solo', measurement: 'Temperatura do solo', Icon: Thermometer },
    { title: 'pH do solo', measurement: 'pH', Icon: FlaskConical },
  ]

  return (
    <DashboardShell title="Monitoramento" subtitle="Acompanhe as condições do solo e do ambiente pelas leituras dos sensores.">
      <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 text-sm text-[#92400e]"><Info className="mt-0.5 size-4 shrink-0" /><p><strong>Dados simulados.</strong> Ainda não há dispositivos físicos integrados; todas as leituras dos sensores exibidas aqui são fictícias.</p></div>

      <div className="mb-6 flex flex-wrap items-center gap-3" role="group" aria-label="Filtros de monitoramento">
        <select value={farm} onChange={e => { setFarm(e.target.value); setField('Todos') }} aria-label="Filtrar por fazenda" className={selectCls}><option value="Todas">Todas as fazendas</option>{farms.map(f => <option key={f}>{f}</option>)}</select>
        <select value={field} onChange={e => setField(e.target.value)} aria-label="Filtrar por talhão" className={selectCls}><option value="Todos">Todos os talhões</option>{filterFields.map(f => <option key={f}>{f}</option>)}</select>
        <select value={type} onChange={e => setType(e.target.value)} aria-label="Filtrar por tipo de medição" className={selectCls}><option value="Todos">Todas as medições</option>{measurementTypes.map(t => <option key={t}>{t}</option>)}</select>
        <div className="flex rounded-lg border border-[#dde5df] bg-white p-0.5" role="radiogroup" aria-label="Período de consulta">
          {periods.map(x => <button key={x.key} role="radio" aria-checked={period === x.key} onClick={() => setPeriod(x.key)} className={`h-9 rounded-md px-3 text-sm transition ${period === x.key ? 'bg-[#0b5d3b] font-medium text-white' : 'text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]'}`}>{x.label}</button>)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ title, measurement, Icon }) => {
          const k = kpi(measurement), unit = measurements[measurement][0], r = expectedRange[measurement]
          return (
            <div key={title} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{title}</span><Icon className="size-5 text-[#0b5d3b]" /></div>
              {k ? <p className="mt-3 flex items-baseline gap-1 text-3xl font-semibold">{k.avg}<span className="text-base font-normal text-[#66736b]">{unit}</span>{k.out && <AlertTriangle aria-label="Fora da faixa esperada" className="ml-1 size-4 self-center text-[#b45309]" />}</p> : <p className="mt-3 text-3xl font-semibold text-[#66736b]">—</p>}
              <p className="mt-1 text-xs text-[#66736b]">{k ? `Última leitura · média de ${k.n} ${k.n === 1 ? 'sensor' : 'sensores'} · esperado ${r.min}–${r.max}` : 'Sem leituras disponíveis'}</p>
            </div>
          )
        })}
        <div className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">Leituras críticas</span><AlertTriangle className={`size-5 ${critical ? 'text-[#b91c1c]' : 'text-[#0b5d3b]'}`} /></div>
          <p className={`mt-3 text-3xl font-semibold ${critical ? 'text-[#b91c1c]' : ''}`}>{critical}</p>
          <p className="mt-1 text-xs text-[#66736b]">Sensores fora da faixa · {offline} sem comunicação</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Condição dos talhões</h2>
        <p className="mb-4 text-sm text-[#66736b]">Clique em um talhão para filtrar a tela.</p>
        {scopedTalhoes.length === 0 ? <p className="rounded-xl border border-dashed border-[#dde5df] bg-white p-6 text-center text-sm text-[#66736b]">Nenhum talhão neste filtro.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {scopedTalhoes.map(t => {
              const es = allEntries.filter(e => e.device.farm === t.farm && e.device.field === t.name)
              const c = conditionInfo[fieldCondition(es)], crit = es.filter(e => e.state === 'CRITICO').length, off = es.filter(e => e.state === 'SEM_COMUNICACAO').length
              return (
                <button key={`${t.farm}-${t.name}`} onClick={() => { setFarm(t.farm); setField(t.name) }} aria-label={`${t.name}, ${t.farm}: ${c.label}`} className="rounded-xl border border-[#dde5df] bg-white p-4 text-left shadow-sm transition hover:border-[#0b5d3b]/40">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{t.name}</p><p className="truncate text-xs text-[#66736b]">{t.farm}</p></div><span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${c.cls}`}><c.Icon className="size-3" />{c.label}</span></div>
                  <p className="mt-3 text-xs text-[#66736b]">{es.length === 0 ? 'Sem sensores instalados' : `${es.length} ${es.length === 1 ? 'sensor' : 'sensores'}${crit ? ` · ${crit} crítico${crit > 1 ? 's' : ''}` : ''}${off ? ` · ${off} sem comunicação` : ''}`}</p>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Histórico das medições</h2>
        <p className="mb-4 text-sm text-[#66736b]">Últimas {p.label.toLowerCase()} · leituras de sensores físicos (simuladas)</p>
        {charts.length === 0 ? <p className="rounded-xl border border-dashed border-[#dde5df] bg-white p-6 text-center text-sm text-[#66736b]">Nenhum sensor encontrado para este filtro.</p> : (
          <div className="grid gap-6 2xl:grid-cols-2">
            {charts.map(c => <MonitoringChart key={`${c.m}-${period}`} measurement={c.m} unit={measurements[c.m][0]} hours={p.hours} step={p.step} series={c.entries.map(e => ({ entry: e, color: colorOf(e), label: `${e.device.code} · ${e.sensor.name}` }))} />)}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Últimas leituras recebidas</h2>
        <p className="mb-4 text-sm text-[#66736b]">Leitura mais recente de cada sensor, independente do período.</p>
        {latest.length === 0 ? <p className="rounded-xl border border-dashed border-[#dde5df] bg-white p-6 text-center text-sm text-[#66736b]">Nenhuma leitura encontrada.</p> : (
          <div className="overflow-x-auto rounded-xl border border-[#dde5df] bg-white shadow-sm">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-[#dde5df] bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-5 py-3 font-medium">Dispositivo</th><th className="px-5 py-3 font-medium">Sensor</th><th className="px-5 py-3 font-medium">Talhão</th><th className="px-5 py-3 text-right font-medium">Valor</th><th className="px-5 py-3 font-medium">Coleta</th><th className="px-5 py-3 font-medium">Situação</th></tr></thead>
              <tbody className="divide-y divide-[#dde5df]">
                {latest.map(e => { const s = stateInfo[e.state]; return (
                  <tr key={e.sensor.id} className="hover:bg-[#f8faf8]">
                    <td className="px-5 py-3"><p className="font-medium">{e.device.code}</p><p className="text-xs text-[#66736b]">{e.device.name}</p></td>
                    <td className="px-5 py-3">{e.sensor.name}<p className="text-xs text-[#66736b]">{e.sensor.measurement}</p></td>
                    <td className="px-5 py-3 text-[#66736b]">{e.device.field}<p className="text-xs">{e.device.farm}</p></td>
                    <td className="px-5 py-3 text-right tabular-nums"><span className="font-semibold">{e.last!.value}</span> <span className="text-[#66736b]">{e.sensor.unit}</span></td>
                    <td className="px-5 py-3 tabular-nums">{formatReadAt(e.last!.readAt)}</td>
                    <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${s.cls}`}><s.Icon className="size-3" />{e.state === 'CRITICO' ? `Crítica (${e.deviation})` : s.label}</span></td>
                  </tr>
                ) })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8" aria-labelledby="ext-title">
        <h2 id="ext-title" className="text-lg font-semibold">Dados meteorológicos externos</h2>
        <p className="mb-4 text-sm text-[#66736b]">Fonte diferente dos sensores: serviço meteorológico externo (ex.: Open-Meteo).</p>
        <div className="flex flex-col items-center rounded-xl border border-dashed border-[#c9d3cc] bg-[#f8faf8] px-6 py-10 text-center">
          <div className="rounded-xl bg-[#e8eef9] p-3 text-[#1d4ed8]"><CloudSun /></div>
          <p className="mt-3 text-sm font-semibold">Integração ainda não definida</p>
          <p className="mt-1 max-w-md text-xs text-[#66736b]">Previsão do tempo e dados climáticos regionais aparecerão aqui, claramente separados e identificados como dados externos. Eles não são leituras dos sensores das fazendas e não entram nos indicadores, gráficos ou alertas acima.</p>
        </div>
      </section>
    </DashboardShell>
  )
}
