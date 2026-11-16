'use client'

import { useState } from 'react'
import { CalendarClock, CloudRain, Droplets, Gauge, Play, Square, Waves } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'

type Zone = { id: number; name: string; farm: string; moisture: number; target: number; flow: number; auto: boolean; running: boolean; next: string }

const initialZones: Zone[] = [
  { id: 1, name: 'Talhão 01', farm: 'Fazenda Santa Maria', moisture: 58, target: 55, flow: 0, auto: true, running: false, next: 'Amanhã, 05:30' },
  { id: 2, name: 'Talhão 02', farm: 'Fazenda Santa Maria', moisture: 52, target: 50, flow: 0, auto: true, running: false, next: 'Amanhã, 06:00' },
  { id: 3, name: 'Talhão 03', farm: 'Fazenda Santa Maria', moisture: 24, target: 50, flow: 38, auto: false, running: true, next: 'Em andamento' },
  { id: 4, name: 'Talhão 05', farm: 'Fazenda Boa Esperança', moisture: 36, target: 45, flow: 0, auto: true, running: false, next: 'Hoje, 18:00' },
  { id: 5, name: 'Talhão 07', farm: 'Sítio Água Limpa', moisture: 41, target: 40, flow: 0, auto: false, running: false, next: 'Manual' },
]

const schedule = [
  ['Talhão 05', 'Hoje, 18:00', '45 min'],
  ['Talhão 01', 'Amanhã, 05:30', '30 min'],
  ['Talhão 02', 'Amanhã, 06:00', '30 min'],
]

export function IrrigationPage() {
  const [zones, setZones] = useState(initialZones)
  const toggle = (id: number, key: 'auto' | 'running') => setZones(z => z.map(x => x.id !== id ? x : key === 'auto' ? { ...x, auto: !x.auto } : { ...x, running: !x.running, flow: x.running ? 0 : 38, next: x.running ? 'Manual' : 'Em andamento' }))
  const running = zones.filter(z => z.running)
  const flow = running.reduce((s, z) => s + z.flow, 0)

  return (
    <DashboardShell title="Irrigação" subtitle="Controle e programe a irrigação dos seus talhões.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([['Irrigando agora', String(running.length), 'Zonas em operação', Droplets], ['Vazão atual', `${flow} L/min`, 'Soma das zonas ativas', Waves], ['Modo automático', `${zones.filter(z => z.auto).length}/${zones.length}`, 'Zonas programadas', CalendarClock], ['Chuva prevista', '30%', 'Próximas 24 horas', CloudRain]] as const).map(([title, value, desc, Icon]) => (
          <div key={title} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{title}</span><Icon className="size-5 text-[#0b5d3b]" /></div><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#66736b]">{desc}</p></div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-4"><h2 className="text-lg font-semibold">Zonas de irrigação</h2><p className="text-sm text-[#66736b]">Umidade do solo em relação à meta de cada talhão</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            {zones.map(z => {
              const low = z.moisture < z.target * 0.7
              return (
                <article key={z.id} className="flex flex-col rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold">{z.name}</h3><p className="truncate text-xs text-[#66736b]">{z.farm}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${z.running ? 'bg-[#dff5e9] text-[#0b5d3b]' : 'bg-[#f1f3f2] text-[#66736b]'}`}>{z.running ? 'Irrigando' : 'Parada'}</span></div>
                  <div className="mt-5"><div className="flex items-end justify-between"><p className="text-3xl font-semibold">{z.moisture}%</p><p className="text-xs text-[#66736b]">meta {z.target}%</p></div>
                    <div className="relative mt-2 h-2 rounded-full bg-[#d1d5db]" role="progressbar" aria-valuenow={z.moisture} aria-valuemin={0} aria-valuemax={100} aria-label={`Umidade ${z.name}`}><div className={`h-full rounded-full ${low ? 'bg-[#dc2626]' : z.moisture < z.target ? 'bg-[#eab308]' : 'bg-[#16a34a]'}`} style={{ width: `${z.moisture}%` }} /><span aria-hidden="true" className="absolute -top-1 h-4 w-0.5 bg-[#17201b]" style={{ left: `${z.target}%` }} /></div></div>
                  <p className="mt-4 flex items-center gap-1.5 text-xs text-[#66736b]"><Gauge className="size-3.5" />{z.running ? `${z.flow} L/min` : 'Sem vazão'} · <CalendarClock className="size-3.5" />{z.next}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#dde5df] pt-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#66736b]"><input type="checkbox" checked={z.auto} onChange={() => toggle(z.id, 'auto')} className="size-4 rounded border-[#dde5df] accent-[#0b5d3b]" />Automático</label>
                    <button onClick={() => toggle(z.id, 'running')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${z.running ? 'border border-[#dde5df] bg-white text-[#17201b] hover:bg-[#f8faf8]' : 'bg-[#0b5d3b] text-white hover:bg-[#06452c]'}`}>{z.running ? <><Square className="size-3.5" /> Parar</> : <><Play className="size-3.5" /> Iniciar</>}</button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <div className="flex flex-col gap-6 self-start">
          <section className="rounded-xl border border-[#dde5df] bg-white p-6 shadow-sm"><h2 className="font-semibold">Próximas irrigações</h2><div className="mt-5 flex flex-col gap-4">{schedule.map(([name, when, dur]) => <div key={name} className="flex items-center gap-3 border-b border-[#dde5df] pb-4 last:border-0 last:pb-0"><div className="rounded-lg bg-[#dff5e9] p-2 text-[#0b5d3b]"><CalendarClock className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{name}</p><p className="text-xs text-[#66736b]">{when}</p></div><span className="text-xs text-[#66736b]">{dur}</span></div>)}</div></section>
          <section className="rounded-xl border border-[#dde5df] bg-[#dff5e9] p-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-white p-2 text-[#0b5d3b]"><Droplets /></div><div><h2 className="font-semibold">Recomendação</h2><p className="text-sm text-[#66736b]">Baseada nas leituras atuais</p></div></div><p className="mt-5 rounded-lg bg-white p-4 text-sm leading-6">Talhão 03 está com 24% de umidade, bem abaixo da meta de 50%. Mantenha a irrigação ativa até atingir o nível ideal.</p></section>
        </div>
      </div>
    </DashboardShell>
  )
}
