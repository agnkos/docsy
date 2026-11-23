import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { authenticate } from '../../middleware/authenticate'
import { userResponseSchema } from '../user/user.schemas'
import { authController } from './auth.controller'
import { authResponseSchema, loginBodySchema, refreshResponseSchema } from './auth.schemas'

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '/auth/login',
    {
      config: { rateLimit: { max: 5, timeWindow: 60000 } },
      schema: {
        body: loginBodySchema,
        response: {
          200: authResponseSchema,
        },
      },
    },
    authController.login,
  )

  fastify.get(
    '/auth/me',
    {
      onRequest: authenticate,
      schema: {
        response: {
          200: userResponseSchema,
        },
      },
    },
    authController.me,
  )

  fastify.post(
    '/auth/refresh',
    {
      schema: {
        response: {
          200: refreshResponseSchema,
        },
      },
    },
    authController.refresh,
  )

  fastify.post(
    '/auth/logout',
    {
      schema: {
        response: {
          204: z.null(),
        },
      },
    },
    authController.logout,
  )
}
