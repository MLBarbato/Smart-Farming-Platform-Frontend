'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, Cpu, Gauge, Plus, Power, PowerOff, Radio, Search, Trash2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard-shell'
import { Dialog } from '@/components/ui/dialog'
import { Entrada, Selecao, estiloSelecaoFiltro } from '@/components/ui/campos'
import { AvisoDeErro, Carregando, ErroBloco, Vazio } from '@/components/ui/estados'
import { useFazendas } from '@/lib/dados/fazendas'
import { useAlterarStatusSensor, useCriarSensor, useExcluirSensor, useSensoresDaFazenda, type SensorDoTalhao } from '@/lib/dados/sensores'
import { useMapa } from '@/lib/dados/talhoes'
import { rotuloStatusSensor, rotuloVariavel, type StatusSensor, type VariavelMonitorada } from '@/lib/dados/tipos'
import { formatarNumero } from '@/lib/formatacao'

const estiloStatus: Record<StatusSensor, string> = {
  ATIVO: 'bg-[#dff5e9] text-[#0b5d3b]',
  INATIVO: 'bg-[#f1f3f2] text-[#66736b]',
  MANUTENCAO: 'bg-[#fff7ed] text-[#b45309]',
}
const variaveis = Object.keys(rotuloVariavel) as VariavelMonitorada[]
const statuses = Object.keys(rotuloStatusSensor) as StatusSensor[]
const dataLeitura = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-BR') : '')

