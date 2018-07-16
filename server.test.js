import bcrypt from 'bcrypt'
import test from 'ava'
import initServer from './server'
import rp from 'request-promise-native'
import queryString from 'query-string'

const user = {
  username: 'johndoe',
  password: 'abc123'
}

const loginTarget = {
  me: 'https://mypersonalwebsite.no/',
  client_id: 'https://webapp.example.org/',
  redirect_uri: 'https://webapp.example.org/auth/callback',
  state: '1234567890',
  response_type: 'id'
}

let server = null

test.before(async t => {
  process.env.PORT = 4000
  server = await initServer()
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
    uri: 'http://localhost:4000/',
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
    uri: 'http://localhost:4000/login',
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

test('user can be granted authorization code, and includes state in redirect.', async t => {
  const response = await rp({
    method: 'POST',
    uri: 'http://localhost:4000/authorize',
    formData: { ...loginTarget },
    simple: false,
    resolveWithFullResponse: true,
    headers: {
      Cookie: await getLoggedInCookie()
    }
  })
  const { location } = response.toJSON().headers
  const redirect = location.split('?')[0]
  const { code, state } = queryString.parse('?' + location.split('?')[1])
  t.is(
    redirect,
    loginTarget.redirect_uri,
    'expected to be redirected correctly'
  )
  t.truthy(code, 'expected query param code to be included')
  t.is(
    state,
    loginTarget.state,
    'state should have been included in the redirect'
  )
})

test('user can exchange authorization code for identification token.', async t => {
  // get code
  const response = await rp({
    method: 'POST',
    uri: 'http://localhost:4000/authorize',
    formData: { ...loginTarget },
    simple: false,
    resolveWithFullResponse: true,
    headers: {
      Cookie: await getLoggedInCookie()
    }
  })
  const { location } = response.toJSON().headers
  const { code } = queryString.parse('?' + location.split('?')[1])
  const { redirect_uri, client_id } = loginTarget
  // exchange code
  const secondResponse = await rp({
    method: 'POST',
    uri: 'http://localhost:4000/',
    formData: { code, redirect_uri, client_id },
    json: true,
    headers: {
      Cookie: await getLoggedInCookie()
    }
  })
  t.deepEqual(
    {
      me: loginTarget.me
    },
    secondResponse
  )
})

test.skip('user can exchange authorization code for access token.', async t => {
  // get code
  const response = await rp({
    method: 'POST',
    uri: 'http://localhost:4000/authorize',
    formData: { ...loginTarget, ...{ scope: 'create update' } },
    simple: false,
    resolveWithFullResponse: true,
    headers: {
      Cookie: await getLoggedInCookie()
    }
  })
  const { location } = response.toJSON().headers
  const { code } = queryString.parse('?' + location.split('?')[1])
  const { redirect_uri, client_id, me } = loginTarget
  // exchange code
  const secondResponse = await rp({
    method: 'POST',
    uri: 'http://localhost:4000/token',
    formData: { code, redirect_uri, client_id, me },
    json: true,
    headers: {
      Cookie: await getLoggedInCookie()
    }
  })
  t.deepEqual(
    {
      access_token: 'XXXXXX',
      scope: 'post',
      me
    },
    secondResponse
  )
})
