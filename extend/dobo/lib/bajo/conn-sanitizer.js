import generic from '../../generic/conn-sanitizer.js'

async function connSanitizer (conn) {
  return await generic.call(this, conn)
}

export default connSanitizer
