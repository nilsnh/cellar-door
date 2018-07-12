const test = require('ava')
const mock = require('mock-require')

const user = {
  photo: 'http://localhost:1313/me_lw.png',
  email: 'mail@nilsnh.no',
  note: 'Keep the web weird and wonderful.',
  name: 'Nils Norman Haukås',
  url: 'http://localhost:1313/'
}

// the hcard service will try to call a remote url. We mock that request and
// return this html instead to be parsed by microformat-node.
mock(
  'request-promise-native',
  () => `<html>
  <a class="h-card" href="${user.url}">
    <img class="u-photo" src="${
      user.photo
    }" width="60" height="60" alt="nilsnh.no">
    <span rel="me" class="p-name" style="display:none;">Nils Norman Haukås</span>
    <span rel="me" class="u-email" style="display:none;">${user.email}</span>
    <span rel="me" class="u-note" style="display:none;">${user.note}</span>
  </a>
</html>`
)

const hcardService = require('./hcard.service')

test('test that we can correctly extract hcard information', async t => {
  const hcardData = await hcardService('someurl')
  t.deepEqual(hcardData, user, 'was not able to extract correct hcard data')
})
