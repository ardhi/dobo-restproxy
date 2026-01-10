import unsupported from '../../generic/unsupported.js'
import prepFetch from '../../generic/prep-fetch.js'
import transform from '../../generic/transform.js'
import fetchGet from './get.js'

async function recordCreate ({ schema, body, options = {} } = {}) {
  const { importModule } = this.app.bajo
  const { get, isFunction, merge } = this.app.lib._
  const { getInfo } = this.app.dobo
  const { driver, connection } = getInfo(schema)
  const { dataOnly, data, responseKey } = connection.options
  const prefix = driver.provider ? `${driver.provider}:/extend/doboRestproxy` : 'doboRestproxy:/extend/dobo'
  const mod = await importModule(`${prefix}/lib/${driver.type}/record-create.js`)
  if (!mod) return unsupported.call(this)
  let { url, opts, ext } = await prepFetch.call(this, schema, 'create', undefined, body)
  let resp
  if (isFunction(mod)) ({ url, opts, ext, resp } = await mod.call(this.app[driver.ns], { url, opts, ext, schema, body, options }))
  if (!resp) resp = await this.fetch(url, opts, ext)
  merge(options, { noTransform: true })
  if (data === false) resp = await fetchGet.call(this, { schema, id: body.id, options }) // TODO: case for autocreate id???
  const result = {
    data: dataOnly === true || (Array.isArray(dataOnly) && dataOnly.includes('create')) ? resp : resp[get(responseKey, 'data')]
  }
  result.data = await transform.call(this, result.data, schema)
  return result
}

export default recordCreate
