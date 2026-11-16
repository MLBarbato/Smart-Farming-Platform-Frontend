'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, ClipboardList, Pencil, Play, Plus, Search, Sprout, Wheat, X, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard-shell'

type Status = 'PLANEJADO' | 'EM_ANDAMENTO' | 'COLHIDO' | 'CANCELADO'
type Planting = { id: number; farm: string; field: string; crop: string; season: string; type: string; plantingDate: string; harvestDate: string; status: Status }

// Dados fictícios — catálogo de culturas (somente leitura nesta tela) e talhões por fazenda.
const crops = ['Soja', 'Milho', 'Café', 'Feijão', 'Algodão', 'Trigo']
const seasons = ['2024/25', '2025/26', '2026/27', '2027/28']
const plantingTypes = ['Plantio direto', 'Convencional', 'Cultivo mínimo', 'Replantio']
const fieldsByFarm: Record<string, string[]> = {
  'Fazenda Santa Maria': ['Talhão A1', 'Talhão A2', 'Talhão B1'],
  'Fazenda Boa Esperança': ['Talhão 01', 'Talhão 02'],
  'Sítio Água Limpa': ['Talhão Café 1', 'Talhão Café 2'],
}
const farms = Object.keys(fieldsByFarm)
const allFields = Array.from(new Set(Object.values(fieldsByFarm).flat()))

const initialPlantings: Planting[] = [
  { id: 1, farm: 'Fazenda Santa Maria', field: 'Talhão A1', crop: 'Soja', season: '2026/27', type: 'Plantio direto', plantingDate: '2026-10-05', harvestDate: '2027-02-10', status: 'EM_ANDAMENTO' },
  { id: 2, farm: 'Fazenda Santa Maria', field: 'Talhão A2', crop: 'Milho', season: '2026/27', type: 'Plantio direto', plantingDate: '2026-10-12', harvestDate: '2027-03-05', status: 'EM_ANDAMENTO' },
  { id: 3, farm: 'Fazenda Santa Maria', field: 'Talhão B1', crop: 'Soja', season: '2026/27', type: 'Convencional', plantingDate: '2026-11-25', harvestDate: '2027-03-15', status: 'PLANEJADO' },
  { id: 4, farm: 'Fazenda Santa Maria', field: 'Talhão A1', crop: 'Milho', season: '2025/26', type: 'Plantio direto', plantingDate: '2026-02-18', harvestDate: '2026-07-10', status: 'COLHIDO' },
  { id: 5, farm: 'Fazenda Santa Maria', field: 'Talhão A1', crop: 'Soja', season: '2025/26', type: 'Plantio direto', plantingDate: '2025-09-28', harvestDate: '2026-02-05', status: 'COLHIDO' },
  { id: 6, farm: 'Fazenda Boa Esperança', field: 'Talhão 01', crop: 'Soja', season: '2026/27', type: 'Plantio direto', plantingDate: '2026-10-01', harvestDate: '2027-02-08', status: 'EM_ANDAMENTO' },
  { id: 7, farm: 'Fazenda Boa Esperança', field: 'Talhão 02', crop: 'Algodão', season: '2026/27', type: 'Convencional', plantingDate: '2026-12-02', harvestDate: '2027-06-20', status: 'PLANEJADO' },
  { id: 8, farm: 'Fazenda Boa Esperança', field: 'Talhão 02', crop: 'Feijão', season: '2025/26', type: 'Cultivo mínimo', plantingDate: '2025-11-10', harvestDate: '2026-02-12', status: 'CANCELADO' },
  { id: 9, farm: 'Sítio Água Limpa', field: 'Talhão Café 1', crop: 'Café', season: '2026/27', type: 'Convencional', plantingDate: '2026-09-15', harvestDate: '2027-06-30', status: 'EM_ANDAMENTO' },
  { id: 10, farm: 'Sítio Água Limpa', field: 'Talhão Café 2', crop: 'Trigo', season: '2027/28', type: 'Plantio direto', plantingDate: '2027-05-10', harvestDate: '2027-09-20', status: 'PLANEJADO' },
]

const statusLabel: Record<Status, string> = { PLANEJADO: 'Planejado', EM_ANDAMENTO: 'Em andamento', COLHIDO: 'Colhido', CANCELADO: 'Cancelado' }
const statusStyle: Record<Status, string> = {
  PLANEJADO: 'bg-[#eff6ff] text-[#1d4ed8]',
  EM_ANDAMENTO: 'bg-[#dff5e9] text-[#0b5d3b]',
  COLHIDO: 'bg-[#f1f3f2] text-[#66736b]',
  CANCELADO: 'bg-[#fef2f2] text-[#b91c1c]',
}
const statuses = Object.keys(statusLabel) as Status[]

