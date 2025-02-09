'use strict'

const path = require('path')

const envSchema = require('env-schema')
const S = require('fluent-json-schema')

const config = envSchema({
  dotenv: true,
  schema: S.object()
    .prop('NODE_ENV', S.string().required())
    .prop('API_HOST', S.string().required())
    .prop('API_PORT', S.string().required())
    .prop('CORS_ORIGIN', S.string())
    .prop('ENABLE_ADMIN', S.boolean())
    .prop('PG_HOST', S.string().required())
    .prop('PG_PORT', S.string().required())
    .prop('PG_DB', S.string().required())
    .prop('PG_USER', S.string().required())
    .prop('AUTH_PROVIDER', S.string())
    .prop('AUTH0_DOMAIN', S.string())
    .prop('AUTH0_CLIENT_ID', S.string())
    .prop('AUTH0_CLIENT_SECRET', S.string())
    .prop('AUTH0_AUDIENCE', S.string())
    .prop('AUTH0_GRANT_TYPE', S.string())
    .prop('AUTH0_CONNECTION', S.string())
    .prop('COGNITO_REGION', S.string())
    .prop('COGNITO_USER_POOL_ID', S.string())
    .prop('JWT_SECRET', S.string().default('3000'))
    .prop('AD_TENANT', S.string())
    .prop('AD_APP_ID', S.string())
    .prop('AD_SECRET', S.string())
    .prop('SECRETS_STRATEGY', S.string())
    .prop('SECRETS_PG_PASS', S.string().required())
    .prop('HEALTHCHECK_URL', S.string().default('/healthcheck'))
    .prop('HEALTHCHECK_MAX_HEAP_USER', S.number().default(768 * 1024 * 1024)) // arbitrary, 768 MB of RAM
    .prop('HEALTHCHECK_MAX_RSS', S.number().default(1024 * 1024 * 1024)) // arbitrary, 1 GB of RAM
    .prop('HEALTHCHECK_MAX_EVENT_LOOP_UTILIZATION', S.number().default(0.98))
})

const routeResponseSchemaOpts = S.object()
  .prop('version', S.string())
  .prop('serverTimestamp', S.string())
  .prop('db', S.string())
  .prop(
    'memoryUsage',
    S.object()
      .prop('eventLoopDelay', S.string())
      .prop('rssBytes', S.string())
      .prop('heapUsed', S.string())
  )
  .valueOf().properties

const isProduction = /^\s$production\s*$/i.test(config.NODE_ENV)

// Global configuration, from env variables
module.exports = {
  isProduction,
  server: {
    host: config.API_HOST,
    port: config.API_PORT
  },
  fastify: {
    logger: true
  },
  enableAdmin: config.ENABLE_ADMIN,
  pgPlugin: {
    host: config.PG_HOST,
    port: config.PG_PORT,
    database: config.PG_DB,
    user: config.PG_USER,
    poolSize: 10,
    idleTimeoutMillis: 30000
  },
  underPressure: {
    maxHeapUsedBytes: config.HEALTHCHECK_MAX_HEAP_USER,
    maxRssBytes: config.HEALTHCHECK_MAX_RSS,
    maxEventLoopUtilization: config.HEALTHCHECK_MAX_EVENT_LOOP_UTILIZATION,
    exposeStatusRoute: {
      url: config.HEALTHCHECK_URL,
      routeResponseSchemaOpts
    }
  },
  cors: { origin: !!config.CORS_ORIGIN, credentials: true },
  auth: {
    provider: config.AUTH_PROVIDER || 'auth0',
    azureAD: {
      appID: config.AD_APP_ID,
      secret: config.AD_SECRET,
      tenant: config.AD_TENANT
    },
    auth0: {
      domain: config.AUTH0_DOMAIN,
      clientId: config.AUTH0_CLIENT_ID,
      clientSecret: config.AUTH0_CLIENT_SECRET,
      audience: config.AUTH0_AUDIENCE,
      grantType: config.AUTH0_GRANT_TYPE,
      connection: config.AUTH0_CONNECTION
    },
    cognito: {
      region: config.COGNITO_REGION,
      userPoolId: config.COGNITO_USER_POOL_ID
    }
  },
  jwt: {
    secret: config.JWT_SECRET
  },
  secretsManager: {
    strategy: config.SECRETS_STRATEGY,
    secrets: {
      dbPassword: config.SECRETS_PG_PASS
    }
  },
  casbin: {
    model: path.join(__dirname, 'authz/casbin_model.conf'),
    adapter: path.join(__dirname, 'authz/casbin_policy.csv')
  }
}
