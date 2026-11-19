'use client'

import { useState } from 'react'
import { CalendarClock, CloudRain, Droplets, Hourglass, Info, RefreshCw, ShieldQuestion, Sprout, type LucideIcon } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { estiloSelecaoFiltro } from '@/components/ui/campos'
import { AvisoDeErro, Carregando, ErroBloco, Vazio } from '@/components/ui/estados'
import { useFazendas } from '@/lib/dados/fazendas'
import { useHistoricoRecomendacoes, useRecalcularRecomendacoes, useRecomendacoesAtuais } from '@/lib/dados/irrigacao'
import { usePrevisao } from '@/lib/dados/painel'
import { rotuloSituacaoIrrigacao, type RecomendacaoIrrigacao, type SituacaoIrrigacao } from '@/lib/dados/tipos'
import { dataNoFuso } from '@/lib/clima'
import { formatarNumero , formatarDataHora, rotuloMediaUmidade } from '@/lib/formatacao'

const estilo: Record<SituacaoIrrigacao, { cls: string; Icone: LucideIcon }> = {
  IRRIGAR: { cls: 'bg-[#eff6ff] text-[#1d4ed8]', Icone: Droplets },
  AGUARDAR_CHUVA: { cls: 'bg-[#f0f9ff] text-[#0369a1]', Icone: CloudRain },
  NAO_IRRIGAR: { cls: 'bg-[#dff5e9] text-[#0b5d3b]', Icone: Sprout },
  SEM_DADOS_SUFICIENTES: { cls: 'bg-[#f1f3f2] text-[#66736b]', Icone: ShieldQuestion },
}
const origemUmidade = { SENSOR_TALHAO: 'sensor do talhão', ESTACAO: 'estação virtual' } as const

function Selo({ situacao }: { situacao?: SituacaoIrrigacao }) {
  if (!situacao) return null
  const { cls, Icone } = estilo[situacao]
  return <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${cls}`}><Icone className="size-3" />{rotuloSituacaoIrrigacao[situacao]}</span>
}

function Cartao({ r }: { r: RecomendacaoIrrigacao }) {
  const atual = r.umidade?.atual
  const minima = r.cultura?.umidadeMinima, ideal = r.cultura?.umidadeIdeal
  const cor = atual === undefined || minima === undefined || ideal === undefined ? '#d1d5db' : atual < minima ? '#dc2626' : atual < ideal ? '#eab308' : '#16a34a'
  return (
    <article className="flex flex-col rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="font-semibold">{r.talhaoIdentificacao}</h3><p className="truncate text-xs text-[#66736b]">{r.cultura?.nome ?? 'Sem cultura'}</p></div>
        <Selo situacao={r.situacao} />
      </div>

      {atual !== undefined && (
        <div className="mt-5">
          <div className="flex items-end justify-between"><p className="text-3xl font-semibold">{formatarNumero(atual, 1)}%</p><p className="text-xs text-[#66736b]">{ideal !== undefined ? `ideal ${formatarNumero(ideal, 0)}%` : ''}{minima !== undefined ? ` · mínima ${formatarNumero(minima, 0)}%` : ''}</p></div>
          <div className="relative mt-2 h-2 rounded-full bg-[#e5e9e6]" role="progressbar" aria-valuenow={atual} aria-valuemin={0} aria-valuemax={100} aria-label={`Umidade do solo em ${r.talhaoIdentificacao}`}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, atual))}%`, background: cor }} />
            {ideal !== undefined && <span aria-hidden="true" className="absolute -top-1 h-4 w-0.5 bg-[#17201b]" style={{ left: `${Math.min(100, ideal)}%` }} />}
          </div>
          <p className="mt-1 text-xs text-[#66736b]">Umidade do solo · {rotuloMediaUmidade(r.justificativa)}{r.umidade?.origem ? ` · ${origemUmidade[r.umidade.origem]}` : ''}</p>
        </div>
      )}

      {r.situacao === 'IRRIGAR' && r.volumeRecomendadoMm != null && <p className="mt-4 rounded-lg bg-[#eff6ff] px-3 py-2 text-sm text-[#1e40af]">Lâmina sugerida: <b>{formatarNumero(r.volumeRecomendadoMm, 1)} mm</b>{r.deficitMm != null && <> · déficit {formatarNumero(r.deficitMm, 1)} mm</>}</p>}
      <p className="mt-4 text-sm leading-6">{r.justificativa}</p>
      {r.dadosFaltantes && r.dadosFaltantes.length > 0 && <p className="mt-2 text-xs text-[#b45309]">Faltou: {r.dadosFaltantes.join(', ')}.</p>}

      <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#dde5df] pt-3 text-xs text-[#66736b]">
        {r.chuva?.previstaMm != null && <span className="flex items-center gap-1"><CloudRain className="size-3.5" />Chuva prevista {formatarNumero(r.chuva.previstaMm, 1)} mm (efetiva {formatarNumero(r.chuva.efetivaMm, 1)} mm)</span>}
        <span className="flex items-center gap-1"><CalendarClock className="size-3.5" />Calculada em {formatarDataHora(r.dataHora)} (Brasília)</span>
        {r.vencida && <span className="flex items-center gap-1 text-[#b45309]"><Hourglass className="size-3.5" />Vencida: aguardando novo cálculo</span>}
      </p>
    </article>
  )
}

