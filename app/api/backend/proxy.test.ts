import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/renovacao', () => ({ renovarSessao: vi.fn() }))

import { renovarSessao } from '@/lib/auth/renovacao'
import { DELETE, GET, POST } from './[...path]/route'

const renovar = vi.mocked(renovarSessao)
const fetchMock = vi.fn()

const requisicao = (caminho: string, init: { method?: string; cookie?: string; corpo?: string } = {}) =>
  new NextRequest(`http://localhost:3000/api/backend/${caminho}`, {
    method: init.method ?? 'GET',
    headers: { ...(init.cookie ? { cookie: init.cookie } : {}), ...(init.corpo ? { 'content-type': 'application/json' } : {}) },
    body: init.corpo,
  })
const contexto = (caminho: string) => ({ params: Promise.resolve({ path: caminho.split('/') }) })
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } })

beforeEach(() => {
  renovar.mockReset()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('proxy do backend', () => {
  it('anexa o access token do cookie e repassa status, corpo e consulta', async () => {
    fetchMock.mockResolvedValue(json({ totais: { fazendas: 2 } }))
    const caminho = 'api/v1/resumo'
    const r = await GET(requisicao(`${caminho}?x=1`, { cookie: 'sf_at=ACESSO; sf_rt=R' }), contexto(caminho))

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ totais: { fazendas: 2 } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('http://localhost:8080/api/v1/resumo?x=1')
    expect(init.headers.Authorization).toBe('Bearer ACESSO')
    expect(r.headers.get('cache-control')).toBe('no-store')
  })

  it('repassa o corpo e o tipo das requisições com dados', async () => {
    fetchMock.mockResolvedValue(json({ id: 1 }, 201))
    const caminho = 'api/v1/culturas'
    const r = await POST(requisicao(caminho, { method: 'POST', cookie: 'sf_at=A; sf_rt=R', corpo: '{"nome":"Soja"}' }), contexto(caminho))

    expect(r.status).toBe(201)
    const init = fetchMock.mock.calls[0][1]
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(new TextDecoder().decode(init.body)).toBe('{"nome":"Soja"}')
  })

  it('204 sai sem corpo', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const caminho = 'api/v1/fazendas/1'
    const r = await DELETE(requisicao(caminho, { method: 'DELETE', cookie: 'sf_at=A; sf_rt=R' }), contexto(caminho))
    expect(r.status).toBe(204)
    expect(await r.text()).toBe('')
  })

  it('com o access token vencido, renova, repete a chamada e grava os cookies novos', async () => {
    renovar.mockResolvedValue({ accessToken: 'A2', refreshToken: 'R2' })
    fetchMock.mockResolvedValueOnce(json({ erro: 1 }, 401)).mockResolvedValueOnce(json({ ok: true }))
    const caminho = 'api/v1/alertas'
    const r = await GET(requisicao(caminho, { cookie: 'sf_at=VELHO; sf_rt=R' }), contexto(caminho))

    expect(r.status).toBe(200)
    expect(fetchMock.mock.calls.map(c => c[1].headers.Authorization)).toEqual(['Bearer VELHO', 'Bearer A2'])
    expect(r.cookies.get('sf_at')?.value).toBe('A2')
    expect(r.cookies.get('sf_rt')?.value).toBe('R2')
    expect(r.headers.get('set-cookie')).toMatch(/HttpOnly/i)
  })

  it('sessão encerrada: 401 com codigo SESSAO_EXPIRADA e cookies apagados', async () => {
    renovar.mockResolvedValue(null)
    fetchMock.mockResolvedValue(json({}, 401))
    const caminho = 'api/v1/alertas'
    const r = await GET(requisicao(caminho, { cookie: 'sf_at=A; sf_rt=R' }), contexto(caminho))

    expect(r.status).toBe(401)
    expect((await r.json()).codigo).toBe('SESSAO_EXPIRADA')
    expect(r.cookies.get('sf_at')?.value).toBe('')
    expect(r.cookies.get('sf_rt')?.value).toBe('')
  })

  it.each([
    ['api/v1/auth/login'],
    ['api/v1/auth/refresh'],
    ['api/v1/auth/logout'],
    ['actuator/health'],
    ['v3/api-docs'],
    ['api/v1/../auth/login'],
    ['api/v2/fazendas'],
  ])('não encaminha %s', async caminho => {
    const r = await POST(requisicao(caminho, { method: 'POST', cookie: 'sf_rt=R' }), contexto(caminho))
    expect(r.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('o cadastro público passa sem sessão', async () => {
    fetchMock.mockResolvedValue(json({ id: 3 }, 201))
    const caminho = 'api/v1/auth/registro'
    const r = await POST(requisicao(caminho, { method: 'POST', corpo: '{"nome":"A"}' }), contexto(caminho))
    expect(r.status).toBe(201)
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })
})
