import { NextResponse, type NextRequest } from 'next/server'
import { executarComSessao, sessaoExpirada, urlDoBackend } from '@/lib/auth/servidor'
import { gravarTokens } from '@/lib/auth/tokens'

/**
 * Proxy (BFF) para a API do backend: o navegador fala só com este servidor, que anexa o access token do cookie
 * httpOnly, renova a sessão quando preciso e repassa a resposta. Os caminhos são os do contrato OpenAPI
 * (por exemplo, /api/backend/api/v1/fazendas).
 */
export const dynamic = 'force-dynamic'

const PREFIXO_PERMITIDO = 'api/v1/'
/** Login, renovação e logout têm rotas próprias, para que os tokens nunca cheguem ao JavaScript do navegador. */
const BLOQUEADOS = /^api\/v1\/auth\/(login|refresh|logout)\/?$/
const CABECALHOS_DA_RESPOSTA = ['content-type', 'retry-after', 'content-disposition']

type Contexto = { params: Promise<{ path: string[] }> }

async function encaminhar(request: NextRequest, contexto: Contexto): Promise<NextResponse> {
  const { path } = await contexto.params
  const caminho = path.join('/')
  if (!caminho.startsWith(PREFIXO_PERMITIDO) || path.some(p => p === '..' || p === '.') || BLOQUEADOS.test(caminho)) {
    return NextResponse.json(
      { status: 404, erro: 'Not Found', mensagem: 'Rota não encontrada.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const url = new URL(urlDoBackend(caminho))
  url.search = request.nextUrl.search
  const temCorpo = !['GET', 'HEAD'].includes(request.method)
  const corpo = temCorpo ? await request.arrayBuffer() : undefined
  const tipo = request.headers.get('content-type')

  const resultado = await executarComSessao(request, token =>
    fetch(url, {
      method: request.method,
      headers: {
        Accept: request.headers.get('accept') ?? 'application/json',
        ...(tipo ? { 'Content-Type': tipo } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo && corpo.byteLength > 0 ? corpo : undefined,
      cache: 'no-store',
      redirect: 'manual',
    }),
  )
  if (resultado.expirada) return sessaoExpirada()

  const { resposta, novosTokens } = resultado
  const cabecalhos = new Headers({ 'Cache-Control': 'no-store' })
  for (const nome of CABECALHOS_DA_RESPOSTA) {
    const valor = resposta.headers.get(nome)
    if (valor) cabecalhos.set(nome, valor)
  }
  const saida = new NextResponse([204, 205, 304].includes(resposta.status) ? null : resposta.body, {
    status: resposta.status,
    headers: cabecalhos,
  })
  if (novosTokens) gravarTokens(saida, novosTokens)
  return saida
}

export const GET = encaminhar
export const POST = encaminhar
export const PUT = encaminhar
export const PATCH = encaminhar
export const DELETE = encaminhar
