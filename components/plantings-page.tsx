'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, ClipboardList, Pencil, Play, Plus, Sprout, Trash2, Wheat, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard-shell'
import { Dialog } from '@/components/ui/dialog'
import { Entrada, Selecao, estiloSelecaoFiltro } from '@/components/ui/campos'
import { AvisoDeErro, Carregando, ErroBloco, Vazio } from '@/components/ui/estados'
import { ApiError } from '@/lib/api/erro'
import { useFazendas } from '@/lib/dados/fazendas'
import { useAlterarStatusPlantio, useCorrigirColheita, useCulturas, useExcluirPlantio, usePlantios, useSalvarPlantio } from '@/lib/dados/plantios'
import { useMapa } from '@/lib/dados/talhoes'
import { rotuloStatusPlantio, type PlantioResponse, type StatusPlantio } from '@/lib/dados/tipos'
import { formatarData, formatarNumero, lerNumero } from '@/lib/formatacao'
import { acoesDoPlantio, hojeIso, safraDaData, safraValida } from '@/lib/plantio'

const estiloStatus: Record<StatusPlantio, string> = {
  PLANEJADO: 'bg-[#eff6ff] text-[#1d4ed8]',
  EM_CULTIVO: 'bg-[#dff5e9] text-[#0b5d3b]',
  COLHIDO: 'bg-[#fef9c3] text-[#854d0e]',
  CANCELADO: 'bg-[#f1f3f2] text-[#66736b]',
}
const tiposDePlantio = ['Plantio direto', 'Convencional', 'Cultivo mínimo', 'Replantio']

type Acao =
  | { tipo: 'editar'; plantio: PlantioResponse | 'novo' }
  | { tipo: 'colher'; plantio: PlantioResponse }
  | { tipo: 'corrigir'; plantio: PlantioResponse }
  | { tipo: 'cancelar'; plantio: PlantioResponse }
  | { tipo: 'excluir'; plantio: PlantioResponse }

