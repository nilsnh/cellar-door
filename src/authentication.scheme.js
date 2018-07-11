const Boom = require('boom')

const scheme = (server, options) => ({
  authenticate: async (request, h) => {
    const session = request.state['sid-indieauth']
    if (!session) {
      return h.unauthenticated(Boom.unauthorized())
    }
    return h.authenticated({ credentials: session })
  }
})

module.exports = scheme
