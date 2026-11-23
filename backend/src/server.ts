import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod'
import rateLimit from '@fastify/rate-limit'

import { registerErrorHandler } from './middleware/error-handler'
import { routes } from './routes'
import { ACCESS_TOKEN_TTL_SECONDS } from './modules/auth/auth.constants'

const fastify = Fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>()

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

registerErrorHandler(fastify)

fastify.register(cors, {
  origin: ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
})

fastify.register(jwt, {
  secret: process.env.JWT_ACCESS_SECRET!,
  sign: { expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s` },
})

fastify.register(cookie)

fastify.register(rateLimit, { global: false })

fastify.decorateRequest('currentUser')

fastify.register(routes)

fastify.get('/', function (request, reply) {
  reply.send('Welcome to Docsy')
})

fastify.listen({ port: 3000, host: 'localhost' }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
