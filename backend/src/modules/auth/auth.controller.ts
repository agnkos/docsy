import type { FastifyReply, FastifyRequest } from 'fastify'

import { userService } from '../user/user.service'
import { authService } from './auth.service'
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_COOKIE_NAME } from './auth.constants'
import { getRefreshCookieOptions, clearRefreshCookieOptions } from './auth.cookies'
import { UnauthorizedError } from '../../errors/http-error'
import type { LoginBody } from './auth.schemas'

const signAccessToken = (reply: FastifyReply, userId: string) =>
  reply.jwtSign({ sub: userId }, { expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s` })

const login = async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
  const user = await authService.validateCredentials(request.body.email, request.body.password)
  const { token } = await authService.createSession(user.id, {
    userAgent: request.headers['user-agent'],
    ip: request.ip,
  })
  reply.setCookie(REFRESH_TOKEN_COOKIE_NAME, token, getRefreshCookieOptions())
  const accessToken = await signAccessToken(reply, user.id)
  reply.code(200).send({ accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS, user })
}

const me = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub } = request.user as { sub: string }
  const user = await userService.getUserById(sub)
  reply.code(200).send(user)
}

const refresh = async (request: FastifyRequest, reply: FastifyReply) => {
  const rawToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME]

  if (!rawToken) {
    throw new UnauthorizedError('Missing refresh token')
  }

  try {
    const { userId } = await authService.verifySession(rawToken)
    const accessToken = await signAccessToken(reply, userId)
    reply.code(200).send({ accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS })
  } catch (err) {
    reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, clearRefreshCookieOptions())
    throw err
  }
}

const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  const rawToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME]

  if (rawToken) {
    await authService.revokeSessionByToken(rawToken)
  }

  reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, clearRefreshCookieOptions())
  reply.code(204).send()
}

export const authController = {
  login,
  me,
  refresh,
  logout,
}
