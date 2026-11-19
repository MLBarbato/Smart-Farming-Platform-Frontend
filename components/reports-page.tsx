'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, CloudSun, Download, Droplets, Gauge, Info, Sprout, type LucideIcon } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'
import { AvisoDeErro, Carregando, ErroBloco, Vazio } from '@/components/ui/estados'
import { FUSO, dataNoFuso } from '@/lib/clima'
import { useBaixarRelatorio } from '@/lib/dados/relatorios'
import { useFazendas } from '@/lib/dados/fazendas'
import { DIAS_PADRAO, MAXIMO_DIAS, somarDias, validarPeriodo, type TipoRelatorio } from '@/lib/relatorios'

const tipos: { id: TipoRelatorio; nome: string; desc: string; Icone: LucideIcon }[] = [
  { id: 'IRRIGACAO', nome: 'Recomendações de irrigação', desc: 'Recomendações calculadas no período: situação, lâmina sugerida, umidade do solo e justificativa.', Icone: Droplets },
  { id: 'CLIMA', nome: 'Histórico climático', desc: 'Leituras horárias da estação virtual: temperatura e umidade do ar, vento, chuva e umidade do solo.', Icone: CloudSun },
  { id: 'SENSORES', nome: 'Saúde dos sensores', desc: 'Um resumo por sensor: estado, leituras no período, mínimo, média, máximo e comunicação atual.', Icone: Gauge },
  { id: 'ALERTAS', nome: 'Ocorrências e alertas', desc: 'Alertas abertos no período, com responsável, resolução e horas até o fechamento.', Icone: AlertTriangle },
  { id: 'PRODUTIVIDADE', nome: 'Produtividade por talhão', desc: 'Plantios do período com datas, colheita e produtividade (kg/ha).', Icone: Sprout },
]

const inputCls = 'h-11 w-full rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none transition focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10'

export function ReportsPage() {
  const fazendas = useFazendas()
  const baixar = useBaixarRelatorio()
  const [tipo, setTipo] = useState<TipoRelatorio>('IRRIGACAO')
  const [escolhida, setEscolhida] = useState<string>('')
  const [hoje] = useState(() => dataNoFuso(Date.now(), FUSO))
  const [de, setDe] = useState(() => somarDias(dataNoFuso(Date.now(), FUSO), -(DIAS_PADRAO - 1)))
  const [ate, setAte] = useState(hoje)

  const lista = fazendas.data ?? []
  const fazendaId = escolhida || (lista[0]?.id !== undefined ? String(lista[0].id) : '')
  const selecionado = tipos.find(t => t.id === tipo)!
  const erroPeriodo = validarPeriodo(de, ate)

  function gerar() {
    if (!fazendaId || erroPeriodo) return
    baixar.mutate({ fazendaId: Number(fazendaId), tipo, de, ate })
  }

  return (
    <DashboardShell title="Relatórios" subtitle="Exporte os dados da sua operação agrícola em planilha (CSV).">
      {fazendas.isPending ? <Carregando texto="Carregando fazendas..." /> : fazendas.isError ? <ErroBloco erro={fazendas.error} aoTentarDeNovo={() => fazendas.refetch()} /> : lista.length === 0 ? (
        <Vazio titulo="Cadastre uma fazenda primeiro" texto="Os relatórios são gerados a partir dos dados de uma fazenda." acao={<Link href="/dashboard/fazendas" className="text-sm font-medium text-[#0b5d3b] underline">Ir para Fazendas</Link>} />
      ) : (
        <>
          <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm text-[#1e40af]"><Info className="mt-0.5 size-4 shrink-0" /><p>O arquivo CSV abre direto no Excel ou no LibreOffice (colunas separadas por ponto e vírgula, números com vírgula decimal). Datas e horários estão no horário de Brasília.</p></div>
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section>
              <div className="mb-4"><h2 className="text-lg font-semibold">Tipo de relatório</h2><p className="text-sm text-[#66736b]">Escolha o que deseja exportar</p></div>
              <div role="radiogroup" aria-label="Tipo de relatório" className="grid gap-4 sm:grid-cols-2">
                {tipos.map(t => (
                  <button key={t.id} type="button" role="radio" aria-checked={tipo === t.id} onClick={() => { setTipo(t.id); baixar.reset() }} className={`flex items-start gap-3 rounded-xl border bg-white p-5 text-left shadow-sm transition ${tipo === t.id ? 'border-[#0b5d3b] ring-4 ring-[#0b5d3b]/10' : 'border-[#dde5df] hover:border-[#0b5d3b]/40'}`}>
                    <div className={`rounded-lg p-2 ${tipo === t.id ? 'bg-[#0b5d3b] text-white' : 'bg-[#dff5e9] text-[#0b5d3b]'}`}><t.Icone className="size-5" /></div>
                    <div><p className="font-semibold">{t.nome}</p><p className="mt-1 text-sm text-[#66736b]">{t.desc}</p></div>
                  </button>
                ))}
              </div>
            </section>

            <section className="self-start rounded-xl border border-[#dde5df] bg-white p-6 shadow-sm">
              <h2 className="font-semibold">Parâmetros</h2><p className="text-sm text-[#66736b]">{selecionado.nome}</p>
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2"><label htmlFor="fazenda" className="text-sm font-medium">Fazenda</label><select id="fazenda" value={fazendaId} onChange={e => { setEscolhida(e.target.value); baixar.reset() }} className={inputCls}>{lista.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2"><label htmlFor="de" className="text-sm font-medium">De</label><input id="de" type="date" value={de} max={hoje} onChange={e => setDe(e.target.value)} className={inputCls} /></div>
                  <div className="flex flex-col gap-2"><label htmlFor="ate" className="text-sm font-medium">Até</label><input id="ate" type="date" value={ate} max={hoje} onChange={e => setAte(e.target.value)} className={inputCls} /></div>
                </div>
                {erroPeriodo ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{erroPeriodo}</p> : <p className="text-xs text-[#66736b]">As duas datas entram no relatório (até {MAXIMO_DIAS} dias).</p>}
                {tipo === 'CLIMA' && <p className="text-xs text-[#66736b]">Usa a estação virtual da fazenda (dados do Open-Meteo). Se a fazenda ainda não tiver estação, crie-a na tela de <Link href="/dashboard/clima" className="font-medium text-[#0b5d3b] underline">Clima</Link>.</p>}
                <button type="button" onClick={gerar} disabled={!fazendaId || !!erroPeriodo || baixar.isPending} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0b5d3b] text-sm font-semibold text-white transition hover:bg-[#06452c] disabled:cursor-not-allowed disabled:opacity-50">
                  {baixar.isPending ? <><span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Gerando...</> : <><Download className="size-4" />Baixar CSV</>}
                </button>
                <AvisoDeErro erro={baixar.error} />
                {baixar.isSuccess && <p role="status" className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"><CheckCircle2 className="size-4 shrink-0" />Download iniciado: {baixar.data.nome}</p>}
              </div>
            </section>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
