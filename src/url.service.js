const queryString = require('query-string')

// Purpose: Create an url with query string included.
module.exports = ({ url = '', state = {} }) => {
  // loop over values, skip password and falsy values
  const preparedState = Object.keys(state).reduce((acc, key) => {
    const propertyValue = state[key]
    if (key === 'password') {
      return acc
    } else if (!propertyValue) {
      return acc
    }
    acc[key] = propertyValue
    return acc
  }, {})
  // if there's no state to speak of we just return the url
  if (Object.keys(preparedState).length === 0) {
    return url
  }
  return `${url}?${queryString.stringify(preparedState)}`
}
