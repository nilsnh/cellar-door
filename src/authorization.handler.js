const Boom = require('boom')
const uuidv4 = require('uuid/v4')

const authorizeCreationOfAuthorizationCode = async (request, h) => {
  if (!request.auth.isAuthenticated) {
    return Boom.unauthorized()
  }
  const { state, redirect_uri, client_id, me } = request.payload
  const code = uuidv4()
  await request.server.app.tokenStore.set(code, { redirect_uri, client_id, me })
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
  exchangeAuthorizationCodeForToken
}
