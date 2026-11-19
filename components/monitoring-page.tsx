'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, CloudSun, Droplets, FlaskConical, Power, Thermometer, WifiOff, type LucideIcon } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'
import { FALLBACK_COLOR, MonitoringChart, SERIES_COLORS, type Serie } from '@/components/monitoring-chart'
import { estiloSelecaoFiltro } from '@/components/ui/campos'
import { Carregando, ErroBloco, Vazio } from '@/components/ui/estados'
import { useFazendas } from '@/lib/dados/fazendas'
import { useResumoFazenda } from '@/lib/dados/painel'
import { useSensoresDaFazenda, useSeriesDosSensores } from '@/lib/dados/sensores'
import { useMapa } from '@/lib/dados/talhoes'
import { rotuloVariavel, type VariavelMonitorada } from '@/lib/dados/tipos'
import { formatarNumero } from '@/lib/formatacao'
import { PADRAO_SEM_LEITURA_MINUTOS, calcularIndicador, classificarSensor, condicaoDoTalhao, descreverIdade, faixaEsperada, periodos, type ChavePeriodo, type CondicaoTalhao, type EstadoSensor } from '@/lib/monitoramento'

const estadoInfo: Record<EstadoSensor, { rotulo: string; cls: string; Icone: LucideIcon }> = {
  NORMAL: { rotulo: 'Normal', cls: 'bg-[#dff5e9] text-[#0b5d3b]', Icone: CheckCircle2 },
  CRITICO: { rotulo: 'Leitura crítica', cls: 'bg-[#fef2f2] text-[#b91c1c]', Icone: AlertTriangle },
  SEM_COMUNICACAO: { rotulo: 'Sem comunicação', cls: 'bg-[#f1f3f2] text-[#66736b]', Icone: WifiOff },
  DESATIVADO: { rotulo: 'Desativado', cls: 'bg-[#f1f3f2] text-[#66736b]', Icone: Power },
}
const condicaoInfo: Record<CondicaoTalhao, { rotulo: string; cls: string; Icone: LucideIcon }> = {
  NORMAL: { rotulo: 'Normal', cls: 'bg-[#dff5e9] text-[#0b5d3b]', Icone: CheckCircle2 },
  ALERTA: { rotulo: 'Alerta', cls: 'bg-[#fff7ed] text-[#b45309]', Icone: AlertTriangle },
  INDISPONIVEL: { rotulo: 'Dados indisponíveis', cls: 'bg-[#f1f3f2] text-[#66736b]', Icone: WifiOff },
}
const infoIndicador: Record<VariavelMonitorada, { Icone: LucideIcon; casas: number }> = {
  UMIDADE_SOLO: { Icone: Droplets, casas: 1 },
  TEMPERATURA_SOLO: { Icone: Thermometer, casas: 1 },
  PH_SOLO: { Icone: FlaskConical, casas: 2 },
  TEMPERATURA_AR: { Icone: Thermometer, casas: 1 },
  UMIDADE_AR: { Icone: Droplets, casas: 0 },
  CONDUTIVIDADE_ELETRICA: { Icone: FlaskConical, casas: 2 },
  LUMINOSIDADE: { Icone: Thermometer, casas: 0 },
  VELOCIDADE_VENTO: { Icone: Thermometer, casas: 1 },
  PRECIPITACAO: { Icone: Droplets, casas: 1 },
}
/** Ordem de preferência dos cards: mostram-se as primeiras variáveis que a fazenda de fato mede. */
const ordemIndicadores: VariavelMonitorada[] = ['UMIDADE_SOLO', 'TEMPERATURA_SOLO', 'PH_SOLO', 'TEMPERATURA_AR', 'UMIDADE_AR', 'CONDUTIVIDADE_ELETRICA']
const dataHora = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-BR') : '')

