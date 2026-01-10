import restproxyFactory from './restproxy.js'

const optsKeys = {
  qs: ['bbox', 'bboxLatField', 'bboxLngField', 'query', 'match', 'page', 'skip', 'limit', 'sort', 'field', 'group', 'aggregates', 'type'],
  response: ['data', 'oldData', 'page', 'count', 'pages']
}

async function waibuDriverFactory () {
  const DoboRestproxyDriver = this.app.baseClass.DoboRestproxyDriver ?? (await restproxyFactory.call(this))

  class DoboWaibuDriver extends DoboRestproxyDriver {
    static optsKeys = optsKeys

    async sanitizeConnection (item) {
      await super.sanitizeConnection(item)
      item.options.version = item.options.version ?? '2.2'
    }

    _prepFetch = async (modelName, action, idOrFilter, bodyOrParams) => {
      const result = await super._prepFetch(modelName, action, idOrFilter, bodyOrParams)
      const { url, opts, ext, dataKey, oldDataKey, connection: conn } = result
      const sorts = []
      const org = opts.params[conn.options.qsKey.sort]
      for (const s in org ?? {}) {
        sorts.push(`${s}:${org[s]}`)
      }
      if (sorts.length > 0) opts.params[conn.options.qsKey.sort] = sorts.join('+')
      return { url, opts, ext, dataKey, oldDataKey, connection: conn }
    }

    async createAggregate (model, filter = {}, params = {}, options = {}) {
      const { isEmpty } = this.app.lib._
      const { url, opts, ext, dataKey } = await this._prepFetch(model, 'aggregate', filter, params)
      const resp = await this.fetch(url, opts, ext)
      const data = await this.transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      return { data }
    }

    async createHistogram (model, filter = {}, params = {}, options = {}) {
      const { isEmpty } = this.app.lib._
      const { url, opts, ext, dataKey } = await this._prepFetch(model, 'histogram', filter, params)
      const resp = await this.fetch(url, opts, ext)
      const data = await this.transform(isEmpty(dataKey) ? resp : resp[dataKey], model)
      return { data }
    }
  }

  this.app.baseClass.DoboWaibuDriver = DoboWaibuDriver
  return DoboWaibuDriver
}

export default waibuDriverFactory
