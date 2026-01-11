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
      const { isString } = this.app.lib._
      const { url, opts, ext, dataKey, oldDataKey } = result
      const sorts = []
      const org = opts.params[model.connection.options.qsKey.sort]
      const { connection: conn } = model
      for (const s in org ?? {}) {
        sorts.push(`${s}:${org[s]}`)
      }
      if (sorts.length > 0) opts.params[model.connection.options.qsKey.sort] = sorts.join('+')
      if (action === 'find') {
        if (options.count) opts.headers['X-Count'] = true
        if (options.altRefs) {
          if (isString(options.altRefs)) options.altRefs = [options.altRefs]
          opts.headers[conn.options.version === '2.2' ? 'X-Refs' : 'X-Rels'] = options.altRefs.join(',')
        }
      }
      return { url, opts, ext, dataKey, oldDataKey }
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
      const { url, opts, ext, dataKey } = await this._prepFetch(model, 'aggregate', filter, params, options)
      const resp = await this.plugin.fetch(url, opts, ext)
      const data = await this._transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      return { data }
    }

    async createHistogram (model, filter = {}, params = {}, options = {}) {
      const { isEmpty } = this.app.lib._
      const { url, opts, ext, dataKey } = await this._prepFetch(model, 'histogram', filter, params, options)
      const resp = await this.plugin.fetch(url, opts, ext)
      const data = await this._transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      return { data }
    }
  }

  this.app.baseClass.DoboWaibuDriver = DoboWaibuDriver
  return DoboWaibuDriver
}

export default waibuDriverFactory
