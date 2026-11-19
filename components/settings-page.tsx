'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Lock, ShieldAlert, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard-shell'
import { Dialog } from '@/components/ui/dialog'
import { Entrada, estiloEntrada } from '@/components/ui/campos'
import { AvisoDeErro, Carregando } from '@/components/ui/estados'
import { ApiError } from '@/lib/api/erro'
import { useAlterarSenha, useAtualizarPerfil, useDesativarConta } from '@/lib/dados/usuario'
import { sair, useSessao, type Usuario } from '@/lib/auth/sessao'

export function SettingsPage() {
  const { data: usuario } = useSessao()
  return (
    <DashboardShell title="Configurações" subtitle="Gerencie as informações do seu perfil.">
      {!usuario ? <Carregando /> : (
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Perfil usuario={usuario} />
          <Senha usuarioId={usuario.id} />
          <ContaDesativavel usuario={usuario} />
        </div>
      )}
    </DashboardShell>
  )
}

const cartao = 'rounded-xl border border-[#dde5df] bg-white p-6 shadow-sm'

function Perfil({ usuario }: { usuario: Usuario }) {
  const atualizar = useAtualizarPerfil()
  const [nome, setNome] = useState(usuario.nome ?? '')
  const [email, setEmail] = useState(usuario.email ?? '')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvo, setSalvo] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setSalvo(false)
    const e: Record<string, string> = {}
    if (!nome.trim()) e.nome = 'Informe seu nome.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Informe um e-mail válido.'
    setErros(e)
    if (Object.keys(e).length > 0) return
    try {
      await atualizar.mutateAsync({ ...usuario, nome: nome.trim(), email: email.trim() })
      setSalvo(true)
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 409) setErros({ email: 'Já existe uma conta com este e-mail.' })
      else if (erro instanceof ApiError && Object.keys(erro.detalhes).length > 0) setErros(erro.detalhes)
    }
  }
  const erroGeral = atualizar.error instanceof ApiError && (atualizar.error.status === 409 || Object.keys(atualizar.error.detalhes).length > 0) ? null : atualizar.error
  return (
    <form autoComplete="off" onSubmit={enviar} noValidate className={cartao}>
      <div className="flex items-center gap-3"><div className="rounded-lg bg-[#dff5e9] p-2 text-[#0b5d3b]"><User className="size-5" /></div><div><h2 className="font-semibold">Perfil</h2><p className="text-sm text-[#66736b]">Informações da sua conta</p></div></div>
      <div className="mt-6 flex items-center gap-4"><div aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-[#dff5e9] text-xl font-semibold text-[#0b5d3b]">{(usuario.nome ?? '?').charAt(0).toUpperCase()}</div><div><p className="font-medium">{usuario.nome}</p><p className="text-xs text-[#66736b]">{usuario.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Agricultor'}</p></div></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Entrada id="nome" rotulo="Nome completo" value={nome} onChange={e => { setNome(e.target.value); setSalvo(false) }} erro={erros.nome} maxLength={150} required />
        <Entrada id="email" rotulo="E-mail" type="email" value={email} onChange={e => { setEmail(e.target.value); setSalvo(false) }} erro={erros.email} maxLength={150} required />
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="perfil" className="flex items-center gap-1.5 text-sm font-medium">Perfil de acesso <Lock aria-hidden="true" className="size-3 text-[#66736b]" /></label>
          <input id="perfil" value={usuario.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Agricultor'} readOnly disabled aria-describedby="perfil-ajuda" className={estiloEntrada} />
          <p id="perfil-ajuda" className="text-xs text-[#66736b]">O perfil só pode ser alterado por um administrador.</p>
        </div>
      </div>
      <div className="mt-4"><AvisoDeErro erro={erroGeral} /></div>
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#dde5df] pt-5">
        {salvo && <p role="status" className="rounded-lg bg-[#dff5e9] px-3 py-2 text-sm text-[#0b5d3b]">Alterações salvas.</p>}
        <Button type="submit" disabled={atualizar.isPending} className="h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">{atualizar.isPending ? 'Salvando...' : 'Salvar alterações'}</Button>
      </div>
    </form>
  )
}

function Senha({ usuarioId }: { usuarioId?: number }) {
  const alterar = useAlterarSenha(usuarioId)
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvo, setSalvo] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setSalvo(false)
    const e: Record<string, string> = {}
    if (!atual) e.senhaAtual = 'Informe a senha atual.'
    if (nova.length < 8 || nova.length > 72) e.novaSenha = 'A nova senha deve ter de 8 a 72 caracteres.'
    if (confirmacao !== nova) e.confirmacao = 'As senhas não coincidem.'
    setErros(e)
    if (Object.keys(e).length > 0) return
    try {
      await alterar.mutateAsync({ senhaAtual: atual, novaSenha: nova })
      setAtual(''); setNova(''); setConfirmacao(''); setSalvo(true)
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 400 && Object.keys(erro.detalhes).length === 0) setErros({ senhaAtual: erro.message })
      else if (erro instanceof ApiError && Object.keys(erro.detalhes).length > 0) setErros(erro.detalhes)
    }
  }
  const erroGeral = alterar.error instanceof ApiError && alterar.error.status === 400 ? null : alterar.error
  return (
    <form autoComplete="off" onSubmit={enviar} noValidate className={cartao}>
      <div className="flex items-center gap-3"><div className="rounded-lg bg-[#dff5e9] p-2 text-[#0b5d3b]"><Lock className="size-5" /></div><div><h2 className="font-semibold">Senha</h2><p className="text-sm text-[#66736b]">Altere a senha de acesso</p></div></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Entrada id="senhaAtual" rotulo="Senha atual" type="password" autoComplete="current-password" value={atual} onChange={e => setAtual(e.target.value)} erro={erros.senhaAtual} />
        <Entrada id="novaSenha" rotulo="Nova senha" type="password" autoComplete="new-password" value={nova} onChange={e => setNova(e.target.value)} erro={erros.novaSenha} ajuda="De 8 a 72 caracteres." />
        <Entrada id="confirmacao" rotulo="Confirmar nova senha" type="password" autoComplete="new-password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} erro={erros.confirmacao} />
      </div>
      <div className="mt-4"><AvisoDeErro erro={erroGeral} /></div>
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#dde5df] pt-5">
        {salvo && <p role="status" className="rounded-lg bg-[#dff5e9] px-3 py-2 text-sm text-[#0b5d3b]">Senha alterada.</p>}
        <Button type="submit" disabled={alterar.isPending} className="h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">{alterar.isPending ? 'Salvando...' : 'Alterar senha'}</Button>
      </div>
    </form>
  )
}

