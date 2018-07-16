import bcrypt from 'bcrypt'
import test from 'ava'
import initServer from '../server'
import rp from 'request-promise-native'
import queryString from 'query-string'
import { createSignedAccessToken } from './token.handler'

const user = {
  username: 'johndoe',
  password: 'abc123'
}

const loginTarget = {
  me: 'https://mypersonalwebsite.no/',
  client_id: 'https://webapp.example.org/',
  redirect_uri: 'https://webapp.example.org/auth/callback',
  state: '1234567890',
  response_type: 'id',
  scope: 'create update'
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

test('user can exchange authorization code for access token.', async t => {
  const scope = 'create update'
  // get code
  const response = await rp({
    method: 'POST',
    uri: `${testUrl}/authorize`,
    formData: { ...loginTarget, ...{ scope } },
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
    uri: `${testUrl}/token`,
    formData: { code, redirect_uri, client_id, me },
    json: true,
    headers: {
      Cookie: await getLoggedInCookie()
    }
  })
  const token = await createSignedAccessToken({ me, client_id, scope })
  t.deepEqual(
    {
      access_token: token,
      scope,
      me
    },
    secondResponse
  )
})

test('invalid token should throw error', t =>
  t.throws(
    rp({
      method: 'GET',
      uri: `${testUrl}/token`,
      headers: {
        Authorization: 'Bearer faketoken'
      }
    }),
    null,
    'Fake token should have thrown error'
  ))

test('user can verify validity of access token.', async t => {
  // get code
  const response = await rp({
    method: 'POST',
    uri: `${testUrl}/authorize`,
    formData: { ...loginTarget },
    simple: false,
    resolveWithFullResponse: true,
    headers: {
      Cookie: await getLoggedInCookie()
    }
  })
  const { location } = response.toJSON().headers
  const { code } = queryString.parse('?' + location.split('?')[1])
  const { redirect_uri, client_id, me, scope } = loginTarget
  const token = await createSignedAccessToken({ me, client_id, scope })
  const secondResponse = await rp({
    method: 'GET',
    uri: `${testUrl}/token`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    json: true
  })
  const keysThatShouldBePresent = ['me', 'client_id', 'scope']
  return keysThatShouldBePresent.map(key =>
    t.is(
      secondResponse[key],
      loginTarget[key],
      `Woops '${key}' was not as expected`
    )
  )
})
