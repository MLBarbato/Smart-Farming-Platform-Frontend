'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Droplets, Gauge, Leaf, Map, Search, Sprout } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'

type Status = 'Saudável' | 'Atenção' | 'Crítico'
type Field = { id: number; name: string; farm: string; crop: string; area: number; moisture: number; sensors: number; stage: string; status: Status }

const fields: Field[] = [
  { id: 1, name: 'Talhão 01', farm: 'Fazenda Santa Maria', crop: 'Soja', area: 142, moisture: 58, sensors: 8, stage: 'Floração', status: 'Saudável' },
  { id: 2, name: 'Talhão 02', farm: 'Fazenda Santa Maria', crop: 'Milho', area: 118, moisture: 52, sensors: 7, stage: 'Vegetativo', status: 'Saudável' },
  { id: 3, name: 'Talhão 03', farm: 'Fazenda Santa Maria', crop: 'Soja', area: 96, moisture: 24, sensors: 6, stage: 'Floração', status: 'Crítico' },
  { id: 4, name: 'Talhão 04', farm: 'Fazenda Boa Esperança', crop: 'Soja', area: 160, moisture: 47, sensors: 9, stage: 'Enchimento de grãos', status: 'Saudável' },
  { id: 5, name: 'Talhão 05', farm: 'Fazenda Boa Esperança', crop: 'Soja', area: 134, moisture: 36, sensors: 7, stage: 'Enchimento de grãos', status: 'Atenção' },
  { id: 6, name: 'Talhão 07', farm: 'Sítio Água Limpa', crop: 'Café', area: 64, moisture: 41, sensors: 5, stage: 'Maturação', status: 'Atenção' },
]

const statusStyle: Record<Status, string> = {
  Saudável: 'bg-[#dff5e9] text-[#0b5d3b]',
  Atenção: 'bg-[#fff7ed] text-[#b45309]',
  Crítico: 'bg-[#fef2f2] text-[#dc2626]',
}
const barColor: Record<Status, string> = { Saudável: 'bg-[#16a34a]', Atenção: 'bg-[#eab308]', Crítico: 'bg-[#dc2626]' }

export function FieldsPage() {
  const [query, setQuery] = useState('')
  const [farm, setFarm] = useState('Todas')
  const [status, setStatus] = useState<'Todos' | Status>('Todos')
  const farms = useMemo(() => Array.from(new Set(fields.map(f => f.farm))), [])
  const filtered = fields.filter(f => (farm === 'Todas' || f.farm === farm) && (status === 'Todos' || f.status === status) && `${f.name} ${f.crop}`.toLowerCase().includes(query.trim().toLowerCase()))
  const area = fields.reduce((s, f) => s + f.area, 0)
  const avg = Math.round(fields.reduce((s, f) => s + f.moisture, 0) / fields.length)

  return (
    <DashboardShell title="Talhões" subtitle="Acompanhe as áreas de cultivo de cada propriedade.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([['Talhões', String(fields.length), 'Áreas monitoradas', Map], ['Área cultivada', `${area} ha`, 'Soma dos talhões', Leaf], ['Umidade média', `${avg}%`, 'Solo, últimas leituras', Droplets], ['Em atenção', String(fields.filter(f => f.status !== 'Saudável').length), 'Requerem acompanhamento', AlertTriangle]] as const).map(([title, value, desc, Icon]) => (
          <div key={title} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{title}</span><Icon className="size-5 text-[#0b5d3b]" /></div><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#66736b]">{desc}</p></div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-[#dde5df] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div><h2 className="font-semibold">Lista de talhões</h2><p className="text-sm text-[#66736b]">{filtered.length} de {fields.length} talhões</p></div>
          <div className="flex w-full flex-wrap gap-3 lg:w-auto">
            <div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar talhão" placeholder="Buscar talhão ou cultura" className="h-10 w-full rounded-lg border border-[#dde5df] bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10" /></div>
            <select value={farm} onChange={e => setFarm(e.target.value)} aria-label="Filtrar por fazenda" className="h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]"><option>Todas</option>{farms.map(f => <option key={f}>{f}</option>)}</select>
            <select value={status} onChange={e => setStatus(e.target.value as 'Todos' | Status)} aria-label="Filtrar por status" className="h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]"><option>Todos</option><option>Saudável</option><option>Atenção</option><option>Crítico</option></select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center border-t border-[#dde5df] px-6 py-14 text-center"><div className="rounded-xl bg-[#dff5e9] p-3 text-[#0b5d3b]"><Map /></div><p className="mt-4 font-semibold">Nenhum talhão encontrado</p><p className="mt-1 text-sm text-[#66736b]">Ajuste os filtros para ver outros resultados.</p></div>
        ) : (
          <div className="overflow-x-auto border-t border-[#dde5df]">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-6 py-3 font-medium">Talhão</th><th className="px-4 py-3 font-medium">Cultura</th><th className="px-4 py-3 font-medium">Área</th><th className="px-4 py-3 font-medium">Umidade do solo</th><th className="px-4 py-3 font-medium">Sensores</th><th className="px-6 py-3 font-medium">Status</th></tr></thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} className="border-t border-[#dde5df] transition hover:bg-[#f8faf8]">
                    <td className="px-6 py-4"><p className="font-medium">{f.name}</p><p className="text-xs text-[#66736b]">{f.farm}</p></td>
                    <td className="px-4 py-4"><p className="flex items-center gap-1.5"><Sprout className="size-3.5 text-[#0b5d3b]" />{f.crop}</p><p className="text-xs text-[#66736b]">{f.stage}</p></td>
                    <td className="px-4 py-4">{f.area} ha</td>
                    <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-2 w-24 overflow-hidden rounded-full bg-[#d1d5db]" role="progressbar" aria-valuenow={f.moisture} aria-valuemin={0} aria-valuemax={100} aria-label={`Umidade ${f.name}`}><div className={`h-full rounded-full ${barColor[f.status]}`} style={{ width: `${f.moisture}%` }} /></div><span className="font-medium">{f.moisture}%</span></div></td>
                    <td className="px-4 py-4"><span className="flex items-center gap-1.5 text-[#66736b]"><Gauge className="size-3.5" />{f.sensors}</span></td>
                    <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[f.status]}`}>{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
