'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/api/erro'

/** Cache de dados da API. Erros de autenticação/permissão não são repetidos; os demais, uma vez. */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (tentativas, erro) =>
              !(erro instanceof ApiError && [400, 401, 403, 404, 409].includes(erro.status)) && tentativas < 1,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
