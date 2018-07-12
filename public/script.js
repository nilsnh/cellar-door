// hack to redirect to https for everything but localhost
if (
  location.host.indexOf('localhost') === -1 &&
  location.protocol != 'https:'
) {
  location.href =
    'https:' + window.location.href.substring(window.location.protocol.length)
}