const fmtDate = (d: string) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—')
const selectCls = 'h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]'

type FormState = { farm: string; field: string; crop: string; season: string; type: string; plantingDate: string; harvestDate: string }
const emptyForm: FormState = { farm: '', field: '', crop: '', season: '', type: '', plantingDate: '', harvestDate: '' }

export function PlantingsPage() {
  const [plantings, setPlantings] = useState(initialPlantings)
  const [query, setQuery] = useState('')
  const [farm, setFarm] = useState('Todas')
  const [field, setField] = useState('Todos')
  const [crop, setCrop] = useState('Todas')
  const [season, setSeason] = useState('Todas')
  const [status, setStatus] = useState<'Todos' | Status>('Todos')
  const [form, setForm] = useState<FormState | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const selected = plantings.find(p => p.id === selectedId) ?? null
  const filterFields = farm === 'Todas' ? allFields : fieldsByFarm[farm]

  const filtered = useMemo(() => plantings.filter(p =>
    (farm === 'Todas' || p.farm === farm) && (field === 'Todos' || p.field === field) &&
    (crop === 'Todas' || p.crop === crop) && (season === 'Todas' || p.season === season) &&
    (status === 'Todos' || p.status === status) &&
    `${p.crop} ${p.field} ${p.farm}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [plantings, query, farm, field, crop, season, status])

  const count = (s: Status) => plantings.filter(p => p.status === s).length

  useEffect(() => {
    if (!form && !selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (form) closeForm(); else setSelectedId(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [form, selected])

  function openCreate() { setEditingId(null); setForm(emptyForm) }
  function openEdit(p: Planting) { setEditingId(p.id); setForm({ farm: p.farm, field: p.field, crop: p.crop, season: p.season, type: p.type, plantingDate: p.plantingDate, harvestDate: p.harvestDate }) }
  function closeForm() { setForm(null); setEditingId(null) }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form) return
    if (editingId) setPlantings(prev => prev.map(p => p.id === editingId ? { ...p, ...form } : p))
    else setPlantings(prev => [{ id: Date.now(), ...form, status: 'PLANEJADO' }, ...prev])
    closeForm()
  }

  function changeStatus(id: number, next: Status) { setPlantings(prev => prev.map(p => p.id === id ? { ...p, status: next } : p)) }

  const harvestInvalid = !!form && !!form.plantingDate && !!form.harvestDate && form.harvestDate < form.plantingDate
  const newButton = (cls: string, label: string) => <Button onClick={openCreate} className={`h-10 gap-2 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c] ${cls}`}><Plus /> {label}</Button>
  const badge = (s: Status) => <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${statusStyle[s]}`}>{statusLabel[s]}</span>

  return (
    <DashboardShell title="Plantios" subtitle="Cadastre e acompanhe os plantios de cada safra." actions={newButton('hidden sm:inline-flex', 'Novo plantio')}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([['Total de plantios', plantings.length, 'Todas as safras', ClipboardList], ['Em andamento', count('EM_ANDAMENTO'), 'Culturas no campo', Sprout], ['Planejados', count('PLANEJADO'), 'Aguardando início', CalendarClock], ['Colhidos', count('COLHIDO'), 'Safras concluídas', Wheat]] as const).map(([title, value, desc, Icon]) => (
          <div key={title} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{title}</span><Icon className="size-5 text-[#0b5d3b]" /></div><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#66736b]">{desc}</p></div>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Seus plantios</h2><p className="text-sm text-[#66736b]">{filtered.length} de {plantings.length} plantios</p></div>
          <div className="flex w-full flex-wrap gap-3 xl:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-none"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar plantio" placeholder="Buscar" className="h-10 w-full rounded-lg border border-[#dde5df] bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10" /></div>
            <select value={farm} onChange={e => { setFarm(e.target.value); setField('Todos') }} aria-label="Filtrar por fazenda" className={selectCls}><option value="Todas">Todas as fazendas</option>{farms.map(f => <option key={f}>{f}</option>)}</select>
            <select value={field} onChange={e => setField(e.target.value)} aria-label="Filtrar por talhão" className={selectCls}><option value="Todos">Todos os talhões</option>{filterFields.map(f => <option key={f}>{f}</option>)}</select>
            <select value={crop} onChange={e => setCrop(e.target.value)} aria-label="Filtrar por cultura" className={selectCls}><option value="Todas">Todas as culturas</option>{crops.map(c => <option key={c}>{c}</option>)}</select>
            <select value={season} onChange={e => setSeason(e.target.value)} aria-label="Filtrar por safra" className={selectCls}><option value="Todas">Todas as safras</option>{seasons.map(s => <option key={s}>{s}</option>)}</select>
            <select value={status} onChange={e => setStatus(e.target.value as 'Todos' | Status)} aria-label="Filtrar por status" className={selectCls}><option value="Todos">Todos os status</option>{statuses.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}</select>
            {newButton('sm:hidden', 'Novo')}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-[#dde5df] bg-white px-6 py-14 text-center"><div className="rounded-xl bg-[#dff5e9] p-3 text-[#0b5d3b]"><Sprout /></div><p className="mt-4 font-semibold">Nenhum plantio encontrado</p><p className="mt-1 text-sm text-[#66736b]">Ajuste os filtros ou cadastre um novo plantio.</p></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#dde5df] bg-white shadow-sm">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-[#dde5df] bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-5 py-3 font-medium">Fazenda</th><th className="px-5 py-3 font-medium">Talhão</th><th className="px-5 py-3 font-medium">Cultura</th><th className="px-5 py-3 font-medium">Safra</th><th className="px-5 py-3 font-medium">Plantio</th><th className="px-5 py-3 font-medium">Prev. colheita</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3"><span className="sr-only">Ações</span></th></tr></thead>
              <tbody className="divide-y divide-[#dde5df]">
                {filtered.map(p => (
                  <tr key={p.id} className="transition hover:bg-[#f8faf8]">
                    <td className="px-5 py-4 text-[#66736b]">{p.farm}</td>
                    <td className="px-5 py-4 font-medium">{p.field}</td>
                    <td className="px-5 py-4">{p.crop}</td>
                    <td className="px-5 py-4 tabular-nums">{p.season}</td>
                    <td className="px-5 py-4 tabular-nums">{fmtDate(p.plantingDate)}</td>
                    <td className="px-5 py-4 tabular-nums">{fmtDate(p.harvestDate)}</td>
                    <td className="px-5 py-4">{badge(p.status)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right"><button onClick={() => setSelectedId(p.id)} aria-label={`Ver detalhes do plantio de ${p.crop} em ${p.field}`} className="text-sm font-medium text-[#0b5d3b] hover:underline">Ver detalhes</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-labelledby="planting-form-title">
          <button aria-label="Fechar" className="fixed inset-0 bg-black/30" onClick={closeForm} />
          <form onSubmit={handleSubmit} className="relative my-auto flex w-full max-w-lg flex-col gap-4 rounded-xl border border-[#dde5df] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between"><div><h2 id="planting-form-title" className="text-lg font-semibold">{editingId ? 'Editar plantio' : 'Novo plantio'}</h2><p className="text-sm text-[#66736b]">{editingId ? 'Atualize os dados do plantio.' : 'O plantio será criado com o status Planejado.'}</p></div><button type="button" aria-label="Fechar" onClick={closeForm} className="rounded-lg p-1.5 text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]"><X className="size-4" /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Fazenda" name="farm" value={form.farm} onChange={v => setForm({ ...form, farm: v, field: '' })} options={farms} placeholder="Selecione a fazenda" />
              <Select label="Talhão" name="field" value={form.field} onChange={v => setForm({ ...form, field: v })} options={form.farm ? fieldsByFarm[form.farm] : []} placeholder={form.farm ? 'Selecione o talhão' : 'Escolha a fazenda primeiro'} disabled={!form.farm} />
              <Select label="Cultura" name="crop" value={form.crop} onChange={v => setForm({ ...form, crop: v })} options={crops} placeholder="Selecione a cultura" hint="Catálogo de culturas cadastradas." />
              <Select label="Safra" name="season" value={form.season} onChange={v => setForm({ ...form, season: v })} options={seasons} placeholder="Selecione a safra" />
              <div className="sm:col-span-2"><Select label="Tipo de plantio" name="type" value={form.type} onChange={v => setForm({ ...form, type: v })} options={plantingTypes} placeholder="Selecione o tipo" /></div>
              <DateInput label="Data do plantio" name="plantingDate" value={form.plantingDate} onChange={v => setForm({ ...form, plantingDate: v })} />
              <DateInput label="Previsão de colheita" name="harvestDate" value={form.harvestDate} min={form.plantingDate || undefined} onChange={v => setForm({ ...form, harvestDate: v })} error={harvestInvalid ? 'Deve ser posterior ao plantio.' : undefined} />
            </div>
            <div className="mt-2 flex justify-end gap-3"><Button type="button" variant="outline" onClick={closeForm} className="h-10 rounded-lg px-4">Cancelar</Button><Button type="submit" disabled={harvestInvalid} className="h-10 rounded-lg bg-[#0b5d3b] px-4 font-semibold text-white hover:bg-[#06452c]">{editingId ? 'Salvar alterações' : 'Salvar plantio'}</Button></div>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="planting-detail-title">
          <button aria-label="Fechar" className="absolute inset-0 bg-black/30" onClick={() => setSelectedId(null)} />
          <aside className="relative flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto border-l border-[#dde5df] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h2 id="planting-detail-title" className="truncate text-xl font-semibold">{selected.crop} · {selected.field}</h2><p className="text-sm text-[#66736b]">{selected.farm}</p></div>
              <div className="flex items-center gap-2">{badge(selected.status)}<button aria-label="Fechar" onClick={() => setSelectedId(null)} className="rounded-lg p-1.5 text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]"><X className="size-4" /></button></div>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold">Informações do plantio</h3>
              <dl className="grid grid-cols-2 gap-4 rounded-xl border border-[#dde5df] p-4 text-sm">
                <div><dt className="text-xs text-[#66736b]">Safra</dt><dd className="font-medium">{selected.season}</dd></div>
                <div><dt className="text-xs text-[#66736b]">Tipo de plantio</dt><dd className="font-medium">{selected.type}</dd></div>
                <div><dt className="text-xs text-[#66736b]">Data do plantio</dt><dd className="font-medium">{fmtDate(selected.plantingDate)}</dd></div>
                <div><dt className="text-xs text-[#66736b]">Previsão de colheita</dt><dd className="font-medium">{fmtDate(selected.harvestDate)}</dd></div>
              </dl>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold">Acompanhamento</h3>
              {selected.status === 'COLHIDO' || selected.status === 'CANCELADO' ? (
                <p className="rounded-xl border border-dashed border-[#dde5df] p-4 text-center text-sm text-[#66736b]">Este plantio foi {selected.status === 'COLHIDO' ? 'colhido' : 'cancelado'} e não pode mais ser alterado.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selected.status === 'PLANEJADO' && <Button onClick={() => changeStatus(selected.id, 'EM_ANDAMENTO')} className="h-10 justify-start gap-2 rounded-lg bg-[#0b5d3b] px-4 font-semibold text-white hover:bg-[#06452c]"><Play className="size-4" /> Iniciar plantio</Button>}
                  {selected.status === 'EM_ANDAMENTO' && <Button onClick={() => changeStatus(selected.id, 'COLHIDO')} className="h-10 justify-start gap-2 rounded-lg bg-[#0b5d3b] px-4 font-semibold text-white hover:bg-[#06452c]"><CheckCircle2 className="size-4" /> Registrar colheita</Button>}
                  <Button variant="outline" onClick={() => openEdit(selected)} className="h-10 justify-start gap-2 rounded-lg px-4"><Pencil className="size-4" /> Editar plantio</Button>
                  <Button variant="outline" onClick={() => changeStatus(selected.id, 'CANCELADO')} className="h-10 justify-start gap-2 rounded-lg px-4 text-[#b91c1c] hover:text-[#b91c1c]"><XCircle className="size-4" /> Cancelar plantio</Button>
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </DashboardShell>
  )
}

const fieldCls = 'h-11 w-full rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none transition focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10 disabled:bg-[#f8faf8] disabled:text-[#66736b]'

function Select({ label, name, value, onChange, options, placeholder, hint, disabled }: { label: string; name: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string; hint?: string; disabled?: boolean }) {
  return <div className="flex flex-col gap-2"><label htmlFor={name} className="text-sm font-medium">{label}</label><select id={name} name={name} value={value} onChange={e => onChange(e.target.value)} required disabled={disabled} className={fieldCls}><option value="" disabled>{placeholder}</option>{options.map(o => <option key={o}>{o}</option>)}</select>{hint && <p className="text-xs text-[#66736b]">{hint}</p>}</div>
}

function DateInput({ label, name, value, onChange, min, error }: { label: string; name: string; value: string; onChange: (v: string) => void; min?: string; error?: string }) {
  return <div className="flex flex-col gap-2"><label htmlFor={name} className="text-sm font-medium">{label}</label><input id={name} name={name} type="date" value={value} min={min} onChange={e => onChange(e.target.value)} required aria-invalid={!!error} className={fieldCls} />{error && <p className="text-xs text-[#b91c1c]">{error}</p>}</div>
}
