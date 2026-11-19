'use client'

import { useState, type FormEvent } from 'react'
import { AlertTriangle, BellRing, Check, CheckCircle2, Clock, Eye, Gauge, XCircle } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { estiloSelecaoFiltro } from '@/components/ui/campos'
import { Dialog } from '@/components/ui/dialog'
import { AvisoDeErro, Carregando, ErroBloco } from '@/components/ui/estados'
import { rotuloCriticidade } from '@/lib/criticidade'
import { useAtenderAlerta, useListaAlertas } from '@/lib/dados/alertas'
import { useFazendas, useResumoGeral } from '@/lib/dados/fazendas'
import { rotuloEventoAlerta, rotuloStatusAlerta, type AlertaResponse, type CriticidadeAlerta, type EventoAlerta, type StatusAlerta } from '@/lib/dados/tipos'
import { formatarNumero } from '@/lib/formatacao'

const abas = {
  Abertos: ['ABERTO', 'EM_ATENDIMENTO'],
  Encerrados: ['RESOLVIDO', 'DISPENSADO'],
  Todos: ['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO', 'DISPENSADO'],
} as const satisfies Record<string, StatusAlerta[]>
type Aba = keyof typeof abas

const estiloCriticidade: Record<CriticidadeAlerta, { selo: string; icone: string }> = {
  ALTA: { selo: 'bg-[#fef2f2] text-[#dc2626]', icone: 'bg-[#fef2f2] text-[#dc2626]' },
  MEDIA: { selo: 'bg-[#fff7ed] text-[#b45309]', icone: 'bg-[#fff7ed] text-[#eab308]' },
  BAIXA: { selo: 'bg-[#dff5e9] text-[#0b5d3b]', icone: 'bg-[#dff5e9] text-[#0b5d3b]' },
}
const operadores = { MENOR_QUE: '<', MENOR_OU_IGUAL: '≤', MAIOR_QUE: '>', MAIOR_OU_IGUAL: '≥' } as const
const dataHora = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-BR') : '')
const fechado = (s?: StatusAlerta) => s === 'RESOLVIDO' || s === 'DISPENSADO'

