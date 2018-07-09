import bcrypt from 'bcrypt'
import test from 'ava'
import initServer from './index'
import rp from 'request-promise-native'

const user = {
  username: 'johndoe',
  password: 'abc123'
}

let server = null

test.before(async t => {
  server = await initServer()
})

test.after(async t => {
  await server.stop()
})

test('test login handler', async t => {
  const { username, password } = user
  process.env.USERNAME = username
  process.env.USER_PASSWORD = await bcrypt.hash(password, 1)
  const response = await rp({
    method: 'POST',
    uri: 'http://localhost:3000/login',
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
