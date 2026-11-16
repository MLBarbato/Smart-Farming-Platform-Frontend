'use client'

import { useState } from 'react'
import { AlertTriangle, BellRing, Check, CheckCircle2, Clock, Wifi } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'

type Priority = 'Alta' | 'Média' | 'Baixa'
type Alert = { id: number; title: string; place: string; time: string; priority: Priority; resolved: boolean; detail: string }

const initial: Alert[] = [
  { id: 1, title: 'Umidade do solo abaixo do limite', place: 'Talhão 03 · Fazenda Santa Maria', time: 'Há 10 minutos', priority: 'Alta', resolved: false, detail: 'Leitura de 24%, meta de 50%. Avalie a necessidade de irrigação.' },
  { id: 2, title: 'Sensor sem comunicação', place: 'Talhão 07 · Sítio Água Limpa', time: 'Há 35 minutos', priority: 'Média', resolved: false, detail: 'Sem leituras há mais de 30 minutos. Verifique bateria e sinal.' },
  { id: 3, title: 'Probabilidade de chuva elevada', place: 'Fazenda Santa Maria', time: 'Há 1 hora', priority: 'Baixa', resolved: false, detail: 'Previsão de 30% de chuva nas próximas 24 horas.' },
  { id: 4, title: 'Umidade do solo abaixo da meta', place: 'Talhão 05 · Fazenda Boa Esperança', time: 'Há 3 horas', priority: 'Média', resolved: false, detail: 'Leitura de 36%, meta de 45%. Irrigação programada para 18:00.' },
  { id: 5, title: 'Bateria do sensor baixa', place: 'Talhão 02 · Fazenda Santa Maria', time: 'Ontem', priority: 'Baixa', resolved: true, detail: 'Bateria em 12%. Substituição realizada.' },
]

const style: Record<Priority, { badge: string; icon: string }> = {
  Alta: { badge: 'bg-[#fef2f2] text-[#dc2626]', icon: 'bg-[#fef2f2] text-[#dc2626]' },
  Média: { badge: 'bg-[#fff7ed] text-[#b45309]', icon: 'bg-[#fff7ed] text-[#eab308]' },
  Baixa: { badge: 'bg-[#dff5e9] text-[#0b5d3b]', icon: 'bg-[#dff5e9] text-[#0b5d3b]' },
}

const tabs = ['Ativos', 'Resolvidos', 'Todos'] as const

export function AlertsPage() {
  const [alerts, setAlerts] = useState(initial)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Ativos')
  const [priority, setPriority] = useState<'Todas' | Priority>('Todas')
  const active = alerts.filter(a => !a.resolved)
  const filtered = alerts.filter(a => (tab === 'Todos' || (tab === 'Ativos') === !a.resolved) && (priority === 'Todas' || a.priority === priority))
  const resolve = (id: number) => setAlerts(a => a.map(x => x.id === id ? { ...x, resolved: true } : x))

  return (
    <DashboardShell title="Alertas" subtitle="Acompanhe ocorrências que requerem atenção na operação.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([['Alertas ativos', String(active.length), 'Requerem atenção', BellRing], ['Prioridade alta', String(active.filter(a => a.priority === 'Alta').length), 'Ação imediata', AlertTriangle], ['Sensores offline', '1', 'Sem comunicação', Wifi], ['Resolvidos', String(alerts.length - active.length), 'Neste período', CheckCircle2]] as const).map(([title, value, desc, Icon]) => (
          <div key={title} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{title}</span><Icon className="size-5 text-[#0b5d3b]" /></div><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#66736b]">{desc}</p></div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-[#dde5df] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div role="tablist" aria-label="Filtrar alertas" className="flex rounded-lg bg-[#f8faf8] p-1 ring-1 ring-[#dde5df]">{tabs.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${tab === t ? 'bg-[#0b5d3b] text-white' : 'text-[#66736b] hover:text-[#17201b]'}`}>{t}</button>)}</div>
          <select value={priority} onChange={e => setPriority(e.target.value as 'Todas' | Priority)} aria-label="Filtrar por prioridade" className="h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]"><option>Todas</option><option>Alta</option><option>Média</option><option>Baixa</option></select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center border-t border-[#dde5df] px-6 py-14 text-center"><div className="rounded-xl bg-[#dff5e9] p-3 text-[#0b5d3b]"><CheckCircle2 /></div><p className="mt-4 font-semibold">Nenhum alerta por aqui</p><p className="mt-1 text-sm text-[#66736b]">Tudo certo com a sua operação neste filtro.</p></div>
        ) : (
          <ul className="border-t border-[#dde5df]">
            {filtered.map(a => (
              <li key={a.id} className="flex flex-wrap items-start gap-4 border-b border-[#dde5df] px-6 py-5 last:border-0 sm:flex-nowrap">
                <div className={`rounded-lg p-2 ${a.resolved ? 'bg-[#f1f3f2] text-[#66736b]' : style[a.priority].icon}`}>{a.resolved ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}</div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`text-sm font-medium ${a.resolved ? 'text-[#66736b] line-through' : ''}`}>{a.title}</p><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style[a.priority].badge}`}>{a.priority}</span></div><p className="mt-1 text-sm text-[#66736b]">{a.detail}</p><p className="mt-2 flex items-center gap-1.5 text-xs text-[#66736b]"><Clock className="size-3" />{a.place} · {a.time}</p></div>
                {!a.resolved && <button onClick={() => resolve(a.id)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#dde5df] bg-white px-3 py-2 text-sm font-medium transition hover:bg-[#dff5e9] hover:text-[#0b5d3b]"><Check className="size-3.5" /> Resolver</button>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  )
}
