import { AlertTriangle, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { ApiError } from '@/lib/api/erro'

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <p role="status" className="flex items-center gap-3 py-10 text-sm text-[#66736b]">
      <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-[#0b5d3b] border-t-transparent" />
      {texto}
    </p>
  )
}

export function ErroBloco({ erro, aoTentarDeNovo }: { erro: unknown; aoTentarDeNovo?: () => void }) {
  const mensagem = erro instanceof ApiError || erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.'
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p>{mensagem}</p>
        {aoTentarDeNovo && <button onClick={aoTentarDeNovo} className="mt-2 font-semibold underline">Tentar novamente</button>}
      </div>
    </div>
  )
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#dde5df] bg-white px-6 py-12 text-center">
      <Inbox className="size-8 text-[#66736b]" aria-hidden="true" />
      <p className="font-medium">{titulo}</p>
      {texto && <p className="max-w-md text-sm text-[#66736b]">{texto}</p>}
      {acao}
    </div>
  )
}

/** Mensagem de erro de uma operação (por exemplo, um 409 ao excluir). */
export function AvisoDeErro({ erro }: { erro: unknown }) {
  if (!erro) return null
  const mensagem = erro instanceof Error ? erro.message : 'Não foi possível concluir a operação.'
  return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{mensagem}</p>
}
