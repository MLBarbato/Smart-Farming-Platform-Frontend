'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Droplets, Gauge, Home, Leaf, Thermometer, Wind, type LucideIcon } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'
import { MonitoringChart, SERIES_COLORS, type Serie } from '@/components/monitoring-chart'
import { Carregando, ErroBloco, Vazio } from '@/components/ui/estados'
import { rotuloCriticidade } from '@/lib/criticidade'
import { useResumoGeral } from '@/lib/dados/fazendas'
import { useAlertasAbertos, usePrevisao, useResumoFazenda, useTemperaturaEstacao } from '@/lib/dados/painel'
import { FUSO, dataNoFuso, rotuloHoraLeitura } from '@/lib/clima'
import { formatarNumero } from '@/lib/formatacao'
import { faixaEsperada } from '@/lib/monitoramento'

const periodos = { 'Últimas 24 horas': 1, 'Últimos 7 dias': 7, 'Últimos 30 dias': 30 } as const
type Periodo = keyof typeof periodos
const HORA_MS = 3_600_000
const DIA_MS = 24 * HORA_MS

const estiloCriticidade = { ALTA: 'bg-red-50 text-red-700', MEDIA: 'bg-[#fff7ed] text-[#b45309]', BAIXA: 'bg-[#fefce8] text-[#a16207]' } as const

function Cartao({ titulo, valor, descricao, Icone }: { titulo: string; valor: string; descricao: string; Icone: LucideIcon }) {
  return (
    <div className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{titulo}</span><Icone className="size-5 text-[#0b5d3b]" /></div>
      <p className="mt-3 text-3xl font-semibold">{valor}</p>
      <p className="mt-1 text-xs text-[#66736b]">{descricao}</p>
    </div>
  )
}

function Metrica({ rotulo, valor, Icone, fonte, externo }: { rotulo: string; valor: string; Icone: LucideIcon; fonte?: string; externo?: string }) {
  return (
    <div className="rounded-xl border border-[#dde5df] bg-white p-4 shadow-sm">
      <Icone className="size-5 text-[#0b5d3b]" />
      <p className="mt-3 truncate text-sm text-[#66736b]">{rotulo}</p>
      <p className="mt-1 whitespace-nowrap text-xl font-semibold">{valor}</p>
      {fonte && <p className="mt-1 text-xs text-[#66736b]">{fonte}</p>}
      {externo && <p className="mt-2 border-t border-[#eef2ef] pt-2 text-xs text-[#66736b]">{externo}</p>}
    </div>
  )
}