export function PlantingsPage() {
  const fazendas = useFazendas()
  const [fazendaId, setFazendaId] = useState<number | undefined>()
  const idEfetivo = fazendas.data?.some(f => f.id === fazendaId) ? fazendaId : fazendas.data?.[0]?.id
  const plantios = usePlantios(idEfetivo)
  const mapa = useMapa(idEfetivo)
  const culturas = useCulturas()
  const alterarStatus = useAlterarStatusPlantio()
  const [filtroTalhao, setFiltroTalhao] = useState('')
  const [filtroCultura, setFiltroCultura] = useState('')
  const [filtroSafra, setFiltroSafra] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [acao, setAcao] = useState<Acao | null>(null)

  const nomeDoTalhao = useMemo(() => new Map((mapa.data?.talhoes ?? []).map(t => [t.id, t.identificacao])), [mapa.data])
  const lista = useMemo(() => plantios.data ?? [], [plantios.data])
  const safras = useMemo(() => Array.from(new Set(lista.map(p => p.safra).filter(Boolean) as string[])).sort().reverse(), [lista])
  const filtrados = lista.filter(p =>
    (!filtroTalhao || String(p.talhaoId) === filtroTalhao) && (!filtroCultura || String(p.culturaId) === filtroCultura) &&
    (!filtroSafra || p.safra === filtroSafra) && (!filtroStatus || p.status === filtroStatus))

  const contar = (s: StatusPlantio) => lista.filter(p => p.status === s).length
  const produtividades = lista.map(p => p.produtividadeKgPorHectare).filter((v): v is number => typeof v === 'number')
  const mediaProdutividade = produtividades.length ? produtividades.reduce((a, b) => a + b, 0) / produtividades.length : null

  const fechar = () => { setAcao(null); alterarStatus.reset() }

  async function mudarStatus(p: PlantioResponse, status: StatusPlantio) {
    try {
      await alterarStatus.mutateAsync({ fazendaId: idEfetivo!, talhaoId: p.talhaoId!, id: p.id!, status })
      fechar()
    } catch {
      /* o erro aparece no diálogo ou no aviso da página */
    }
  }

  return (
    <DashboardShell
      title="Plantios"
      subtitle="Registre e acompanhe o ciclo das culturas em cada talhão."
      actions={idEfetivo !== undefined && <Button onClick={() => setAcao({ tipo: 'editar', plantio: 'novo' })} className="h-10 gap-2 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]"><Plus className="size-4" />Novo plantio</Button>}
    >
      {fazendas.isPending ? <Carregando texto="Carregando fazendas..." /> : fazendas.isError ? <ErroBloco erro={fazendas.error} aoTentarDeNovo={() => fazendas.refetch()} /> : fazendas.data.length === 0 ? (
        <Vazio titulo="Cadastre uma fazenda primeiro" texto="Os plantios pertencem aos talhões de uma fazenda." />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label htmlFor="fazenda" className="text-sm font-medium">Fazenda</label>
            <select id="fazenda" value={idEfetivo} onChange={e => { setFazendaId(Number(e.target.value)); setFiltroTalhao('') }} className={estiloSelecaoFiltro}>
              {fazendas.data.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {([
              ['Em cultivo', String(contar('EM_CULTIVO')), 'Plantios em andamento', Sprout],
              ['Planejados', String(contar('PLANEJADO')), 'Aguardando início', ClipboardList],
              ['Colhidos', String(contar('COLHIDO')), 'Safras encerradas', Wheat],
              ['Produtividade média', mediaProdutividade === null ? '—' : `${formatarNumero(mediaProdutividade, 0)} kg/ha`, 'Plantios colhidos com quantidade', CheckCircle2],
            ] as const).map(([titulo, valor, descricao, Icone]) => (
              <div key={titulo} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{titulo}</span><Icone className="size-5 text-[#0b5d3b]" /></div>
                <p className="mt-3 text-3xl font-semibold">{valor}</p><p className="mt-1 text-xs text-[#66736b]">{descricao}</p>
              </div>
            ))}
          </div>

          <section className="mt-8 rounded-xl border border-[#dde5df] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 p-6">
              <div><h2 className="text-lg font-semibold">Plantios</h2><p className="text-sm text-[#66736b]">{filtrados.length} de {lista.length} plantios</p></div>
              <div className="flex flex-wrap items-center gap-3">
                <select value={filtroTalhao} onChange={e => setFiltroTalhao(e.target.value)} aria-label="Filtrar por talhão" className={estiloSelecaoFiltro}><option value="">Todos os talhões</option>{(mapa.data?.talhoes ?? []).map(t => <option key={t.id} value={t.id}>{t.identificacao}</option>)}</select>
                <select value={filtroCultura} onChange={e => setFiltroCultura(e.target.value)} aria-label="Filtrar por cultura" className={estiloSelecaoFiltro}><option value="">Todas as culturas</option>{(culturas.data ?? []).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
                <select value={filtroSafra} onChange={e => setFiltroSafra(e.target.value)} aria-label="Filtrar por safra" className={estiloSelecaoFiltro}><option value="">Todas as safras</option>{safras.map(s => <option key={s}>{s}</option>)}</select>
                <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} aria-label="Filtrar por status" className={estiloSelecaoFiltro}><option value="">Todos os status</option>{(Object.keys(rotuloStatusPlantio) as StatusPlantio[]).map(s => <option key={s} value={s}>{rotuloStatusPlantio[s]}</option>)}</select>
              </div>
            </div>
            {alterarStatus.error && !acao && <div className="px-6 pb-4"><AvisoDeErro erro={alterarStatus.error} /></div>}

            {plantios.isPending ? <div className="px-6"><Carregando texto="Carregando plantios..." /></div> : plantios.isError ? <div className="px-6 pb-6"><ErroBloco erro={plantios.error} aoTentarDeNovo={() => plantios.refetch()} /></div> : lista.length === 0 ? (
              <div className="px-6 pb-6"><Vazio titulo="Nenhum plantio nesta fazenda" texto="Registre o primeiro plantio escolhendo um talhão e uma cultura do catálogo." acao={<Button onClick={() => setAcao({ tipo: 'editar', plantio: 'novo' })} className="mt-2 h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">Novo plantio</Button>} /></div>
            ) : filtrados.length === 0 ? <div className="px-6 pb-6"><Vazio titulo="Nenhum plantio encontrado" texto="Ajuste os filtros." /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[64rem] text-left text-sm">
                  <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-6 py-3 font-medium">Talhão</th><th className="px-4 py-3 font-medium">Cultura</th><th className="px-4 py-3 font-medium">Safra</th><th className="px-4 py-3 font-medium">Plantio</th><th className="px-4 py-3 font-medium">Colheita</th><th className="px-4 py-3 font-medium">Produtividade</th><th className="px-4 py-3 font-medium">Status</th><th className="px-6 py-3 text-right font-medium">Ações</th></tr></thead>
                  <tbody className="divide-y divide-[#dde5df]">
                    {filtrados.map(p => {
                      const a = acoesDoPlantio(p.status)
                      return (
                        <tr key={p.id}>
                          <td className="px-6 py-4 font-medium">{nomeDoTalhao.get(p.talhaoId) ?? `Talhão ${p.talhaoId}`}</td>
                          <td className="px-4 py-4">{p.culturaNome}{p.tipoPlantio && <p className="text-xs text-[#66736b]">{p.tipoPlantio}</p>}</td>
                          <td className="whitespace-nowrap px-4 py-4">{p.safra}</td>
                          <td className="whitespace-nowrap px-4 py-4">{formatarData(p.dataPlantio)}</td>
                          <td className="whitespace-nowrap px-4 py-4">{p.dataColheitaReal ? formatarData(p.dataColheitaReal) : <span title="Prevista">{formatarData(p.dataColheitaPrevista)} <span className="text-xs text-[#66736b]">(prev.)</span></span>}</td>
                          <td className="whitespace-nowrap px-4 py-4">{p.produtividadeKgPorHectare != null ? `${formatarNumero(p.produtividadeKgPorHectare, 0)} kg/ha` : '—'}{p.quantidadeColhidaKg != null && <p className="text-xs text-[#66736b]">{formatarNumero(p.quantidadeColhidaKg)} kg</p>}</td>
                          <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estiloStatus[p.status as StatusPlantio]}`}>{rotuloStatusPlantio[p.status as StatusPlantio]}</span></td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            {a.iniciar && <button onClick={() => void mudarStatus(p, 'EM_CULTIVO')} disabled={alterarStatus.isPending} aria-label={`Iniciar cultivo de ${p.culturaNome}`} title="Iniciar cultivo" className="rounded-lg p-2 text-[#0b5d3b] hover:bg-[#dff5e9]"><Play className="size-4" /></button>}
                            {a.colher && <button onClick={() => { alterarStatus.reset(); setAcao({ tipo: 'colher', plantio: p }) }} aria-label={`Registrar colheita de ${p.culturaNome}`} title="Registrar colheita" className="rounded-lg p-2 text-[#854d0e] hover:bg-[#fef9c3]"><Wheat className="size-4" /></button>}
                            {a.corrigirColheita && <button onClick={() => { alterarStatus.reset(); setAcao({ tipo: 'corrigir', plantio: p }) }} aria-label={`Corrigir colheita de ${p.culturaNome}`} title="Corrigir colheita" className="rounded-lg p-2 text-[#66736b] hover:bg-[#f8faf8]"><Pencil className="size-4" /></button>}
                            {a.editar && <button onClick={() => setAcao({ tipo: 'editar', plantio: p })} aria-label={`Editar plantio de ${p.culturaNome}`} title="Editar" className="rounded-lg p-2 text-[#66736b] hover:bg-[#f8faf8]"><Pencil className="size-4" /></button>}
                            {a.cancelar && <button onClick={() => { alterarStatus.reset(); setAcao({ tipo: 'cancelar', plantio: p }) }} aria-label={`Cancelar plantio de ${p.culturaNome}`} title="Cancelar plantio" className="rounded-lg p-2 text-[#66736b] hover:bg-[#f8faf8]"><XCircle className="size-4" /></button>}
                            {a.excluir && <button onClick={() => setAcao({ tipo: 'excluir', plantio: p })} aria-label={`Excluir plantio de ${p.culturaNome}`} title="Excluir" className="rounded-lg p-2 text-[#66736b] hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {idEfetivo !== undefined && <Dialogos acao={acao} fechar={fechar} fazendaId={idEfetivo} talhoes={(mapa.data?.talhoes ?? []).map(t => ({ valor: String(t.id), rotulo: t.identificacao ?? '' }))} culturas={(culturas.data ?? []).map(c => ({ valor: String(c.id), rotulo: c.nome ?? '' }))} aoCancelar={mudarStatus} cancelando={alterarStatus.isPending} erroDeStatus={alterarStatus.error} />}
        </>
      )}
    </DashboardShell>
  )
}

type Opcao = { valor: string; rotulo: string }

function Dialogos({ acao, fechar, fazendaId, talhoes, culturas, aoCancelar, cancelando, erroDeStatus }: {
  acao: Acao | null; fechar: () => void; fazendaId: number; talhoes: Opcao[]; culturas: Opcao[]
  aoCancelar: (p: PlantioResponse, s: StatusPlantio) => Promise<void>; cancelando: boolean; erroDeStatus: unknown
}) {
  const excluir = useExcluirPlantio()
  async function confirmarExclusao(p: PlantioResponse) {
    try { await excluir.mutateAsync({ fazendaId, talhaoId: p.talhaoId!, id: p.id! }); fechar() } catch { /* aviso no diálogo */ }
  }
  return (
    <>
      <Dialog aberto={acao?.tipo === 'editar'} aoFechar={fechar} titulo={acao?.tipo === 'editar' && acao.plantio !== 'novo' ? 'Editar plantio' : 'Novo plantio'} descricao="O plantio nasce planejado; inicie o cultivo quando o plantio for feito." largura="max-w-xl">
        {acao?.tipo === 'editar' && <FormularioPlantio key={acao.plantio === 'novo' ? 'novo' : acao.plantio.id} fazendaId={fazendaId} plantio={acao.plantio} talhoes={talhoes} culturas={culturas} aoFechar={fechar} />}
      </Dialog>
      <Dialog aberto={acao?.tipo === 'colher' || acao?.tipo === 'corrigir'} aoFechar={fechar} titulo={acao?.tipo === 'corrigir' ? 'Corrigir colheita' : 'Registrar colheita'} descricao={acao && acao.tipo !== 'editar' && 'plantio' in acao ? (acao.plantio as PlantioResponse).culturaNome : undefined}>
        {(acao?.tipo === 'colher' || acao?.tipo === 'corrigir') && <FormularioColheita key={acao.plantio.id} fazendaId={fazendaId} plantio={acao.plantio} correcao={acao.tipo === 'corrigir'} aoFechar={fechar} />}
      </Dialog>
      <Dialog aberto={acao?.tipo === 'cancelar'} aoFechar={fechar} titulo="Cancelar plantio" descricao={acao?.tipo === 'cancelar' ? acao.plantio.culturaNome : undefined}>
        <div className="flex flex-col gap-4">
          <p className="text-sm">O plantio passa para <strong>Cancelado</strong> e não poderá mais ser alterado. Use isto quando o plantio não for mais acontecer ou for descartado.</p>
          <AvisoDeErro erro={erroDeStatus} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={fechar} className="h-10 rounded-lg px-4">Voltar</Button>
            <Button type="button" disabled={cancelando} onClick={() => acao?.tipo === 'cancelar' && void aoCancelar(acao.plantio, 'CANCELADO')} className="h-10 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">{cancelando ? 'Cancelando...' : 'Cancelar plantio'}</Button>
          </div>
        </div>
      </Dialog>
      <Dialog aberto={acao?.tipo === 'excluir'} aoFechar={fechar} titulo="Excluir plantio" descricao={acao?.tipo === 'excluir' ? acao.plantio.culturaNome : undefined}>
        <div className="flex flex-col gap-4">
          <p className="text-sm">Somente plantios planejados podem ser excluídos. Esta ação não pode ser desfeita.</p>
          <AvisoDeErro erro={excluir.error} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={fechar} className="h-10 rounded-lg px-4">Voltar</Button>
            <Button type="button" disabled={excluir.isPending} onClick={() => acao?.tipo === 'excluir' && void confirmarExclusao(acao.plantio)} className="h-10 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">{excluir.isPending ? 'Excluindo...' : 'Excluir'}</Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}

function FormularioPlantio({ fazendaId, plantio, talhoes, culturas, aoFechar }: { fazendaId: number; plantio: PlantioResponse | 'novo'; talhoes: Opcao[]; culturas: Opcao[]; aoFechar: () => void }) {
  const salvar = useSalvarPlantio()
  const edicao = plantio !== 'novo'
  const [campos, setCampos] = useState({
    talhaoId: edicao ? String(plantio.talhaoId) : '', culturaId: edicao ? String(plantio.culturaId) : '', tipoPlantio: edicao ? plantio.tipoPlantio ?? '' : 'Plantio direto',
    safra: edicao ? plantio.safra ?? '' : '', dataPlantio: edicao ? plantio.dataPlantio ?? '' : hojeIso(), dataColheitaPrevista: edicao ? plantio.dataColheitaPrevista ?? '' : '',
  })
  const [erros, setErros] = useState<Record<string, string>>({})
  const definir = (campo: keyof typeof campos) => (e: { target: { value: string } }) => setCampos(c => ({ ...c, [campo]: e.target.value }))
  const safraSugerida = campos.dataPlantio ? safraDaData(campos.dataPlantio) : ''
  const culturaBloqueada = edicao && plantio.status !== 'PLANEJADO'

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const e: Record<string, string> = {}
    if (!campos.talhaoId) e.talhaoId = 'Escolha o talhão.'
    if (!campos.culturaId) e.culturaId = 'Escolha a cultura.'
    if (!campos.dataPlantio) e.dataPlantio = 'Informe a data do plantio.'
    if (campos.safra.trim() && !safraValida(campos.safra)) e.safra = 'Use o formato AAAA/AAAA com anos consecutivos, por exemplo 2026/2027.'
    if (campos.dataColheitaPrevista && campos.dataPlantio && campos.dataColheitaPrevista < campos.dataPlantio) e.dataColheitaPrevista = 'A colheita não pode ser anterior ao plantio.'
    setErros(e)
    if (Object.keys(e).length > 0) return
    try {
      await salvar.mutateAsync({
        fazendaId, talhaoId: Number(campos.talhaoId), id: edicao ? plantio.id : undefined,
        corpo: { culturaId: Number(campos.culturaId), tipoPlantio: campos.tipoPlantio.trim() || undefined, safra: campos.safra.trim() || undefined, dataPlantio: campos.dataPlantio, dataColheitaPrevista: campos.dataColheitaPrevista || undefined },
      })
      aoFechar()
    } catch (erro) {
      if (erro instanceof ApiError && Object.keys(erro.detalhes).length > 0) setErros(erro.detalhes)
    }
  }
  const erroGeral = salvar.error instanceof ApiError && Object.keys(salvar.error.detalhes).length > 0 ? null : salvar.error
  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao id="talhaoId" rotulo="Talhão" value={campos.talhaoId} onChange={definir('talhaoId')} opcoes={talhoes} placeholder="Selecione o talhão" erro={erros.talhaoId} disabled={edicao} />
        <Selecao id="culturaId" rotulo="Cultura" value={campos.culturaId} onChange={definir('culturaId')} opcoes={culturas} placeholder="Selecione a cultura" erro={erros.culturaId} disabled={culturaBloqueada} ajuda="Catálogo mantido pelo administrador." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada id="dataPlantio" rotulo="Data do plantio" type="date" value={campos.dataPlantio} onChange={definir('dataPlantio')} erro={erros.dataPlantio} required />
        <Entrada id="dataColheitaPrevista" rotulo="Colheita prevista (opcional)" type="date" value={campos.dataColheitaPrevista} onChange={definir('dataColheitaPrevista')} erro={erros.dataColheitaPrevista} ajuda="Se vazia, é calculada pelo ciclo da cultura." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada id="safra" rotulo="Safra (opcional)" value={campos.safra} onChange={definir('safra')} erro={erros.safra} placeholder={safraSugerida || 'AAAA/AAAA'} ajuda={safraSugerida ? `Se vazia, usa ${safraSugerida} (o ano-safra começa em julho).` : undefined} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tipoPlantio" className="text-sm font-medium">Tipo de plantio</label>
          <input id="tipoPlantio" list="tipos-de-plantio" value={campos.tipoPlantio} onChange={definir('tipoPlantio')} maxLength={100} className="h-11 w-full rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10" />
          <datalist id="tipos-de-plantio">{tiposDePlantio.map(t => <option key={t} value={t} />)}</datalist>
        </div>
      </div>
      <AvisoDeErro erro={erroGeral} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={aoFechar} className="h-10 rounded-lg px-4">Cancelar</Button>
        <Button type="submit" disabled={salvar.isPending} className="h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">{salvar.isPending ? 'Salvando...' : edicao ? 'Salvar alterações' : 'Criar plantio'}</Button>
      </div>
    </form>
  )
}

function FormularioColheita({ fazendaId, plantio, correcao, aoFechar }: { fazendaId: number; plantio: PlantioResponse; correcao: boolean; aoFechar: () => void }) {
  const alterar = useAlterarStatusPlantio()
  const corrigir = useCorrigirColheita()
  const [data, setData] = useState(plantio.dataColheitaReal ?? hojeIso())
  const [quantidade, setQuantidade] = useState(plantio.quantidadeColhidaKg != null ? String(plantio.quantidadeColhidaKg).replace('.', ',') : '')
  const [erros, setErros] = useState<Record<string, string>>({})
  const mutacao = correcao ? corrigir : alterar

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const e: Record<string, string> = {}
    const kg = lerNumero(quantidade)
    if (!data) e.dataColheitaReal = 'Informe a data da colheita.'
    else if (plantio.dataPlantio && data < plantio.dataPlantio) e.dataColheitaReal = 'A colheita não pode ser anterior ao plantio.'
    else if (data > hojeIso()) e.dataColheitaReal = 'A data da colheita não pode estar no futuro.'
    if (quantidade.trim() && (kg === undefined || kg <= 0)) e.quantidadeColhidaKg = 'Informe uma quantidade maior que zero.'
    setErros(e)
    if (Object.keys(e).length > 0) return
    const base = { fazendaId, talhaoId: plantio.talhaoId!, id: plantio.id!, dataColheitaReal: data, quantidadeColhidaKg: kg }
    try {
      if (correcao) await corrigir.mutateAsync(base)
      else await alterar.mutateAsync({ ...base, status: 'COLHIDO' })
      aoFechar()
    } catch (erro) {
      if (erro instanceof ApiError && Object.keys(erro.detalhes).length > 0) setErros(erro.detalhes)
    }
  }
  const erroGeral = mutacao.error instanceof ApiError && Object.keys(mutacao.error.detalhes).length > 0 ? null : mutacao.error
  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Entrada id="dataColheitaReal" rotulo="Data da colheita" type="date" value={data} onChange={e => setData(e.target.value)} erro={erros.dataColheitaReal} max={hojeIso()} required />
      <Entrada id="quantidadeColhidaKg" rotulo="Quantidade colhida (kg)" inputMode="decimal" value={quantidade} onChange={e => setQuantidade(e.target.value)} erro={erros.quantidadeColhidaKg} placeholder="54000" ajuda="Opcional. Com a quantidade, o sistema calcula a produtividade em kg/ha." />
      <AvisoDeErro erro={erroGeral} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={aoFechar} className="h-10 rounded-lg px-4">Cancelar</Button>
        <Button type="submit" disabled={mutacao.isPending} className="h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">{mutacao.isPending ? 'Salvando...' : correcao ? 'Salvar correção' : 'Registrar colheita'}</Button>
      </div>
    </form>
  )
}
