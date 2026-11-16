import type { components } from './schema'

type ErroResponse = components['schemas']['ErroResponse']

/** Erro devolvido pela API (formato padrão do backend) ou gerado pela camada de acesso. */
export class ApiError extends Error {
  readonly status: number
  /** Código especial do backend: USUARIO_DESATIVADO, LOGIN_BLOQUEADO; ou SESSAO_EXPIRADA e REDE (gerados aqui). */
  readonly codigo?: string
  /** Erros de validação por campo (status 400). */
  readonly detalhes: Record<string, string>
  /** Segundos de espera informados em `Retry-After` (login bloqueado). */
  readonly retryAfterSegundos?: number

  constructor(init: {
    status: number
    mensagem: string
    codigo?: string
    detalhes?: Record<string, string>
    retryAfterSegundos?: number
  }) {
    super(init.mensagem)
    this.name = 'ApiError'
    this.status = init.status
    this.codigo = init.codigo
    this.detalhes = init.detalhes ?? {}
    this.retryAfterSegundos = init.retryAfterSegundos
  }
}

/** Converte o corpo e os cabeçalhos de uma resposta de erro em `ApiError`. */
export function erroDaResposta(status: number, corpo: unknown, retryAfter?: string | null): ApiError {
  const erro = (typeof corpo === 'object' && corpo !== null ? corpo : {}) as ErroResponse
  const segundos = retryAfter ? Number.parseInt(retryAfter, 10) : Number.NaN
  return new ApiError({
    status,
    mensagem: erro.mensagem || mensagemPadrao(status),
    codigo: erro.codigo,
    detalhes: erro.detalhes ?? {},
    retryAfterSegundos: Number.isFinite(segundos) ? segundos : undefined,
  })
}

export function erroDeRede(): ApiError {
  return new ApiError({
    status: 0,
    codigo: 'REDE',
    mensagem: 'Não foi possível falar com o servidor. Verifique a conexão e tente novamente.',
  })
}

function mensagemPadrao(status: number): string {
  if (status === 401) return 'Sessão expirada. Entre novamente.'
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 404) return 'Registro não encontrado.'
  if (status === 409) return 'A operação conflita com o estado atual dos dados.'
  if (status === 429) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  if (status === 503) return 'Serviço externo indisponível no momento. Tente novamente mais tarde.'
  if (status >= 500) return 'Erro interno do servidor. Tente novamente em instantes.'
  return 'Não foi possível concluir a operação.'
}

/** Formata um tempo de espera em segundos, por exemplo "14 minutos". */
export function formatarEspera(segundos: number): string {
  if (segundos < 90) return `${segundos} segundos`
  const minutos = Math.ceil(segundos / 60)
  return minutos === 1 ? '1 minuto' : `${minutos} minutos`
}

/** Mensagem pronta para exibir ao usuário em um formulário de login. */
export function mensagemDeLogin(erro: unknown): string {
  if (!(erro instanceof ApiError)) return 'Não foi possível entrar. Tente novamente.'
  if (erro.codigo === 'LOGIN_BLOQUEADO') {
    const espera = erro.retryAfterSegundos ? ` Tente novamente em ${formatarEspera(erro.retryAfterSegundos)}.` : ''
    return `Muitas tentativas de login.${espera}`
  }
  if (erro.codigo === 'USUARIO_DESATIVADO') return 'Esta conta está desativada. Procure um administrador.'
  if (erro.status === 401) return 'E-mail ou senha incorretos.'
  if (erro.status === 400) return 'Informe um e-mail e uma senha válidos.'
  return erro.message
}
