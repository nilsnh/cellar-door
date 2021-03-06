const microFormat = require('microformat-node')
const rp = require('request-promise-native')

module.exports = async url => {
  if (!url) {
    return null
  }
  try {
    const html = await rp(url)
    const { items } = microFormat.get({ html })
    const hcard = items.find(({ type = [] }) =>
      type.find(typeName => typeName === 'h-card')
    )
    if (!hcard) {
      return null
    }
    return unwrapProperties(hcard.properties)
  } catch (e) {
    console.error('Failed to fetch hcard data', e)
    return null
  }
}

// for each property that is an array, pick the first array value as replacement.
function unwrapProperties(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    const propertyValue = obj[key]
    if (Array.isArray(propertyValue)) {
      acc[key] = propertyValue[0] || ''
    } else {
      acc[key] = propertyValue
    }
    return acc
  }, {})
}