export function SensorsPage() {
  const fazendas = useFazendas()
  const [fazendaEscolhida, setFazendaEscolhida] = useState<number>()
  const fazendaId = fazendaEscolhida ?? fazendas.data?.[0]?.id
  const fazenda = fazendas.data?.find(f => f.id === fazendaId)

  const mapa = useMapa(fazendaId)
  const talhoes = useMemo(
    () => (mapa.data?.talhoes ?? []).map(t => ({ id: t.id as number, identificacao: t.identificacao ?? '' })),
    [mapa.data],
  )
  const { sensores, carregando, erro, recarregar } = useSensoresDaFazenda(fazendaId, talhoes)

  const criar = useCriarSensor(fazendaId ?? 0)
  const alterarStatus = useAlterarStatusSensor(fazendaId ?? 0)
  const excluir = useExcluirSensor(fazendaId ?? 0)

  const [busca, setBusca] = useState('')
  const [talhao, setTalhao] = useState('')
  const [variavel, setVariavel] = useState('')
  const [status, setStatus] = useState('')
  const [novo, setNovo] = useState(false)
  const [excluindo, setExcluindo] = useState<SensorDoTalhao | null>(null)

  const filtrados = sensores.filter(s =>
    (!talhao || String(s.talhaoId) === talhao) && (!variavel || s.sensor?.variavel === variavel) && (!status || s.sensor?.status === status) &&
    `${s.sensor?.codigo} ${s.talhaoIdentificacao}`.toLowerCase().includes(busca.trim().toLowerCase()),
  )
  const contar = (st: StatusSensor) => sensores.filter(s => s.sensor?.status === st).length

  function mudarFazenda(id: number) {
    setFazendaEscolhida(id)
    setTalhao('')
  }

  async function confirmarExclusao() {
    if (!excluindo?.sensor?.id) return
    try {
      await excluir.mutateAsync({ talhaoId: excluindo.talhaoId, sensorId: excluindo.sensor.id })
      setExcluindo(null)
    } catch {
      /* a mensagem aparece no diálogo */
    }
  }

  const botaoNovo = fazendaId !== undefined && talhoes.length > 0 && (
    <Button onClick={() => { criar.reset(); setNovo(true) }} className="h-10 gap-2 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]"><Plus className="size-4" />Novo sensor</Button>
  )

  return (
    <DashboardShell title="Sensores" subtitle="Cadastre e acompanhe os sensores instalados nos talhões." actions={botaoNovo || undefined}>
      {fazendas.isPending ? <Carregando texto="Carregando fazendas..." /> : fazendas.isError ? <ErroBloco erro={fazendas.error} aoTentarDeNovo={() => fazendas.refetch()} /> : fazendas.data.length === 0 ? (
        <Vazio titulo="Cadastre uma fazenda primeiro" texto="Os sensores ficam em talhões de uma fazenda. Vá em Fazendas e crie a sua propriedade." />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label htmlFor="fazenda" className="text-sm font-medium">Fazenda</label>
            <select id="fazenda" value={fazendaId} onChange={e => mudarFazenda(Number(e.target.value))} className={estiloSelecaoFiltro}>
              {fazendas.data.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>

          {mapa.isPending ? <Carregando texto="Carregando talhões..." /> : mapa.isError ? <ErroBloco erro={mapa.error} aoTentarDeNovo={() => mapa.refetch()} /> : talhoes.length === 0 ? (
            <Vazio titulo="Esta fazenda não tem talhões" texto="Cadastre um talhão em Talhões para poder instalar sensores." />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {([['Total de sensores', sensores.length, `em ${talhoes.length} talhão(ões)`, Gauge], ['Ativos', contar('ATIVO'), 'Aceitam leituras', Radio], ['Inativos', contar('INATIVO'), 'Desativados', PowerOff], ['Em manutenção', contar('MANUTENCAO'), 'Não aceitam leituras', AlertTriangle]] as const).map(([titulo, valor, descricao, Icone]) => (
                  <div key={titulo} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{titulo}</span><Icone className="size-5 text-[#0b5d3b]" /></div><p className="mt-3 text-3xl font-semibold">{valor}</p><p className="mt-1 text-xs text-[#66736b]">{descricao}</p></div>
                ))}
              </div>

              <section className="mt-8">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                  <div><h2 className="text-lg font-semibold">Sensores de {fazenda?.nome}</h2><p className="text-sm text-[#66736b]">{filtrados.length} de {sensores.length} sensores</p></div>
                  <div className="flex w-full flex-wrap gap-3 xl:w-auto">
                    <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-none"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input autoComplete="off" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar sensor" placeholder="Buscar código" className="h-10 w-full rounded-lg border border-[#dde5df] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-[#66736b] focus:border-[#0b5d3b]" /></div>
                    <select value={talhao} onChange={e => setTalhao(e.target.value)} aria-label="Filtrar por talhão" className={estiloSelecaoFiltro}><option value="">Todos os talhões</option>{talhoes.map(t => <option key={t.id} value={t.id}>{t.identificacao}</option>)}</select>
                    <select value={variavel} onChange={e => setVariavel(e.target.value)} aria-label="Filtrar por variável" className={estiloSelecaoFiltro}><option value="">Todas as variáveis</option>{variaveis.map(v => <option key={v} value={v}>{rotuloVariavel[v]}</option>)}</select>
                    <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filtrar por status" className={estiloSelecaoFiltro}><option value="">Todos os status</option>{statuses.map(s => <option key={s} value={s}>{rotuloStatusSensor[s]}</option>)}</select>
                  </div>
                </div>

                <AvisoDeErro erro={alterarStatus.error} />
                {carregando ? <Carregando texto="Carregando sensores..." /> : erro ? <ErroBloco erro={erro} aoTentarDeNovo={recarregar} /> : filtrados.length === 0 ? (
                  <Vazio titulo="Nenhum sensor encontrado" texto="Ajuste os filtros ou cadastre um novo sensor." />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#dde5df] bg-white shadow-sm">
                    <table className="w-full min-w-[900px] text-left text-sm">
                      <thead className="border-b border-[#dde5df] bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-5 py-3 font-medium">Código</th><th className="px-5 py-3 font-medium">Variável</th><th className="px-5 py-3 font-medium">Talhão</th><th className="px-5 py-3 font-medium">Última leitura</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3"><span className="sr-only">Ações</span></th></tr></thead>
                      <tbody className="divide-y divide-[#dde5df]">
                        {filtrados.map(s => {
                          const sensor = s.sensor!
                          const ativo = sensor.status === 'ATIVO'
                          return (
                            <tr key={sensor.id} className="hover:bg-[#f8faf8]">
                              <td className="px-5 py-4 font-medium">{sensor.codigo}{sensor.dataInstalacao && <p className="text-xs font-normal text-[#66736b]">Instalado em {sensor.dataInstalacao.slice(0, 10).split('-').reverse().join('/')}</p>}</td>
                              <td className="px-5 py-4">{rotuloVariavel[sensor.variavel as VariavelMonitorada] ?? sensor.variavel}</td>
                              <td className="px-5 py-4 text-[#66736b]">{s.talhaoIdentificacao}</td>
                              <td className="px-5 py-4 tabular-nums">{s.ultimaLeitura ? <><p className="font-medium">{formatarNumero(s.ultimaLeitura.valor, 2)} {sensor.unidade}</p><p className="text-xs text-[#66736b]">{dataLeitura(s.ultimaLeitura.dataHora)}</p></> : <span className="text-xs text-[#66736b]">Sem leituras</span>}</td>
                              <td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${estiloStatus[sensor.status as StatusSensor]}`}>{rotuloStatusSensor[sensor.status as StatusSensor]}</span></td>
                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                <button disabled={alterarStatus.isPending} onClick={() => alterarStatus.mutate({ talhaoId: s.talhaoId, sensorId: sensor.id!, status: ativo ? 'INATIVO' : 'ATIVO' })} aria-label={`${ativo ? 'Desativar' : 'Ativar'} ${sensor.codigo}`} className="rounded-lg p-2 text-[#66736b] hover:bg-[#f8faf8] disabled:opacity-50"><Power className="size-4" /></button>
                                {sensor.status !== 'MANUTENCAO' && <button disabled={alterarStatus.isPending} onClick={() => alterarStatus.mutate({ talhaoId: s.talhaoId, sensorId: sensor.id!, status: 'MANUTENCAO' })} aria-label={`Colocar ${sensor.codigo} em manutenção`} className="rounded-lg p-2 text-[#66736b] hover:bg-[#f8faf8] disabled:opacity-50"><Wrench className="size-4" /></button>}
                                <button onClick={() => { excluir.reset(); setExcluindo(s) }} aria-label={`Excluir ${sensor.codigo}`} className="rounded-lg p-2 text-[#66736b] hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {fazendaId !== undefined && (
            <Dialog aberto={novo} aoFechar={() => setNovo(false)} titulo="Novo sensor" descricao={fazenda?.nome}>
              {novo && <FormularioSensor talhoes={talhoes} criar={criar} aoFechar={() => setNovo(false)} />}
            </Dialog>
          )}

          <Dialog aberto={!!excluindo} aoFechar={() => setExcluindo(null)} titulo="Excluir sensor" descricao={excluindo?.sensor?.codigo}>
            <div className="flex flex-col gap-4">
              <p className="text-sm">Esta ação não pode ser desfeita. Sensores que já têm leituras não podem ser excluídos: desative-os.</p>
              <AvisoDeErro erro={excluir.error} />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setExcluindo(null)} className="h-10 rounded-lg px-4">Cancelar</Button>
                <Button onClick={confirmarExclusao} disabled={excluir.isPending} className="h-10 rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700">{excluir.isPending ? 'Excluindo...' : 'Excluir'}</Button>
              </div>
            </div>
          </Dialog>
        </>
      )}
    </DashboardShell>
  )
}

function FormularioSensor({ talhoes, criar, aoFechar }: { talhoes: { id: number; identificacao: string }[]; criar: ReturnType<typeof useCriarSensor>; aoFechar: () => void }) {
  const [talhaoId, setTalhaoId] = useState(String(talhoes[0]?.id ?? ''))
  const [codigo, setCodigo] = useState('')
  const [variavel, setVariavel] = useState<VariavelMonitorada | ''>('')
  const [data, setData] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!variavel) return
    try {
      await criar.mutateAsync({ talhaoId: Number(talhaoId), corpo: { codigo: codigo.trim(), variavel, ...(data ? { dataInstalacao: data } : {}) } })
      aoFechar()
    } catch {
      /* a mensagem aparece no formulário */
    }
  }

  return (
    <form autoComplete="off" onSubmit={enviar} className="flex flex-col gap-4">
      <Selecao id="talhao" rotulo="Talhão de instalação" value={talhaoId} onChange={e => setTalhaoId(e.target.value)} required opcoes={talhoes.map(t => ({ valor: String(t.id), rotulo: t.identificacao }))} />
      <Entrada id="codigo" rotulo="Código do sensor" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ex.: SENS-001" required maxLength={60} ajuda="O código é único em todo o sistema." />
      <Selecao id="variavel" rotulo="Variável medida" value={variavel} onChange={e => setVariavel(e.target.value as VariavelMonitorada)} required placeholder="Selecione" opcoes={variaveis.map(v => ({ valor: v, rotulo: rotuloVariavel[v] }))} ajuda="A unidade é definida pela variável." />
      <Entrada id="data" rotulo="Data de instalação (opcional)" type="date" value={data} onChange={e => setData(e.target.value)} />
      <AvisoDeErro erro={criar.error} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={aoFechar} className="h-10 rounded-lg px-4">Cancelar</Button>
        <Button type="submit" disabled={criar.isPending || !variavel || !codigo.trim()} className="h-10 gap-2 rounded-lg bg-[#0b5d3b] px-4 font-semibold text-white hover:bg-[#06452c]"><Cpu className="size-4" />{criar.isPending ? 'Salvando...' : 'Salvar sensor'}</Button>
      </div>
    </form>
  )
}
