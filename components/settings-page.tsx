'use client'

import { FormEvent, useState } from 'react'
import { Lock, User } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'

const inputCls = 'h-11 w-full rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10'

export function SettingsPage() {
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(true)
    window.setTimeout(() => setSaved(false), 3000)
  }

  return (
    <DashboardShell title="Configurações" subtitle="Gerencie as informações do seu perfil.">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl rounded-xl border border-[#dde5df] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><div className="rounded-lg bg-[#dff5e9] p-2 text-[#0b5d3b]"><User className="size-5" /></div><div><h2 className="font-semibold">Perfil</h2><p className="text-sm text-[#66736b]">Informações da sua conta</p></div></div>
        <div className="mt-6 flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-full bg-[#dff5e9] text-xl font-semibold text-[#0b5d3b]">M</div><div><p className="font-medium">Matheus</p><p className="text-xs text-[#66736b]">Administrador</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2"><label htmlFor="name" className="text-sm font-medium">Nome completo</label><input id="name" defaultValue="Matheus" required className={inputCls} /></div>
          <div className="flex flex-col gap-2"><label htmlFor="email" className="text-sm font-medium">E-mail</label><input id="email" type="email" defaultValue="matheus@empresa.com" required className={inputCls} /></div>
          <div className="flex flex-col gap-2 sm:col-span-2"><label htmlFor="role" className="flex items-center gap-1.5 text-sm font-medium">Cargo <Lock aria-hidden="true" className="size-3 text-[#66736b]" /></label><input id="role" value="Administrador" readOnly disabled aria-describedby="role-help" className={`${inputCls} cursor-not-allowed bg-[#f1f3f2] text-[#66736b]`} /><p id="role-help" className="text-xs text-[#66736b]">O cargo é definido pela administração e não pode ser alterado.</p></div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#dde5df] pt-5">
          {saved && <p role="status" className="rounded-lg bg-[#dff5e9] px-3 py-2 text-sm text-[#0b5d3b]">Alterações salvas.</p>}
          <button type="submit" className="h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#06452c]">Salvar alterações</button>
        </div>
      </form>
    </DashboardShell>
  )
}
