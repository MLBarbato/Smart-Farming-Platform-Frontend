'use client'

import { FormEvent, useMemo, useState } from 'react'
import { AlertTriangle, Gauge, Home, Leaf, MapPin, Plus, Search, Sprout, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard-shell'

type Status = 'Ativa' | 'Atenção' | 'Inativa'
type Farm = { id: number; name: string; city: string; state: string; area: number; fields: number; sensors: number; sensorsOnline: number; alerts: number; crops: string[]; status: Status }

const initialFarms: Farm[] = [
  { id: 1, name: 'Fazenda Santa Maria', city: 'Rio Verde', state: 'GO', area: 1240, fields: 9, sensors: 64, sensorsOnline: 60, alerts: 3, crops: ['Soja', 'Milho'], status: 'Atenção' },
  { id: 2, name: 'Fazenda Boa Esperança', city: 'Sorriso', state: 'MT', area: 860, fields: 6, sensors: 41, sensorsOnline: 41, alerts: 0, crops: ['Soja'], status: 'Ativa' },
  { id: 3, name: 'Sítio Água Limpa', city: 'Patos de Minas', state: 'MG', area: 180, fields: 3, sensors: 23, sensorsOnline: 17, alerts: 1, crops: ['Café'], status: 'Ativa' },
]

const statusStyle: Record<Status, string> = {
  Ativa: 'bg-[#dff5e9] text-[#0b5d3b]',
  Atenção: 'bg-[#fff7ed] text-[#b45309]',
  Inativa: 'bg-[#f1f3f2] text-[#66736b]',
}

const nf = new Intl.NumberFormat('pt-BR')

export function FarmsPage() {
  const [farms, setFarms] = useState(initialFarms)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'Todas' | Status>('Todas')
  const [modal, setModal] = useState(false)

  const filtered = useMemo(() => farms.filter(f => (status === 'Todas' || f.status === status) && `${f.name} ${f.city} ${f.state}`.toLowerCase().includes(query.trim().toLowerCase())), [farms, query, status])
  const totals = useMemo(() => ({
    farms: farms.length,
    area: farms.reduce((s, f) => s + f.area, 0),
    fields: farms.reduce((s, f) => s + f.fields, 0),
    sensors: farms.reduce((s, f) => s + f.sensors, 0),
  }), [farms])

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const d = new FormData(event.currentTarget)
    setFarms(prev => [...prev, {
      id: Date.now(), name: String(d.get('name')).trim(), city: String(d.get('city')).trim(), state: String(d.get('state')).trim().toUpperCase(),
      area: Number(d.get('area')) || 0, fields: 0, sensors: 0, sensorsOnline: 0, alerts: 0,
      crops: String(d.get('crops')).split(',').map(c => c.trim()).filter(Boolean), status: 'Ativa',
    }])
    setModal(false)
  }

  return (
    <DashboardShell title="Fazendas" subtitle="Gerencie as propriedades da sua operação agrícola." actions={<Button onClick={() => setModal(true)} className="hidden h-10 gap-2 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c] sm:inline-flex"><Plus /> Nova fazenda</Button>}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([['Fazendas', String(totals.farms), 'Propriedades cadastradas', Home], ['Área total', `${nf.format(totals.area)} ha`, 'Hectares sob gestão', Leaf], ['Talhões', String(totals.fields), 'Áreas monitoradas', Sprout], ['Sensores', String(totals.sensors), 'Dispositivos IoT', Gauge]] as const).map(([title, value, desc, Icon]) => (
          <div key={title} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{title}</span><Icon className="size-5 text-[#0b5d3b]" /></div><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#66736b]">{desc}</p></div>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Suas propriedades</h2><p className="text-sm text-[#66736b]">{filtered.length} de {farms.length} fazendas</p></div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar fazenda" placeholder="Buscar por nome ou cidade" className="h-10 w-full rounded-lg border border-[#dde5df] bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10" /></div>
            <select value={status} onChange={e => setStatus(e.target.value as 'Todas' | Status)} aria-label="Filtrar por status" className="h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]"><option>Todas</option><option>Ativa</option><option>Atenção</option><option>Inativa</option></select>
            <Button onClick={() => setModal(true)} className="h-10 gap-2 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c] sm:hidden"><Plus /> Nova</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-[#dde5df] bg-white px-6 py-14 text-center"><div className="rounded-xl bg-[#dff5e9] p-3 text-[#0b5d3b]"><Leaf /></div><p className="mt-4 font-semibold">Nenhuma fazenda encontrada</p><p className="mt-1 text-sm text-[#66736b]">Ajuste a busca ou cadastre uma nova propriedade.</p></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map(f => {
              const pct = f.sensors ? Math.round((f.sensorsOnline / f.sensors) * 100) : 0
              return (
                <article key={f.id} className="flex flex-col rounded-xl border border-[#dde5df] bg-white p-6 shadow-sm transition hover:border-[#0b5d3b]/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-[#dff5e9] p-2.5 text-[#0b5d3b]"><Leaf className="size-5" /></div><div className="min-w-0"><h3 className="truncate font-semibold">{f.name}</h3><p className="flex items-center gap-1 text-xs text-[#66736b]"><MapPin className="size-3" />{f.city} · {f.state}</p></div></div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${statusStyle[f.status]}`}>{f.status}</span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3 border-y border-[#dde5df] py-4 text-center">
                    <div><p className="text-xl font-semibold">{nf.format(f.area)}</p><p className="text-xs text-[#66736b]">hectares</p></div>
                    <div><p className="text-xl font-semibold">{f.fields}</p><p className="text-xs text-[#66736b]">talhões</p></div>
                    <div><p className="text-xl font-semibold">{f.sensors}</p><p className="text-xs text-[#66736b]">sensores</p></div>
                  </div>
                  <div className="mt-4"><div className="flex justify-between text-xs text-[#66736b]"><span>Sensores online</span><span className="font-medium text-[#17201b]">{f.sensorsOnline}/{f.sensors}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#d1d5db]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Sensores online"><div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${pct}%` }} /></div></div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">{f.crops.map(c => <span key={c} className="rounded-full bg-[#f8faf8] px-2.5 py-1 text-xs text-[#66736b] ring-1 ring-[#dde5df]">{c}</span>)}{f.alerts > 0 && <span className="ml-auto flex items-center gap-1 rounded-full bg-[#fff7ed] px-2 py-1 text-xs text-[#b45309]"><AlertTriangle className="size-3" />{f.alerts} {f.alerts === 1 ? 'alerta' : 'alertas'}</span>}</div>
                  <button className="mt-5 self-start text-sm font-medium text-[#0b5d3b] hover:underline">Ver detalhes</button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="new-farm-title">
          <button aria-label="Fechar" className="absolute inset-0 bg-black/30" onClick={() => setModal(false)} />
          <form onSubmit={handleCreate} className="relative flex w-full max-w-md flex-col gap-4 rounded-xl border border-[#dde5df] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between"><div><h2 id="new-farm-title" className="text-lg font-semibold">Nova fazenda</h2><p className="text-sm text-[#66736b]">Cadastre uma nova propriedade.</p></div><button type="button" aria-label="Fechar" onClick={() => setModal(false)} className="rounded-lg p-1.5 text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]"><X className="size-4" /></button></div>
            <Input label="Nome da fazenda" name="name" placeholder="Ex.: Fazenda Santa Maria" required />
            <div className="grid grid-cols-[1fr_5rem] gap-3"><Input label="Cidade" name="city" placeholder="Rio Verde" required /><Input label="UF" name="state" placeholder="GO" maxLength={2} required /></div>
            <Input label="Área total (ha)" name="area" type="number" min={1} placeholder="1000" required />
            <Input label="Culturas (separadas por vírgula)" name="crops" placeholder="Soja, Milho" />
            <div className="mt-2 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setModal(false)} className="h-10 rounded-lg px-4">Cancelar</Button><Button type="submit" className="h-10 rounded-lg bg-[#0b5d3b] px-4 font-semibold text-white hover:bg-[#06452c]">Salvar fazenda</Button></div>
          </form>
        </div>
      )}
    </DashboardShell>
  )
}

function Input({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div className="flex flex-col gap-2"><label htmlFor={name} className="text-sm font-medium">{label}</label><input id={name} name={name} {...props} className="h-11 w-full rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10" /></div>
}
