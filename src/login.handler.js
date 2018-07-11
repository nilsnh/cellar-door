const bcrypt = require('bcrypt')
const Boom = require('boom')

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
  const isValid = await bcrypt.compare(password, myOnlyUser.password)
  if (username !== myOnlyUser.username || !isValid) {
    return h
      .redirect(
        request.server.methods.createStatefulUrl({
          url: '/login',
          state: request.query
        })
      )
      .state('message', 'Login failed, username or password was wrong.')
  }
  return h
    .redirect(
      request.server.methods.createStatefulUrl({
        url: '/',
        state: request.query
      })
    )
    .state('sid-indieauth', username)
}

module.exports = loginHandler
