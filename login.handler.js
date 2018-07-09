const bcrypt = require('bcrypt')
const Boom = require('boom')
const queryString = require('query-string')

const getUser = () => ({
  username: process.env.USERNAME,
  password: process.env.USER_PASSWORD
})

async function loginHandler(request, h) {
  const myOnlyUser = getUser()
  const { username, password } = request.payload
  if (!username || !password) {
    return Boom.badRequest(
      'Username and password was not provided when logging in.'
    )
  }
  if (username !== myOnlyUser.username) {
    console.error('Unknown user', username)
    return Boom.unauthorized()
  }
  const isValid = await bcrypt.compare(password, myOnlyUser.password)
  if (!isValid) {
    console.error('Invalid password')
    return Boom.unauthorized()
  }
  // we pass everything except the password back to authorization page.
  delete request.payload.password
  return h
    .redirect(`/?${queryString.stringify(request.payload)}`)
    .state('sid-indieauth', username)
}

module.exports = loginHandler
