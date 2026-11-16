import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export const estiloEntrada =
  'h-11 w-full rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none transition placeholder:text-[#66736b] focus:border-[#0b5d3b] focus:ring-4 focus:ring-[#0b5d3b]/10 disabled:bg-[#f8faf8] disabled:text-[#66736b]'

/** Rótulo, ajuda e mensagem de erro de um campo de formulário. */
export function Campo({
  rotulo,
  id,
  erro,
  ajuda,
  children,
}: {
  rotulo: string
  id: string
  erro?: string
  ajuda?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{rotulo}</label>
      {children}
      {ajuda && !erro && <p id={`${id}-ajuda`} className="text-xs text-[#66736b]">{ajuda}</p>}
      {erro && <p id={`${id}-erro`} role="alert" className="text-xs text-red-700">{erro}</p>}
    </div>
  )
}

export function Entrada({
  rotulo,
  id,
  erro,
  ajuda,
  ...props
}: { rotulo: string; id: string; erro?: string; ajuda?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Campo rotulo={rotulo} id={id} erro={erro} ajuda={ajuda}>
      <input id={id} name={id} aria-invalid={erro ? true : undefined} aria-describedby={erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined} {...props} className={estiloEntrada} />
    </Campo>
  )
}

export function Selecao({
  rotulo,
  id,
  erro,
  ajuda,
  opcoes,
  placeholder,
  ...props
}: {
  rotulo: string
  id: string
  erro?: string
  ajuda?: string
  opcoes: { valor: string; rotulo: string }[]
  placeholder?: string
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Campo rotulo={rotulo} id={id} erro={erro} ajuda={ajuda}>
      <select id={id} name={id} aria-invalid={erro ? true : undefined} {...props} className={estiloEntrada}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {opcoes.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
    </Campo>
  )
}

export const estiloSelecaoFiltro =
  'h-10 rounded-lg border border-[#dde5df] bg-white px-3 text-sm outline-none focus:border-[#0b5d3b]'
