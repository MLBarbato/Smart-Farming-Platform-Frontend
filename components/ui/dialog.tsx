'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Janela modal sobre o elemento nativo <dialog>: foco preso, Esc para fechar e leitor de tela correto sem
 * código extra. Clicar fora (no fundo) também fecha.
 */
export function Dialog({
  aberto,
  aoFechar,
  titulo,
  descricao,
  largura = 'max-w-lg',
  children,
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao?: string
  largura?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialogo-titulo"
      onClose={aoFechar}
      onClick={e => e.target === ref.current && aoFechar()}
      className={`m-auto max-h-[92vh] w-[calc(100%-2rem)] ${largura} overflow-y-auto rounded-xl border border-[#dde5df] bg-white p-0 text-[#17201b] shadow-xl backdrop:bg-black/30`}
    >
      {aberto && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="dialogo-titulo" className="text-lg font-semibold">{titulo}</h2>
              {descricao && <p className="text-sm text-[#66736b]">{descricao}</p>}
            </div>
            <button type="button" aria-label="Fechar" onClick={aoFechar} className="rounded-lg p-1.5 text-[#66736b] hover:bg-[#f8faf8]">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
