'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Cpu, Info, Pencil, Plus, Power, Radio, Search, Trash2, X, Gauge, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard-shell'
import {
  Device, SensorStatus, allFields, deviceModels, farms, fieldsByFarm, formatReadAt, getLastReading, getReadings, getSensorStatus,
  initialDevices, measurements, measurementTypes, sensorStatuses, statusLabel,
} from '@/lib/sensors-data'

const statusStyle: Record<SensorStatus, string> = {
  ATIVO: 'bg-[#dff5e9] text-[#0b5d3b]',
  INATIVO: 'bg-[#f1f3f2] text-[#66736b]',
  ALERTA: 'bg-[#fff7ed] text-[#b45309]',
  FALHA: 'bg-[#fef2f2] text-[#b91c1c]',
}
const selectCls = 'h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]'
const fieldCls = 'h-11 w-full rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10 disabled:bg-[#f8faf8] disabled:text-[#66736b]'

type SensorForm = { key: number; id?: number; name: string; measurement: string; unit: string }
type DeviceForm = { code: string; name: string; model: string; farm: string; field: string; sensors: SensorForm[] }

const Badge = ({ s }: { s: SensorStatus }) => <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${statusStyle[s]}`}>{statusLabel[s]}</span>

export function SensorsPage() {
  const [devices, setDevices] = useState(initialDevices)
  const [query, setQuery] = useState('')
  const [farm, setFarm] = useState('Todas')
  const [field, setField] = useState('Todos')
  const [type, setType] = useState('Todos')
  const [status, setStatus] = useState<'Todos' | SensorStatus>('Todos')
  const [form, setForm] = useState<DeviceForm | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const keySeq = useRef(0)
  const idSeq = useRef(10_000)

  const selected = devices.find(d => d.id === selectedId) ?? null
  const filterFields = farm === 'Todas' ? allFields : fieldsByFarm[farm]

  // Uma linha por sensor (cada sensor pertence a um único dispositivo)
  const rows = useMemo(() => devices.flatMap(d => d.sensors.map(s => ({ device: d, sensor: s, status: getSensorStatus(s.id, d), last: getLastReading(s.id) }))), [devices])
  const filtered = useMemo(() => rows.filter(r =>
    (farm === 'Todas' || r.device.farm === farm) && (field === 'Todos' || r.device.field === field) &&
    (type === 'Todos' || r.sensor.measurement === type) && (status === 'Todos' || r.status === status) &&
    `${r.device.code} ${r.device.name} ${r.sensor.name}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [rows, query, farm, field, type, status])

  const count = (...s: SensorStatus[]) => rows.filter(r => s.includes(r.status)).length

  const codeTaken = !!form && devices.some(d => d.id !== editingId && d.code.toLowerCase() === form.code.trim().toLowerCase())

  useEffect(() => {
    if (!form && !selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (form) closeForm(); else setSelectedId(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [form, selected])

  const newSensor = (): SensorForm => ({ key: ++keySeq.current, name: '', measurement: '', unit: '' })
  function openCreate() { setEditingId(null); setForm({ code: '', name: '', model: '', farm: '', field: '', sensors: [newSensor()] }) }
  function openEdit(d: Device) {
    setEditingId(d.id)
    setForm({ code: d.code, name: d.name, model: d.model, farm: d.farm, field: d.field, sensors: d.sensors.map(s => ({ key: ++keySeq.current, id: s.id, name: s.name, measurement: s.measurement, unit: s.unit })) })
  }
  function closeForm() { setForm(null); setEditingId(null) }

  function updateSensor(key: number, patch: Partial<SensorForm>) {
    setForm(f => f && { ...f, sensors: f.sensors.map(s => s.key === key ? { ...s, ...patch } : s) })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form || codeTaken) return
    const id = editingId ?? ++idSeq.current
    const device: Device = {
      id, code: form.code.trim(), name: form.name.trim(), model: form.model, farm: form.farm, field: form.field,
      status: devices.find(d => d.id === id)?.status ?? 'ATIVO',
      sensors: form.sensors.map(s => ({ id: s.id ?? ++idSeq.current, deviceId: id, name: s.name.trim(), measurement: s.measurement, unit: s.unit })),
    }
    setDevices(prev => editingId ? prev.map(d => d.id === id ? device : d) : [device, ...prev])
    closeForm()
  }

  function toggleActive(d: Device) {
    setDevices(prev => prev.map(x => x.id === d.id ? { ...x, status: d.status === 'INATIVO' ? 'ATIVO' : 'INATIVO' } : x))
  }

  const newButton = (cls: string, label: string) => <Button onClick={openCreate} className={`h-10 gap-2 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c] ${cls}`}><Plus /> {label}</Button>

  return (
    <DashboardShell title="Sensores" subtitle="Cadastre e acompanhe dispositivos e sensores das fazendas." actions={newButton('hidden sm:inline-flex', 'Novo dispositivo')}>
      <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 text-sm text-[#92400e]"><Info className="mt-0.5 size-4 shrink-0" /><p><strong>Dados simulados.</strong> Ainda não há dispositivos físicos integrados; dispositivos, sensores e leituras exibidos aqui são fictícios.</p></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([['Total de sensores', rows.length, `em ${devices.length} dispositivos`, Gauge], ['Ativos', count('ATIVO'), 'Em funcionamento normal', Radio], ['Inativos', count('INATIVO'), 'Desativados', PowerOff], ['Com alertas', count('ALERTA', 'FALHA'), 'Alerta ou falha', AlertTriangle]] as const).map(([title, value, desc, Icon]) => (
          <div key={title} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{title}</span><Icon className="size-5 text-[#0b5d3b]" /></div><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#66736b]">{desc}</p></div>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Seus sensores</h2><p className="text-sm text-[#66736b]">{filtered.length} de {rows.length} sensores</p></div>
          <div className="flex w-full flex-wrap gap-3 xl:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-none"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar sensor" placeholder="Buscar" className="h-10 w-full rounded-lg border border-[#dde5df] bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10" /></div>
            <select value={farm} onChange={e => { setFarm(e.target.value); setField('Todos') }} aria-label="Filtrar por fazenda" className={selectCls}><option value="Todas">Todas as fazendas</option>{farms.map(f => <option key={f}>{f}</option>)}</select>
            <select value={field} onChange={e => setField(e.target.value)} aria-label="Filtrar por talhão" className={selectCls}><option value="Todos">Todos os talhões</option>{filterFields.map(f => <option key={f}>{f}</option>)}</select>
            <select value={type} onChange={e => setType(e.target.value)} aria-label="Filtrar por tipo de sensor" className={selectCls}><option value="Todos">Todos os tipos</option>{measurementTypes.map(t => <option key={t}>{t}</option>)}</select>
            <select value={status} onChange={e => setStatus(e.target.value as 'Todos' | SensorStatus)} aria-label="Filtrar por status" className={selectCls}><option value="Todos">Todos os status</option>{sensorStatuses.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}</select>
            {newButton('sm:hidden', 'Novo')}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-[#dde5df] bg-white px-6 py-14 text-center"><div className="rounded-xl bg-[#dff5e9] p-3 text-[#0b5d3b]"><Cpu /></div><p className="mt-4 font-semibold">Nenhum sensor encontrado</p><p className="mt-1 text-sm text-[#66736b]">Ajuste os filtros ou cadastre um novo dispositivo.</p></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#dde5df] bg-white shadow-sm">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-[#dde5df] bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-5 py-3 font-medium">Dispositivo</th><th className="px-5 py-3 font-medium">Sensor</th><th className="px-5 py-3 font-medium">Medição</th><th className="px-5 py-3 font-medium">Fazenda</th><th className="px-5 py-3 font-medium">Talhão</th><th className="px-5 py-3 font-medium">Última leitura</th><th className="px-5 py-3 font-medium">Unidade</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3"><span className="sr-only">Ações</span></th></tr></thead>
              <tbody className="divide-y divide-[#dde5df]">
                {filtered.map(({ device: d, sensor: s, status: st, last }) => (
                  <tr key={s.id} className="transition hover:bg-[#f8faf8]">
                    <td className="px-5 py-4"><p className="font-medium">{d.code}</p><p className="text-xs text-[#66736b]">{d.name}</p></td>
                    <td className="px-5 py-4">{s.name}</td>
                    <td className="px-5 py-4 text-[#66736b]">{s.measurement}</td>
                    <td className="px-5 py-4 text-[#66736b]">{d.farm}</td>
                    <td className="px-5 py-4">{d.field}</td>
                    <td className="px-5 py-4 tabular-nums">{last ? <><p className="font-medium">{last.value}</p><p className="text-xs text-[#66736b]">{formatReadAt(last.readAt)}</p></> : <span className="text-xs text-[#66736b]">Sem leituras</span>}</td>
                    <td className="px-5 py-4 text-[#66736b]">{s.unit}</td>
                    <td className="px-5 py-4"><Badge s={st} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-right"><button onClick={() => setSelectedId(d.id)} aria-label={`Ver detalhes do dispositivo ${d.code}`} className="text-sm font-medium text-[#0b5d3b] hover:underline">Ver detalhes</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-labelledby="device-form-title">
          <button aria-label="Fechar" className="fixed inset-0 bg-black/30" onClick={closeForm} />
          <form onSubmit={handleSubmit} className="relative my-auto flex w-full max-w-2xl flex-col gap-4 rounded-xl border border-[#dde5df] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between"><div><h2 id="device-form-title" className="text-lg font-semibold">{editingId ? 'Editar dispositivo' : 'Novo dispositivo'}</h2><p className="text-sm text-[#66736b]">Informe o dispositivo e os sensores instalados nele.</p></div><button type="button" aria-label="Fechar" onClick={closeForm} className="rounded-lg p-1.5 text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]"><X className="size-4" /></button></div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Identificação" id="code" error={codeTaken ? 'Já existe um dispositivo com esta identificação.' : undefined}><input id="code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Ex.: DEV-008" required aria-invalid={codeTaken} className={fieldCls} /></Field>
              <Field label="Nome do dispositivo" id="dname"><input id="dname" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Estação A1 Norte" required className={fieldCls} /></Field>
              <div className="sm:col-span-2"><Field label="Tipo / modelo" id="model"><Select id="model" value={form.model} onChange={v => setForm({ ...form, model: v })} options={deviceModels} placeholder="Selecione o modelo" /></Field></div>
              <Field label="Fazenda" id="farm"><Select id="farm" value={form.farm} onChange={v => setForm({ ...form, farm: v, field: '' })} options={farms} placeholder="Selecione a fazenda" /></Field>
              <Field label="Talhão de instalação" id="field"><Select id="field" value={form.field} onChange={v => setForm({ ...form, field: v })} options={form.farm ? fieldsByFarm[form.farm] : []} placeholder={form.farm ? 'Selecione o talhão' : 'Escolha a fazenda primeiro'} disabled={!form.farm} /></Field>
            </div>

            <fieldset className="flex flex-col gap-3">
              <div className="flex items-center justify-between"><legend className="text-sm font-semibold">Sensores do dispositivo ({form.sensors.length})</legend><Button type="button" variant="outline" onClick={() => setForm({ ...form, sensors: [...form.sensors, newSensor()] })} className="h-8 gap-1 rounded-lg px-3 text-xs"><Plus className="size-3" /> Adicionar sensor</Button></div>
              {form.sensors.map((s, i) => (
                <div key={s.key} className="grid gap-3 rounded-xl border border-[#dde5df] p-3 sm:grid-cols-[1fr_1fr_6rem_auto]">
                  <Field label="Nome do sensor" id={`sn-${s.key}`}><input id={`sn-${s.key}`} value={s.name} onChange={e => updateSensor(s.key, { name: e.target.value })} placeholder="Ex.: Umidade 20 cm" required className={fieldCls} /></Field>
                  <Field label="Tipo de medição" id={`sm-${s.key}`}><Select id={`sm-${s.key}`} value={s.measurement} onChange={v => updateSensor(s.key, { measurement: v, unit: measurements[v][0] })} options={measurementTypes} placeholder="Selecione" /></Field>
                  <Field label="Unidade" id={`su-${s.key}`}><Select id={`su-${s.key}`} value={s.unit} onChange={v => updateSensor(s.key, { unit: v })} options={s.measurement ? measurements[s.measurement] : []} placeholder="—" disabled={!s.measurement} /></Field>
                  <button type="button" aria-label={`Remover sensor ${i + 1}`} disabled={form.sensors.length === 1} onClick={() => setForm({ ...form, sensors: form.sensors.filter(x => x.key !== s.key) })} className="self-end rounded-lg p-3 text-[#66736b] hover:bg-[#fef2f2] hover:text-[#b91c1c] disabled:pointer-events-none disabled:opacity-40"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </fieldset>

            <div className="mt-2 flex justify-end gap-3"><Button type="button" variant="outline" onClick={closeForm} className="h-10 rounded-lg px-4">Cancelar</Button><Button type="submit" disabled={codeTaken} className="h-10 rounded-lg bg-[#0b5d3b] px-4 font-semibold text-white hover:bg-[#06452c]">{editingId ? 'Salvar alterações' : 'Salvar dispositivo'}</Button></div>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="device-detail-title">
          <button aria-label="Fechar" className="absolute inset-0 bg-black/30" onClick={() => setSelectedId(null)} />
          <aside className="relative flex h-full w-full max-w-lg flex-col gap-6 overflow-y-auto border-l border-[#dde5df] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h2 id="device-detail-title" className="truncate text-xl font-semibold">{selected.name}</h2><p className="text-sm text-[#66736b]">{selected.code}</p></div>
              <div className="flex items-center gap-2"><Badge s={selected.status} /><button aria-label="Fechar" onClick={() => setSelectedId(null)} className="rounded-lg p-1.5 text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]"><X className="size-4" /></button></div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openEdit(selected)} className="h-10 gap-2 rounded-lg px-4"><Pencil className="size-4" /> Editar</Button>
              <Button variant="outline" onClick={() => toggleActive(selected)} className="h-10 gap-2 rounded-lg px-4"><Power className="size-4" /> {selected.status === 'INATIVO' ? 'Reativar' : 'Desativar'}</Button>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold">Informações do dispositivo</h3>
              <dl className="grid grid-cols-2 gap-4 rounded-xl border border-[#dde5df] p-4 text-sm">
                <div className="col-span-2"><dt className="text-xs text-[#66736b]">Modelo</dt><dd className="font-medium">{selected.model}</dd></div>
                <div><dt className="text-xs text-[#66736b]">Fazenda</dt><dd className="font-medium">{selected.farm}</dd></div>
                <div><dt className="text-xs text-[#66736b]">Talhão</dt><dd className="font-medium">{selected.field}</dd></div>
              </dl>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold">Sensores e leituras recentes <span className="font-normal text-[#66736b]">(simuladas)</span></h3>
              <ul className="flex flex-col gap-3">
                {selected.sensors.map(s => {
                  const st = getSensorStatus(s.id, selected)
                  const readings = getReadings(s.id, 5)
                  return (
                    <li key={s.id} className="rounded-xl border border-[#dde5df] p-4">
                      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{s.name}</p><p className="text-xs text-[#66736b]">{s.measurement} · {s.unit}</p></div><Badge s={st} /></div>
                      {readings.length === 0 ? <p className="mt-3 text-xs text-[#66736b]">Aguardando a primeira leitura.</p> : (
                        <table className="mt-3 w-full text-xs tabular-nums"><thead className="text-left text-[#66736b]"><tr><th className="pb-1 font-medium">Data/hora</th><th className="pb-1 text-right font-medium">Valor</th></tr></thead><tbody>{readings.map(r => <tr key={r.id} className="border-t border-[#dde5df]"><td className="py-1">{formatReadAt(r.readAt)}</td><td className="py-1 text-right">{r.value} {s.unit}</td></tr>)}</tbody></table>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </DashboardShell>
  )
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><label htmlFor={id} className="text-sm font-medium">{label}</label>{children}{error && <p className="text-xs text-[#b91c1c]">{error}</p>}</div>
}

function Select({ id, value, onChange, options, placeholder, disabled }: { id: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string; disabled?: boolean }) {
  return <select id={id} value={value} onChange={e => onChange(e.target.value)} required disabled={disabled} className={fieldCls}><option value="" disabled>{placeholder}</option>{options.map(o => <option key={o}>{o}</option>)}</select>
}
