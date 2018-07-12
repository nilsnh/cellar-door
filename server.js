'use strict'

require('dotenv').config()
const Hapi = require('hapi')

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    state: {
      // let cookies live twelve hours
      ttl: 1000 * 60 * 60 * 12,
      strictHeader: true,
      ignoreErrors: true,
      // cookies should only be set on https connections, except in testing.
      isSecure: process.env.NODE_ENV !== 'test',
      isHttpOnly: true,
      isSameSite: 'Strict',
      encoding: 'iron',
      password: process.env.IRON_SECRET
    }
  })

  server.app.tokenStore = server.cache({
    segment: 'tokens',
    expiresIn: 1000 * 60 * 60 * 3 // three hours
  })

  server.method('createStatefulUrl', require('./src/url.service'))

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

  // Setup html templating
  await server.register(require('vision'))
  await server.register(require('inert'))
  server.views({
    engines: {
      hbs: require('handlebars')
    },
    path: 'views',
    partialsPath: 'views/partials',
    relativeTo: __dirname,
    isCached: process.env.NODE_ENV !== 'test'
  })

  // Setup authentication. Please note: You still need to add an if check
  // on the routes you want to protect.
  server.auth.scheme('cookie-scheme', require('./src/authentication.scheme'))
  server.auth.strategy('cookie-strategy', 'cookie-scheme')
  server.auth.default({
    strategy: 'cookie-strategy',
    mode: 'try'
  })

  server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
      if (!request.auth.isAuthenticated) {
        return h.redirect(
          request.server.methods.createStatefulUrl({
            url: '/login',
            state: request.query
          })
        )
      }
      const { client_id } = request.query
      console.log('trying to process client_id', client_id)
      // try to get any vcard data about the service you are trying to login to.
      const vcardService = require('./src/vcard.service')
      const vcard = await vcardService(client_id)
      const context = { ...request.query, vcard }
      console.log('context', { context })
      return h.view('authorize', context)
    }
  })

  // exchange authorization code for token
  server.route({
    method: 'POST',
    path: '/',
    options: { auth: false },
    handler: require('./src/authorization.handler')
      .exchangeAuthorizationCodeForToken
  })

  // user posts data to this endpoint to confirm that they want to give
  // an authorization code to the site they want to login to. Code is
  // generated, stored and given to the external site through redirect.
  server.route({
    method: 'POST',
    path: '/authorize',
    handler: require('./src/authorization.handler')
      .authorizeCreationOfAuthorizationCode
  })

  server.route({
    method: 'GET',
    path: '/login',
    options: { auth: false },
    handler: (request, h) => {
      const { message } = request.state
      h.unstate('message')
      return h.view('login', { ...request.query, ...{ message } })
    }
  })

  server.route({
    method: 'GET',
    path: '/logout',
    options: { auth: false },
    handler: (request, h) => h.redirect('/').unstate('sid-indieauth')
  })

  server.route({
    method: 'POST',
    path: '/login',
    options: { auth: false },
    handler: require('./src/login.handler')
  })

  server.route({
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: 'public'
      }
    }
  })

  await server.start()
  console.log(`Server running at: ${server.info.uri}`)
  return server
}

process.on('unhandledRejection', err => {
  console.log(err)
  process.exit(1)
})

// only start server if file is called directly
if (require.main === module) {
  init()
}

module.exports = init
