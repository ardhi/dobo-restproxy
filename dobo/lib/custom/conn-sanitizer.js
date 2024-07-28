import generic from '../../generic/conn-sanitizer.js'

async function connSanitizer (conn) {
  const { callHandler } = this.app.bajo
  let newConn = await generic.call(this, conn)
  const { connSanitizer } = newConn.handler ?? {}
  if (connSanitizer) newConn = await callHandler(connSanitizer, newConn)
  return newConn
}

export default connSanitizer
