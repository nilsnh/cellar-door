'use strict'

require('dotenv').config()
const Hapi = require('hapi')
const uuidv4 = require('uuid/v4')
const queryString = require('query-string')
const Boom = require('Boom')

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    state: {
      //cookie configuration
      //expires on closing browser
      strictHeader: true,
      ignoreErrors: false,
      isSecure: process.env.NODE_ENV !== 'test',
      isHttpOnly: true,
      isSameSite: 'Strict',
      encoding: 'iron',
      password: process.env.IRON_SECRET,
      clearInvalid: true
    }
  })

  server.app.tokenStore = server.cache({
    segment: 'tokens',
    expiresIn: 60 * 60 * 3 // three hours
  })

  // setup logging
  await server.register({
    plugin: require('good'),
    options: {
      ops: {
        interval: 1000
      },
      reporters: {
        myConsoleReporter: [
          {
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', response: '*' }]
          },
          {
            module: 'good-console'
          },
          'stdout'
        ]
      }
    }
  })

  // setup html templating
  await server.register(require('vision'))
  await server.register(require('inert'))
  server.views({
    engines: {
      hbr: require('handlebars')
    },
    relativeTo: __dirname,
    path: 'templates'
  })

  // setup authentication
  server.auth.scheme('cookie-scheme', require('./authentication.scheme'))
  server.auth.strategy('cookie-strategy', 'cookie-scheme')
  server.auth.default({
    strategy: 'cookie-strategy',
    mode: 'try'
  })

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      if (!request.auth.isAuthenticated) {
        return h.redirect('/login')
      }
      return h.view('authorize', request.query)
    }
  })

  // exchange authorization code for token
  server.route({
    method: 'POST',
    path: '/',
    options: { auth: false },
    handler: async (request, h) => {
      const {
        code,
        client_id: inboundClientId,
        redirect_uri: inboudRedirectUri
      } = request.payload
      if (!code) {
        return Boom.badRequest('Missing authorization code')
      }
      const data = await server.app.tokenStore.get(code)
      if (!data) {
        // if we found nothing stored, we deny the exchange
        return Boom.unauthorized()
      }
      const { client_id, redirect_uri, me } = data
      if (client_id !== inboundClientId || redirect_uri !== inboudRedirectUri) {
        return Boom.unauthorized()
      }
      // remove code, to ensure that a authorization code can only be used once
      await server.app.tokenStore.drop(code)
      return { me }
    }
  })

  server.route({
    method: 'POST',
    path: '/authorize',
    handler: async (request, h) => {
      if (!request.auth.isAuthenticated) {
        return h.redirect('/login')
      }
      const { state, redirect_uri, client_id, me } = request.payload
      const code = uuidv4()
      await server.app.tokenStore.set(code, { redirect_uri, client_id, me })
      return h.redirect(
        `${redirect_uri}?${queryString.stringify({ code, state })}`
      )
    }
  })

  server.route({
    method: 'GET',
    path: '/login',
    options: { auth: false },
    handler: (request, h) => h.view('login', request.query)
  })

  server.route({
    method: 'POST',
    path: '/login',
    options: { auth: false },
    handler: require('./login.handler')
  })

  await server.start()
  console.log(`Server running at: ${server.info.uri}`)
  return server
}

process.on('unhandledRejection', err => {
  console.log(err)
  process.exit(1)
})

if (require.main === module) {
  init()
}

module.exports = init
