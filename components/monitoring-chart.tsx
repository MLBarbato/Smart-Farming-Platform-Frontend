'use client'

import { useId, useMemo, useState } from 'react'
import { LineChart, Table2 } from 'lucide-react'
import { dividirEmTrechos } from '@/lib/monitoramento'

// Categórica fixa (slots 1–5 da paleta de referência). A cor segue a entidade (sensor), não o ranking.
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
export const FALLBACK_COLOR = '#8a948d'
const W = 640, H = 260, M = { l: 48, r: 16, t: 16, b: 28 }

/** Marcas "redondas" do eixo Y; a primeira fica em ou abaixo de `min` e a última em ou acima de `max`, para nada sair do gráfico. */
export function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1
  const raw = span / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw) ?? raw
  const start = Math.floor(min / step + 1e-9) * step
  const ticks: number[] = []
  for (let i = 0; i < 100; i++) {
    const v = Number((start + i * step).toFixed(6))
    ticks.push(v)
    if (v >= max - step * 1e-9 && ticks.length > 1) break
  }
  return ticks
}

export const fmtTick = (v: number) => (Math.abs(v) >= 10000 ? `${v / 1000}K` : String(Number(v.toFixed(2))))

export type Serie = { id: number; rotulo: string; cor: string; pontos: { t: number; v: number }[]; semComunicacao?: boolean }

