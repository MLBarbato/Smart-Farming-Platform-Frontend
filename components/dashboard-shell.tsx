'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, Bell, CloudSun, Droplets, Gauge, Home, Leaf, Map, Menu, Settings, Sprout, Thermometer, X } from 'lucide-react'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Fazendas', href: '/dashboard/fazendas', icon: Leaf },
  { label: 'Talhões', href: '/dashboard/talhoes', icon: Map },
  { label: 'Plantios', href: '/dashboard/plantios', icon: Sprout },
  { label: 'Sensores', href: '/dashboard/sensores', icon: Gauge },
  { label: 'Monitoramento', href: '/dashboard/monitoramento', icon: Thermometer },
  { label: 'Clima', href: '/dashboard/clima', icon: CloudSun },
  { label: 'Irrigação', href: '/dashboard/irrigacao', icon: Droplets },
  { label: 'Alertas', href: '/dashboard/alertas', icon: AlertTriangle },
  { label: 'Relatórios', href: '/dashboard/relatorios', icon: Gauge },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]

export function DashboardShell({ title, subtitle, actions, children }: { title: string; subtitle: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  return (
    <main suppressHydrationWarning className="min-h-screen bg-[#f8faf8] text-[#17201b]">
      <button aria-label="Abrir menu" className="fixed left-4 top-4 z-30 rounded-lg bg-[#0b5d3b] p-2 text-white lg:hidden" onClick={() => setOpen(true)}><Menu /></button>
      {open && <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-[#06452c] p-5 pb-28 text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-white/15 p-2"><Leaf /></div><div><p className="font-bold">Smart Farming</p><p className="text-xs text-white/60">Plataforma agrícola</p></div></div><button className="lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)}><X /></button></div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? 'page' : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${pathname === href ? 'bg-white text-[#0b5d3b]' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}><Icon className="size-4" />{label}</Link>
          ))}
        </nav>
        <div className="absolute inset-x-5 bottom-5 border-t border-white/15 pt-4"><p className="font-medium">Matheus</p><p className="text-xs text-white/60">Administrador</p><Link href="/login" className="mt-3 inline-block text-sm text-white/70 hover:text-white">Sair</Link></div>
      </aside>
      <section className="lg:pl-64">
        <header className="flex items-center justify-between gap-4 border-b border-[#dde5df] bg-white px-6 py-5 lg:px-10">
          <div className="pl-12 lg:pl-0"><h1 className="text-2xl font-semibold">{title}</h1><p className="text-sm text-[#66736b]">{subtitle}</p></div>
          <div className="flex items-center gap-4">{actions}<button aria-label="Notificações" className="relative rounded-lg p-2 hover:bg-[#dff5e9]"><Bell className="size-5" /><span className="absolute right-1 top-1 size-2 rounded-full bg-[#dc2626]" /></button><div className="flex size-9 items-center justify-center rounded-full bg-[#dff5e9] font-semibold text-[#0b5d3b]">M</div></div>
        </header>
        <div className="p-6 lg:p-10">{children}</div>
      </section>
    </main>
  )
}
