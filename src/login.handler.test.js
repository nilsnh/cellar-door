import bcrypt from 'bcrypt'
import test from 'ava'
import initServer from '../server'
import rp from 'request-promise-native'

const user = {
  username: 'johndoe',
  password: 'abc123'
}

let server = null
let testUrl = null

test.before(async t => {
  process.env.PORT = 0
  server = await initServer()
  testUrl = `http://localhost:${server.info.port}`
})

test.after(async t => {
  await server.stop()
})

const getLoggedInCookie = () =>
  server.states.format({
    name: 'sid-indieauth',
    value: user.username
  })

test('visiting index unauthenticated redirects to /login', async t => {
  const response = await rp({
    method: 'GET',
    uri: `${testUrl}/`,
    simple: false,
    resolveWithFullResponse: true
  })
  t.is(
    response.toJSON().request.uri.pathname,
    '/login',
    'Expected to be redirected to /login'
  )
})

test('login should authenticate and redirect', async t => {
  const { username, password } = user
  process.env.USERNAME = username
  process.env.USER_PASSWORD = await bcrypt.hash(password, 1)
  const response = await rp({
    method: 'POST',
    uri: `${testUrl}/login`,
    formData: { username, password },
    simple: false,
    resolveWithFullResponse: true
  })
  t.is(
    response.statusCode,
    302,
    'Expected to be redirected upon successful login'
  )
})
