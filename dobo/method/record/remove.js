import unsupported from '../../generic/unsupported.js'
import prepFetch from '../../generic/prep-fetch.js'
import transform from '../../generic/transform.js'
import fetchGet from './get.js'

async function recordRemove ({ schema, id, options = {} } = {}) {
  const { importModule } = this.app.bajo
  const { get, isFunction, merge } = this.app.bajo.lib._
  const { fetch } = this.app.bajoExtra
  const { getInfo } = this.app.dobo
  const { driver, connection } = getInfo(schema)
  const { dataOnly, oldData, responseKey } = connection.options
  const prefix = driver.provider ? `${driver.provider}:/doboRestproxy` : 'doboRestproxy:/dobo'
  const mod = await importModule(`${prefix}/lib/${driver.type}/record-remove.js`)
  if (!mod) return unsupported.call(this)
  let { url, opts, ext } = await prepFetch.call(this, schema, 'remove', id)
  let resp
  if (isFunction(mod)) ({ url, opts, ext, resp } = await mod.call(this.app[driver.ns], { url, opts, ext, schema, id, options }))
  let oldResp
  merge(options, { noTransform: true })
  if (oldData === false) oldResp = await fetchGet.call(this, { schema, id, options })
  if (!resp) resp = await fetch(url, opts, ext)
  const result = {}
  if (oldData === false) {
    result.oldData = oldResp[get(responseKey, 'data')]
  } else {
    result.oldData = dataOnly === true || (Array.isArray(dataOnly) && dataOnly.includes('remove')) ? resp : resp[get(responseKey, 'oldData')]
  }
  result.oldData = await transform.call(this, result.oldData, schema)
  return result
}

export default recordRemove