export function IrrigationPage() {
  const fazendas = useFazendas()
  const [escolhida, setEscolhida] = useState<number>()
  const [dataHoje] = useState(() => dataNoFuso(Date.now()))
  const fazendaId = escolhida ?? fazendas.data?.[0]?.id
  const fazenda = fazendas.data?.find(f => f.id === fazendaId)

  const atuais = useRecomendacoesAtuais(fazendaId)
  const historico = useHistoricoRecomendacoes(fazendaId, 10)
  const previsao = usePrevisao(fazendaId)
  const recalcular = useRecalcularRecomendacoes(fazendaId ?? 0)

  const lista = atuais.data ?? []
  const conta = (s: SituacaoIrrigacao) => lista.filter(r => r.situacao === s).length
  const dias = previsao.data?.dias ?? []
  const diaHoje = dias.find(d => d.data === dataHoje) ?? dias[0]

  return (
    <DashboardShell
      title="Irrigação"
      subtitle="Recomendações de irrigação para cada talhão em cultivo."
      actions={fazendaId !== undefined && <Button variant="outline" disabled={recalcular.isPending} onClick={() => recalcular.mutate()} className="h-10 gap-2 rounded-lg px-4 text-sm"><RefreshCw className={`size-4 ${recalcular.isPending ? 'animate-spin' : ''}`} />Recalcular agora</Button>}
    >
      {fazendas.isPending ? <Carregando texto="Carregando fazendas..." /> : fazendas.isError ? <ErroBloco erro={fazendas.error} aoTentarDeNovo={() => fazendas.refetch()} /> : fazendas.data.length === 0 ? (
        <Vazio titulo="Cadastre uma fazenda primeiro" texto="As recomendações são calculadas para os plantios em cultivo dos talhões de uma fazenda." />
      ) : (
        <>
          <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm text-[#1e40af]"><Info className="mt-0.5 size-4 shrink-0" /><p><strong>Apoio à decisão.</strong> O sistema calcula o balanço hídrico pela umidade do solo, pela cultura e pela previsão de chuva e <em>recomenda</em> quando irrigar. Ele não aciona nem controla equipamentos de irrigação. As recomendações são recalculadas automaticamente a cada 3 horas.</p></div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label htmlFor="fazenda" className="text-sm font-medium">Fazenda</label>
            <select id="fazenda" value={fazendaId} onChange={e => setEscolhida(Number(e.target.value))} className={estiloSelecaoFiltro}>{fazendas.data.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
          </div>
          <AvisoDeErro erro={recalcular.error} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {([['Irrigar', conta('IRRIGAR'), 'Talhões que precisam de água', Droplets], ['Aguardar chuva', conta('AGUARDAR_CHUVA'), 'A chuva prevista supre o déficit', CloudRain], ['Não irrigar', conta('NAO_IRRIGAR'), 'Umidade adequada', Sprout], ['Sem dados', conta('SEM_DADOS_SUFICIENTES'), 'Faltam leituras ou previsão', ShieldQuestion], ['Chuva prevista hoje', diaHoje?.probabilidadePrecipitacao != null ? `${diaHoje.probabilidadePrecipitacao}%` : '—', diaHoje?.precipitacaoMm != null ? `${formatarNumero(diaHoje.precipitacaoMm, 1)} mm previstos` : 'Sem previsão', CloudRain]] as const).map(([titulo, valor, desc, Icone]) => (
              <div key={titulo} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-2"><span className="text-sm text-[#66736b]">{titulo}</span><Icone className="size-5 shrink-0 text-[#0b5d3b]" /></div><p className="mt-3 text-3xl font-semibold">{valor}</p><p className="mt-1 text-xs text-[#66736b]">{desc}</p></div>
            ))}
          </div>

          <section className="mt-8">
            <div className="mb-4"><h2 className="text-lg font-semibold">Recomendações atuais</h2><p className="text-sm text-[#66736b]">A mais recente de cada talhão com plantio em cultivo em {fazenda?.nome}</p></div>
            {atuais.isPending ? <Carregando /> : atuais.isError ? <ErroBloco erro={atuais.error} aoTentarDeNovo={() => atuais.refetch()} /> : lista.length === 0 ? (
              <Vazio titulo="Nenhuma recomendação no momento" texto="Há recomendação para talhões com plantio em cultivo. Cadastre um plantio ou use “Recalcular agora”." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{lista.map(r => <Cartao key={r.id} r={r} />)}</div>
            )}
          </section>

          <section className="mt-8">
            <div className="mb-4"><h2 className="text-lg font-semibold">Histórico</h2><p className="text-sm text-[#66736b]">As 10 recomendações mais recentes da fazenda</p></div>
            {historico.isPending ? <Carregando /> : historico.isError ? <ErroBloco erro={historico.error} aoTentarDeNovo={() => historico.refetch()} /> : (historico.data?.conteudo ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#dde5df] bg-white p-6 text-center text-sm text-[#66736b]">Ainda não há recomendações gravadas.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#dde5df] bg-white shadow-sm">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-[#dde5df] bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-5 py-3 font-medium">Data</th><th className="px-5 py-3 font-medium">Talhão</th><th className="px-5 py-3 font-medium">Situação</th><th className="px-5 py-3 text-right font-medium">Lâmina</th><th className="px-5 py-3 font-medium">Justificativa</th></tr></thead>
                  <tbody className="divide-y divide-[#dde5df]">
                    {historico.data!.conteudo!.map(r => (
                      <tr key={r.id} className="align-top hover:bg-[#f8faf8]">
                        <td className="whitespace-nowrap px-5 py-3 tabular-nums">{formatarDataHora(r.dataHora)}</td>
                        <td className="px-5 py-3 font-medium">{r.talhaoIdentificacao}</td>
                        <td className="px-5 py-3"><Selo situacao={r.situacao} /></td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">{r.volumeRecomendadoMm != null ? `${formatarNumero(r.volumeRecomendadoMm, 1)} mm` : '—'}</td>
                        <td className="px-5 py-3 text-[#66736b]">{r.justificativa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardShell>
  )
}
