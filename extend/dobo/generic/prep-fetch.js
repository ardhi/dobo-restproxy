import transform from './transform.js'

async function prepFetch (schema, action, id, body) {
  const { callHandler } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { connection } = getInfo(schema)
  const conn = connection.connection
  const opts = conn.options ?? {}
  const ext = conn.extra ?? {}
  if (!conn.url[action]) throw this.error('methodIsDisabled%s%s', action, schema.name)
  let [method, url] = conn.url[action].split(':')
  let name = schema.name
  if (connection.modelResolver) name = await callHandler(this, connection.modelResolver, name)
  url = `${conn.url.base}/${url}`.replace('{modelName}', name)
  if (body) opts.body = await transform.call(this, body, schema, true)
  if (id) url = url.replace('{id}', id)
  opts.method = method.toLowerCase()
  opts.headers = opts.headers ?? {}
  opts.params = opts.params ?? {}
  delete opts.headers['X-Rels']
  switch (conn.auth) {
    case 'basic': opts.auth = { username: conn.username, password: conn.password }; break
    case 'apiKey': opts.headers.Authorization = `Bearer ${conn.apiKey}`; break
    case 'jwt': opts.headers.Authorizarion = `Bearer ${conn.jwt}`; break
  }
  return { url, opts, ext }
}

export default prepFetch
