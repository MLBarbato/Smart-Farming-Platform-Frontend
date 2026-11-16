'use client'

import { useId, useMemo, useState } from 'react'
import { Table2, LineChart } from 'lucide-react'
import { NOW, formatReadAt, getSeries, isoOf, minutesOf } from '@/lib/sensors-data'
import { SensorEntry, expectedRange } from '@/lib/monitoring-data'

// Categórica fixa (slots 1–5 da paleta de referência, validados em linhas/adjacentes). A cor segue a entidade (sensor), não o ranking.
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
export const FALLBACK_COLOR = '#8a948d'
const W = 640, H = 260, M = { l: 48, r: 16, t: 16, b: 28 }

export function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1
  const raw = span / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw) ?? raw
  const start = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(6)))
  return ticks
}

export const fmtTick = (v: number) => (Math.abs(v) >= 10000 ? `${v / 1000}K` : String(Number(v.toFixed(2))))

export type ChartSeries = { entry: SensorEntry; color: string; label: string }

export function MonitoringChart({ measurement, unit, series, hours, step }: { measurement: string; unit: string; series: ChartSeries[]; hours: number; step: number }) {
  const uid = useId()
  const [table, setTable] = useState(false)
  const [hover, setHover] = useState<number | null>(null) // minutos absolutos
  const range = expectedRange[measurement]

  const data = useMemo(() => series.map(s => ({ ...s, points: getSeries(s.entry.sensor.id, hours, step).map(r => ({ t: minutesOf(r.readAt), v: r.value })) })), [series, hours, step])

  const t1 = minutesOf(NOW), t0 = t1 - hours * 60
  const vals = data.flatMap(d => d.points.map(p => p.v))
  let lo = Math.min(...vals, range?.min ?? Infinity), hi = Math.max(...vals, range?.max ?? -Infinity)
  if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1 }
  if (range && range.max > hi * 3 && vals.length) hi = Math.max(...vals, range.min) * 1.3 + 1 // faixas muito largas (ex.: chuva) não esmagam a série
  const pad = (hi - lo) * 0.08 || 1
  const ticks = niceTicks(Math.max(0, lo - pad), hi + pad)
  const y0 = ticks[0], y1 = ticks[ticks.length - 1]
  const x = (t: number) => M.l + ((t - t0) / (t1 - t0)) * (W - M.l - M.r)
  const y = (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b)
  const xticks = Array.from({ length: 5 }, (_, i) => t0 + ((t1 - t0) * i) / 4)
  const fmtX = (t: number) => { const iso = isoOf(t); return hours <= 24 ? iso.slice(11) : `${iso.slice(8, 10)}/${iso.slice(5, 7)}` }

  const snap = (t: number) => Math.min(t1, Math.max(t0, Math.round(t / step) * step))
  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    setHover(snap(t0 + ((px - M.l) / (W - M.l - M.r)) * (t1 - t0)))
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    setHover(h => snap((h ?? t1) + (e.key === 'ArrowLeft' ? -step : step)))
  }

  const nearest = (pts: { t: number; v: number }[], t: number) => {
    let best: { t: number; v: number } | null = null
    for (const p of pts) if (!best || Math.abs(p.t - t) < Math.abs(best.t - t)) best = p
    return best && Math.abs(best.t - t) <= step * 0.75 ? best : null
  }
  const out = (v: number) => !!range && (v < range.min || v > range.max)

  const tableTimes = useMemo(() => { const n = Math.min(12, Math.floor((hours * 60) / step)); return Array.from({ length: n }, (_, i) => snap(t1 - i * step)) }, [hours, step, t1]) // eslint-disable-line react-hooks/exhaustive-deps

  const hoverX = hover !== null ? x(hover) : null
  const tipLeftPct = hoverX !== null ? (hoverX / W) * 100 : 0

  return (
    <article className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="font-semibold">{measurement} <span className="font-normal text-[#66736b]">({unit})</span></h3>{range && <p className="text-xs text-[#66736b]">Faixa esperada: {range.min}–{range.max} {unit}</p>}</div>
        <button type="button" onClick={() => setTable(t => !t)} aria-pressed={table} className="flex items-center gap-1.5 rounded-lg border border-[#dde5df] px-2.5 py-1.5 text-xs font-medium text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]">{table ? <><LineChart className="size-3.5" /> Gráfico</> : <><Table2 className="size-3.5" /> Tabela</>}</button>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#52514e]">
        {data.map(d => (
          <li key={d.entry.sensor.id} className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: d.color }} />{d.label}{d.entry.state === 'SEM_COMUNICACAO' && <span className="text-[#66736b]">(sem comunicação)</span>}</li>
        ))}
      </ul>

      {table ? (
        <div className="mt-3 max-h-64 overflow-auto">
          <table className="w-full text-xs tabular-nums">
            <thead className="sticky top-0 bg-white text-left text-[#66736b]"><tr><th className="py-1.5 pr-3 font-medium">Data/hora</th>{data.map(d => <th key={d.entry.sensor.id} className="py-1.5 pr-3 text-right font-medium">{d.entry.device.code} · {d.entry.sensor.name}</th>)}</tr></thead>
            <tbody>{tableTimes.map(t => <tr key={t} className="border-t border-[#dde5df]"><td className="py-1.5 pr-3">{formatReadAt(isoOf(t))}</td>{data.map(d => { const p = nearest(d.points, t); return <td key={d.entry.sensor.id} className={`py-1.5 pr-3 text-right ${p && out(p.v) ? 'font-medium text-[#b91c1c]' : ''}`}>{p ? p.v : '—'}</td> })}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-2">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" tabIndex={0} aria-label={`Histórico de ${measurement}. Use as setas para percorrer o tempo.`} className="w-full touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d3b]/40" onPointerMove={onMove} onPointerLeave={() => setHover(null)} onKeyDown={onKey} onBlur={() => setHover(null)}>
            <defs><clipPath id={`${uid}-clip`}><rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} /></clipPath></defs>
            {ticks.map(t => <g key={t}><line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="#e5e9e6" strokeWidth="1" /><text x={M.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#66736b">{fmtTick(t)}</text></g>)}
            {xticks.map((t, i) => <text key={i} x={x(t)} y={H - 8} textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'} fontSize="11" fill="#66736b">{fmtX(t)}</text>)}
            {range && <rect x={M.l} width={W - M.l - M.r} y={y(Math.min(range.max, y1))} height={Math.max(0, y(Math.max(range.min, y0)) - y(Math.min(range.max, y1)))} fill="#0b5d3b" opacity="0.07" clipPath={`url(#${uid}-clip)`} />}
            <g clipPath={`url(#${uid}-clip)`}>
              {data.map(d => d.points.length > 1 && <polyline key={d.entry.sensor.id} fill="none" stroke={d.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={d.points.map(p => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')} />)}
            </g>
            {data.map(d => { const p = d.points[d.points.length - 1]; return p && <circle key={d.entry.sensor.id} cx={x(p.t)} cy={y(p.v)} r="4" fill={d.color} stroke="#fff" strokeWidth="2" /> })}
            {hoverX !== null && <line x1={hoverX} x2={hoverX} y1={M.t} y2={H - M.b} stroke="#66736b" strokeWidth="1" />}
            {hover !== null && data.map(d => { const p = nearest(d.points, hover); return p && <circle key={d.entry.sensor.id} cx={x(p.t)} cy={y(p.v)} r="4" fill={d.color} stroke="#fff" strokeWidth="2" /> })}
          </svg>
          {hover !== null && (
            <div role="status" className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-[#dde5df] bg-white p-3 text-xs shadow-lg" style={{ left: `${tipLeftPct}%`, transform: tipLeftPct > 55 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}>
              <p className="mb-1.5 text-[#66736b]">{formatReadAt(isoOf(hover))}</p>
              {data.map(d => { const p = nearest(d.points, hover); return (
                <div key={d.entry.sensor.id} className="flex items-center gap-2 py-0.5"><span aria-hidden="true" className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: d.color }} />{p ? <span className={`font-semibold tabular-nums ${out(p.v) ? 'text-[#b91c1c]' : 'text-[#17201b]'}`}>{p.v} {unit}{out(p.v) ? ' ⚠' : ''}</span> : <span className="text-[#66736b]">sem dado</span>}<span className="truncate text-[#66736b]">{d.entry.device.code}</span></div>
              ) })}
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-xs text-[#66736b]">Sensores sem comunicação interrompem a linha na última leitura recebida. {range && 'A faixa sombreada indica o intervalo esperado.'}</p>
    </article>
  )
}
