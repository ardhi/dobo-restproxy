async function fetch (url, opts = {}, extra = {}) {
  const { fetch } = this.app.bajoExtra
  extra.rawResponse = true
  const resp = await fetch(url, opts, extra)
  const result = await resp.json()
  if (!resp.ok) {
    throw this.error(result.message, {
      statusCode: resp.status,
      success: false
    })
  }
  return result
}

export default fetch
