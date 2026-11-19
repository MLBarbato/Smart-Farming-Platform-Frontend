'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Droplets, MapPin, RefreshCw, Sun, Thermometer, Umbrella, Wind, type LucideIcon } from 'lucide-react'
import { ClimateChart } from '@/components/climate-chart'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { estiloSelecaoFiltro } from '@/components/ui/campos'
import { AvisoDeErro, Carregando, ErroBloco, Vazio } from '@/components/ui/estados'
import { useAtualizarPrevisao, useCriarEstacao, useEstacao, useHistoricoClima, useSincronizarEstacao } from '@/lib/dados/clima'
import { useFazendas } from '@/lib/dados/fazendas'
import { usePrevisao } from '@/lib/dados/painel'
import { FUSO, dataNoFuso, descreverTempo, rotuloHoraLeitura, diaDaSemana, diaMes, periodosClima, periodosDisponiveis, type ChavePeriodoClima, type IconeTempo } from '@/lib/clima'
import { formatarNumero } from '@/lib/formatacao'

const icones: Record<IconeTempo, LucideIcon> = { sun: Sun, partly: CloudSun, cloud: Cloud, drizzle: CloudDrizzle, rain: CloudRain, storm: CloudLightning }
const dataHora = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—')
const situacaoRotulo = { ATUAL: 'Atualizada', DESATUALIZADA: 'Desatualizada', SEM_DADOS: 'Sem dados', SEM_COORDENADAS: 'Sem coordenadas', SEM_SINCRONIZACAO: 'Sem sincronização', INATIVA: 'Inativa' } as const

// Identidade visual dos dados externos (azul), distinta dos sensores (verde).
const EtiquetaExterna = ({ fonte }: { fonte?: string }) => <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#eff6ff] px-2 py-0.5 text-xs font-medium text-[#1d4ed8]"><CloudSun className="size-3" />{fonte ?? 'Open-Meteo'} · dado externo</span>

