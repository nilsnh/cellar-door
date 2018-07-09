import bcrypt from 'bcrypt'
import test from 'ava'
import initServer from './index'
import rp from 'request-promise-native'
import queryString from 'query-string'

const user = {
  username: 'johndoe',
  password: 'abc123'
}

const application = {
  me: 'https://aaronparecki.com/',
  client_id: 'https://webapp.example.org/',
  redirect_uri: 'https://webapp.example.org/auth/callback',
  state: '1234567890',
  response_type: 'id'
}

let server = null
let cookieJar = null

test.before(async t => {
  server = await initServer()
  cookieJar = rp.jar()
})

test.after(async t => {
  await server.stop()
})

test('visiting index unauthenticated redirects to /login', async t => {
  const response = await rp({
    method: 'GET',
    uri: 'http://localhost:3000/',
    simple: false,
    resolveWithFullResponse: true
  })
  t.is(
    response.toJSON().request.uri.pathname,
    '/login',
    'Expected to be redirected to /login'
  )
})

test.serial('login should authenticate and redirect', async t => {
  const { username, password } = user
  process.env.USERNAME = username
  process.env.USER_PASSWORD = await bcrypt.hash(password, 1)
  const response = await rp({
    method: 'POST',
    uri: 'http://localhost:3000/login',
    formData: { username, password },
    simple: false,
    resolveWithFullResponse: true,
    jar: cookieJar
  })
  t.is(
    response.statusCode,
    302,
    'Expected to be redirected upon successful login'
  )
})

test.serial(
  'user can authorize and is granted code, and state is passed along.',
  async t => {
    const response = await rp({
      method: 'POST',
      uri: 'http://localhost:3000/',
      formData: { ...application },
      simple: false,
      resolveWithFullResponse: true,
      jar: cookieJar
    })
    const { location } = response.toJSON().headers
    const redirect = location.split('?')[0]
    const { code, state } = queryString.parse('?' + location.split('?')[1])
    t.is(
      redirect,
      application.redirect_uri,
      'expected to be redirected correctly'
    )
    t.truthy(code, 'expected query param code to be included')
    t.is(
      state,
      application.state,
      'state should have been included in the redirect'
    )
  }
)
