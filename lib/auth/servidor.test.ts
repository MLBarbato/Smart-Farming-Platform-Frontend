import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./renovacao', () => ({ renovarSessao: vi.fn() }))

import { renovarSessao } from './renovacao'
import { executarComSessao, ipDoCliente } from './servidor'

const renovar = vi.mocked(renovarSessao)
const requisicao = (cookies: string, headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3000/x', { headers: { cookie: cookies, ...headers } })
const resposta = (status: number) => new Response(null, { status })

beforeEach(() => renovar.mockReset())

describe('executarComSessao', () => {
  it('usa o access token do cookie e não renova', async () => {
    const chamar = vi.fn(async () => resposta(200))
    const r = await executarComSessao(requisicao('sf_at=A; sf_rt=R'), chamar)
    expect(chamar).toHaveBeenCalledWith('A')
    expect(renovar).not.toHaveBeenCalled()
    expect(r).toMatchObject({ expirada: false, novosTokens: null })
  })

  it('sem access token (cookie vencido), renova antes de chamar', async () => {
    renovar.mockResolvedValue({ accessToken: 'A2', refreshToken: 'R2' })
    const chamar = vi.fn(async () => resposta(200))
    const r = await executarComSessao(requisicao('sf_rt=R'), chamar)
    expect(renovar).toHaveBeenCalledWith('R')
    expect(chamar).toHaveBeenCalledTimes(1)
    expect(chamar).toHaveBeenCalledWith('A2')
    expect(r).toMatchObject({ expirada: false, novosTokens: { accessToken: 'A2', refreshToken: 'R2' } })
  })

  it('401 do backend: renova uma vez e repete a chamada com o token novo', async () => {
    renovar.mockResolvedValue({ accessToken: 'A2', refreshToken: 'R2' })
    const chamar = vi.fn(async (token?: string) => resposta(token === 'A2' ? 200 : 401))
    const r = await executarComSessao(requisicao('sf_at=A; sf_rt=R'), chamar)
    expect(chamar.mock.calls.map(c => c[0])).toEqual(['A', 'A2'])
    expect(r).toMatchObject({ expirada: false, novosTokens: { refreshToken: 'R2' } })
  })

  it('não renova de novo se o token acabou de ser renovado e ainda dá 401', async () => {
    renovar.mockResolvedValue({ accessToken: 'A2', refreshToken: 'R2' })
    const chamar = vi.fn(async () => resposta(401))
    const r = await executarComSessao(requisicao('sf_rt=R'), chamar)
    expect(renovar).toHaveBeenCalledTimes(1)
    expect(r).toMatchObject({ expirada: false })
    if (!r.expirada) expect(r.resposta.status).toBe(401)
  })

  it('renovação recusada encerra a sessão', async () => {
    renovar.mockResolvedValue(null)
    const chamar = vi.fn(async () => resposta(401))
    expect(await executarComSessao(requisicao('sf_at=A; sf_rt=R'), chamar)).toEqual({ expirada: true })
    expect(await executarComSessao(requisicao('sf_rt=R'), vi.fn())).toEqual({ expirada: true })
  })

  it('sem nenhum cookie, só repassa (o backend decide; rotas públicas funcionam)', async () => {
    const chamar = vi.fn(async () => resposta(401))
    const r = await executarComSessao(requisicao(''), chamar)
    expect(chamar).toHaveBeenCalledWith(undefined)
    expect(renovar).not.toHaveBeenCalled()
    expect(r).toMatchObject({ expirada: false })
  })
})

describe('ipDoCliente', () => {
  it('usa o primeiro IP de X-Forwarded-For', () => {
    expect(ipDoCliente(requisicao('', { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }))).toBe('203.0.113.9')
    expect(ipDoCliente(requisicao(''))).toBeUndefined()
  })
})
