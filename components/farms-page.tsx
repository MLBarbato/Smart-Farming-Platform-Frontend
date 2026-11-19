'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, Gauge, Home, Leaf, MapPin, Pencil, Plus, Search, Sprout, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard-shell'
import { Dialog } from '@/components/ui/dialog'
import { Entrada } from '@/components/ui/campos'
import { AvisoDeErro, Carregando, ErroBloco, Vazio } from '@/components/ui/estados'
import { MapaFazenda, SeletorPonto } from '@/components/mapa'
import { ApiError } from '@/lib/api/erro'
import { corDaCriticidade } from '@/lib/criticidade'
import { useExcluirFazenda, useFazendas, useResumoGeral, useSalvarFazenda } from '@/lib/dados/fazendas'
import { useMapa } from '@/lib/dados/talhoes'
import type { FazendaResponse, ResumoGeralResponse } from '@/lib/dados/tipos'
import { formatarCoordenada, formatarNumero, lerNumero } from '@/lib/formatacao'
import { ehPoligono } from '@/lib/geo'

type Status = 'Ativa' | 'Atenção' | 'Inativa'
type Cartao = ResumoGeralResponse['fazendas'] extends (infer C)[] | undefined ? C : never
type Linha = { cartao: Cartao; fazenda?: FazendaResponse; status: Status }

const statusStyle: Record<Status, string> = {
  Ativa: 'bg-[#dff5e9] text-[#0b5d3b]',
  Atenção: 'bg-[#fff7ed] text-[#b45309]',
  Inativa: 'bg-[#f1f3f2] text-[#66736b]',
}

function statusDaFazenda(cartao: Cartao, fazenda?: FazendaResponse): Status {
  if (fazenda && fazenda.ativa === false) return 'Inativa'
  return (cartao.alertas?.abertos ?? 0) > 0 ? 'Atenção' : 'Ativa'
}

