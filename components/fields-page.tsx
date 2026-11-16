'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, Droplets, Leaf, Map as MapIcon, Pencil, Plus, Sprout, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard-shell'
import { Dialog } from '@/components/ui/dialog'
import { Entrada, estiloSelecaoFiltro } from '@/components/ui/campos'
import { AvisoDeErro, Carregando, ErroBloco, Vazio } from '@/components/ui/estados'
import { EditorPoligono, MapaFazenda } from '@/components/mapa'
import { ApiError } from '@/lib/api/erro'
import { corDaCriticidade, rotuloDaSituacao } from '@/lib/criticidade'
import { useFazendas } from '@/lib/dados/fazendas'
import { useExcluirTalhao, useMapa, useSalvarTalhao } from '@/lib/dados/talhoes'
import type { TalhaoMapa } from '@/lib/dados/tipos'
import { formatarNumero, lerNumero } from '@/lib/formatacao'
import { areaHectares, ehPoligono, MAX_POSICOES, type Poligono } from '@/lib/geo'

const umidade = (t: TalhaoMapa) => t.leiturasAtuais?.find(l => l.variavel === 'UMIDADE_SOLO')

export function FieldsPage() {
  const fazendas = useFazendas()
  const [fazendaId, setFazendaId] = useState<number | undefined>()
  const [escolhido, setEscolhido] = useState<{ fazendaId?: number; talhaoId: number } | null>(null)
  const [editando, setEditando] = useState<TalhaoMapa | 'novo' | null>(null)
  const [excluindo, setExcluindo] = useState<TalhaoMapa | null>(null)

  // Seleciona a primeira fazenda assim que a lista chega (e se a escolhida deixar de existir).
  const idEfetivo = fazendas.data?.some(f => f.id === fazendaId) ? fazendaId : fazendas.data?.[0]?.id
  // A seleção vale só para a fazenda em que foi feita.
  const selecionado = escolhido && escolhido.fazendaId === idEfetivo ? escolhido.talhaoId : null
  const setSelecionado = (talhaoId: number | null) => setEscolhido(talhaoId === null ? null : { fazendaId: idEfetivo, talhaoId })

  const mapa = useMapa(idEfetivo)
  const excluir = useExcluirTalhao(idEfetivo ?? 0)
  const talhoes = useMemo(() => mapa.data?.talhoes ?? [], [mapa.data])
  const fazenda = fazendas.data?.find(f => f.id === idEfetivo)
  const ponto: [number, number] | null = fazenda?.latitude != null && fazenda?.longitude != null ? [fazenda.latitude, fazenda.longitude] : null

  const noMapa = talhoes.map(t => ({
    id: t.id as number,
    identificacao: t.identificacao ?? '',
    geometria: ehPoligono(t.geometria) ? t.geometria : null,
    cor: corDaCriticidade(t.alertas?.maiorCriticidade),
    linhas: [
      `${formatarNumero(t.areaHectares)} ha`,
      t.plantioAtual ? `Cultura: ${t.plantioAtual.culturaNome}` : 'Sem plantio em cultivo',
      umidade(t) ? `Umidade do solo: ${formatarNumero(umidade(t)?.valor, 1)}${umidade(t)?.unidade ?? ''}` : 'Sem leitura de umidade',
      `${t.alertas?.abertos ?? 0} alerta(s) aberto(s)`,
    ],
  }))

  const areaCultivada = talhoes.filter(t => t.plantioAtual).reduce((s, t) => s + (t.areaHectares ?? 0), 0)
  const umidades = talhoes.map(umidade).filter(Boolean).map(l => l!.valor ?? 0)
  const mediaUmidade = umidades.length ? umidades.reduce((a, b) => a + b, 0) / umidades.length : null
  const emAtencao = talhoes.filter(t => (t.alertas?.abertos ?? 0) > 0).length

  async function confirmarExclusao() {
    if (excluindo?.id === undefined) return
    try {
      await excluir.mutateAsync(excluindo.id)
      setExcluindo(null)
    } catch {
      /* a mensagem aparece no diálogo */
    }
  }

  return (
    <DashboardShell
      title="Talhões"
      subtitle="Áreas de cultivo de cada fazenda, no mapa."
      actions={idEfetivo !== undefined && <Button onClick={() => setEditando('novo')} className="h-10 gap-2 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]"><Plus className="size-4" />Novo talhão</Button>}
    >
      {fazendas.isPending ? <Carregando texto="Carregando fazendas..." /> : fazendas.isError ? <ErroBloco erro={fazendas.error} aoTentarDeNovo={() => fazendas.refetch()} /> : fazendas.data.length === 0 ? (
        <Vazio titulo="Cadastre uma fazenda primeiro" texto="Os talhões pertencem a uma fazenda. Vá em Fazendas e crie a sua propriedade." />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label htmlFor="fazenda" className="text-sm font-medium">Fazenda</label>
            <select id="fazenda" value={idEfetivo} onChange={e => setFazendaId(Number(e.target.value))} className={estiloSelecaoFiltro}>
              {fazendas.data.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {([
              ['Talhões', String(talhoes.length), 'Áreas cadastradas', MapIcon],
              ['Área em cultivo', `${formatarNumero(areaCultivada)} ha`, 'Talhões com plantio em cultivo', Leaf],
              ['Umidade média', mediaUmidade === null ? '—' : `${formatarNumero(mediaUmidade, 1)}%`, 'Solo, últimas leituras', Droplets],
              ['Com alertas', String(emAtencao), 'Talhões com alerta aberto', AlertTriangle],
            ] as const).map(([titulo, valor, descricao, Icone]) => (
              <div key={titulo} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{titulo}</span><Icone className="size-5 text-[#0b5d3b]" /></div>
                <p className="mt-3 text-3xl font-semibold">{valor}</p><p className="mt-1 text-xs text-[#66736b]">{descricao}</p>
              </div>
            ))}
          </div>

          {mapa.isPending ? <Carregando texto="Carregando talhões..." /> : mapa.isError ? <ErroBloco erro={mapa.error} aoTentarDeNovo={() => mapa.refetch()} /> : (
            <>
              <section className="mt-8 rounded-xl border border-[#dde5df] bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-semibold">Mapa da fazenda</h2>
                  <ul className="flex flex-wrap items-center gap-4 text-xs text-[#66736b]" aria-label="Legenda">
                    {([[null, 'Sem alertas'], ['BAIXA', 'Alerta baixo'], ['MEDIA', 'Alerta médio'], ['ALTA', 'Alerta alto']] as const).map(([c, rotulo]) => (
                      <li key={rotulo} className="flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded-sm" style={{ background: corDaCriticidade(c) }} />{rotulo}</li>
                    ))}
                  </ul>
                </div>
                {noMapa.some(t => t.geometria) || ponto ? (
                  <MapaFazenda ponto={ponto} talhoes={noMapa} selecionadoId={selecionado} aoSelecionar={setSelecionado} className="h-[28rem] w-full" />
                ) : (
                  <p className="rounded-lg border border-dashed border-[#dde5df] p-8 text-center text-sm text-[#66736b]">Esta fazenda ainda não tem localização nem talhões desenhados. Informe as coordenadas da fazenda (em Fazendas) e desenhe os talhões.</p>
                )}
                <p className="mt-2 text-xs text-[#66736b]">Passe o mouse sobre um talhão para ver os detalhes; clique para destacá-lo na lista.</p>
              </section>

              <section className="mt-8 rounded-xl border border-[#dde5df] bg-white shadow-sm">
                <div className="p-6 pb-0"><h2 className="font-semibold">Lista de talhões</h2><p className="text-sm text-[#66736b]">{talhoes.length} talhão(ões) em {fazenda?.nome}</p></div>
                {talhoes.length === 0 ? <div className="p-6"><Vazio titulo="Nenhum talhão cadastrado" texto="Crie o primeiro talhão e desenhe o contorno no mapa." acao={<Button onClick={() => setEditando('novo')} className="mt-2 h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">Novo talhão</Button>} /></div> : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[56rem] text-left text-sm">
                      <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#66736b]"><tr><th className="px-6 py-3 font-medium">Talhão</th><th className="px-4 py-3 font-medium">Cultura</th><th className="px-4 py-3 font-medium">Área</th><th className="px-4 py-3 font-medium">Umidade do solo</th><th className="px-4 py-3 font-medium">Sensores</th><th className="px-4 py-3 font-medium">Situação</th><th className="px-6 py-3 text-right font-medium">Ações</th></tr></thead>
                      <tbody className="divide-y divide-[#dde5df]">
                        {talhoes.map(t => {
                          const u = umidade(t)
                          const cor = corDaCriticidade(t.alertas?.maiorCriticidade)
                          return (
                            <tr key={t.id} aria-selected={selecionado === t.id} className={selecionado === t.id ? 'bg-[#f1f8f4]' : undefined}>
                              <td className="px-6 py-4"><button onClick={() => setSelecionado(t.id ?? null)} className="text-left font-medium hover:underline">{t.identificacao}</button>{!ehPoligono(t.geometria) && <p className="text-xs text-[#66736b]">Sem contorno desenhado</p>}</td>
                              <td className="px-4 py-4">{t.plantioAtual ? <span className="flex items-center gap-1.5"><Sprout className="size-4 text-[#0b5d3b]" />{t.plantioAtual.culturaNome}</span> : <span className="text-[#66736b]">—</span>}</td>
                              <td className="whitespace-nowrap px-4 py-4">{formatarNumero(t.areaHectares)} ha</td>
                              <td className="whitespace-nowrap px-4 py-4">{u ? `${formatarNumero(u.valor, 1)}${u.unidade}` : <span className="text-[#66736b]">Sem leitura</span>}</td>
                              <td className="px-4 py-4">{t.sensores?.ativos ?? 0}/{t.sensores?.total ?? 0}</td>
                              <td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: `${cor}1f`, color: cor }}><span aria-hidden="true" className="size-2 rounded-full" style={{ background: cor }} />{rotuloDaSituacao(t.alertas?.maiorCriticidade)}{(t.alertas?.abertos ?? 0) > 0 ? ` · ${t.alertas?.abertos}` : ''}</span></td>
                              <td className="whitespace-nowrap px-6 py-4 text-right">
                                <button onClick={() => setEditando(t)} aria-label={`Editar ${t.identificacao}`} className="rounded-lg p-2 text-[#66736b] hover:bg-[#f8faf8]"><Pencil className="size-4" /></button>
                                <button onClick={() => { excluir.reset(); setExcluindo(t) }} aria-label={`Excluir ${t.identificacao}`} className="rounded-lg p-2 text-[#66736b] hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></button>
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

          {idEfetivo !== undefined && (
            <Dialog aberto={editando !== null} aoFechar={() => setEditando(null)} titulo={editando === 'novo' ? 'Novo talhão' : 'Editar talhão'} descricao={fazenda?.nome} largura="max-w-3xl">
              {editando !== null && <FormularioTalhao key={editando === 'novo' ? 'novo' : editando.id} fazendaId={idEfetivo} talhao={editando} outros={talhoes} ponto={ponto} aoFechar={() => setEditando(null)} />}
            </Dialog>
          )}

          <Dialog aberto={!!excluindo} aoFechar={() => setExcluindo(null)} titulo="Excluir talhão" descricao={excluindo?.identificacao}>
            <div className="flex flex-col gap-4">
              <p className="text-sm">Esta ação não pode ser desfeita. Talhões com plantios, dispositivos, alertas ou recomendações vinculados não podem ser excluídos.</p>
              <AvisoDeErro erro={excluir.error} />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setExcluindo(null)} className="h-10 rounded-lg px-4">Cancelar</Button>
                <Button type="button" onClick={confirmarExclusao} disabled={excluir.isPending} className="h-10 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">{excluir.isPending ? 'Excluindo...' : 'Excluir'}</Button>
              </div>
            </div>
          </Dialog>
        </>
      )}
    </DashboardShell>
  )
}

function FormularioTalhao({ fazendaId, talhao, outros, ponto, aoFechar }: { fazendaId: number; talhao: TalhaoMapa | 'novo'; outros: TalhaoMapa[]; ponto: [number, number] | null; aoFechar: () => void }) {
  const salvar = useSalvarTalhao(fazendaId)
  const edicao = talhao !== 'novo'
  const inicial = edicao && ehPoligono(talhao.geometria) ? talhao.geometria : null
  const [identificacao, setIdentificacao] = useState(edicao ? talhao.identificacao ?? '' : '')
  const [area, setArea] = useState(edicao && talhao.areaHectares != null ? String(talhao.areaHectares).replace('.', ',') : '')
  const [areaAutomatica, setAreaAutomatica] = useState(!edicao)
  const [geometria, setGeometria] = useState<Poligono | null>(inicial)
  const [erros, setErros] = useState<Record<string, string>>({})

  const contexto = outros.filter(o => o.id !== (edicao ? talhao.id : -1)).flatMap(o => (ehPoligono(o.geometria) ? [o.geometria] : []))
  const areaDoDesenho = geometria ? areaHectares(geometria) : null

  function aoDesenhar(p: Poligono | null) {
    setGeometria(p)
    if (p && areaAutomatica) setArea(String(Math.round(areaHectares(p) * 100) / 100).replace('.', ','))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const e: Record<string, string> = {}
    const valorArea = lerNumero(area)
    if (!identificacao.trim()) e.identificacao = 'Informe a identificação do talhão.'
    if (valorArea === undefined || valorArea <= 0) e.areaHectares = 'Informe uma área maior que zero.'
    if (geometria && geometria.coordinates[0].length > MAX_POSICOES) e.geometria = `O contorno pode ter no máximo ${MAX_POSICOES} pontos.`
    setErros(e)
    if (Object.keys(e).length > 0) return
    try {
      await salvar.mutateAsync({
        id: edicao ? talhao.id : undefined,
        corpo: { identificacao: identificacao.trim(), areaHectares: valorArea!, ...(geometria ? { geometria: geometria as never } : {}) },
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
        <Entrada id="identificacao" rotulo="Identificação" value={identificacao} onChange={e => setIdentificacao(e.target.value)} erro={erros.identificacao} placeholder="Ex.: Talhão 01" maxLength={100} required />
        <Entrada id="areaHectares" rotulo="Área (ha)" inputMode="decimal" value={area} onChange={e => { setArea(e.target.value); setAreaAutomatica(false) }} erro={erros.areaHectares} placeholder="48,75" required
          ajuda={areaDoDesenho !== null ? `Área do contorno desenhado: ${formatarNumero(areaDoDesenho)} ha` : 'Desenhe o contorno para calcular a área automaticamente.'} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Contorno no mapa (opcional)</legend>
        <p className="text-xs text-[#66736b]">Use as ferramentas do mapa para desenhar um polígono ou retângulo; a ferramenta de edição ajusta os vértices e a lixeira apaga o contorno. Um novo desenho substitui o anterior.</p>
        <EditorPoligono inicial={inicial} contexto={contexto} ponto={ponto} aoMudar={aoDesenhar} />
        {erros.geometria && <p role="alert" className="text-xs text-red-700">{erros.geometria}</p>}
        {geometria && !areaAutomatica && areaDoDesenho !== null && <button type="button" onClick={() => { setArea(String(Math.round(areaDoDesenho * 100) / 100).replace('.', ',')); setAreaAutomatica(true) }} className="self-start text-xs font-medium text-[#0b5d3b] hover:underline">Usar a área do desenho</button>}
      </fieldset>
      <AvisoDeErro erro={erroGeral} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={aoFechar} className="h-10 rounded-lg px-4">Cancelar</Button>
        <Button type="submit" disabled={salvar.isPending} className="h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">{salvar.isPending ? 'Salvando...' : edicao ? 'Salvar alterações' : 'Criar talhão'}</Button>
      </div>
    </form>
  )
}
