import createStatefulUrl from './url.service'
import test from 'ava'

test('building url with query params without falsy values', t => {
  const state = {
    client_id: 'something',
    someOtherValue: 'aValue',
    falsyValue: '',
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