const dataHora = (t: number) => new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** Gráfico de linhas por sensor sobre o tempo real (`t` em ms); a faixa sombreada é o intervalo esperado. */
export function MonitoringChart({ titulo, unidade, faixa, series, de, ate, passoMs }: {
  titulo: string
  unidade?: string
  faixa?: { min: number; max: number }
  series: Serie[]
  de: number
  ate: number
  passoMs: number
}) {
  const uid = useId()
  const [tabela, setTabela] = useState(false)
  const [hover, setHover] = useState<number | null>(null)

  const vals = series.flatMap(s => s.pontos.map(p => p.v))
  let lo = Math.min(...vals, faixa?.min ?? Infinity), hi = Math.max(...vals, faixa?.max ?? -Infinity)
  if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1 }
  if (faixa && faixa.max > hi * 3 && vals.length) hi = Math.max(...vals, faixa.min) * 1.3 + 1 // faixas muito largas não esmagam a série
  const pad = (hi - lo) * 0.08 || 1
  const ticks = niceTicks(Math.max(0, lo - pad), hi + pad)
  const y0 = ticks[0], y1 = ticks[ticks.length - 1]
  const x = (t: number) => M.l + ((t - de) / (ate - de)) * (W - M.l - M.r)
  const y = (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b)
  const xticks = Array.from({ length: 5 }, (_, i) => de + ((ate - de) * i) / 4)
  const fmtX = (t: number) => new Date(t).toLocaleString('pt-BR', (ate - de) <= 48 * 3600_000 ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit' })

  function aoMover(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    setHover(Math.min(ate, Math.max(de, de + ((px - M.l) / (W - M.l - M.r)) * (ate - de))))
  }
  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    setHover(h => Math.min(ate, Math.max(de, (h ?? ate) + (e.key === 'ArrowLeft' ? -passoMs : passoMs))))
  }

  const maisProximo = (pts: { t: number; v: number }[], t: number) => {
    let melhor: { t: number; v: number } | null = null
    for (const p of pts) if (!melhor || Math.abs(p.t - t) < Math.abs(melhor.t - t)) melhor = p
    return melhor && Math.abs(melhor.t - t) <= passoMs * 0.75 ? melhor : null
  }
  const fora = (v: number) => !!faixa && (v < faixa.min || v > faixa.max)

  const tempos = useMemo(() => {
    const todos = Array.from(new Set(series.flatMap(s => s.pontos.map(p => p.t)))).sort((a, b) => b - a)
    return todos.slice(0, 12)
  }, [series])

  const hoverX = hover !== null ? x(hover) : null
  const dicaEsq = hoverX !== null ? (hoverX / W) * 100 : 0

  return (
    <article className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="font-semibold">{titulo} {unidade && <span className="font-normal text-[#66736b]">({unidade})</span>}</h3>{faixa && <p className="text-xs text-[#66736b]">Faixa esperada: {faixa.min}–{faixa.max} {unidade}</p>}</div>
        <button type="button" onClick={() => setTabela(t => !t)} aria-pressed={tabela} className="flex items-center gap-1.5 rounded-lg border border-[#dde5df] px-2.5 py-1.5 text-xs font-medium text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]">{tabela ? <><LineChart className="size-3.5" /> Gráfico</> : <><Table2 className="size-3.5" /> Tabela</>}</button>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#52514e]">
        {series.map(s => <li key={s.id} className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: s.cor }} />{s.rotulo}{s.semComunicacao && <span className="text-[#66736b]">(sem comunicação)</span>}</li>)}
      </ul>

      {vals.length === 0 ? <p className="mt-6 rounded-lg bg-[#f8faf8] p-6 text-center text-sm text-[#66736b]">Sem leituras neste período.</p> : tabela ? (
        <div className="mt-3 max-h-64 overflow-auto">
          <table className="w-full text-xs tabular-nums">
            <thead className="sticky top-0 bg-white text-left text-[#66736b]"><tr><th className="py-1.5 pr-3 font-medium">Data/hora</th>{series.map(s => <th key={s.id} className="py-1.5 pr-3 text-right font-medium">{s.rotulo}</th>)}</tr></thead>
            <tbody>{tempos.map(t => <tr key={t} className="border-t border-[#dde5df]"><td className="py-1.5 pr-3">{dataHora(t)}</td>{series.map(s => { const p = s.pontos.find(q => q.t === t); return <td key={s.id} className={`py-1.5 pr-3 text-right ${p && fora(p.v) ? 'font-medium text-[#b91c1c]' : ''}`}>{p ? p.v : '—'}</td> })}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-2">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" tabIndex={0} aria-label={`Histórico de ${titulo}. Use as setas para percorrer o tempo.`} className="w-full touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d3b]/40" onPointerMove={aoMover} onPointerLeave={() => setHover(null)} onKeyDown={aoTeclar} onBlur={() => setHover(null)}>
            <defs><clipPath id={`${uid}-clip`}><rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} /></clipPath></defs>
            {ticks.map(t => <g key={t}><line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="#e5e9e6" strokeWidth="1" /><text x={M.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#66736b">{fmtTick(t)}</text></g>)}
            {xticks.map((t, i) => <text key={i} x={x(t)} y={H - 8} textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'} fontSize="11" fill="#66736b">{fmtX(t)}</text>)}
            {faixa && <rect x={M.l} width={W - M.l - M.r} y={y(Math.min(faixa.max, y1))} height={Math.max(0, y(Math.max(faixa.min, y0)) - y(Math.min(faixa.max, y1)))} fill="#0b5d3b" opacity="0.07" clipPath={`url(#${uid}-clip)`} />}
            <g clipPath={`url(#${uid}-clip)`}>
              {series.map(s => dividirEmTrechos(s.pontos, passoMs * 3).map((trecho, i) => trecho.length > 1
                ? <polyline key={`${s.id}-${i}`} fill="none" stroke={s.cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={trecho.map(p => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')} />
                : <circle key={`${s.id}-${i}`} cx={x(trecho[0].t)} cy={y(trecho[0].v)} r="2.5" fill={s.cor} />))}
            </g>
            {series.map(s => { const p = s.pontos[s.pontos.length - 1]; return p && <circle key={s.id} cx={x(p.t)} cy={y(p.v)} r="4" fill={s.cor} stroke="#fff" strokeWidth="2" /> })}
            {hoverX !== null && <line x1={hoverX} x2={hoverX} y1={M.t} y2={H - M.b} stroke="#66736b" strokeWidth="1" />}
            {hover !== null && series.map(s => { const p = maisProximo(s.pontos, hover); return p && <circle key={s.id} cx={x(p.t)} cy={y(p.v)} r="4" fill={s.cor} stroke="#fff" strokeWidth="2" /> })}
          </svg>
          {hover !== null && (
            <div role="status" className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-[#dde5df] bg-white p-3 text-xs shadow-lg" style={{ left: `${dicaEsq}%`, transform: dicaEsq > 55 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}>
              <p className="mb-1.5 text-[#66736b]">{dataHora(hover)}</p>
              {series.map(s => { const p = maisProximo(s.pontos, hover); return (
                <div key={s.id} className="flex items-center gap-2 py-0.5"><span aria-hidden="true" className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: s.cor }} />{p ? <span className={`font-semibold tabular-nums ${fora(p.v) ? 'text-[#b91c1c]' : 'text-[#17201b]'}`}>{p.v} {unidade}</span> : <span className="text-[#66736b]">sem leitura</span>}<span className="truncate text-[#66736b]">{s.rotulo}</span></div>
              ) })}
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-xs text-[#66736b]">Valores são a média de cada intervalo. {faixa && 'A faixa sombreada indica o intervalo esperado.'}</p>
    </article>
  )
}
