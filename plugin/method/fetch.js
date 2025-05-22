async function fetch (url, opts = {}, extra = {}) {
  const { fetchUrl } = this.app.bajoExtra
  extra.rawResponse = true
  const resp = await fetchUrl(url, opts, extra)
  const result = await resp.json()
  if (!resp.ok) {
    throw this.error(result.message, {
      noTrans: true,
      statusCode: resp.status,
      success: false
    })
  }
  return result
}

export default fetch
