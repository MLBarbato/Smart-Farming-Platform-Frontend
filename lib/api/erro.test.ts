import { describe, expect, it } from 'vitest'
import { ApiError, erroDaResposta, erroDeRede, formatarEspera, mensagemDeLogin } from './erro'

describe('erroDaResposta', () => {
  it('lê o formato padrão de erro do backend', () => {
    const erro = erroDaResposta(409, { status: 409, mensagem: 'Um alerta RESOLVIDO não pode passar para ABERTO.' })
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.status).toBe(409)
    expect(erro.message).toBe('Um alerta RESOLVIDO não pode passar para ABERTO.')
  })

  it('traz os erros de validação por campo e o código especial', () => {
    const erro = erroDaResposta(400, { mensagem: 'Dados inválidos', detalhes: { email: 'deve ser um e-mail válido' }, codigo: 'X' })
    expect(erro.detalhes).toEqual({ email: 'deve ser um e-mail válido' })
    expect(erro.codigo).toBe('X')
  })

  it('usa uma mensagem padrão quando o corpo não é o formato esperado', () => {
    expect(erroDaResposta(500, '<html>').message).toMatch(/Erro interno/)
    expect(erroDaResposta(503, null).message).toMatch(/indisponível/)
    expect(erroDaResposta(404, undefined).message).toMatch(/não encontrado/i)
  })

  it('lê o tempo de espera de Retry-After', () => {
    expect(erroDaResposta(429, { codigo: 'LOGIN_BLOQUEADO' }, '900').retryAfterSegundos).toBe(900)
    expect(erroDaResposta(429, {}, 'abc').retryAfterSegundos).toBeUndefined()
    expect(erroDaResposta(429, {}, null).retryAfterSegundos).toBeUndefined()
  })

  it('o erro de rede tem status 0 e código REDE', () => {
    expect(erroDeRede().status).toBe(0)
    expect(erroDeRede().codigo).toBe('REDE')
  })
})

describe('mensagens de login', () => {
  it('distingue credenciais inválidas, conta desativada e bloqueio', () => {
    expect(mensagemDeLogin(erroDaResposta(401, {}))).toBe('E-mail ou senha incorretos.')
    expect(mensagemDeLogin(erroDaResposta(403, { codigo: 'USUARIO_DESATIVADO' }))).toMatch(/desativada/)
    expect(mensagemDeLogin(erroDaResposta(429, { codigo: 'LOGIN_BLOQUEADO' }, '900'))).toMatch(/15 minutos/)
    expect(mensagemDeLogin(erroDaResposta(429, { codigo: 'LOGIN_BLOQUEADO' }))).toBe('Muitas tentativas de login.')
    expect(mensagemDeLogin(erroDaResposta(400, {}))).toMatch(/válidos/)
  })

  it('mostra a mensagem de rede e uma genérica para erros desconhecidos', () => {
    expect(mensagemDeLogin(erroDeRede())).toMatch(/servidor/)
    expect(mensagemDeLogin(new Error('x'))).toBe('Não foi possível entrar. Tente novamente.')
  })
})

describe('formatarEspera', () => {
  it('usa segundos até 90 e minutos arredondados para cima depois', () => {
    expect(formatarEspera(45)).toBe('45 segundos')
    expect(formatarEspera(100)).toBe('2 minutos')
    expect(formatarEspera(900)).toBe('15 minutos')
    expect(formatarEspera(90)).toBe('2 minutos')
  })
})
