'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, dados } from '@/lib/api/client'
import { CHAVE_SESSAO, type Usuario } from '@/lib/auth/sessao'

export function useAtualizarPerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (usuario: Usuario & { nome: string; email: string }) =>
      dados(api.PUT('/api/v1/usuarios/{id}', {
        params: { path: { id: usuario.id! } },
        body: { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil! },
      })),
    onSuccess: atualizado => queryClient.setQueryData(CHAVE_SESSAO, atualizado),
  })
}

export function useAlterarSenha(usuarioId: number | undefined) {
  return useMutation({
    mutationFn: (corpo: { senhaAtual: string; novaSenha: string }) =>
      dados(api.PATCH('/api/v1/usuarios/{id}/senha', { params: { path: { id: usuarioId! } }, body: corpo })),
  })
}

export function useDesativarConta() {
  return useMutation({
    mutationFn: () => dados(api.PATCH('/api/v1/usuarios/me/desativar')),
  })
}
