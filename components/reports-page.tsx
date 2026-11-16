'use client'

import { useState } from 'react'
import { AlertTriangle, Download, Droplets, FileText, Gauge, Sprout, Thermometer } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'

const types = [
  { id: 'irrigacao', name: 'Consumo de irrigação', desc: 'Volume de água e tempo de operação por talhão.', icon: Droplets },
  { id: 'clima', name: 'Histórico climático', desc: 'Temperatura, umidade do ar, chuva e vento.', icon: Thermometer },
  { id: 'sensores', name: 'Saúde dos sensores', desc: 'Disponibilidade, falhas e bateria dos dispositivos.', icon: Gauge },
  { id: 'alertas', name: 'Ocorrências e alertas', desc: 'Alertas gerados, tempo de resposta e resolução.', icon: AlertTriangle },
  { id: 'produtividade', name: 'Produtividade por talhão', desc: 'Desenvolvimento das culturas e estimativa de colheita.', icon: Sprout },
] as const

const history = [
  { name: 'Consumo de irrigação', range: '01/11 a 07/11', farm: 'Fazenda Santa Maria', format: 'PDF', date: '08/11/2026' },
  { name: 'Histórico climático', range: '01/10 a 31/10', farm: 'Todas as fazendas', format: 'CSV', date: '01/11/2026' },
  { name: 'Saúde dos sensores', range: '25/10 a 31/10', farm: 'Sítio Água Limpa', format: 'PDF', date: '01/11/2026' },
]

const inputCls = 'h-11 w-full rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none transition focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10'

export function ReportsPage() {
  const [type, setType] = useState<string>(types[0].id)
  const [farm, setFarm] = useState('Todas as fazendas')
  const [from, setFrom] = useState('2026-11-01')
  const [to, setTo] = useState('2026-11-07')
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF')
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const invalid = !from || !to || from > to
  const selected = types.find(t => t.id === type)!

  function generate() {
    if (invalid) return
    setDone(false)
    setGenerating(true)
    window.setTimeout(() => { setGenerating(false); setDone(true) }, 1200)
  }

  return (
    <DashboardShell title="Relatórios" subtitle="Gere e exporte relatórios da sua operação agrícola.">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-4"><h2 className="text-lg font-semibold">Tipo de relatório</h2><p className="text-sm text-[#66736b]">Escolha o que deseja analisar</p></div>
          <div role="radiogroup" aria-label="Tipo de relatório" className="grid gap-4 sm:grid-cols-2">
            {types.map(t => (
              <button key={t.id} role="radio" aria-checked={type === t.id} onClick={() => { setType(t.id); setDone(false) }} className={`flex items-start gap-3 rounded-xl border bg-white p-5 text-left shadow-sm transition ${type === t.id ? 'border-[#0b5d3b] ring-4 ring-[#0b5d3b]/10' : 'border-[#dde5df] hover:border-[#0b5d3b]/40'}`}>
                <div className={`rounded-lg p-2 ${type === t.id ? 'bg-[#0b5d3b] text-white' : 'bg-[#dff5e9] text-[#0b5d3b]'}`}><t.icon className="size-5" /></div>
                <div><p className="font-semibold">{t.name}</p><p className="mt-1 text-sm text-[#66736b]">{t.desc}</p></div>
              </button>
            ))}
          </div>
        </section>

        <section className="self-start rounded-xl border border-[#dde5df] bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Parâmetros</h2><p className="text-sm text-[#66736b]">{selected.name}</p>
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2"><label htmlFor="farm" className="text-sm font-medium">Fazenda</label><select id="farm" value={farm} onChange={e => setFarm(e.target.value)} className={inputCls}><option>Todas as fazendas</option><option>Fazenda Santa Maria</option><option>Fazenda Boa Esperança</option><option>Sítio Água Limpa</option></select></div>
            <div className="grid grid-cols-2 gap-3"><div className="flex flex-col gap-2"><label htmlFor="from" className="text-sm font-medium">De</label><input id="from" type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} /></div><div className="flex flex-col gap-2"><label htmlFor="to" className="text-sm font-medium">Até</label><input id="to" type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} /></div></div>
            {from && to && from > to && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">A data inicial deve ser anterior à final.</p>}
            <div className="flex flex-col gap-2"><span className="text-sm font-medium">Formato</span><div className="flex gap-3">{(['PDF', 'CSV'] as const).map(f => <label key={f} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${format === f ? 'border-[#0b5d3b] bg-[#dff5e9] text-[#0b5d3b]' : 'border-[#dde5df] text-[#66736b]'}`}><input type="radio" name="format" checked={format === f} onChange={() => setFormat(f)} className="sr-only" />{f}</label>)}</div></div>
            <button onClick={generate} disabled={generating || invalid} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0b5d3b] text-sm font-semibold text-white shadow-sm transition hover:bg-[#06452c] disabled:pointer-events-none disabled:opacity-50">{generating ? <><span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Gerando...</> : <><FileText className="size-4" /> Gerar relatório</>}</button>
            {done && <p role="status" className="rounded-lg bg-[#dff5e9] px-3 py-2.5 text-sm text-[#0b5d3b]">Relatório gerado com sucesso. Em breve ficará disponível para download.</p>}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-[#dde5df] bg-white shadow-sm">
        <div className="p-6"><h2 className="font-semibold">Relatórios recentes</h2><p className="text-sm text-[#66736b]">Últimos relatórios gerados</p></div>
        <div className="overflow-x-auto border-t border-[#dde5df]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-6 py-3 font-medium">Relatório</th><th className="px-4 py-3 font-medium">Período</th><th className="px-4 py-3 font-medium">Fazenda</th><th className="px-4 py-3 font-medium">Gerado em</th><th className="px-6 py-3 text-right font-medium">Ação</th></tr></thead>
            <tbody>{history.map(h => <tr key={h.name + h.date} className="border-t border-[#dde5df] transition hover:bg-[#f8faf8]"><td className="px-6 py-4"><p className="font-medium">{h.name}</p><span className="mt-1 inline-block rounded-full bg-[#dff5e9] px-2 py-0.5 text-xs font-medium text-[#0b5d3b]">{h.format}</span></td><td className="px-4 py-4">{h.range}</td><td className="px-4 py-4">{h.farm}</td><td className="px-4 py-4 text-[#66736b]">{h.date}</td><td className="px-6 py-4 text-right"><button className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0b5d3b] hover:underline"><Download className="size-3.5" /> Baixar</button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  )
}
