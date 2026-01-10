import unsupported from '../../generic/unsupported.js'
import prepFetch from '../../generic/prep-fetch.js'
import transform from '../../generic/transform.js'

async function recordGet ({ schema, id, options = {} } = {}) {
  const { importModule } = this.app.bajo
  const { isFunction, get } = this.app.lib._
  const { getInfo } = this.app.dobo
  const { driver, connection } = getInfo(schema)
  const { dataOnly, responseKey } = connection.options
  const { noTransform = false } = options
  const prefix = driver.provider ? `${driver.provider}:/extend/doboRestproxy` : 'doboRestproxy:/extend/dobo'
  const mod = await importModule(`${prefix}/lib/${driver.type}/record-get.js`)
  if (!mod) return unsupported.call(this)
  let { url, opts, ext } = await prepFetch.call(this, schema, 'get', id)
  let resp
  if (isFunction(mod)) ({ url, opts, ext, resp } = await mod.call(this.app[driver.ns], { url, opts, ext, schema, id, options }))
  if (!resp) resp = await this.fetch(url, opts, ext)
  const result = {
    data: dataOnly === true || (Array.isArray(dataOnly) && dataOnly.includes('get')) ? resp : resp[get(responseKey, 'data')]
  }
  if (!noTransform) result.data = await transform.call(this, result.data, schema)
  return result
}

export default recordGet