function ContaDesativavel({ usuario }: { usuario: Usuario }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const desativar = useDesativarConta()
  const [aberto, setAberto] = useState(false)
  const administrador = usuario.perfil === 'ADMINISTRADOR'

  async function confirmar() {
    try {
      await desativar.mutateAsync()
      await sair()
      queryClient.clear()
      router.replace('/login')
    } catch {
      /* a mensagem aparece no diálogo */
    }
  }
  return (
    <section className={`${cartao} border-red-200`}>
      <div className="flex items-center gap-3"><div className="rounded-lg bg-red-50 p-2 text-red-700"><ShieldAlert className="size-5" /></div><div><h2 className="font-semibold">Desativar conta</h2><p className="text-sm text-[#66736b]">Você deixa de poder entrar; os dados são mantidos e um administrador pode reativar a conta.</p></div></div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-xs text-[#66736b]">{administrador ? 'Administradores não podem desativar a própria conta.' : 'A sessão é encerrada na hora.'}</p>
        <Button type="button" variant="outline" disabled={administrador} onClick={() => { desativar.reset(); setAberto(true) }} className="h-10 rounded-lg border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50">Desativar minha conta</Button>
      </div>
      <Dialog aberto={aberto} aoFechar={() => setAberto(false)} titulo="Desativar a conta?" descricao={usuario.email}>
        <div className="flex flex-col gap-4">
          <p className="text-sm">Você será desconectado e não conseguirá entrar até que um administrador reative a conta.</p>
          <AvisoDeErro erro={desativar.error} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAberto(false)} className="h-10 rounded-lg px-4">Voltar</Button>
            <Button type="button" onClick={confirmar} disabled={desativar.isPending} className="h-10 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">{desativar.isPending ? 'Desativando...' : 'Desativar'}</Button>
          </div>
        </div>
      </Dialog>
    </section>
  )
}
