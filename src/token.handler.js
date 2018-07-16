const Boom = require('boom')
const jwt = require('jsonwebtoken')
const { exchangeAuthorizationCodeForToken } = require('./authorization.handler')

const createSignedAccessToken = payload => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: '2w',
        algorithm: 'HS512'
      },
      (err, token) => {
        if (err) {
          return reject(err)
        }
        resolve(token)
      }
    )
  })
}

const verifyAndDecodeToken = token => {
  return new Promise((resolve, reject) =>
    jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithm: 'HS512' },
      (err, decoded) => {
        if (err) {
          return reject(err)
        }
        return resolve(decoded)
      }
    )
  )
}

const verifyToken = async (request, h) => {
  const { authorization = '' } = request.headers
  if (!authorization) {
    return Boom.unauthorized()
  }
  const token = authorization.split(' ')[1]
  try {
    const decodedData = await verifyAndDecodeToken(token)
    return h.response(decodedData)
  } catch (e) {
    return Boom.boomify(e)
  }
}

const exchangeCodeForToken = async (request, h) => {
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
  const { client_id, redirect_uri, me, scope } = data
  if (client_id !== inboundClientId || redirect_uri !== inboundRedirectUri) {
    return Boom.unauthorized()
  }
  try {
    const token = await createSignedAccessToken({ me, client_id, scope })
    return { me, scope, access_token: token }
  } catch (e) {
    return Boom.serverUnavailable(e)
  }
}

module.exports = {
  verifyToken,
  exchangeCodeForToken,
  createSignedAccessToken
}