export function DashboardPage() {
  const resumo = useResumoGeral()
  const [escolhida, setEscolhida] = useState<number>()
  const [periodo, setPeriodo] = useState<Periodo>('Últimas 24 horas')
  const [agora] = useState(() => Date.now())
  const dataHoje = dataNoFuso(agora, FUSO)

  const cards = resumo.data?.fazendas ?? []
  const fazendaId = escolhida ?? cards[0]?.id
  const fazenda = cards.find(c => c.id === fazendaId)

  const detalhe = useResumoFazenda(fazendaId)
  const previsao = usePrevisao(fazendaId)
  const temperatura = useTemperaturaEstacao(fazendaId, periodos[periodo], agora)
  const alertas = useAlertasAbertos(4)

  const totais = resumo.data?.totais
  const serieTemperatura: Serie[] = [{
    id: 0, rotulo: 'Estação virtual', cor: SERIES_COLORS[0],
    pontos: (temperatura.data?.pontos ?? []).filter(p => p.inicio && p.media !== undefined).map(p => ({ t: Date.parse(p.inicio!), v: Number(p.media!.toFixed(2)) })),
  }]
  const condicao = (v: string) => detalhe.data?.condicoesAtuais?.find(c => c.variavel === v)
  const hoje = previsao.data?.dias?.[0]
  const estacaoLeitura = (v: string) => detalhe.data?.estacao?.leiturasAtuais?.find(l => l.variavel === v)
  /** Texto da origem do valor dos sensores da fazenda: quantos sensores e quando foi a leitura mais recente. */
  const fonteSensores = (v: string) => {
    const c = condicao(v)
    if (!c) return 'Sem sensor com leitura recente'
    const n = c.sensores ?? 0
    const quando = c.ultimaAtualizacao ? ` · ${rotuloHoraLeitura(c.ultimaAtualizacao, dataHoje)}` : ''
    return `${n === 1 ? 'Sensor da fazenda' : `Média de ${n} sensores`} (simulado ou real)${quando}`
  }
  /** O mesmo indicador medido pela estação virtual (Open-Meteo), para comparar. */
  const externoEstacao = (v: string, casas: number, unidade: string) => {
    const l = estacaoLeitura(v)
    if (l?.valor === undefined || !l.dataHora) return undefined
    return `Estação (Open-Meteo): ${formatarNumero(l.valor, casas)} ${unidade} · ${rotuloHoraLeitura(l.dataHora, dataHoje)}`
  }
  const sensores = detalhe.data?.sensores
  const irrigacao = detalhe.data?.irrigacao
  const total = sensores?.total ?? 0
  const pct = (n = 0) => (total ? (n / total) * 100 : 0)
  const ativos = sensores?.ativos ?? 0
  const semLeitura = sensores?.semLeituraRecente ?? 0
  const inativos = Math.max(total - ativos, 0)
  const aAtivos = pct(Math.max(ativos - semLeitura, 0)), aAlerta = aAtivos + pct(semLeitura)

  const seletor = cards.length > 0 && (
    <select aria-label="Fazenda" value={fazendaId} onChange={e => setEscolhida(Number(e.target.value))} className="hidden rounded-lg border border-[#dde5df] bg-white px-3 py-2 text-sm md:block">
      {cards.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
    </select>
  )

  return (
    <DashboardShell title="Dashboard" subtitle="Visão geral da sua operação agrícola." actions={seletor || undefined}>
      {resumo.isLoading ? <Carregando /> : resumo.isError ? <ErroBloco erro={resumo.error} aoTentarDeNovo={() => resumo.refetch()} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Cartao titulo="Fazendas" valor={String(totais?.fazendas ?? 0)} descricao="Propriedades cadastradas" Icone={Home} />
            <Cartao titulo="Talhões" valor={String(totais?.talhoes ?? 0)} descricao="Áreas cadastradas" Icone={Leaf} />
            <Cartao titulo="Sensores" valor={String(totais?.sensores ?? 0)} descricao={`${totais?.sensoresAtivos ?? 0} ativos`} Icone={Gauge} />
            <Cartao titulo="Alertas ativos" valor={String(totais?.alertas?.abertos ?? 0)} descricao="Requerem atenção" Icone={AlertTriangle} />
          </div>

          {!fazenda ? (
            <div className="mt-8"><Vazio titulo="Nenhuma fazenda cadastrada" texto="Cadastre uma fazenda para acompanhar as condições ambientais aqui." acao={<Link href="/dashboard/fazendas" className="text-sm font-medium text-[#0b5d3b] underline">Ir para Fazendas</Link>} /></div>
          ) : (
            <>
              <section className="mt-8">
                <div className="mb-4"><h2 className="text-lg font-semibold">Monitoramento ambiental</h2><p className="text-sm text-[#66736b]">Condições atuais de {fazenda.nome}</p></div>
                {detalhe.isError ? <ErroBloco erro={detalhe.error} aoTentarDeNovo={() => detalhe.refetch()} /> : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Metrica rotulo="Temperatura do ar" valor={condicao('TEMPERATURA_AR') ? `${formatarNumero(condicao('TEMPERATURA_AR')!.media, 1)} °C` : '—'} Icone={Thermometer} fonte={fonteSensores('TEMPERATURA_AR')} externo={externoEstacao('TEMPERATURA_AR', 1, '°C')} />
                    <Metrica rotulo="Umidade do ar" valor={condicao('UMIDADE_AR') ? `${formatarNumero(condicao('UMIDADE_AR')!.media, 0)}%` : '—'} Icone={Droplets} fonte={fonteSensores('UMIDADE_AR')} externo={externoEstacao('UMIDADE_AR', 0, '%')} />
                    <Metrica rotulo="Umidade do solo" valor={condicao('UMIDADE_SOLO') ? `${formatarNumero(condicao('UMIDADE_SOLO')!.media, 0)}%` : '—'} Icone={Droplets} fonte={fonteSensores('UMIDADE_SOLO')} />
                    <Metrica rotulo="Chuva hoje (prob.)" valor={hoje?.probabilidadePrecipitacao !== undefined ? `${hoje.probabilidadePrecipitacao}%` : '—'} Icone={Droplets} fonte="Previsão (Open-Meteo)" />
                    <Metrica rotulo="Velocidade do vento" valor={condicao('VELOCIDADE_VENTO') ? `${formatarNumero(condicao('VELOCIDADE_VENTO')!.media, 0)} km/h` : '—'} Icone={Wind} fonte={fonteSensores('VELOCIDADE_VENTO')} externo={externoEstacao('VELOCIDADE_VENTO', 0, 'km/h')} />
                  </div>
                )}
              </section>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <section>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div><h2 className="font-semibold">Histórico de temperatura</h2><p className="text-sm text-[#66736b]">Estação virtual de {fazenda.nome} (Open-Meteo)</p></div>
                    <select aria-label="Período" value={periodo} onChange={e => setPeriodo(e.target.value as Periodo)} className="rounded-lg border border-[#dde5df] bg-white px-3 py-2 text-sm">
                      {Object.keys(periodos).map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  {temperatura.isLoading ? <Carregando /> : temperatura.isError ? <ErroBloco erro={temperatura.error} aoTentarDeNovo={() => temperatura.refetch()} /> : (
                    <MonitoringChart key={`${fazendaId}-${periodo}`} titulo="Temperatura do ar" unidade="°C" faixa={faixaEsperada.TEMPERATURA_AR} series={serieTemperatura} de={agora - periodos[periodo] * DIA_MS} ate={agora} passoMs={periodos[periodo] === 30 ? DIA_MS : HORA_MS} />
                  )}
                </section>

                <section className="rounded-xl border border-[#dde5df] bg-white p-6 shadow-sm">
                  <h2 className="font-semibold">Status dos sensores</h2>
                  {total === 0 ? <p className="mt-6 text-sm text-[#66736b]">Nenhum sensor cadastrado nesta fazenda.</p> : (
                    <div className="mt-6 flex items-center gap-6">
                      <div className="relative size-32 rounded-full" style={{ background: `conic-gradient(#16a34a 0 ${aAtivos}%, #eab308 ${aAtivos}% ${aAlerta}%, #d1d5db ${aAlerta}% 100%)` }}>
                        <div className="absolute inset-5 flex items-center justify-center rounded-full bg-white text-center"><span><b className="block text-2xl">{total}</b><small className="text-xs text-[#66736b]">total</small></span></div>
                      </div>
                      <div className="flex flex-col gap-3 text-sm">
                        <p><span className="mr-2 inline-block size-2 rounded-full bg-[#16a34a]" />Ativos <b>{Math.max(ativos - semLeitura, 0)}</b></p>
                        <p><span className="mr-2 inline-block size-2 rounded-full bg-[#eab308]" />Sem leitura recente <b>{semLeitura}</b></p>
                        <p><span className="mr-2 inline-block size-2 rounded-full bg-[#d1d5db]" />Inativos <b>{inativos}</b></p>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-2">
                <section className="rounded-xl border border-[#dde5df] bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between"><h2 className="font-semibold">Alertas recentes</h2><Link href="/dashboard/alertas" className="text-sm font-medium text-[#0b5d3b]">Ver todos os alertas</Link></div>
                  <div className="mt-5 flex flex-col gap-4">
                    {alertas.isLoading ? <Carregando /> : alertas.isError ? <ErroBloco erro={alertas.error} /> : (alertas.data?.conteudo ?? []).length === 0 ? <p className="text-sm text-[#66736b]">Nenhum alerta aberto.</p> : alertas.data!.conteudo!.map(a => (
                      <div key={a.id} className="flex items-start gap-3 border-b border-[#dde5df] pb-4 last:border-0 last:pb-0">
                        <div className="rounded-lg bg-[#fff7ed] p-2 text-[#eab308]"><AlertTriangle className="size-4" /></div>
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium">{a.mensagem}</p><p className="text-xs text-[#66736b]">{a.talhaoIdentificacao} · {a.fazendaNome} · {a.dataHora ? new Date(a.dataHora).toLocaleString('pt-BR') : ''}</p></div>
                        <span className={`rounded-full px-2 py-1 text-xs ${estiloCriticidade[a.criticidade ?? 'BAIXA']}`}>{rotuloCriticidade[a.criticidade ?? 'BAIXA']}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-[#dde5df] bg-[#dff5e9] p-6">
                  <div className="flex items-center gap-3"><div className="rounded-lg bg-white p-2 text-[#0b5d3b]"><Droplets /></div><div><h2 className="font-semibold">Recomendações</h2><p className="text-sm text-[#66736b]">Irrigação em {fazenda.nome}</p></div></div>
                  <div className="mt-6 rounded-lg bg-white p-4">
                    {!irrigacao || (irrigacao.irrigar ?? 0) + (irrigacao.aguardarChuva ?? 0) + (irrigacao.naoIrrigar ?? 0) + (irrigacao.semDadosSuficientes ?? 0) === 0 ? <p className="text-sm">Nenhum talhão em cultivo com recomendação no momento.</p> : (
                      <ul className="flex flex-col gap-2 text-sm">
                        <li><b>{irrigacao.irrigar ?? 0}</b> talhão(ões) para irrigar</li>
                        <li><b>{irrigacao.aguardarChuva ?? 0}</b> aguardando chuva</li>
                        <li><b>{irrigacao.naoIrrigar ?? 0}</b> sem necessidade de irrigação</li>
                        <li><b>{irrigacao.semDadosSuficientes ?? 0}</b> sem dados suficientes</li>
                      </ul>
                    )}
                    <Link href="/dashboard/irrigacao" className="mt-4 inline-block rounded-lg bg-[#0b5d3b] px-4 py-2 text-sm font-medium text-white hover:bg-[#06452c]">Ver detalhes</Link>
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
    </DashboardShell>
  )
}
