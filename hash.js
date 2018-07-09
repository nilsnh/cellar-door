const bcrypt = require('bcrypt')

// how heavy bcrypt should hash
const saltRounds = 10

const main = async () => {
  const stringToHash = process.argv[2]
  try {
    console.log(await bcrypt.hash(stringToHash, saltRounds))
  } catch (e) {
    console.error('Hashing failed', e)
  }
}

main()
