const Boom = require('boom')
const uuidv4 = require('uuid/v4')
const hcardService = require('./hcard.service')

const showAppToAuthorize = async (request, h) => {
  if (
    !process.env.USERNAME ||
    !process.env.USER_PASSWORD ||
    !process.env.IRON_SECRET ||
    !process.env.JWT_SECRET
  ) {
    return h.view('setup')
  }
  if (!request.auth.isAuthenticated) {
    return h.redirect(
      request.server.methods.createStatefulUrl({
        url: '/login',
        state: request.query
      })
    )
  }
  const { client_id } = request.query
  if (!client_id) {
    return h.view('ready-to-authorize')
  }
  // try to get any hcard data about the service you are trying to login to.
  const hcard = await hcardService(client_id)
  // parse space-separated scope into array to make it edible for handlebarsjs.
  const { scope = '' } = request.query
  const scopeAsList = scope ? scope.split(' ').map(scope => ({ scope })) : []
  return h.view('authorize', { ...request.query, hcard, scopeAsList })
}

const authorizeCreationOfAuthorizationCode = async (request, h) => {
  if (!request.auth.isAuthenticated) {
    return Boom.unauthorized()
  }
  const { state, redirect_uri, client_id, me, scope } = request.payload
  const code = uuidv4()
  await request.server.app.tokenStore.set(code, {
    redirect_uri,
    client_id,
    me,
    scope
  })
  return h.redirect(
    request.server.methods.createStatefulUrl({
      url: redirect_uri,
      state: { code, state }
    })
  )
}

const exchangeAuthorizationCodeForToken = async (request, h) => {
  const {
    code,
    client_id: inboundClientId,
    redirect_uri: inboundRedirectUri
  } = request.payload
  if (!code) {
    return Boom.badRequest('Missing authorization code')
  }
  const data = await request.server.app.tokenStore.get(code)
  if (!data) {
    // if we found nothing stored, we deny the exchange
    return Boom.unauthorized()
  }
  const { client_id, redirect_uri, me } = data
  if (client_id !== inboundClientId || redirect_uri !== inboundRedirectUri) {
    return Boom.unauthorized()
  }
  // remove code, to ensure that a authorization code can only be used once
  await request.server.app.tokenStore.drop(code)
  return { me }
}

module.exports = {
  authorizeCreationOfAuthorizationCode,
  exchangeAuthorizationCodeForToken,
  showAppToAuthorize
}