export function MonitoringPage() {
  const fazendas = useFazendas()
  const [fazendaEscolhida, setFazendaEscolhida] = useState<number>()
  const [talhao, setTalhao] = useState('')
  const [variavel, setVariavel] = useState('')
  const [chavePeriodo, setChavePeriodo] = useState<ChavePeriodo>('24h')

  const fazendaId = fazendaEscolhida ?? fazendas.data?.[0]?.id
  const periodo = periodos.find(p => p.chave === chavePeriodo)!

  const mapa = useMapa(fazendaId)
  const resumo = useResumoFazenda(fazendaId)
  const talhoes = useMemo(() => (mapa.data?.talhoes ?? []).map(t => ({ id: t.id as number, identificacao: t.identificacao ?? '', alertas: t.alertas?.abertos ?? 0 })), [mapa.data])
  const { sensores, carregando, erro, recarregar } = useSensoresDaFazenda(fazendaId, talhoes)

  const limite = resumo.data?.criterioSemLeituraRecenteMinutos ?? PADRAO_SEM_LEITURA_MINUTOS
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  const entradas = useMemo(() => sensores.filter(s => s.sensor?.id !== undefined).map(s => {
    const c = classificarSensor({ status: s.sensor?.status, variavel: s.sensor?.variavel, valor: s.ultimaLeitura?.valor, dataHora: s.ultimaLeitura?.dataHora }, agora, limite)
    return { ...s, id: s.sensor!.id!, estado: c.estado, desvio: c.desvio }
  }), [sensores, agora, limite])

  const noEscopo = entradas.filter(e => !talhao || String(e.talhaoId) === talhao)
  const filtradas = noEscopo.filter(e => !variavel || e.sensor?.variavel === variavel)
  const variaveisPresentes = Array.from(new Set(entradas.map(e => e.sensor?.variavel as VariavelMonitorada))).filter(Boolean)

  const corDe = (e: (typeof entradas)[number]) => {
    const mesmos = entradas.filter(x => x.sensor?.variavel === e.sensor?.variavel)
    return SERIES_COLORS[mesmos.findIndex(x => x.id === e.id)] ?? FALLBACK_COLOR
  }

  const seriesQ = useSeriesDosSensores(fazendaId, filtradas.map(e => ({ id: e.id, talhaoId: e.talhaoId })), periodo)
  const ate = agora
  const de = ate - periodo.horas * 3600_000
  const graficos = variaveisPresentes.map(v => ({ v, entradas: filtradas.map((e, i) => ({ e, i })).filter(({ e }) => e.sensor?.variavel === v) })).filter(g => g.entradas.length > 0)
  const carregandoSeries = seriesQ.some(q => q.isPending && q.fetchStatus !== 'idle')

  const indicador = (v: VariavelMonitorada) => {
    const r = calcularIndicador(noEscopo.map(e => ({ variavel: e.sensor?.variavel, estado: e.estado, valor: e.ultimaLeitura?.valor, dataHora: e.ultimaLeitura?.dataHora })), v, agora)
    return r && { ...r, unidade: noEscopo.find(e => e.sensor?.variavel === v)?.sensor?.unidade }
  }
  const presentes = new Set(entradas.map(e => e.sensor?.variavel))
  const cartoes = [...ordemIndicadores.filter(v => presentes.has(v)), ...ordemIndicadores.filter(v => !presentes.has(v))].slice(0, 3)
  const criticos = noEscopo.filter(e => e.estado === 'CRITICO').length
  const semComunicacao = noEscopo.filter(e => e.estado === 'SEM_COMUNICACAO').length
  const recentes = [...filtradas].filter(e => e.ultimaLeitura).sort((a, b) => ((a.ultimaLeitura!.dataHora ?? '') < (b.ultimaLeitura!.dataHora ?? '') ? 1 : -1))
  const talhoesVisiveis = talhoes.filter(t => !talhao || String(t.id) === talhao)

  return (
    <DashboardShell title="Monitoramento" subtitle="Acompanhe as condições do solo e do ambiente pelas leituras dos sensores.">
      {fazendas.isPending ? <Carregando texto="Carregando fazendas..." /> : fazendas.isError ? <ErroBloco erro={fazendas.error} aoTentarDeNovo={() => fazendas.refetch()} /> : fazendas.data.length === 0 ? (
        <Vazio titulo="Cadastre uma fazenda primeiro" texto="O monitoramento mostra os sensores dos talhões de uma fazenda." />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3" role="group" aria-label="Filtros de monitoramento">
            <select value={fazendaId} onChange={e => { setFazendaEscolhida(Number(e.target.value)); setTalhao(''); setVariavel('') }} aria-label="Fazenda" className={estiloSelecaoFiltro}>{fazendas.data.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
            <select value={talhao} onChange={e => setTalhao(e.target.value)} aria-label="Filtrar por talhão" className={estiloSelecaoFiltro}><option value="">Todos os talhões</option>{talhoes.map(t => <option key={t.id} value={t.id}>{t.identificacao}</option>)}</select>
            <select value={variavel} onChange={e => setVariavel(e.target.value)} aria-label="Filtrar por medição" className={estiloSelecaoFiltro}><option value="">Todas as medições</option>{variaveisPresentes.map(v => <option key={v} value={v}>{rotuloVariavel[v]}</option>)}</select>
            <div className="flex rounded-lg border border-[#dde5df] bg-white p-0.5" role="radiogroup" aria-label="Período de consulta">
              {periodos.map(x => <button key={x.chave} role="radio" aria-checked={chavePeriodo === x.chave} onClick={() => setChavePeriodo(x.chave)} className={`h-9 rounded-md px-3 text-sm transition ${chavePeriodo === x.chave ? 'bg-[#0b5d3b] font-medium text-white' : 'text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]'}`}>{x.rotulo}</button>)}
            </div>
          </div>

          {mapa.isPending || carregando ? <Carregando texto="Carregando sensores..." /> : mapa.isError ? <ErroBloco erro={mapa.error} aoTentarDeNovo={() => mapa.refetch()} /> : erro ? <ErroBloco erro={erro} aoTentarDeNovo={recarregar} /> : entradas.length === 0 ? (
            <Vazio titulo="Nenhum sensor nesta fazenda" texto="Cadastre sensores nos talhões para acompanhar as leituras." acao={<Link href="/dashboard/sensores" className="text-sm font-medium text-[#0b5d3b] underline">Ir para Sensores</Link>} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cartoes.map(v => {
                  const { Icone, casas } = infoIndicador[v], titulo = rotuloVariavel[v]
                  const k = indicador(v), f = faixaEsperada[v]
                  return (
                    <div key={titulo} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{titulo}</span><Icone className="size-5 text-[#0b5d3b]" /></div>
                      {k ? <p className={`mt-3 flex items-baseline gap-1 text-3xl font-semibold ${k.desatualizado ? 'text-[#66736b]' : ''}`}>{formatarNumero(k.media, casas)}<span className="text-base font-normal text-[#66736b]">{k.unidade}</span>{k.fora && <AlertTriangle aria-label="Fora da faixa esperada" className="ml-1 size-4 self-center text-[#b45309]" />}</p> : <p className="mt-3 text-3xl font-semibold text-[#66736b]">—</p>}
                      <p className="mt-1 text-xs text-[#66736b]">{k ? (k.desatualizado ? `Desatualizado: última leitura ${k.idadeMs !== undefined ? descreverIdade(k.idadeMs) : 'sem data'} · média de ${k.n} ${k.n === 1 ? 'sensor' : 'sensores'}` : `Última leitura · média de ${k.n} ${k.n === 1 ? 'sensor' : 'sensores'}${f ? ` · esperado ${f.min}–${f.max}` : ''}`) : 'Nenhuma leitura registrada'}</p>
                    </div>
                  )
                })}
                <div className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">Leituras críticas</span><AlertTriangle className={`size-5 ${criticos ? 'text-[#b91c1c]' : 'text-[#0b5d3b]'}`} /></div>
                  <p className={`mt-3 text-3xl font-semibold ${criticos ? 'text-[#b91c1c]' : ''}`}>{criticos}</p>
                  <p className="mt-1 text-xs text-[#66736b]">Sensores fora da faixa · {semComunicacao} sem comunicação</p>
                </div>
              </div>

              <section className="mt-8">
                <h2 className="text-lg font-semibold">Condição dos talhões</h2>
                <p className="mb-4 text-sm text-[#66736b]">Clique em um talhão para filtrar a tela.</p>
                {talhoesVisiveis.length === 0 ? <p className="rounded-xl border border-dashed border-[#dde5df] bg-white p-6 text-center text-sm text-[#66736b]">Nenhum talhão neste filtro.</p> : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {talhoesVisiveis.map(t => {
                      const es = entradas.filter(e => e.talhaoId === t.id)
                      const c = condicaoInfo[condicaoDoTalhao(es.map(e => e.estado), t.alertas)]
                      const crit = es.filter(e => e.estado === 'CRITICO').length, off = es.filter(e => e.estado === 'SEM_COMUNICACAO').length
                      return (
                        <button key={t.id} onClick={() => setTalhao(String(t.id))} aria-label={`${t.identificacao}: ${c.rotulo}`} className="rounded-xl border border-[#dde5df] bg-white p-4 text-left shadow-sm transition hover:border-[#0b5d3b]/40">
                          <div className="flex items-start justify-between gap-3"><p className="min-w-0 truncate font-semibold">{t.identificacao}</p><span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${c.cls}`}><c.Icone className="size-3" />{c.rotulo}</span></div>
                          <p className="mt-3 text-xs text-[#66736b]">{es.length === 0 ? 'Sem sensores instalados' : `${es.length} ${es.length === 1 ? 'sensor' : 'sensores'}${crit ? ` · ${crit} crítico${crit > 1 ? 's' : ''}` : ''}${off ? ` · ${off} sem comunicação` : ''}${t.alertas ? ` · ${t.alertas} alerta(s) aberto(s)` : ''}`}</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold">Histórico das medições</h2>
                <p className="mb-4 text-sm text-[#66736b]">Últimas {periodo.rotulo.toLowerCase()}, por sensor</p>
                {graficos.length === 0 ? <p className="rounded-xl border border-dashed border-[#dde5df] bg-white p-6 text-center text-sm text-[#66736b]">Nenhum sensor encontrado para este filtro.</p> : carregandoSeries ? <Carregando texto="Carregando leituras..." /> : (
                  <div className="grid gap-6 2xl:grid-cols-2">
                    {graficos.map(g => {
                      const series: Serie[] = g.entradas.map(({ e, i }) => ({
                        id: e.id, rotulo: `${e.sensor?.codigo} · ${e.talhaoIdentificacao}`, cor: corDe(e), semComunicacao: e.estado === 'SEM_COMUNICACAO',
                        pontos: (seriesQ[i]?.data?.pontos ?? []).filter(p => p.inicio && p.media !== undefined).map(p => ({ t: Date.parse(p.inicio!), v: Number(p.media!.toFixed(2)) })),
                      }))
                      return <MonitoringChart key={`${g.v}-${chavePeriodo}`} titulo={rotuloVariavel[g.v]} unidade={g.entradas[0].e.sensor?.unidade} faixa={faixaEsperada[g.v]} series={series} de={de} ate={ate} passoMs={periodo.passoMs} />
                    })}
                  </div>
                )}
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold">Últimas leituras recebidas</h2>
                <p className="mb-4 text-sm text-[#66736b]">Leitura mais recente de cada sensor, independente do período.</p>
                {recentes.length === 0 ? <p className="rounded-xl border border-dashed border-[#dde5df] bg-white p-6 text-center text-sm text-[#66736b]">Nenhuma leitura encontrada.</p> : (
                  <div className="overflow-x-auto rounded-xl border border-[#dde5df] bg-white shadow-sm">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-[#dde5df] bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-5 py-3 font-medium">Sensor</th><th className="px-5 py-3 font-medium">Talhão</th><th className="px-5 py-3 text-right font-medium">Valor</th><th className="px-5 py-3 font-medium">Coleta</th><th className="px-5 py-3 font-medium">Origem</th><th className="px-5 py-3 font-medium">Situação</th></tr></thead>
                      <tbody className="divide-y divide-[#dde5df]">
                        {recentes.map(e => { const s = estadoInfo[e.estado]; return (
                          <tr key={e.id} className="hover:bg-[#f8faf8]">
                            <td className="px-5 py-3 font-medium">{e.sensor?.codigo}<p className="text-xs font-normal text-[#66736b]">{rotuloVariavel[e.sensor?.variavel as VariavelMonitorada]}</p></td>
                            <td className="px-5 py-3 text-[#66736b]">{e.talhaoIdentificacao}</td>
                            <td className="px-5 py-3 text-right tabular-nums"><span className="font-semibold">{formatarNumero(e.ultimaLeitura?.valor, 2)}</span> <span className="text-[#66736b]">{e.sensor?.unidade}</span></td>
                            <td className="px-5 py-3 tabular-nums">{dataHora(e.ultimaLeitura?.dataHora)}</td>
                            <td className="px-5 py-3 text-[#66736b]">{e.ultimaLeitura?.origem === 'SIMULADA' ? 'Simulada' : e.ultimaLeitura?.origem === 'REAL' ? 'Sensor' : e.ultimaLeitura?.origem}</td>
                            <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${s.cls}`}><s.Icone className="size-3" />{e.estado === 'CRITICO' ? `Crítica (${e.desvio})` : s.rotulo}</span></td>
                          </tr>
                        ) })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="mt-8 rounded-xl border border-dashed border-[#c9d3cc] bg-[#f8faf8] p-5">
                <div className="flex items-start gap-3"><div className="rounded-xl bg-[#e8eef9] p-2.5 text-[#1d4ed8]"><CloudSun /></div><div><h2 className="font-semibold">Dados meteorológicos externos</h2><p className="mt-1 max-w-xl text-sm text-[#66736b]">A previsão e a estação virtual vêm de um serviço externo e não entram nos indicadores acima. Veja-as, com a atribuição da fonte, em <Link href="/dashboard/clima" className="font-medium text-[#0b5d3b] underline">Clima</Link>.</p></div></div>
              </section>
            </>
          )}
        </>
      )}
    </DashboardShell>
  )
}
