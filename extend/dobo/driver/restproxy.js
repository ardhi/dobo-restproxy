const authTypes = ['basic', 'apiKey', 'jwt']
const methods = { find: 'GET', get: 'GET', create: 'POST', update: 'PUT', remove: 'DELETE' }
const optsKeys = {
  qs: ['query', 'page', 'limit', 'sort'],
  response: ['data', 'page', 'count']
}

async function restproxyDriverFactory () {
  const { join } = this.app.bajo
  const { DoboDriver } = this.app.baseClass
  const { isString, trimEnd, isPlainObject, trimStart, get, set } = this.app.lib._

  class DoboRestproxyDriver extends DoboDriver {
    static optsKeys = optsKeys
    static authTypes = authTypes
    static methods = methods

    constructor (plugin, name, options) {
      super(plugin, name, options)
      this.idField.name = 'id'
    }

    async sanitizeConnection (item) {
      await super.sanitizeConnection(item)
      item.port = item.port ?? 6379
      item.host = item.host ?? '127.0.0.1'
      item.database = item.database ?? '0'

      if (isString(item.url)) {
        item.url = {
          base: trimEnd(item.url),
          find: 'GET:{modelName}',
          get: 'GET:{modelName}/{id}',
          create: 'POST:{modelName}',
          update: 'PUT:{modelName}/{id}',
          remove: 'DELETE:{modelName}/{id}',
          aggregate: 'GET:{modelName}/stat/aggregate',
          histogaram: 'GET:{modelName}/stat/histogram'
        }
      } else if (isPlainObject((item.url))) {
        if (!item.url.base) throw this.error('baseUrlMissing')
        item.url.base = trimEnd(item.url.base.trim(), '/')
        for (const method in this.constructor.methods) {
          if (!item.url[method]) continue
          let [m, u] = item.url[method].split(':').map(item => item.trim())
          if (!u) {
            u = m
            m = this.constructor.methods[method]
          }
          u = trimStart(u, '/')
          if (!u.includes('{modelName}')) throw this.error('urlPattern%s', method)
          if (['get', 'update', 'remove'].includes(method) && !u.includes('{id}')) throw this.error('urlIdPattern%s', method)
          item.url[method] = `${m}:${u}`
        }
      }
      item.auth = item.auth ?? 'apiKey'
      if (item.auth !== false) {
        const types = this.constructor.authTypes
        if (!types.includes(item.auth)) throw this.error('onlySupportThese%s', join(types))
        switch (item.auth) {
          case 'apiKey': if (!item.apiKey) throw this.error('isMissing%s', this.t('field.apiKey')); break
          case 'jwt': if (!item.jwt) throw this.error('isMissing%s', this.t('field.jwt')); break
          case 'basic':
            if (!item.username) throw this.error('isMissing%s', this.t('field.username'))
            if (!item.password) throw this.error('isMissing%s', this.t('field.password'))
            break
        }
      }
      item.options = item.options ?? {}
      for (const type in this.constructor.optsKeys) {
        for (const key of this.constructor.optsKeys[type]) {
          const [def, org] = key.split(':')
          const realKey = `${type}Key.${def}`
          const val = get(item.options, realKey, org ?? def)
          set(item.options, realKey, val)
        }
      }
      item.options.fieldsMap = item.options.fieldsMap ?? {}
      if (Array.isArray(item.options.fieldsMap)) {
        const map = {}
        for (const f of item.options.fieldsMap) {
          const [field, nfield] = f.split(':').map(f => f.trim())
          if (!nfield || (nfield === field)) continue
          map[field] = nfield
        }
        item.options.fieldsMap = map
      }
    }

    _transform = async (data, modelName, reverse) => {
      const { callHandler } = this.app.bajo
      const conn = this.app.dobo.getModel(modelName).connection

      function mapFields (rec, reverse) {
        const { get, invert } = this.app.lib._
        const fm = invert(conn.options.fieldsMap)
        const newRec = {}
        for (const key in rec) {
          const nkey = get(reverse ? fm.fieldsMap : conn.options.fieldsMap, key, key)
          newRec[nkey] = rec[key]
        }
        return newRec
      }

      const arr = Array.isArray(data)
      if (!arr) data = [data]
      for (const i in data) {
        let d = data[i]
        if (conn.options.transformer) d = await callHandler(this, conn.options.transformer, d, modelName)
        data[i] = mapFields(d, reverse)
      }
      return arr ? data : data[0]
    }

    _prepFetch = async (modelName, action, idOrFilter, bodyOrParams) => {
      const { callHandler } = this.app.bajo
      const { pick, cloneDeep, invert, has } = this.app.lib._
      const { isSet } = this.app.lib.aneka

      const conn = this.app.dobo.getModel(modelName).connection
      const opts = pick(conn.options ?? {}, ['qsKeys', 'responseKeys'])
      const ext = cloneDeep(conn.options.fetchExtraOpts ?? {})

      if (!conn.url[action]) throw this.error('methodIsDisabled%s%s', action, modelName)
      let [method, url] = conn.url[action].split(':')
      let name = modelName
      if (conn.options.modelResolver) name = await callHandler(this, conn.options.modelResolver, name)
      url = `${conn.url.base}/${url}`.replace('{modelName}', name)
      if (!isPlainObject(idOrFilter)) url = url.replace('{id}', idOrFilter)
      if (isPlainObject(idOrFilter) && bodyOrParams) opts.body = await this.transform(bodyOrParams, modelName, true)
      opts.method = method.toLowerCase()
      opts.headers = opts.headers ?? {}
      opts.params = opts.params ?? {}
      switch (conn.auth) {
        case 'basic': opts.auth = { username: conn.username, password: conn.password }; break
        case 'apiKey': opts.headers.Authorization = `Bearer ${conn.apiKey}`; break
        case 'jwt': opts.headers.Authorizarion = `Bearer ${conn.jwt}`; break
      }
      const dataKey = get(conn.options.responseKey, 'data')
      const oldDataKey = get(conn.options.responseKey, 'oldData')
      if (isPlainObject(idOrFilter)) {
        // id is actually filter
        const fm = invert(conn.options.fieldsMap)
        const newSort = {}
        for (const s in idOrFilter.sort) {
          newSort[fm[s] ?? s] = idOrFilter.sort[s]
        }
        opts.params[conn.options.qsKey.sort] = newSort
        for (const k in conn.options.qsKey) {
          if (k === 'sort') continue
          if (has(idOrFilter, k)) {
            const val = isPlainObject(idOrFilter[k]) ? JSON.stringify(idOrFilter[k]) : idOrFilter[k]
            if (!isSet(val)) continue
            opts.params[conn.options.qsKey[k]] = val
          }
          if (has(bodyOrParams, k)) {
            const val = bodyOrParams[k]
            if (!isSet(val)) continue
            opts.params[conn.options.qsKey[k]] = val
          }
        }
      }
      return { url, opts, ext, dataKey, oldDataKey, connection: conn }
    }

    async createRecord (model, body = {}, options = {}) {
      const { isEmpty } = this.app.lib._
      const { url, opts, ext, dataKey } = await this.prepFetch(model, 'create', undefined, body)
      const resp = await this.fetch(url, opts, ext)
      if (options.noResult) return
      const data = await this.transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      return { data }
    }

    async getRecord (model, id, options = {}) {
      const { isEmpty } = this.app.lib._
      const { url, opts, ext, dataKey } = await this.prepFetch(model, 'get', id)
      const resp = await this.fetch(url, opts, ext)
      const data = await this.transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      return { data }
    }

    async updateRecord (model, id, body = {}, options = {}) {
      const { isEmpty } = this.app.lib._
      const { url, opts, ext, dataKey, oldDataKey } = await this.prepFetch(model, 'update', id, body)
      const resp = await this.fetch(url, opts, ext)
      const data = await this.transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      const oldData = await this.transform(isEmpty(oldDataKey) ? resp : resp[oldDataKey], model)
      return { data, oldData }
    }

    async removeRecord (model, id, options = {}) {
      const { isEmpty } = this.app.lib._
      const { url, opts, ext, oldDataKey } = await this.prepFetch(model, 'remove', id)
      const resp = await this.fetch(url, opts, ext)
      const oldData = await this.transform(isEmpty(oldDataKey) ? resp : resp[oldDataKey], model)
      return { oldData }
    }

    async findRecord (model, filter = {}, options = {}) {
      const { isEmpty } = this.app.lib._
      const { url, opts, ext, dataKey, connection: conn } = await this.prepFetch(model, 'find')

      const resp = await this.fetch(url, opts, ext)
      const data = await this.transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      const result = {
        data,
        page: resp[conn.options.responseKey.page] ?? filter.page,
        limit: resp[conn.options.responseKey.limit] ?? filter.limit
      }
      for (const key of ['count', 'pages']) {
        if (resp[conn.options.responseKey[key]]) result[key] = resp[conn.options.responseKey[key]]
      }
      return result
    }

    async countRecord (model, filter = {}, options = {}) {
      const resp = this.findRecord(model, filter, options)
      return { data: resp.count }
    }
  }

  this.app.baseClass.DoboRestproxyDriver = DoboRestproxyDriver
  return DoboRestproxyDriver
}

export default restproxyDriverFactory
