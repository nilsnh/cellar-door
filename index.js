'use strict'

require('dotenv').config()
const Hapi = require('hapi')
const uuidv4 = require('uuid/v4')
const queryString = require('query-string')

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    state: {
      strictHeader: true,
      ignoreErrors: false,
      isSecure: false,
      isHttpOnly: true,
      isSameSite: 'Strict',
      // encrypt cookies
      encoding: 'iron',
      password: process.env.IRON_SECRET,
      clearInvalid: true
    }
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

  server.route({
    method: 'POST',
    path: '/',
    handler: (request, h) => {
      if (!request.auth.isAuthenticated) {
        return h.redirect('/login')
      }
      const { state, redirect_uri } = request.payload
      const code = uuidv4()
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
