'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useSessao } from '@/lib/auth/sessao'

/** Só mostra o painel com uma sessão válida; senão volta ao login (e retorna à página depois de entrar). */
export function SessionGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const sessao = useSessao()

  const semSessao = sessao.isError && [401, 403].includes(sessao.error.status)
  useEffect(() => {
    if (semSessao) router.replace(`/login?proximo=${encodeURIComponent(pathname)}`)
  }, [semSessao, pathname, router])

  if (sessao.isError && !semSessao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8faf8] p-6 text-[#17201b]">
        <div role="alert" className="max-w-md rounded-xl border border-[#dde5df] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Não foi possível carregar sua sessão</h1>
          <p className="mt-2 text-sm text-[#66736b]">{sessao.error.message}</p>
          <button onClick={() => sessao.refetch()} className="mt-4 h-10 rounded-lg bg-[#0b5d3b] px-4 text-sm font-semibold text-white hover:bg-[#06452c]">Tentar novamente</button>
        </div>
      </main>
    )
  }
  if (!sessao.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8faf8]" aria-busy="true">
        <span role="status" className="flex items-center gap-3 text-sm text-[#66736b]">
          <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-[#0b5d3b] border-t-transparent" />
          Carregando...
        </span>
      </main>
    )
  }
  return <>{children}</>
}
