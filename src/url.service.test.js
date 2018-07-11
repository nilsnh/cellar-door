import createStatefulUrl from './url.service'
import test from 'ava'

test('Test that we can build url', t => {
  const state = {
    client_id: 'something',
    someOtherValue: 'aValue',
    password: 'asimplepassword'
  }
  t.is(
    createStatefulUrl({
      url: '/login',
      state
    }),
    '/login?client_id=something&someOtherValue=aValue',
    'Url was not correctly built'
  )
})
