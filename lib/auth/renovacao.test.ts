import { afterEach, describe, expect, it, vi } from 'vitest'
import { limparRenovacoes, renovarSessao } from './renovacao'

const tokens = { accessToken: 'novo-a', refreshToken: 'novo-r' }

afterEach(() => limparRenovacoes())

describe('renovarSessao', () => {
  it('requisições simultâneas com o mesmo refresh token compartilham uma única renovação', async () => {
    const renovador = vi.fn(async () => tokens)
    const resultados = await Promise.all([
      renovarSessao('antigo', renovador),
      renovarSessao('antigo', renovador),
      renovarSessao('antigo', renovador),
    ])
    expect(renovador).toHaveBeenCalledTimes(1)
    expect(resultados).toEqual([tokens, tokens, tokens])
  })

  it('uma requisição atrasada, que ainda leva o cookie antigo, reaproveita o resultado', async () => {
    const renovador = vi.fn(async () => tokens)
    await renovarSessao('antigo', renovador)
    expect(await renovarSessao('antigo', renovador)).toEqual(tokens)
    expect(renovador).toHaveBeenCalledTimes(1)
  })

  it('refresh tokens diferentes renovam separadamente', async () => {
    const renovador = vi.fn(async (r: string) => ({ accessToken: 'a-' + r, refreshToken: 'r-' + r }))
    const [a, b] = await Promise.all([renovarSessao('um', renovador), renovarSessao('dois', renovador)])
    expect(renovador).toHaveBeenCalledTimes(2)
    expect(a?.accessToken).toBe('a-um')
    expect(b?.accessToken).toBe('a-dois')
  })

  it('falhas não ficam guardadas: a próxima tentativa chama o backend de novo', async () => {
    const renovador = vi.fn().mockRejectedValueOnce(new Error('rede')).mockResolvedValueOnce(tokens)
    expect(await renovarSessao('antigo', renovador)).toBeNull()
    await Promise.resolve()
    expect(await renovarSessao('antigo', renovador)).toEqual(tokens)
    expect(renovador).toHaveBeenCalledTimes(2)
  })

  it('refresh recusado pelo backend (nulo) também não é reaproveitado', async () => {
    const renovador = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(tokens)
    expect(await renovarSessao('revogado', renovador)).toBeNull()
    await Promise.resolve()
    expect(await renovarSessao('revogado', renovador)).toEqual(tokens)
  })
})
