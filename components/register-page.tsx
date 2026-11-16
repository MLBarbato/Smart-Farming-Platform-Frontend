'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Eye, EyeOff, Leaf, LockKeyhole, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const confirmation = String(form.get('confirmation') ?? '')
    const terms = form.get('terms') === 'on'
    const nextErrors: Record<string, string> = {}

    if (!name) nextErrors.name = 'Digite seu nome completo.'
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Digite um e-mail válido.'
    if (password.length < 8) nextErrors.password = 'A senha deve ter no mínimo 8 caracteres.'
    if (confirmation !== password) nextErrors.confirmation = 'As senhas não coincidem.'
    if (!terms) nextErrors.terms = 'Aceite os termos para continuar.'

    setErrors(nextErrors)
    setSubmitted(false)
    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)
    window.setTimeout(() => {
      setIsLoading(false)
      setSubmitted(true)
    }, 900)
  }

  return (
    <main className="min-h-screen bg-[#f8faf8] text-[#17201b] lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden text-white lg:flex lg:flex-col">
        <img src="/images/aerial-farm.png" alt="Vista aérea de uma lavoura moderna com linhas de cultivo" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[#06452c]/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06452c]/80 via-[#0b5d3b]/55 to-[#032d1e]/90" />
        <div aria-hidden="true" className="absolute inset-0 opacity-50 [background-image:linear-gradient(90deg,transparent_49%,rgba(223,245,233,0.18)_50%,transparent_51%),linear-gradient(0deg,transparent_49%,rgba(223,245,233,0.18)_50%,transparent_51%)] [background-size:72px_72px]" />
        <div className="relative z-10 flex items-center gap-3 px-10 py-9 xl:px-16"><span className="flex size-10 items-center justify-center rounded-lg bg-[#dff5e9] text-[#0b5d3b]"><Leaf aria-hidden="true" className="size-5 fill-current" /></span><span className="text-lg font-semibold tracking-tight">Smart Farming</span></div>
        <div className="relative z-10 my-auto max-w-2xl px-10 py-16 xl:px-16"><p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200"><span className="size-1.5 rounded-full bg-emerald-300" /> Agricultura orientada por dados</p><h1 className="max-w-xl text-4xl font-semibold leading-[1.06] tracking-[-0.035em] xl:text-[3.35rem]">Dados precisos para decisões que fazem sua lavoura crescer.</h1><p className="mt-6 max-w-lg text-[1.05rem] leading-7 text-emerald-50/90">Monitore cada área da sua operação, antecipe necessidades e transforme dados em produtividade — tudo em um só lugar.</p></div>
        <div className="relative z-10 flex items-center px-10 pb-8 text-xs text-emerald-50/80 xl:px-16"><span>© 2024 Smart Farming Platform. Todos os direitos reservados.</span></div>
      </section>

      <section className="flex min-h-screen flex-col bg-[#f8faf8] px-6 py-8 sm:px-10 lg:justify-center lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center lg:flex-none">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><span className="flex size-10 items-center justify-center rounded-lg bg-[#0b5d3b] text-white"><Leaf aria-hidden="true" className="size-5 fill-current" /></span><span className="text-lg font-semibold text-[#0b5d3b]">Smart Farming</span></div>
          <div className="mb-9"><p className="mb-3 text-sm font-semibold text-[#0b5d3b]">Comece agora</p><h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#17201b]">Crie sua conta</h2><p className="mt-2 text-sm leading-6 text-[#66736b]">Comece a gerenciar sua propriedade rural de forma inteligente.</p></div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field label="Nome completo" htmlFor="name" error={errors.name}><User aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input id="name" name="name" autoComplete="name" placeholder="Digite seu nome completo" aria-invalid={Boolean(errors.name)} className={inputClass(Boolean(errors.name))} /></Field>
            <Field label="E-mail" htmlFor="email" error={errors.email}><Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input id="email" name="email" type="email" autoComplete="email" placeholder="seu@email.com" aria-invalid={Boolean(errors.email)} className={inputClass(Boolean(errors.email))} /></Field>
            <Field label="Senha" htmlFor="password" error={errors.password}><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Crie uma senha" aria-invalid={Boolean(errors.password)} className={inputClass(Boolean(errors.password), true)} /><PasswordToggle visible={showPassword} onClick={() => setShowPassword((visible) => !visible)} /></Field>
            <Field label="Confirmar senha" htmlFor="confirmation" error={errors.confirmation}><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#66736b]" /><input id="confirmation" name="confirmation" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" placeholder="Digite novamente sua senha" aria-invalid={Boolean(errors.confirmation)} className={inputClass(Boolean(errors.confirmation), true)} /><PasswordToggle visible={showConfirmation} onClick={() => setShowConfirmation((visible) => !visible)} /></Field>
            <div className="flex flex-col gap-1"><label className="flex cursor-pointer items-start gap-2.5 text-sm leading-5 text-[#66736b]"><input type="checkbox" name="terms" className="mt-0.5 size-4 shrink-0 rounded border-[#dde5df] accent-[#0b5d3b]" /> <span>Li e concordo com os <a href="#termos" className="font-medium text-[#0b5d3b] underline-offset-4 hover:underline">Termos de Uso</a> e a <a href="#privacidade" className="font-medium text-[#0b5d3b] underline-offset-4 hover:underline">Política de Privacidade</a>.</span></label>{errors.terms && <p role="alert" className="text-xs text-red-700">{errors.terms}</p>}</div>
            {submitted && <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">Cadastro enviado com sucesso.</p>}
            <Button type="submit" disabled={isLoading} className="mt-1 h-12 w-full gap-2 rounded-lg bg-[#0b5d3b] text-sm font-semibold text-white shadow-sm hover:bg-[#06452c]">{isLoading ? <><span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Criando conta...</> : <>Criar minha conta <ArrowRight data-icon="inline-end" /></>}</Button>
          </form>
          <p className="mt-7 text-center text-sm text-[#66736b]">Já possui uma conta? <Link href="/login" className="font-semibold text-[#0b5d3b] underline-offset-4 hover:underline">Entrar</Link></p>
        </div>
        <p className="mx-auto mt-8 w-full max-w-md text-center text-xs text-[#66736b] lg:mt-10">© 2024 Smart Farming Platform. Todos os direitos reservados.</p>
      </section>
    </main>
  )
}

function inputClass(invalid: boolean, withToggle = false) {
  return `h-12 w-full rounded-lg border bg-white pl-10 ${withToggle ? 'pr-12' : 'pr-4'} text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10 ${invalid ? 'border-red-500 ring-4 ring-red-500/10' : 'border-[#dde5df]'}`
}

function PasswordToggle({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return <button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={onClick} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#66736b] hover:bg-[#dff5e9] hover:text-[#0b5d3b]">{visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}</button>
}

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><label htmlFor={htmlFor} className="text-sm font-medium text-[#17201b]">{label}</label><div className="relative">{children}</div>{error && <p role="alert" className="text-xs text-red-700">{error}</p>}</div>
}
