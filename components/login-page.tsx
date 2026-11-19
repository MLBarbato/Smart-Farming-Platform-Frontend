'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { mensagemDeLogin } from '@/lib/api/erro'
import { CHAVE_SESSAO, entrar } from '@/lib/auth/sessao'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const queryClient = useQueryClient()

  /** Só aceita destinos internos (começam com uma única barra), para não virar redirecionamento aberto. */
  function destinoSeguro(): string {
    const proximo = new URLSearchParams(window.location.search).get('proximo')
    return proximo && proximo.startsWith('/') && !proximo.startsWith('//') ? proximo : '/dashboard'
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    setIsLoading(true)
    try {
      const usuario = await entrar(String(form.get('email') ?? '').trim(), String(form.get('password') ?? ''))
      queryClient.setQueryData(CHAVE_SESSAO, usuario)
      router.replace(destinoSeguro())
    } catch (erro) {
      setError(mensagemDeLogin(erro))
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8faf8] text-[#17201b] lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden text-white lg:flex lg:flex-col">
        <img src="/images/aerial-farm.png" alt="Vista aérea de uma lavoura moderna com linhas de cultivo" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[#06452c]/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06452c]/80 via-[#0b5d3b]/55 to-[#032d1e]/90" />
        <div aria-hidden="true" className="absolute inset-0 opacity-50 [background-image:linear-gradient(90deg,transparent_49%,rgba(223,245,233,0.18)_50%,transparent_51%),linear-gradient(0deg,transparent_49%,rgba(223,245,233,0.18)_50%,transparent_51%)] [background-size:72px_72px]" />
        <div aria-hidden="true" className="absolute left-[28%] top-[29%] size-2 rounded-full bg-emerald-300 shadow-[0_0_0_7px_rgba(167,243,208,0.14),0_0_22px_6px_rgba(167,243,208,0.7)]" />
        <div aria-hidden="true" className="absolute right-[24%] top-[43%] size-2 rounded-full bg-emerald-300 shadow-[0_0_0_7px_rgba(167,243,208,0.14),0_0_22px_6px_rgba(167,243,208,0.7)]" />
        <div aria-hidden="true" className="absolute bottom-[30%] left-[45%] h-px w-32 rotate-[24deg] bg-emerald-200/50" />

        <div className="relative z-10 flex items-center gap-3 px-10 py-9 xl:px-16">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[#dff5e9] text-[#0b5d3b]"><Leaf aria-hidden="true" className="size-5 fill-current" /></span>
          <span className="text-lg font-semibold tracking-tight">Smart Farming</span>
        </div>

        <div className="relative z-10 my-auto max-w-2xl px-10 py-16 xl:px-16">
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200"><span className="size-1.5 rounded-full bg-emerald-300" /> Agricultura orientada por dados</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.06] tracking-[-0.035em] xl:text-[3.35rem]">Dados precisos para decisões que fazem sua lavoura crescer.</h1>
          <p className="mt-6 max-w-lg text-[1.05rem] leading-7 text-emerald-50/90">Monitore cada área da sua operação, antecipe necessidades e transforme dados em produtividade — tudo em um só lugar.</p>
        </div>

        <div className="relative z-10 flex items-center px-10 pb-8 text-xs text-emerald-50/80 xl:px-16"><span>© 2026 Smart Farming Platform.</span></div>
      </section>

      <section className="flex min-h-screen flex-col bg-[#f8faf8] px-6 py-8 sm:px-10 lg:justify-center lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center lg:flex-none">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><span className="flex size-10 items-center justify-center rounded-lg bg-[#0b5d3b] text-white"><Leaf aria-hidden="true" className="size-5 fill-current" /></span><span className="text-lg font-semibold text-[#0b5d3b]">Smart Farming</span></div>
          <div className="mb-9"><p className="mb-3 text-sm font-semibold text-[#0b5d3b]">Bem-vindo de volta</p><h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#17201b]">Acesse sua conta</h2><p className="mt-2 text-sm leading-6 text-[#66736b]">Entre para acompanhar sua operação agrícola.</p></div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <Field label="E-mail" htmlFor="email"><Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com" className="h-12 w-full rounded-lg border border-[#dde5df] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10" /></Field>
            <Field label="Senha" htmlFor="password"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="Digite sua senha" className="h-12 w-full rounded-lg border border-[#dde5df] bg-white pl-10 pr-12 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10" /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]">{showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}</button></Field>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={isLoading} className="h-12 w-full gap-2 rounded-lg bg-[#0b5d3b] text-sm font-semibold text-white shadow-sm hover:bg-[#06452c]">{isLoading ? <><span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Entrando...</> : <>Entrar na plataforma <ArrowRight data-icon="inline-end" /></>}</Button>
          </form>
          <p className="mt-7 text-center text-sm text-[#66736b]">Ainda não tem uma conta? <Link href="/cadastro" className="font-semibold text-[#0b5d3b] underline-offset-4 hover:underline">Cadastre-se</Link></p>
        </div>
        <p className="mx-auto mt-8 w-full max-w-md text-center text-xs text-[#66736b] lg:mt-12">© 2026 Smart Farming Platform.</p>
      </section>
    </main>
  )
}

function Field({ label, htmlFor, action, children }: { label: string; htmlFor: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><div className="flex items-center justify-between"><label htmlFor={htmlFor} className="text-sm font-medium text-[#17201b]">{label}</label>{action}</div><div className="relative">{children}</div></div>
}