export function FarmsPage() {
  const resumo = useResumoGeral()
  const fazendas = useFazendas()
  const excluir = useExcluirFazenda()
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<'Todas' | Status>('Todas')
  const [editando, setEditando] = useState<FazendaResponse | 'nova' | null>(null)
  const [visualizando, setVisualizando] = useState<Linha | null>(null)
  const [excluindo, setExcluindo] = useState<Linha | null>(null)

  const linhas = useMemo<Linha[]>(() => {
    const porId = new Map((fazendas.data ?? []).map(f => [f.id, f]))
    return (resumo.data?.fazendas ?? []).map(cartao => {
      const fazenda = porId.get(cartao.id)
      return { cartao, fazenda, status: statusDaFazenda(cartao, fazenda) }
    })
  }, [resumo.data, fazendas.data])

  const filtradas = linhas.filter(l =>
    (status === 'Todas' || l.status === status) &&
    `${l.cartao.nome} ${l.cartao.cidade ?? ''} ${l.cartao.estado ?? ''}`.toLowerCase().includes(busca.toLowerCase()),
  )
  const totais = resumo.data?.totais

  async function confirmarExclusao() {
    if (!excluindo?.cartao.id) return
    try {
      await excluir.mutateAsync(excluindo.cartao.id)
      setExcluindo(null)
    } catch {
      /* a mensagem do erro aparece no diálogo */
    }
  }

  return (
    <DashboardShell
      title="Fazendas"
      subtitle="Gerencie suas propriedades rurais."
      actions={<Button onClick={() => setEditando('nova')} className="h-10 gap-2 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]"><Plus className="size-4" />Nova fazenda</Button>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([
          ['Fazendas', String(totais?.fazendas ?? '—'), 'Propriedades cadastradas', Home],
          ['Área total', totais ? `${formatarNumero(totais.areaTotalHectares)} ha` : '—', 'Hectares sob gestão', Leaf],
          ['Talhões', String(totais?.talhoes ?? '—'), 'Áreas cadastradas', Sprout],
          ['Sensores ativos', totais ? `${totais.sensoresAtivos}/${totais.sensores}` : '—', 'Dispositivos em operação', Gauge],
        ] as const).map(([titulo, valor, descricao, Icone]) => (
          <div key={titulo} className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-sm text-[#66736b]">{titulo}</span><Icone className="size-5 text-[#0b5d3b]" /></div>
            <p className="mt-3 text-3xl font-semibold">{valor}</p><p className="mt-1 text-xs text-[#66736b]">{descricao}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold">Suas propriedades</h2><p className="text-sm text-[#66736b]">{filtradas.length} de {linhas.length} fazendas</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" />
              <input autoComplete="off" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar fazenda" placeholder="Buscar por nome ou cidade" className="h-10 w-full rounded-lg border border-[#dde5df] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#0b5d3b]" />
            </div>
            <select value={status} onChange={e => setStatus(e.target.value as 'Todas' | Status)} aria-label="Filtrar por status" className="h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]">
              <option value="Todas">Todos os status</option><option>Ativa</option><option>Atenção</option><option>Inativa</option>
            </select>
          </div>
        </div>

        {resumo.isPending || fazendas.isPending ? <Carregando texto="Carregando fazendas..." /> : resumo.isError || fazendas.isError ? (
          <ErroBloco erro={resumo.error ?? fazendas.error} aoTentarDeNovo={() => { void resumo.refetch(); void fazendas.refetch() }} />
        ) : linhas.length === 0 ? (
          <Vazio titulo="Nenhuma fazenda cadastrada" texto="Cadastre sua primeira propriedade para começar a acompanhar talhões, sensores e alertas." acao={<Button onClick={() => setEditando('nova')} className="mt-2 h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">Nova fazenda</Button>} />
        ) : filtradas.length === 0 ? (
          <Vazio titulo="Nenhuma fazenda encontrada" texto="Ajuste a busca ou o filtro de status." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtradas.map(l => {
              const { cartao: c } = l
              const online = Math.max((c.sensoresAtivos ?? 0) - (c.sensoresSemLeituraRecente ?? 0), 0)
              return (
                <article key={c.id} className="flex flex-col rounded-xl border border-[#dde5df] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="truncate font-semibold">{c.nome}</h3><p className="mt-1 flex items-center gap-1 text-xs text-[#66736b]"><MapPin className="size-3.5 shrink-0" />{[c.cidade, c.estado].filter(Boolean).join(' / ') || 'Localização não informada'}</p></div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${statusStyle[l.status]}`}>{l.status}</span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3 border-y border-[#dde5df] py-4 text-center">
                    <div><p className="text-xl font-semibold">{formatarNumero(c.areaTotal)}</p><p className="text-xs text-[#66736b]">hectares</p></div>
                    <div><p className="text-xl font-semibold">{c.talhoes}</p><p className="text-xs text-[#66736b]">talhões</p></div>
                    <div><p className="flex items-center justify-center gap-1 text-xl font-semibold">{(c.alertas?.abertos ?? 0) > 0 && <AlertTriangle aria-hidden="true" className="size-4" style={{ color: corDaCriticidade(c.alertas?.maiorCriticidade) }} />}{c.alertas?.abertos ?? 0}</p><p className="text-xs text-[#66736b]">alertas</p></div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-[#66736b]"><span>Sensores com leitura recente</span><span className="font-medium text-[#17201b]">{online}/{c.sensores}</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#d1d5db]" role="progressbar" aria-valuenow={online} aria-valuemin={0} aria-valuemax={c.sensores || 1} aria-label="Sensores com leitura recente"><div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${c.sensores ? (online / c.sensores) * 100 : 0}%` }} /></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(c.culturasEmCultivo ?? []).length === 0 ? <span className="text-xs text-[#66736b]">Sem plantio em cultivo</span> : c.culturasEmCultivo?.map(cultura => <span key={cultura} className="rounded-full bg-[#f8faf8] px-2.5 py-1 text-xs text-[#66736b] ring-1 ring-[#dde5df]">{cultura}</span>)}
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#dde5df] pt-4">
                    <button onClick={() => setVisualizando(l)} className="flex items-center gap-1.5 text-sm font-medium text-[#0b5d3b] hover:underline"><MapPin className="size-4" />Ver no mapa</button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => l.fazenda && setEditando(l.fazenda)} disabled={!l.fazenda} aria-label={`Editar ${c.nome}`} className="rounded-lg p-2 text-[#66736b] hover:bg-[#f8faf8] disabled:opacity-40"><Pencil className="size-4" /></button>
                      <button onClick={() => { excluir.reset(); setExcluindo(l) }} aria-label={`Excluir ${c.nome}`} className="rounded-lg p-2 text-[#66736b] hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <FormularioFazenda fazenda={editando} aoFechar={() => setEditando(null)} />
      <VisaoDaFazenda linha={visualizando} aoFechar={() => setVisualizando(null)} />

      <Dialog aberto={!!excluindo} aoFechar={() => setExcluindo(null)} titulo="Excluir fazenda" descricao={excluindo?.cartao.nome}>
        <div className="flex flex-col gap-4">
          <p className="text-sm">Esta ação não pode ser desfeita. A previsão do tempo e a estação virtual da fazenda também serão removidas. Fazendas com talhões não podem ser excluídas: exclua os talhões antes.</p>
          <AvisoDeErro erro={excluir.error} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setExcluindo(null)} className="h-10 rounded-lg px-4">Cancelar</Button>
            <Button type="button" onClick={confirmarExclusao} disabled={excluir.isPending} className="h-10 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">{excluir.isPending ? 'Excluindo...' : 'Excluir'}</Button>
          </div>
        </div>
      </Dialog>
    </DashboardShell>
  )
}

function VisaoDaFazenda({ linha, aoFechar }: { linha: Linha | null; aoFechar: () => void }) {
  const id = linha?.cartao.id
  const mapa = useMapa(linha ? id : undefined)
  const f = linha?.fazenda
  const ponto: [number, number] | null = f?.latitude != null && f?.longitude != null ? [f.latitude, f.longitude] : null
  const talhoes = (mapa.data?.talhoes ?? []).map(t => ({
    id: t.id as number,
    identificacao: t.identificacao ?? '',
    geometria: ehPoligono(t.geometria) ? t.geometria : null,
    cor: corDaCriticidade(t.alertas?.maiorCriticidade),
    linhas: [`${formatarNumero(t.areaHectares)} ha`, t.plantioAtual ? `${t.plantioAtual.culturaNome} (${t.plantioAtual.status})` : 'Sem plantio em cultivo'],
  }))
  return (
    <Dialog aberto={!!linha} aoFechar={aoFechar} titulo={linha?.cartao.nome ?? ''} descricao="Localização e talhões" largura="max-w-3xl">
      {linha && (
        <div className="flex flex-col gap-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-[#66736b]">Localização</dt><dd>{f?.localizacao || '—'}</dd></div>
            <div><dt className="text-xs text-[#66736b]">Cidade / UF</dt><dd>{[f?.cidade, f?.estado].filter(Boolean).join(' / ') || '—'}</dd></div>
            <div><dt className="text-xs text-[#66736b]">Coordenadas (latitude, longitude)</dt><dd>{ponto ? `${formatarCoordenada(f?.latitude)}; ${formatarCoordenada(f?.longitude)}` : 'Não informadas'}</dd></div>
            <div><dt className="text-xs text-[#66736b]">Área total</dt><dd>{formatarNumero(f?.areaTotal)} ha</dd></div>
          </dl>
          {ponto || talhoes.some(t => t.geometria) ? <MapaFazenda ponto={ponto} talhoes={talhoes} className="h-96 w-full" /> : (
            <p className="rounded-lg border border-dashed border-[#dde5df] p-6 text-center text-sm text-[#66736b]">Informe a latitude e a longitude da fazenda (e desenhe os talhões) para vê-la no mapa.</p>
          )}
        </div>
      )}
    </Dialog>
  )
}

type Campos = { nome: string; localizacao: string; areaTotal: string; cidade: string; estado: string; latitude: string; longitude: string }
const vazio: Campos = { nome: '', localizacao: '', areaTotal: '', cidade: '', estado: '', latitude: '', longitude: '' }

function FormularioFazenda({ fazenda, aoFechar }: { fazenda: FazendaResponse | 'nova' | null; aoFechar: () => void }) {
  return (
    <Dialog aberto={fazenda !== null} aoFechar={aoFechar} titulo={fazenda === 'nova' ? 'Nova fazenda' : 'Editar fazenda'} descricao="A latitude e a longitude habilitam o mapa, a previsão do tempo e a estação virtual." largura="max-w-2xl">
      {fazenda !== null && <CorpoFormulario key={fazenda === 'nova' ? 'nova' : fazenda.id} fazenda={fazenda} aoFechar={aoFechar} />}
    </Dialog>
  )
}

function CorpoFormulario({ fazenda, aoFechar }: { fazenda: FazendaResponse | 'nova'; aoFechar: () => void }) {
  const salvar = useSalvarFazenda()
  const edicao = fazenda !== 'nova'
  const [campos, setCampos] = useState<Campos>(() => edicao ? {
    nome: fazenda.nome ?? '', localizacao: fazenda.localizacao ?? '', areaTotal: fazenda.areaTotal != null ? String(fazenda.areaTotal).replace('.', ',') : '',
    cidade: fazenda.cidade ?? '', estado: fazenda.estado ?? '', latitude: fazenda.latitude != null ? String(fazenda.latitude) : '', longitude: fazenda.longitude != null ? String(fazenda.longitude) : '',
  } : vazio)
  const [erros, setErros] = useState<Record<string, string>>({})

  const lat = lerNumero(campos.latitude)
  const lon = lerNumero(campos.longitude)
  const ponto: [number, number] | null = lat !== undefined && lon !== undefined ? [lat, lon] : null
  const definir = (campo: keyof Campos) => (e: { target: { value: string } }) => setCampos(c => ({ ...c, [campo]: e.target.value }))

  function validar(): Record<string, string> {
    const e: Record<string, string> = {}
    const area = lerNumero(campos.areaTotal)
    if (!campos.nome.trim()) e.nome = 'Informe o nome da fazenda.'
    if (area === undefined || area <= 0) e.areaTotal = 'Informe uma área maior que zero.'
    if (campos.estado && !/^[A-Za-z]{2}$/.test(campos.estado)) e.estado = 'Use a sigla da UF, com 2 letras.'
    if ((campos.latitude.trim() === '') !== (campos.longitude.trim() === '')) e.longitude = 'Informe latitude e longitude juntas.'
    else if (campos.latitude.trim() !== '') {
      if (lat === undefined || lat < -90 || lat > 90) e.latitude = 'Latitude entre -90 e 90.'
      if (lon === undefined || lon < -180 || lon > 180) e.longitude = 'Longitude entre -180 e 180.'
    }
    return e
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validar()
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) return
    try {
      await salvar.mutateAsync({
        id: edicao ? fazenda.id : undefined,
        corpo: {
          nome: campos.nome.trim(), localizacao: campos.localizacao.trim() || undefined, areaTotal: lerNumero(campos.areaTotal)!,
          cidade: campos.cidade.trim() || undefined, estado: campos.estado.trim().toUpperCase() || undefined,
          latitude: lat, longitude: lon,
        },
      })
      aoFechar()
    } catch (erro) {
      if (erro instanceof ApiError && Object.keys(erro.detalhes).length > 0) setErros(erro.detalhes)
    }
  }

  const erroGeral = salvar.error instanceof ApiError && Object.keys(salvar.error.detalhes).length > 0 ? null : salvar.error
  return (
    <form autoComplete="off" onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Entrada id="nome" rotulo="Nome da fazenda" value={campos.nome} onChange={definir('nome')} erro={erros.nome} placeholder="Ex.: Fazenda Santa Maria" maxLength={150} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada id="areaTotal" rotulo="Área total (ha)" inputMode="decimal" value={campos.areaTotal} onChange={definir('areaTotal')} erro={erros.areaTotal} placeholder="1240" required />
        <Entrada id="localizacao" rotulo="Localização (opcional)" value={campos.localizacao} onChange={definir('localizacao')} erro={erros.localizacao} placeholder="Zona rural de Rio Verde" maxLength={255} />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <Entrada id="cidade" rotulo="Cidade" value={campos.cidade} onChange={definir('cidade')} erro={erros.cidade} placeholder="Rio Verde" maxLength={100} />
        <Entrada id="estado" rotulo="UF" value={campos.estado} onChange={e => setCampos(c => ({ ...c, estado: e.target.value.toUpperCase() }))} erro={erros.estado} placeholder="GO" maxLength={2} />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Localização no mapa</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Entrada id="latitude" rotulo="Latitude" inputMode="decimal" value={campos.latitude} onChange={definir('latitude')} erro={erros.latitude} placeholder="-17.7923" />
          <Entrada id="longitude" rotulo="Longitude" inputMode="decimal" value={campos.longitude} onChange={definir('longitude')} erro={erros.longitude} placeholder="-50.9192" />
        </div>
        <p className="text-xs text-[#66736b]">Clique no mapa para marcar a sede da fazenda, ou digite as coordenadas.</p>
        <SeletorPonto valor={ponto} aoEscolher={(la, lo) => setCampos(c => ({ ...c, latitude: String(la), longitude: String(lo) }))} />
        {ponto && <button type="button" onClick={() => setCampos(c => ({ ...c, latitude: '', longitude: '' }))} className="self-start text-xs font-medium text-[#0b5d3b] hover:underline">Limpar localização</button>}
      </fieldset>
      <AvisoDeErro erro={erroGeral} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={aoFechar} className="h-10 rounded-lg px-4">Cancelar</Button>
        <Button type="submit" disabled={salvar.isPending} className="h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">{salvar.isPending ? 'Salvando...' : edicao ? 'Salvar alterações' : 'Criar fazenda'}</Button>
      </div>
    </form>
  )
}