export function AlertsPage() {
  const fazendas = useFazendas()
  const resumo = useResumoGeral()
  const [aba, setAba] = useState<Aba>('Abertos')
  const [fazendaId, setFazendaId] = useState('')
  const [criticidade, setCriticidade] = useState('')
  const [evento, setEvento] = useState('')
  const [pagina, setPagina] = useState(0)
  const [dispensando, setDispensando] = useState<AlertaResponse | null>(null)
  const [nota, setNota] = useState('')

  const filtro = {
    status: [...abas[aba]],
    ...(fazendaId ? { fazendaId: Number(fazendaId) } : {}),
    ...(criticidade ? { criticidade: criticidade as CriticidadeAlerta } : {}),
    ...(evento ? { evento: evento as EventoAlerta } : {}),
    pagina,
    tamanho: 10,
  }
  const lista = useListaAlertas(filtro)
  const resolvidos = useListaAlertas({ status: ['RESOLVIDO'], tamanho: 1 })
  const atender = useAtenderAlerta()

  const totais = resumo.data?.totais
  const alertas = lista.data?.conteudo ?? []
  const totalPaginas = lista.data?.totalPaginas ?? 0

  const filtrar = (f: () => void) => { f(); setPagina(0) }
  const mudar = (a: AlertaResponse, status: StatusAlerta) => atender.mutate({ fazendaId: a.fazendaId!, alertaId: a.id!, status })

  async function dispensar(e: FormEvent) {
    e.preventDefault()
    if (!dispensando || !nota.trim()) return
    try {
      await atender.mutateAsync({ fazendaId: dispensando.fazendaId!, alertaId: dispensando.id!, status: 'DISPENSADO', nota: nota.trim() })
      setDispensando(null)
    } catch {
      /* a mensagem aparece no diálogo */
    }
  }

  return (
    <DashboardShell title="Alertas" subtitle="Acompanhe ocorrências que requerem atenção na operação.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([['Alertas abertos', totais?.alertas?.abertos ?? 0, 'Requerem atenção', BellRing], ['Prioridade alta', totais?.alertas?.alta ?? 0, 'Ação imediata', AlertTriangle], ['Sensores sem leitura', totais?.sensoresSemLeituraRecente ?? 0, 'Sem leitura recente', Gauge], ['Resolvidos', resolvidos.data?.totalElementos ?? 0, 'No histórico', CheckCircle2]] as const).map(([titulo, valor, desc, Icone]) => (
          <div key={titulo} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{titulo}</span><Icone className="size-5 text-[#0b5d3b]" /></div><p className="mt-3 text-3xl font-semibold">{valor}</p><p className="mt-1 text-xs text-[#66736b]">{desc}</p></div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-[#dde5df] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div role="tablist" aria-label="Filtrar alertas" className="flex rounded-lg bg-[#f8faf8] p-1 ring-1 ring-[#dde5df]">{(Object.keys(abas) as Aba[]).map(t => <button key={t} role="tab" aria-selected={aba === t} onClick={() => filtrar(() => setAba(t))} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${aba === t ? 'bg-[#0b5d3b] text-white' : 'text-[#66736b] hover:text-[#17201b]'}`}>{t}</button>)}</div>
          <div className="flex flex-wrap gap-3">
            <select value={fazendaId} onChange={e => filtrar(() => setFazendaId(e.target.value))} aria-label="Filtrar por fazenda" className={estiloSelecaoFiltro}><option value="">Todas as fazendas</option>{(fazendas.data ?? []).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
            <select value={criticidade} onChange={e => filtrar(() => setCriticidade(e.target.value))} aria-label="Filtrar por prioridade" className={estiloSelecaoFiltro}><option value="">Todas as prioridades</option>{(Object.keys(rotuloCriticidade) as CriticidadeAlerta[]).map(c => <option key={c} value={c}>{rotuloCriticidade[c]}</option>)}</select>
            <select value={evento} onChange={e => filtrar(() => setEvento(e.target.value))} aria-label="Filtrar por tipo" className={estiloSelecaoFiltro}><option value="">Todos os tipos</option>{(Object.keys(rotuloEventoAlerta) as EventoAlerta[]).map(v => <option key={v} value={v}>{rotuloEventoAlerta[v]}</option>)}</select>
          </div>
        </div>
        <div className="px-6"><AvisoDeErro erro={atender.error && !dispensando ? atender.error : null} /></div>

        {lista.isPending ? <div className="border-t border-[#dde5df] px-6"><Carregando /></div> : lista.isError ? <div className="border-t border-[#dde5df] p-6"><ErroBloco erro={lista.error} aoTentarDeNovo={() => lista.refetch()} /></div> : alertas.length === 0 ? (
          <div className="flex flex-col items-center border-t border-[#dde5df] px-6 py-14 text-center"><div className="rounded-xl bg-[#dff5e9] p-3 text-[#0b5d3b]"><CheckCircle2 /></div><p className="mt-4 font-semibold">Nenhum alerta por aqui</p><p className="mt-1 text-sm text-[#66736b]">Tudo certo com a sua operação neste filtro.</p></div>
        ) : (
          <ul className="border-t border-[#dde5df]">
            {alertas.map(a => {
              const estilo = estiloCriticidade[a.criticidade ?? 'BAIXA']
              const encerrado = fechado(a.status)
              const regra = a.regra
              return (
                <li key={a.id} className="flex flex-wrap items-start gap-4 border-b border-[#dde5df] px-6 py-5 last:border-0 sm:flex-nowrap">
                  <div className={`rounded-lg p-2 ${encerrado ? 'bg-[#f1f3f2] text-[#66736b]' : estilo.icone}`}>{encerrado ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-medium ${encerrado ? 'text-[#66736b]' : ''}`}>{a.evento ? rotuloEventoAlerta[a.evento] : 'Alerta'}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilo.selo}`}>{rotuloCriticidade[a.criticidade ?? 'BAIXA']}</span>
                      <span className="rounded-full bg-[#f1f3f2] px-2 py-0.5 text-xs font-medium text-[#66736b]">{a.status ? rotuloStatusAlerta[a.status] : ''}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#66736b]">{a.mensagem}</p>
                    {(regra?.limiar != null || a.leitura?.valor != null) && <p className="mt-1 text-xs text-[#66736b]">{a.leitura?.valor != null && <>Leitura: <b>{formatarNumero(a.leitura.valor, 2)}{regra?.unidade ? ` ${regra.unidade}` : ''}</b></>}{regra?.limiar != null && regra.operador && <> · Regra: {operadores[regra.operador]} {formatarNumero(regra.limiar)}{regra.unidade ? ` ${regra.unidade}` : ''}{regra.janelaHoras ? ` em ${regra.janelaHoras} h` : ''}</>}</p>}
                    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-[#66736b]"><Clock className="size-3" />{a.talhaoIdentificacao} · {a.fazendaNome} · {dataHora(a.dataHora)}</p>
                    {a.atendente?.nome && <p className="mt-1 text-xs text-[#66736b]">Atendido por {a.atendente.nome}{a.atendidoEm ? ` em ${dataHora(a.atendidoEm)}` : ''}{a.resolucao === 'AUTOMATICA' ? ' · resolvido automaticamente' : ''}</p>}
                    {!a.atendente?.nome && a.resolucao === 'AUTOMATICA' && <p className="mt-1 text-xs text-[#66736b]">Resolvido automaticamente em {dataHora(a.resolvidoEm)}: a condição voltou ao normal.</p>}
                    {a.nota && <p className="mt-1 text-xs italic text-[#66736b]">Nota: {a.nota}</p>}
                  </div>
                  {!encerrado && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {a.status === 'ABERTO' && <button disabled={atender.isPending} onClick={() => mudar(a, 'EM_ATENDIMENTO')} className="flex items-center gap-1.5 rounded-lg border border-[#dde5df] bg-white px-3 py-2 text-sm font-medium transition hover:bg-[#f8faf8] disabled:opacity-50"><Eye className="size-3.5" /> Atender</button>}
                      <button disabled={atender.isPending} onClick={() => mudar(a, 'RESOLVIDO')} className="flex items-center gap-1.5 rounded-lg border border-[#dde5df] bg-white px-3 py-2 text-sm font-medium transition hover:bg-[#dff5e9] hover:text-[#0b5d3b] disabled:opacity-50"><Check className="size-3.5" /> Resolver</button>
                      <button disabled={atender.isPending} onClick={() => { atender.reset(); setNota(''); setDispensando(a) }} className="flex items-center gap-1.5 rounded-lg border border-[#dde5df] bg-white px-3 py-2 text-sm font-medium text-[#66736b] transition hover:bg-[#f8faf8] disabled:opacity-50"><XCircle className="size-3.5" /> Dispensar</button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-[#dde5df] px-6 py-4 text-sm text-[#66736b]">
            <span>{lista.data?.totalElementos} alertas · página {pagina + 1} de {totalPaginas}</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)} className="h-9 rounded-lg px-3">Anterior</Button>
              <Button variant="outline" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="h-9 rounded-lg px-3">Próxima</Button>
            </div>
          </div>
        )}
      </section>

      <Dialog aberto={!!dispensando} aoFechar={() => setDispensando(null)} titulo="Dispensar alerta" descricao={dispensando?.mensagem}>
        <form autoComplete="off" onSubmit={dispensar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nota" className="text-sm font-medium">Motivo (obrigatório)</label>
            <textarea id="nota" autoComplete="off" value={nota} onChange={e => setNota(e.target.value)} required maxLength={500} rows={3} placeholder="Ex.: sensor em manutenção; leitura conferida no campo." className="w-full rounded-lg border border-[#dde5df] bg-white p-3 text-sm outline-none focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10" />
            <p className="text-xs text-[#66736b]">Um alerta dispensado não reabre.</p>
          </div>
          <AvisoDeErro erro={atender.error} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDispensando(null)} className="h-10 rounded-lg px-4">Cancelar</Button>
            <Button type="submit" disabled={atender.isPending || !nota.trim()} className="h-10 rounded-lg bg-[#0b5d3b] px-4 font-semibold text-white hover:bg-[#06452c]">{atender.isPending ? 'Salvando...' : 'Dispensar'}</Button>
          </div>
        </form>
      </Dialog>
    </DashboardShell>
  )
}
