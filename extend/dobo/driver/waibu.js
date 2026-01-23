import restproxyFactory from './restproxy.js'

async function waibuDriverFactory () {
  const DoboRestproxyDriver = this.app.baseClass.DoboRestproxyDriver ?? (await restproxyFactory.call(this))

  const optsKeys = {
    qs: [...DoboRestproxyDriver.optsKeys.qs, 'bbox', 'bboxLatField', 'bboxLngField', 'match', 'skip', 'sort', 'field', 'group', 'aggregates', 'type'],
    response: [...DoboRestproxyDriver.optsKeys.response, 'oldData', 'pages']
  }

  class DoboWaibuDriver extends DoboRestproxyDriver {
    static optsKeys = optsKeys

    async sanitizeConnection (item) {
      await super.sanitizeConnection(item)
      item.version = item.version ?? '2.2'
    }

    async _prepFetch (action, model, idOrFilter, bodyOrParams, options = {}) {
      const result = await super._prepFetch(action, model, idOrFilter, bodyOrParams, options)
      const { isString, has } = this.app.lib._
      const { url, opts, ext, dataKey, oldDataKey } = result
      const sorts = []
      const org = opts.params[model.connection.options.qsKey.sort]
      const { connection: conn } = model
      for (const s in org ?? {}) {
        sorts.push(`${s}:${org[s]}`)
      }
      if (sorts.length > 0) opts.params[conn.options.qsKey.sort] = sorts.join('+')
      if (action === 'find') {
        if (options.count) opts.headers['X-Count'] = true
        if (options.refs) {
          if (isString(options.refs)) options.refs = [options.refs]
          opts.headers[conn.options.version >= '2.2' ? 'X-Refs' : 'X-Rels'] = options.refs.join(',')
        }
      }
      if (conn.options.version < '2.2' && ['aggregate', 'histogram'].includes(action) && has(opts.params, 'field')) {
        opts.params.fields = opts.params.field
        delete opts.params.field
      }
      return { url, opts, ext, dataKey, oldDataKey }
    }

    async _transform (data, model, reverse) {
      const { isEmpty } = this.app.lib._
      const { connection: conn } = model
      data = await super._transform(data, model, reverse)
      const arr = Array.isArray(data)
      if (!arr) data = [data]
      for (const i in data) {
        const d = data[i]
        if (conn.options.version < '2.2' && !isEmpty(d._rel)) {
          d._ref = d._rel
          delete d._rel
        }
        data[i] = d
      }
      return arr ? data : data[0]
    }

    async findRecord (model, filter = {}, options = {}) {
      const result = await super.findRecord(model, filter, options)
      for (const key of ['count', 'pages']) {
        if (result[model.connection.options.responseKey[key]]) result[key] = result[model.connection.options.responseKey[key]]
      }
      return result
    }

    async createAggregate (model, filter = {}, params = {}, options = {}) {
      const { isEmpty } = this.app.lib._
      const { generateId } = this.app.lib.aneka
      const { url, opts, ext, dataKey } = await this._prepFetch('aggregate', model, filter, params, options)
      const resp = await this.plugin.fetch(url, opts, ext)
      const data = await this._transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      if (model.connection.options.version < '2.2') {
        for (const idx in data) {
          const d = data[idx]
          d.id = generateId()
          for (const op of ['Count', 'Avg', 'Min', 'Max']) {
            for (const key in d) {
              if (key.endsWith(op)) {
                d[op.toLowerCase()] = d[key]
                delete d[key]
              }
            }
          }
          data[idx] = d
        }
      }
      return { data }
    }

    async createHistogram (model, filter = {}, params = {}, options = {}) {
      const { isEmpty } = this.app.lib._
      const { url, opts, ext, dataKey } = await this._prepFetch('histogram', model, filter, params, options)
      const resp = await this.plugin.fetch(url, opts, ext)
      const data = await this._transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      return { data }
    }
  }

  this.app.baseClass.DoboWaibuDriver = DoboWaibuDriver
  return DoboWaibuDriver
}

export default waibuDriverFactory