export function ClimatePage() {
  const fazendas = useFazendas()
  const [escolhida, setEscolhida] = useState<number>()
  const [chavePeriodo, setChavePeriodo] = useState<ChavePeriodoClima>('7d')

  const [dataHoje] = useState(() => dataNoFuso(Date.now(), FUSO))
  const fazendaId = escolhida ?? fazendas.data?.[0]?.id
  const fazenda = fazendas.data?.find(f => f.id === fazendaId)
  const temCoordenadas = fazenda?.latitude != null && fazenda?.longitude != null

  const previsao = usePrevisao(fazendaId)
  const estacao = useEstacao(fazendaId)
  const temEstacao = !!estacao.data
  const historico = useHistoricoClima(fazendaId, temEstacao)

  const atualizarPrevisao = useAtualizarPrevisao(fazendaId ?? 0)
  const criarEstacao = useCriarEstacao(fazendaId ?? 0)
  const sincronizar = useSincronizarEstacao(fazendaId ?? 0)

  const leitura = (v: string) => estacao.data?.leiturasAtuais?.find(l => l.variavel === v)
  const quando = (v: string, rotulo: string) => { const l = leitura(v); return l?.dataHora ? `${rotulo} ${rotuloHoraLeitura(l.dataHora, dataHoje)}` : rotulo }
  const previsaoDias = previsao.data?.dias ?? []
  const hoje = dataHoje
  const diaHoje = previsaoDias.find(d => d.data === hoje) ?? previsaoDias[0]
  const tempoHoje = descreverTempo(diaHoje?.precipitacaoMm, diaHoje?.probabilidadePrecipitacao)
  const IconeHoje = icones[tempoHoje.icone]

  const indicadores: { titulo: string; valor: string; unidade?: string; desc: string; Icone: LucideIcon; texto?: boolean }[] = [
    { titulo: 'Temperatura do ar', valor: leitura('TEMPERATURA_AR') ? formatarNumero(leitura('TEMPERATURA_AR')!.valor, 1) : '—', unidade: leitura('TEMPERATURA_AR') ? '°C' : undefined, desc: quando('TEMPERATURA_AR', 'Leitura de'), Icone: Thermometer },
    { titulo: 'Condição', valor: diaHoje ? tempoHoje.rotulo : '—', desc: 'Estimada pela previsão de hoje', Icone: IconeHoje, texto: true },
    { titulo: 'Umidade do ar', valor: leitura('UMIDADE_AR') ? formatarNumero(leitura('UMIDADE_AR')!.valor, 0) : '—', unidade: leitura('UMIDADE_AR') ? '%' : undefined, desc: quando('UMIDADE_AR', 'Leitura de'), Icone: Droplets },
    { titulo: 'Probabilidade de chuva', valor: diaHoje?.probabilidadePrecipitacao != null ? String(diaHoje.probabilidadePrecipitacao) : '—', unidade: diaHoje?.probabilidadePrecipitacao != null ? '%' : undefined, desc: 'Para hoje', Icone: Umbrella },
    { titulo: 'Vento', valor: leitura('VELOCIDADE_VENTO') ? formatarNumero(leitura('VELOCIDADE_VENTO')!.valor, 1) : '—', unidade: leitura('VELOCIDADE_VENTO') ? 'km/h' : undefined, desc: quando('VELOCIDADE_VENTO', 'Leitura de'), Icone: Wind },
  ]

  const todos = historico.data ?? []
  const liberados = periodosDisponiveis(todos.length)
  const periodoAtual = liberados.includes(chavePeriodo) ? chavePeriodo : liberados[0]
  const dias = periodosClima.find(p => p.chave === periodoAtual)!.dias
  const hist = todos.slice(-dias)
  const histTemp = hist.filter(d => d.tempMax !== undefined && d.tempMin !== undefined)
  const chuvaTotal = hist.reduce((s, d) => s + (d.chuva ?? 0), 0)
  const diasChuva = hist.filter(d => (d.chuva ?? 0) > 0).length
  const atribuicao = estacao.data?.atribuicao ?? previsao.data?.atribuicao

  return (
    <DashboardShell title="Clima" subtitle="Condições e previsão meteorológica na localização de cada fazenda.">
      {fazendas.isPending ? <Carregando texto="Carregando fazendas..." /> : fazendas.isError ? <ErroBloco erro={fazendas.error} aoTentarDeNovo={() => fazendas.refetch()} /> : fazendas.data.length === 0 ? (
        <Vazio titulo="Cadastre uma fazenda primeiro" texto="O clima é consultado pela localização da fazenda." />
      ) : (
        <>
          <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm text-[#1e40af]"><CloudSun className="mt-0.5 size-4 shrink-0" /><p><strong>Dados meteorológicos externos.</strong> Temperatura e umidade do <em>ar</em> e a previsão vêm de um serviço externo e não são medições dos sensores das fazendas. Para o <em>solo</em>, veja <Link href="/dashboard/monitoramento" className="font-medium underline">Monitoramento</Link>.</p></div>

          <div className="mb-6 flex flex-wrap items-center gap-3" role="group" aria-label="Filtros de clima">
            <select value={fazendaId} onChange={e => setEscolhida(Number(e.target.value))} aria-label="Fazenda" className={estiloSelecaoFiltro}>{fazendas.data.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
            <div className="flex rounded-lg border border-[#dde5df] bg-white p-0.5" role="radiogroup" aria-label="Período do histórico">
              {periodosClima.map(p => { const livre = liberados.includes(p.chave); return <button key={p.chave} role="radio" aria-checked={periodoAtual === p.chave} disabled={!livre} title={livre ? undefined : `A estação ainda não tem ${p.dias} dias de histórico`} onClick={() => setChavePeriodo(p.chave)} className={`h-9 rounded-md px-3 text-sm transition ${periodoAtual === p.chave ? 'bg-[#0b5d3b] font-medium text-white' : livre ? 'text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]' : 'cursor-not-allowed text-[#b6beb9]'}`}>{p.rotulo}</button> })}
            </div>
            <span className="text-xs text-[#66736b]">{temEstacao && !historico.isPending ? `O período vale para o histórico (disponível: ${todos.length} ${todos.length === 1 ? 'dia' : 'dias'} de leituras da estação). ` : 'O período vale para o histórico. '}A previsão cobre os dias que o provedor devolver.</span>
          </div>

          <section aria-labelledby="loc-title" className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="loc-title" className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-[#0b5d3b]" />{fazenda?.nome}</h2><EtiquetaExterna fonte={previsao.data?.fonte} /></div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <div><dt className="text-xs text-[#66736b]">Localidade</dt><dd className="font-medium">{fazenda?.cidade ? `${fazenda.cidade} · ${fazenda.estado ?? ''}` : '—'}</dd></div>
              <div><dt className="text-xs text-[#66736b]">Latitude (consulta)</dt><dd className="font-medium tabular-nums">{fazenda?.latitude != null ? `${fazenda.latitude.toFixed(4)}°` : '—'}</dd></div>
              <div><dt className="text-xs text-[#66736b]">Longitude (consulta)</dt><dd className="font-medium tabular-nums">{fazenda?.longitude != null ? `${fazenda.longitude.toFixed(4)}°` : '—'}</dd></div>
              <div><dt className="text-xs text-[#66736b]">Previsão</dt><dd className="font-medium">{previsao.data?.situacao ? situacaoRotulo[previsao.data.situacao] : '—'} <span className="font-normal text-[#66736b]">{previsao.data?.consultadaEm ? `(${dataHora(previsao.data.consultadaEm)})` : ''}</span></dd></div>
              <div><dt className="text-xs text-[#66736b]">Estação virtual</dt><dd className="font-medium">{estacao.data?.situacao ? situacaoRotulo[estacao.data.situacao] : 'Não criada'} <span className="font-normal text-[#66736b]">{estacao.data?.ultimaSincronizacao ? `(${dataHora(estacao.data.ultimaSincronizacao)})` : ''}</span></dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="outline" disabled={!temCoordenadas || atualizarPrevisao.isPending} onClick={() => atualizarPrevisao.mutate()} className="h-9 gap-2 rounded-lg px-3 text-sm"><RefreshCw className={`size-4 ${atualizarPrevisao.isPending ? 'animate-spin' : ''}`} />Atualizar previsão</Button>
              {temEstacao && <Button variant="outline" disabled={sincronizar.isPending} onClick={() => sincronizar.mutate()} className="h-9 gap-2 rounded-lg px-3 text-sm"><RefreshCw className={`size-4 ${sincronizar.isPending ? 'animate-spin' : ''}`} />Sincronizar estação</Button>}
              {!temCoordenadas && <p className="text-xs text-[#b45309]">Informe a latitude e a longitude da fazenda (em <Link href="/dashboard/fazendas" className="underline">Fazendas</Link>) para consultar o clima.</p>}
            </div>
            <div className="mt-3 flex flex-col gap-2"><AvisoDeErro erro={atualizarPrevisao.error} /><AvisoDeErro erro={sincronizar.error} /></div>
          </section>

          {!temCoordenadas ? null : (
            <>
              {previsao.isError && <div className="mt-6"><ErroBloco erro={previsao.error} aoTentarDeNovo={() => previsao.refetch()} /></div>}

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {indicadores.map(({ titulo, valor, unidade, desc, Icone, texto }) => (
                  <div key={titulo} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2"><span className="text-sm text-[#66736b]">{titulo}</span><Icone className="size-5 shrink-0 text-[#1d4ed8]" /></div>
                    <p className={`mt-3 font-semibold ${texto ? 'text-xl leading-9' : 'flex items-baseline gap-1 text-3xl'}`}>{valor}{unidade && <span className="text-base font-normal text-[#66736b]">{unidade}</span>}</p>
                    <p className="mt-1 text-xs text-[#66736b]">{desc}</p>
                  </div>
                ))}
              </div>

              <section className="mt-8" aria-labelledby="fc-title">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 id="fc-title" className="text-lg font-semibold">Previsão dos próximos dias</h2><p className="text-sm text-[#66736b]">Temperatura do ar e possibilidade de precipitação.</p></div><EtiquetaExterna fonte={previsao.data?.fonte} /></div>
                {previsao.isPending ? <Carregando /> : previsaoDias.length === 0 ? <Vazio titulo="Sem previsão disponível" texto="Use “Atualizar previsão” para consultar o provedor." /> : (
                  <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                    {previsaoDias.map(d => {
                      const w = descreverTempo(d.precipitacaoMm, d.probabilidadePrecipitacao), Icone = icones[w.icone], ehHoje = d.data === hoje
                      return (
                        <li key={d.data} className={`rounded-xl border bg-white p-4 text-center shadow-sm ${ehHoje ? 'border-[#1d4ed8]/50' : 'border-[#dde5df]'}`}>
                          <p className="text-sm font-semibold">{ehHoje ? 'Hoje' : diaDaSemana(d.data!)}</p><p className="text-xs text-[#66736b]">{diaMes(d.data!)}</p>
                          <Icone aria-hidden="true" className="mx-auto my-3 size-7 text-[#1d4ed8]" /><p className="min-h-8 text-xs text-[#66736b]">{w.rotulo}</p>
                          <p className="mt-2 text-sm tabular-nums"><span className="font-semibold">{formatarNumero(d.temperaturaMaxima, 0)}°</span> <span className="text-[#66736b]">/ {formatarNumero(d.temperaturaMinima, 0)}°</span></p>
                          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-[#52514e]"><Umbrella className="size-3" />{d.probabilidadePrecipitacao ?? 0}% · {formatarNumero(d.precipitacaoMm, 1)} mm</p>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </section>

              <section className="mt-8" aria-labelledby="hist-title">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 id="hist-title" className="text-lg font-semibold">Histórico meteorológico</h2><p className="text-sm text-[#66736b]">{temEstacao && hist.length > 0 ? `Últimos ${hist.length} dias, até ontem · ${formatarNumero(chuvaTotal, 1)} mm acumulados em ${diasChuva} ${diasChuva === 1 ? 'dia' : 'dias'} com chuva` : 'Estação virtual da fazenda'}</p></div><EtiquetaExterna fonte={previsao.data?.fonte} /></div>
                {estacao.isPending ? <Carregando /> : estacao.isError ? <ErroBloco erro={estacao.error} aoTentarDeNovo={() => estacao.refetch()} /> : !temEstacao ? (
                  <Vazio titulo="Esta fazenda ainda não tem estação virtual" texto="A estação virtual guarda as leituras horárias do provedor (temperatura, umidade, vento e chuva) para o histórico." acao={<div className="flex flex-col items-center gap-2"><Button onClick={() => criarEstacao.mutate()} disabled={criarEstacao.isPending} className="h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">{criarEstacao.isPending ? 'Criando...' : 'Criar estação virtual'}</Button><AvisoDeErro erro={criarEstacao.error} /></div>} />
                ) : historico.isPending ? <Carregando /> : historico.isError ? <ErroBloco erro={historico.error} aoTentarDeNovo={() => historico.refetch()} /> : histTemp.length === 0 ? (
                  <Vazio titulo="Sem leituras no período" texto="Use “Sincronizar estação” para buscar as leituras mais recentes." />
                ) : (
                  <div className="grid gap-6 2xl:grid-cols-2">
                    <ClimateChart key={`t-${fazendaId}-${dias}-${histTemp.length}`} kind="line" title="Temperatura do ar" subtitle="Máxima e mínima diárias" unit="°C" dates={histTemp.map(d => d.data)} series={[{ label: 'Máxima', color: '#eb6834', values: histTemp.map(d => d.tempMax!) }, { label: 'Mínima', color: '#2a78d6', values: histTemp.map(d => d.tempMin!) }]} />
                    <ClimateChart key={`p-${fazendaId}-${dias}-${histTemp.length}`} kind="bar" title="Precipitação" subtitle="Total diário" unit="mm" dates={histTemp.map(d => d.data)} series={[{ label: 'Precipitação', color: '#2a78d6', values: histTemp.map(d => d.chuva ?? 0) }]} />
                  </div>
                )}
              </section>

              {atribuicao && <p className="mt-8 text-xs text-[#66736b]">{atribuicao}</p>}
            </>
          )}
        </>
      )}
    </DashboardShell>
  )
}
