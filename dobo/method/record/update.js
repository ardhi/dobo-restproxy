import unsupported from '../../generic/unsupported.js'
import prepFetch from '../../generic/prep-fetch.js'
import transform from '../../generic/transform.js'
import fetchGet from './get.js'

async function recordUpdate ({ schema, id, body, options } = {}) {
  const { importModule } = this.app.bajo
  const { get, isFunction, merge } = this.app.bajo.lib._
  const { getInfo } = this.app.dobo
  const { driver, connection } = getInfo(schema)
  const { dataOnly, oldData, data, responseKey } = connection.options
  const prefix = driver.provider ? `${driver.provider}:/doboRestproxy` : 'doboRestproxy:/dobo'
  const mod = await importModule(`${prefix}/lib/${driver.type}/record-update.js`)
  if (!mod) return unsupported.call(this)
  let { url, opts, ext } = await prepFetch.call(this, schema, 'update', id, body)
  let resp
  let oldResp
  if (isFunction(mod)) ({ url, opts, ext, resp } = await mod.call(this.app[driver.ns], { url, opts, ext, schema, id, body, options }))
  merge(options, { noTransform: true })
  if (oldData === false) oldResp = await fetchGet.call(this, { schema, id, options })
  if (!resp) resp = await this.fetch(url, opts, ext)
  if (data === false) resp = await fetchGet.call(this, { schema, id, options })
  const result = {}
  if (oldData === false) {
    result.oldData = oldResp[get(responseKey, 'data')]
  } else {
    result.oldData = dataOnly === true || (Array.isArray(dataOnly) && dataOnly.includes('update')) ? resp : resp[get(responseKey, 'oldData')]
  }
  result.data = dataOnly === true || (Array.isArray(dataOnly) && dataOnly.includes('update')) ? resp : resp[get(responseKey, 'data')]
  result.oldData = await transform.call(this, result.oldData, schema)
  result.data = await transform.call(this, result.data, schema)
  return result
}

export default recordUpdate
