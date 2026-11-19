'use client'

import { useState } from 'react'
import { LineChart, Table2 } from 'lucide-react'
import { fmtTick, niceTicks } from '@/components/monitoring-chart'
import { diaDaSemana as weekday, diaMes as fmtDay } from '@/lib/clima'

const W = 640, H = 240, M = { l: 48, r: 16, t: 16, b: 28 }

export type ClimateSeries = { label: string; color: string; values: number[] }

type Props = { kind: 'line' | 'bar'; title: string; subtitle?: string; unit: string; dates: string[]; series: ClimateSeries[]; decimals?: number }

export function ClimateChart({ kind, title, subtitle, unit, dates, series, decimals = 1 }: Props) {
  const [table, setTable] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const n = dates.length
  const all = series.flatMap(s => s.values)
  const lo = kind === 'bar' ? 0 : Math.min(...all), hi = Math.max(...all, kind === 'bar' ? 1 : -Infinity)
  const pad = kind === 'bar' ? hi * 0.08 : (hi - lo) * 0.1 || 1
  const ticks = niceTicks(kind === 'bar' ? 0 : lo - pad, hi + pad)
  const y0 = ticks[0], y1 = ticks[ticks.length - 1]
  const iw = W - M.l - M.r, ih = H - M.t - M.b
  const band = iw / n
  const x = (i: number) => M.l + (kind === 'bar' ? band * (i + 0.5) : n === 1 ? iw / 2 : (iw * i) / (n - 1))
  const y = (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * ih
  const step = Math.ceil(n / 6)
  const barW = Math.min(24, band * 0.62)
  const fmt = (v: number) => v.toFixed(decimals).replace('.', ',')

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = kind === 'bar' ? Math.floor((px - M.l) / band) : Math.round(((px - M.l) / iw) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    setHover(h => Math.min(n - 1, Math.max(0, (h ?? n - 1) + (e.key === 'ArrowLeft' ? -1 : 1))))
  }
  const barPath = (i: number, v: number) => {
    const h = y(0) - y(v); if (h <= 0) return ''
    const r = Math.min(4, barW / 2, h), x0 = x(i) - barW / 2, x1 = x0 + barW, yt = y(v)
    return `M${x0},${y(0)}V${yt + r}A${r},${r} 0 0 1 ${x0 + r},${yt}H${x1 - r}A${r},${r} 0 0 1 ${x1},${yt + r}V${y(0)}Z`
  }
  const tipPct = hover !== null ? (x(hover) / W) * 100 : 0

  return (
    <article className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="font-semibold">{title} <span className="font-normal text-[#66736b]">({unit})</span></h3>{subtitle && <p className="text-xs text-[#66736b]">{subtitle}</p>}</div>
        <button type="button" onClick={() => setTable(t => !t)} aria-pressed={table} className="flex items-center gap-1.5 rounded-lg border border-[#dde5df] px-2.5 py-1.5 text-xs font-medium text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]">{table ? <><LineChart className="size-3.5" /> Gráfico</> : <><Table2 className="size-3.5" /> Tabela</>}</button>
      </div>
      {series.length > 1 && <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#52514e]">{series.map(s => <li key={s.label} className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />{s.label}</li>)}</ul>}

      {table ? (
        <div className="mt-3 max-h-64 overflow-auto">
          <table className="w-full text-xs tabular-nums"><thead className="sticky top-0 bg-white text-left text-[#66736b]"><tr><th className="py-1.5 pr-3 font-medium">Data</th>{series.map(s => <th key={s.label} className="py-1.5 pr-3 text-right font-medium">{s.label}</th>)}</tr></thead>
            <tbody>{dates.map((d, i) => ({ d, i })).reverse().map(({ d, i }) => <tr key={d} className="border-t border-[#dde5df]"><td className="py-1.5 pr-3">{weekday(d)} {fmtDay(d)}</td>{series.map(s => <td key={s.label} className="py-1.5 pr-3 text-right">{fmt(s.values[i])}</td>)}</tr>)}</tbody></table>
        </div>
      ) : (
        <div className="relative mt-2">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" tabIndex={0} aria-label={`${title}. Use as setas para percorrer os dias.`} className="w-full touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d3b]/40" onPointerMove={onMove} onPointerLeave={() => setHover(null)} onKeyDown={onKey} onBlur={() => setHover(null)}>
            {ticks.map(t => <g key={t}><line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="#e5e9e6" strokeWidth="1" /><text x={M.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#66736b">{fmtTick(t)}</text></g>)}
            {dates.map((d, i) => i % step === 0 && <text key={d} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#66736b">{fmtDay(d)}</text>)}
            {hover !== null && (kind === 'bar' ? <rect x={x(hover) - band / 2} y={M.t} width={band} height={ih} fill="#0b5d3b" opacity="0.06" /> : <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} stroke="#66736b" strokeWidth="1" />)}
            {kind === 'bar'
              ? series[0].values.map((v, i) => <path key={i} d={barPath(i, v)} fill={series[0].color} opacity={hover === null || hover === i ? 1 : 0.55} />)
              : series.map(s => <g key={s.label}><polyline fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')} />{s.values.map((v, i) => i < n - 1 && <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={s.color} />)}<circle cx={x(n - 1)} cy={y(s.values[n - 1])} r="4" fill={s.color} stroke="#fff" strokeWidth="2" />{hover !== null && <circle cx={x(hover)} cy={y(s.values[hover])} r="4" fill={s.color} stroke="#fff" strokeWidth="2" />}</g>)}
          </svg>
          {hover !== null && (
            <div role="status" className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-[#dde5df] bg-white p-3 text-xs shadow-lg" style={{ left: `${tipPct}%`, transform: tipPct > 55 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}>
              <p className="mb-1.5 text-[#66736b]">{weekday(dates[hover])} {fmtDay(dates[hover])}</p>
              {series.map(s => <div key={s.label} className="flex items-center gap-2 py-0.5"><span aria-hidden="true" className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: s.color }} /><span className="font-semibold tabular-nums text-[#17201b]">{fmt(s.values[hover])} {unit}</span><span className="text-[#66736b]">{series.length > 1 ? s.label : ''}</span></div>)}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
