const test = require('ava')
const mock = require('mock-require')

const user = {
  photo: 'http://localhost:1313/me_lw.png',
  email: 'mail@nilsnh.no',
  note: 'Keep the web weird and wonderful.',
  name: 'Nils Norman Haukås',
  url: 'http://localhost:1313/'
}

// the vcard service will try to call a remote url. We mock that request and
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

const vcardService = require('./vcard.service')

test('test that we can correctly extract vcard information', async t => {
  const vcardData = await vcardService('someurl')
  t.deepEqual(vcardData, user, 'was not able to extract correct vcard data')
})
